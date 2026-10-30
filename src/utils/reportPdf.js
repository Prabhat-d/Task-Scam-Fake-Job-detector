import { buildReasons } from './reasons.js';
import { HELPLINE, CYBERCRIME_URL } from './constants.js';

/**
 * Structured PDF report for a scan (jsPDF, standard Helvetica):
 *   Header (TrustMatrix + date/time) → verdict & risk
 *   → Incident details | Complainant & contact entities (side by side)
 *   → Company details → Summary → Why it looks fake / safe → footer.
 * Tries to fit on one page (shrinking text slightly); if the reasons list is long,
 * it continues on a second page with a compact header instead of cutting content.
 */

const VERDICT_STYLE = {
  scam: { label: 'SCAM', color: [220, 38, 38], soft: [254, 242, 242] },
  suspicious: { label: 'SUSPICIOUS', color: [217, 119, 6], soft: [255, 251, 235] },
  genuine: { label: 'GENUINE', color: [22, 163, 74], soft: [240, 253, 244] },
};
const MARK = {
  against: { color: [220, 38, 38], sign: 'x' },
  for: { color: [22, 163, 74], sign: '+' },
  unknown: { color: [100, 116, 139], sign: '?' },
};
const INK = [15, 23, 42];
const BODY = [51, 65, 85];
const MUTED = [100, 116, 139];
const LINE = [226, 232, 240];
const BRAND = [37, 99, 235];

/** Make text safe for jsPDF's Latin fonts: ₹ → INR, smart quotes → ASCII, other scripts → [...]. */
export const pdfSafe = (s) =>
  String(s ?? '')
    .replace(/₹\s?/g, 'INR ')
    .replace(/[–—]/g, '-')
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/…/g, '...')
    .replace(/\s*·\s*/g, ' - ')
    .replace(/[^\x20-\x7E\n]+/g, (m) => (m.trim().length > 2 ? ' [...] ' : ''))
    .replace(/[ \t]+\n/g, '\n');

/* ============================== Report data ============================== */

/** Stable, human-friendly tracking ID derived from the scan: TM-SCAM-2026-7Q4K. */
export function scamIdFor(scan) {
  let h = 2166136261;
  for (const ch of String(scan.id || '')) h = Math.imul(h ^ ch.charCodeAt(0), 16777619) >>> 0;
  const year = new Date(scan.createdAt || Date.now()).getFullYear();
  return `TM-SCAM-${year}-${h.toString(36).toUpperCase().padStart(6, '0').slice(-4)}`;
}

/** e.g. "Telegram Task Post", "WhatsApp Chat", "Email Offer Letter". */
export function contentTypeFor(scan) {
  const text = `${scan.extractedText || scan.inputText || ''} ${scan.link || ''}`.toLowerCase();
  const hasEmail = !!(scan.domain?.hrEmail || scan.hrEmail) || /subject:|dear (candidate|applicant)/.test(text);
  const platform = /whatsapp|wa\.me\//.test(text) && !/telegram|t\.me\//.test(text)
    ? 'WhatsApp'
    : /telegram|t\.me\//.test(text)
      ? 'Telegram'
      : hasEmail
        ? 'Email'
        : '';
  const isTask = scan.track === 'task' && scan.verdict !== 'genuine';
  const base = {
    chat: 'Chat',
    screenshot: 'Chat Screenshot',
    offer_letter: 'Offer Letter',
    job_post: isTask ? 'Task Post' : 'Job Post',
  }[scan.type] || 'Message';
  return platform ? `${platform} ${base}` : base;
}

/** Named scam pattern(s) from the red flags, e.g. "Prepaid Task Trap + Account Freeze / Exit Fee". */
export function scamPatternFor(scan) {
  if (scan.verdict === 'genuine') return 'None detected';
  const ids = new Set((scan.redFlags || []).map((f) => f.id));
  const out = [];
  if (ids.has('prepaid_task')) out.push('Prepaid Task Trap');
  if (ids.has('pay_to_work') || ids.has('verification_fee')) out.push('Upfront Deposit / Fee Demand');
  if (ids.has('frozen') || ids.has('exit_fee')) out.push('Account Freeze / Exit Fee');
  if (!out.length && ids.has('like_earn')) out.push('Like-and-Earn Task Hook');
  if (ids.has('impersonation')) out.push('Company Impersonation');
  if (!out.length && (ids.has('mca_not_found') || ids.has('mca_struck'))) out.push('Unregistered / Fake Employer');
  if (!out.length) out.push(scan.track === 'job' ? 'Fake Job Offer' : 'Online Task Scam');
  return out.slice(0, 2).join(' + ');
}

const ageText = (days) => {
  if (days == null) return 'unknown age';
  if (days >= 365) return `${Math.floor(days / 365)} year(s) old`;
  if (days >= 60) return `${Math.floor(days / 30)} month(s) old`;
  return `${days} day(s) old`;
};

function domainStatus(domain = {}, company = {}) {
  const official = domain.officialDomain || company.officialDomain;
  if (domain.matchesOfficial) return `Verified - matches official domain ${official}`;
  if (domain.emailType === 'free') return 'Not verified - HR uses a free webmail address';
  if (official && domain.matchesOfficial === false && domain.domain) return `Mismatch - uses ${domain.domain}, official is ${official}`;
  if (domain.domain && domain.ageDays != null && domain.ageDays < 90) return `Suspicious - ${domain.domain} is only ${ageText(domain.ageDays)}`;
  if (domain.domain) return `Checked - ${domain.domain} (${ageText(domain.ageDays)})`;
  return 'Not available - no website or HR email found';
}

const EMAIL_RE = /[\w.+-]+@[\w-]+\.[\w.-]+/g;
const UPI_RE = /@(ybl|paytm|okaxis|oksbi|okhdfcbank|okicici|ibl|axl|upi|apl|ptyes|ptsbi)$/i;

/** All values for the report, in English. `complainant` is a display name. */
export function buildReportData(scan, complainant) {
  const company = scan.company || {};
  const domain = scan.domain || {};
  const entities = scan.entities || [];
  const text = scan.extractedText || scan.inputText || '';
  const values = (type) => entities.filter((e) => e.type === type).map((e) => e.value);

  const emails = [domain.hrEmail, scan.hrEmail, ...(text.match(EMAIL_RE) || [])]
    .map((e) => (e || '').replace(/[.,;:]+$/, '')) // drop sentence punctuation caught by the regex
    .filter((e) => e && !UPI_RE.test(e))
    .filter((e, i, a) => a.findIndex((x) => x.toLowerCase() === e.toLowerCase()) === i);
  const contacts = [...values('phone'), ...values('telegram')];

  const claimed = company.queried || scan.companyName || company.name || '';
  const registered = company.cin && company.name && company.name !== claimed ? ` (registered as ${company.name})` : '';
  const cin = company.cin
    ? company.cin
    : company.status === 'not_found'
      ? 'Not found in MCA registry'
      : 'Not provided';
  const mca = { active: 'Active', struck_off: 'Struck off', not_found: 'Not found', not_provided: 'Not checked' }[company.status || 'not_provided'];

  // Summary: two short sentences.
  const firstSentence = (scan.explanation?.en || '').split(/(?<=\.)\s/)[0] || '';
  const summary = [scan.summary?.en, firstSentence].filter(Boolean).join(' ');

  const r = buildReasons(scan);
  return {
    scamId: scamIdFor(scan),
    ref: scan.id,
    contentType: contentTypeFor(scan),
    pattern: scamPatternFor(scan),
    style: VERDICT_STYLE[scan.verdict] || VERDICT_STYLE.suspicious,
    score: Math.max(0, Math.min(100, Math.round(Number(scan.score) || 0))),
    scannedOn: new Date(scan.createdAt || Date.now()),
    complainant: complainant || 'Not provided',
    phone: contacts.length ? contacts.join(', ') : 'None found',
    email: emails.length ? emails.join(', ') : 'None found',
    upi: values('upi').join(', ') || 'None found',
    links: values('link').join(', '),
    company: [
      ['Company name', claimed ? `${claimed}${registered}` : 'Not provided'],
      ['CIN (purported)', cin],
      ['Registered state', company.state || '-'],
      ['MCA status', mca],
      ['Domain verification', domainStatus(domain, company)],
    ],
    summary,
    against: r.against,
    for: r.for,
    unknown: r.unknown,
  };
}

const fmtDateTime = (d) =>
  d.toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true });

/* ============================== Rendering ============================== */

function render(JsPDF, D, fs) {
  const doc = new JsPDF({ unit: 'pt', format: 'a4' });
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  const M = 40;
  const CW = W - M * 2;
  const BOTTOM = H - M - 22;
  const lh = fs * 1.35;
  const now = fmtDateTime(new Date());
  let y = M;

  const font = (style = 'normal', size = fs, color = BODY, family = 'helvetica') => {
    doc.setFont(family, style);
    doc.setFontSize(size);
    doc.setTextColor(...color);
  };
  const split = (t, w, style = 'normal', size = fs, family = 'helvetica') => {
    doc.setFont(family, style);
    doc.setFontSize(size);
    return doc.splitTextToSize(pdfSafe(t), w);
  };

  const brand = (size, x, by) => {
    font('bold', size, INK);
    doc.text('Trust', x, by);
    const w = doc.getTextWidth('Trust');
    doc.setTextColor(...BRAND);
    doc.text('Matrix', x + w, by);
  };

  const continuationHeader = () => {
    brand(13, M, M + 10);
    font('normal', 8.5, MUTED);
    doc.text(pdfSafe(`${D.scamId} - continued`), W - M, M + 10, { align: 'right' });
    doc.setDrawColor(...LINE);
    doc.setLineWidth(0.6);
    doc.line(M, M + 18, W - M, M + 18);
    y = M + 32;
  };
  const ensure = (h) => {
    if (y + h > BOTTOM) {
      doc.addPage();
      continuationHeader();
    }
  };

  const heading = (title, color = BRAND) => {
    ensure(18 + lh * 2);
    doc.setFillColor(...color);
    doc.rect(M, y, 3, 13, 'F');
    font('bold', fs + 2.5, INK);
    doc.text(title, M + 9, y + 10.5);
    y += 19;
  };

  /** Key/value table at (x, y) of width w; returns its height. Measure only when draw is false. */
  const kvTable = (rows, x, w, labelW, draw = true) => {
    let ty = y;
    rows.forEach(([k, v], i) => {
      const kl = split(k, labelW - 10, 'bold', fs - 0.5);
      const vl = split(v, w - labelW - 10);
      const rh = Math.max(kl.length, vl.length) * lh + 7;
      if (draw) {
        doc.setFillColor(...(i % 2 ? [255, 255, 255] : [248, 250, 252]));
        doc.rect(x, ty, w, rh, 'F');
        doc.setFillColor(241, 245, 249);
        doc.rect(x, ty, labelW, rh, 'F');
        font('bold', fs - 0.5, MUTED);
        kl.forEach((l, j) => doc.text(l, x + 6, ty + 4 + fs + j * lh));
        font('normal', fs, INK);
        vl.forEach((l, j) => doc.text(l, x + labelW + 6, ty + 4 + fs + j * lh));
        doc.setDrawColor(...LINE);
        doc.setLineWidth(0.5);
        doc.line(x, ty + rh, x + w, ty + rh);
      }
      ty += rh;
    });
    if (draw) {
      doc.setDrawColor(...LINE);
      doc.setLineWidth(0.7);
      doc.rect(x, y, w, ty - y, 'S');
    }
    return ty - y;
  };

  /* ---------- Header ---------- */
  brand(22, M, M + 16);
  font('normal', 9, MUTED);
  doc.text(pdfSafe(`Date & time: ${now}`), M, M + 31);
  font('bold', 10, INK);
  doc.text('Scam Analysis & Incident Report', W - M, M + 14, { align: 'right' });
  font('normal', 9, MUTED);
  doc.text(pdfSafe(`Scam ID: ${D.scamId}`), W - M, M + 29, { align: 'right' });
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.8);
  doc.line(M, M + 40, W - M, M + 40);
  y = M + 52;

  /* ---------- Verdict & risk ---------- */
  const s = D.style;
  const vh = 60;
  doc.setFillColor(...s.soft);
  doc.setDrawColor(...s.color);
  doc.setLineWidth(1.1);
  doc.roundedRect(M, y, CW, vh, 6, 6, 'FD');
  doc.setFillColor(...s.color);
  doc.rect(M + 0.6, y + 6, 5, vh - 12, 'F');
  font('bold', 8, MUTED);
  doc.text('VERDICT', M + 18, y + 17);
  doc.text('RISK SCORE', W - M - 16, y + 17, { align: 'right' });
  font('bold', 22, s.color);
  doc.text(s.label, M + 18, y + 42);
  doc.text(`${D.score}%`, W - M - 16, y + 42, { align: 'right' });
  const bx = M + 190;
  const bw = CW - 190 - 100;
  doc.setFillColor(...LINE);
  doc.roundedRect(bx, y + 33, bw, 7, 3.5, 3.5, 'F');
  doc.setFillColor(...s.color);
  doc.roundedRect(bx, y + 33, Math.max(7, (bw * D.score) / 100), 7, 3.5, 3.5, 'F');
  font('normal', 7.5, MUTED);
  doc.text('0', bx, y + 51);
  doc.text('100', bx + bw, y + 51, { align: 'right' });
  y += vh + 16;

  /* ---------- Incident details | Complainant & contacts ---------- */
  const GAP = 14;
  const colW = (CW - GAP) / 2;
  const incident = [
    ['Scam ID', D.scamId],
    ['Reference', D.ref],
    ['Scanned on', fmtDateTime(D.scannedOn)],
    ['Content type', D.contentType],
    ['Scam pattern', D.pattern],
    ['Risk & verdict', `${D.score}% - ${s.label}`],
  ];
  const contacts = [
    ['Complainant', D.complainant],
    ['Phone / WhatsApp / Telegram', D.phone],
    ['Email', D.email],
    ['UPI ID(s)', D.upi],
    ...(D.links ? [['Links', D.links]] : []),
  ];
  const leftH = kvTable(incident, M, colW, 88, false);
  const rightH = kvTable(contacts, M + colW + GAP, colW, 92, false);
  ensure(19 + Math.max(leftH, rightH));
  // Two headings on one row.
  [[M, 'Incident Details'], [M + colW + GAP, 'Complainant & Contact Entities']].forEach(([x, t]) => {
    doc.setFillColor(...BRAND);
    doc.rect(x, y, 3, 13, 'F');
    font('bold', fs + 2.5, INK);
    doc.text(t, x + 9, y + 10.5);
  });
  y += 19;
  kvTable(incident, M, colW, 88);
  kvTable(contacts, M + colW + GAP, colW, 92);
  y += Math.max(leftH, rightH) + 16;

  /* ---------- Company ---------- */
  heading('Company Details');
  ensure(kvTable(D.company, M, CW, 120, false));
  y += kvTable(D.company, M, CW, 120) + 16;

  /* ---------- Summary ---------- */
  heading('Summary', s.color);
  let sum = split(D.summary, CW - 20, 'normal', fs + 0.5);
  if (sum.length > 2) {
    sum = sum.slice(0, 2);
    sum[1] = `${sum[1].replace(/\s+\S*$/, '')}...`;
  }
  const sh = sum.length * (lh + 0.5) + 12;
  ensure(sh);
  doc.setFillColor(...s.soft);
  doc.setDrawColor(...LINE);
  doc.setLineWidth(0.6);
  doc.roundedRect(M, y, CW, sh, 5, 5, 'FD');
  font('normal', fs + 0.5, INK);
  sum.forEach((l, i) => doc.text(l, M + 10, y + 6 + fs + 0.5 + i * (lh + 0.5)));
  y += sh + 16;

  /* ---------- Why it looks fake / safe ---------- */
  const IND = 18;
  const reasonList = (items, kind) => {
    const m = MARK[kind];
    items.forEach((r) => {
      const title = split(r.title?.en || '', CW - IND - 60, 'bold', fs);
      const detail = r.detail?.en ? split(r.detail.en, CW - IND, 'normal', fs - 0.5) : [];
      const ev = r.evidence ? split(`Found: "${r.evidence}"`, CW - IND, 'normal', fs - 1, 'courier') : [];
      const h = title.length * lh + detail.length * lh * 0.95 + ev.length * lh * 0.9 + 6;
      ensure(h);
      const cy = y + fs * 0.62;
      doc.setFillColor(...m.color);
      doc.circle(M + 6, cy, 5, 'F');
      font('bold', 7, [255, 255, 255]);
      doc.text(m.sign, M + 6, cy + 2.4, { align: 'center' });
      let ty = y + fs;
      font('bold', fs, INK);
      title.forEach((l) => {
        doc.text(l, M + IND, ty);
        ty += lh;
      });
      if (r.severity) {
        const lw = doc.getTextWidth(title[title.length - 1] || '');
        font('bold', fs - 2.5, m.color);
        doc.text(r.severity.toUpperCase(), M + IND + lw + 6, ty - lh);
      }
      font('normal', fs - 0.5, [71, 85, 105]);
      detail.forEach((l) => {
        doc.text(l, M + IND, ty);
        ty += lh * 0.95;
      });
      font('normal', fs - 1, [180, 83, 9], 'courier');
      ev.forEach((l) => {
        doc.text(l, M + IND, ty);
        ty += lh * 0.9;
      });
      y += h;
    });
  };
  const empty = (t) => {
    ensure(lh);
    font('italic', fs - 0.5, MUTED);
    doc.text(t, M + IND, y + fs);
    y += lh + 2;
  };
  const groups = [
    ['Why It Looks Fake', D.against, 'against', [220, 38, 38], 'No warning signs found.'],
    ['Why It Looks Safe', D.for, 'for', [22, 163, 74], 'No safety indicators found.'],
  ];
  if (D.style.label === 'GENUINE') groups.reverse();
  groups.forEach(([title, items, kind, color, none]) => {
    heading(`${title} (${items.length})`, color);
    if (items.length) reasonList(items, kind);
    else empty(none);
    y += 8;
  });
  if (D.unknown.length) {
    heading('Could Not Be Verified', MUTED);
    reasonList(D.unknown, 'unknown');
  }

  /* ---------- Footer on every page ---------- */
  const pages = doc.getNumberOfPages();
  for (let i = 1; i <= pages; i += 1) {
    doc.setPage(i);
    doc.setDrawColor(...LINE);
    doc.setLineWidth(0.6);
    doc.line(M, H - M - 8, W - M, H - M - 8);
    font('normal', 7.5, MUTED);
    doc.text(`Lost money? Call ${HELPLINE} or report at ${CYBERCRIME_URL.replace(/^https?:\/\//, '')}  |  Automated analysis by TrustMatrix`, M, H - M + 4);
    doc.text(`Page ${i} of ${pages}`, W - M, H - M + 4, { align: 'right' });
  }
  return doc;
}

/** Builds the report PDF Blob. Uses one page when the content fits at a readable size. */
export async function buildReportPdf(scan, complainant) {
  const { jsPDF } = await import('jspdf');
  const data = buildReportData(scan, complainant);
  let doc = null;
  for (const fs of [9, 8.5, 8]) {
    doc = render(jsPDF, data, fs);
    if (doc.getNumberOfPages() === 1) break;
  }
  if (doc.getNumberOfPages() > 1) doc = render(jsPDF, data, 9); // multi-page: keep the comfortable size
  return doc.output('blob');
}
