import i18n from '../i18n/index.js';
import { formatDateTime, downloadBlob } from './formatters.js';
import { buildReasons } from './reasons.js';
import { TASK_STAGES, JOB_STAGES, HELPLINE, CYBERCRIME_URL } from './constants.js';

/**
 * Incident report for a scan, used for the 1930 helpline and the cybercrime.gov.in complaint.
 * Always in English (police portals work in English; jsPDF's built-in fonts are Latin-only).
 *
 * buildReportSections() is the single source; buildDossierText() and buildDossierPdf() only render it.
 */

const en = () => i18n.getFixedT('en');

/** Make text safe for jsPDF's Latin fonts: ₹ → INR, smart quotes → ASCII, other scripts → […]. */
export const pdfSafe = (s) =>
  String(s ?? '')
    .replace(/₹\s?/g, 'INR ')
    .replace(/[–—]/g, '-')
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/…/g, '...')
    .replace(/[^\x20-\x7E\n]+/g, (m) => (m.trim().length > 2 ? ' [...] ' : ''))
    .replace(/[ \t]+\n/g, '\n');

const stageName = (scan) => {
  if (scan.stage == null || scan.stage < 0) return 'Not applicable';
  const list = scan.track === 'job' ? JOB_STAGES : TASK_STAGES;
  const key = list[Math.min(scan.stage, list.length - 1)];
  return `${scan.stage + 1} of ${list.length} - ${en()(`stages.${scan.track}.${key}`)}`;
};

const ageText = (days) => {
  if (days == null) return 'Unknown';
  if (days >= 365) return `${Math.floor(days / 365)} year(s)`;
  if (days >= 60) return `${Math.floor(days / 30)} month(s)`;
  return `${days} day(s)`;
};

const yesNo = (v) => (v == null ? 'Unknown' : v ? 'Yes' : 'No');

/** All report content as plain data: [{ title, rows?: [label, value][], table?, items?, text? }]. */
export function buildReportSections(scan, user) {
  const t = en();
  const company = scan.company || {};
  const domain = scan.domain || {};
  const entities = scan.entities || [];
  const reasons = buildReasons(scan);
  const sections = [];

  sections.push({
    title: 'Scan verdict',
    rows: [
      ['Verdict', t(`verdict.${scan.verdict}`)],
      ['Risk score', `${scan.score} / 100`],
      ['Summary', scan.summary?.en || ''],
      ['Content type', t(`types.${scan.type}`, { defaultValue: scan.type || '-' })],
      ['Scam pattern', scan.verdict === 'genuine' ? 'None detected' : t(`result.track.${scan.track}`)],
      ['Scam stage reached', stageName(scan)],
      ['Scan ID', scan.id],
      ['Scanned on', formatDateTime(scan.createdAt, 'en')],
    ],
  });

  if (user) {
    sections.push({
      title: 'Complainant',
      rows: [
        ['Name', user.name || '-'],
        ['Phone', user.phone || '-'],
        ['Email', user.email || '-'],
        ['State', user.state || '-'],
      ],
    });
  }

  sections.push({
    title: 'Company details',
    rows: [
      ['Company name used', company.queried || company.name || scan.companyName || 'Not provided'],
      ['Registered name (MCA)', company.cin ? company.name : '-'],
      ['MCA status', t(`mca.status.${company.status || 'not_provided'}`)],
      ['CIN', company.cin || '-'],
      ['Incorporated on', company.incorporated || '-'],
      ['Registered state', company.state || '-'],
      ['Exact name match', company.cin ? yesNo(company.nameMatch) : '-'],
      ['HR email', domain.hrEmail || scan.hrEmail || 'Not provided'],
      ['HR email type', domain.emailType === 'free' ? 'Free webmail (Gmail/Yahoo etc.)' : domain.emailType === 'corporate' ? 'Company domain' : '-'],
      ['Website / domain checked', domain.domain || '-'],
      ['Official company domain', domain.officialDomain || company.officialDomain || '-'],
      ['Matches official domain', yesNo(domain.matchesOfficial)],
      ['Website age', domain.domain ? ageText(domain.ageDays) : '-'],
      ['Mail server (MX) found', domain.domain ? yesNo(domain.mx) : '-'],
    ],
  });

  const groups = ['upi', 'phone', 'telegram', 'link', 'amount'];
  sections.push({
    title: 'Entity breakdown',
    table: {
      head: ['Type', 'Value', 'Reported before'],
      rows: groups.flatMap((g) =>
        entities
          .filter((e) => e.type === g)
          .map((e) => [t(`entity.${e.type}`), e.value, e.type === 'amount' ? '-' : e.seenCount ? `Yes, ${e.seenCount} time(s)` : 'No'])
      ),
      empty: 'No UPI IDs, phone numbers, Telegram handles, links or amounts were found.',
    },
  });

  sections.push({
    title: `Why it looks fake (${reasons.against.length})`,
    items: reasons.against.map((r) => ({
      mark: '[x]',
      title: `${r.title.en}${r.severity ? ` [${t(`severity.${r.severity}`).toUpperCase()}]` : ''}`,
      detail: r.detail?.en || '',
      evidence: r.evidence,
    })),
    empty: 'No warning signs found.',
  });
  sections.push({
    title: `Why it looks safe (${reasons.for.length})`,
    items: reasons.for.map((r) => ({ mark: '[+]', title: r.title.en, detail: r.detail?.en || '', evidence: r.evidence })),
    empty: 'Nothing reassuring found.',
  });
  if (reasons.unknown.length) {
    sections.push({
      title: 'Could not be checked',
      items: reasons.unknown.map((r) => ({ mark: '[?]', title: r.title.en, detail: r.detail?.en || '' })),
    });
  }

  sections.push({ title: 'Explanation', text: scan.explanation?.en || '' });
  if (scan.nextMove?.en) sections.push({ title: 'What the scammer will likely do next', text: scan.nextMove.en });

  sections.push({ title: 'Full message text analysed', text: scan.extractedText || scan.inputText || '(No text)', mono: true });
  if (scan.link) sections.push({ title: 'Link submitted', text: scan.link, mono: true });
  if (scan.files?.length) {
    sections.push({ title: 'Files submitted', items: scan.files.map((f) => ({ mark: '-', title: f.name, detail: f.type || '' })) });
  }

  // Dossier for the helpline / police.
  const suspects = entities.filter((e) => e.type !== 'amount');
  const amounts = entities.filter((e) => e.type === 'amount').map((e) => e.value);
  sections.push({
    title: 'Incident dossier (1930 helpline / cybercrime.gov.in)',
    rows: [
      ['Category', t('report.categoryValue')],
      ['Assessment', `${t(`verdict.${scan.verdict}`)} (risk ${scan.score}/100)`],
      ['Amount already paid', scan.amountPaid ? `INR ${scan.amountPaid}` : 'None reported'],
      ['Amounts mentioned', amounts.length ? amounts.join(', ') : 'None'],
      ['Suspect identifiers', suspects.length ? suspects.map((e) => `${t(`entity.${e.type}`)}: ${e.value}`).join('; ') : 'None found'],
      ['Company name used', company.queried || company.name || '-'],
      ['Email used', domain.hrEmail || '-'],
      ['Report generated', formatDateTime(new Date(), 'en')],
    ],
  });
  sections.push({
    title: 'Timeline',
    items: [
      { mark: '-', title: `${formatDateTime(scan.createdAt, 'en')}: message checked on TrustMatrix (scan ${scan.id})` },
      ...(scan.redFlags || []).map((f) => ({ mark: '-', title: f.title?.en || '', evidence: f.evidence })),
    ],
  });
  sections.push({
    title: 'What to do now',
    items: [
      { mark: '1.', title: `Call ${HELPLINE} (National Cyber Crime Helpline) immediately if any money was paid. Reporting within the first hours gives the best chance to freeze funds.` },
      { mark: '2.', title: `File a complaint at ${CYBERCRIME_URL} -> Report other cyber crime -> Financial fraud. Copy the details from this report.` },
      { mark: '3.', title: 'Inform your bank / UPI app and ask them to block the transaction and the receiving account.' },
      { mark: '4.', title: 'Keep screenshots, chat exports, payment receipts and transaction IDs. Do not delete the chat.' },
      { mark: '5.', title: 'Stop all contact. Do not pay any further "unlock", "tax" or "verification" fee.' },
    ],
  });
  return sections;
}

/** Plain-text version (shown in the report modal and copied into the complaint form). */
export function buildDossierText(scan, user) {
  const lines = ['TRUSTMATRIX - SCAM ANALYSIS & INCIDENT REPORT', '='.repeat(48)];
  buildReportSections(scan, user).forEach((s) => {
    lines.push('', s.title.toUpperCase(), '-'.repeat(Math.min(48, s.title.length)));
    s.rows?.forEach(([k, v]) => lines.push(`${k}: ${v}`));
    if (s.table) {
      if (!s.table.rows.length) lines.push(s.table.empty);
      s.table.rows.forEach((r) => lines.push(`- ${r[0]}: ${r[1]} (reported before: ${r[2]})`));
    }
    if (s.items) {
      if (!s.items.length && s.empty) lines.push(s.empty);
      s.items.forEach((it) => {
        lines.push(`${it.mark} ${it.title}`);
        if (it.detail) lines.push(`    ${it.detail}`);
        if (it.evidence) lines.push(`    Evidence: "${it.evidence}"`);
      });
    }
    if (s.text) lines.push(s.text);
  });
  lines.push('', en()('report.footer'));
  return lines.join('\n');
}

/** Builds the full report as a PDF Blob (jsPDF is loaded on demand to keep the bundle small). */
export async function buildDossierPdf(scan, user) {
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  const M = 44;
  const CW = W - M * 2;
  const LABEL_W = 150;
  let y = M;

  const ensure = (h) => {
    if (y + h > H - M - 16) {
      doc.addPage();
      y = M;
    }
  };
  const write = (text, x, width, { size = 9.5, bold = false, color = [51, 65, 85], font = 'helvetica', lh = 12.5 } = {}) => {
    doc.setFont(font, bold ? 'bold' : 'normal');
    doc.setFontSize(size);
    doc.setTextColor(...color);
    const lines = doc.splitTextToSize(pdfSafe(text), width);
    lines.forEach((line) => {
      ensure(lh);
      doc.text(line, x, y + size);
      y += lh;
    });
    return lines.length;
  };

  // Header band
  const verdictColor = { scam: [239, 68, 68], suspicious: [245, 158, 11], genuine: [16, 185, 129] }[scan.verdict] || [59, 130, 246];
  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, W, 64, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(255, 255, 255);
  doc.text('TrustMatrix', M, 32);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(203, 213, 225);
  doc.text('Scam Analysis & Incident Report', M, 48);
  doc.text(pdfSafe(`Scan ${scan.id}`), W - M, 32, { align: 'right' });
  doc.text(pdfSafe(formatDateTime(new Date(), 'en')), W - M, 48, { align: 'right' });
  y = 84;

  // Verdict box with risk bar
  const t = en();
  doc.setDrawColor(...verdictColor);
  doc.setLineWidth(1.2);
  doc.roundedRect(M, y, CW, 70, 6, 6, 'S');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.setTextColor(...verdictColor);
  doc.text(pdfSafe(t(`verdict.${scan.verdict}`).toUpperCase()), M + 16, y + 30);
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text(`Risk score: ${scan.score}/100`, W - M - 16, y + 30, { align: 'right' });
  doc.setFillColor(226, 232, 240);
  doc.roundedRect(M + 16, y + 44, CW - 32, 8, 4, 4, 'F');
  doc.setFillColor(...verdictColor);
  doc.roundedRect(M + 16, y + 44, Math.max(8, ((CW - 32) * scan.score) / 100), 8, 4, 4, 'F');
  y += 86;

  buildReportSections(scan, user).forEach((s) => {
    ensure(40);
    y += 6;
    doc.setFillColor(241, 245, 249);
    doc.rect(M, y, CW, 20, 'F');
    doc.setFillColor(59, 130, 246);
    doc.rect(M, y, 3, 20, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    doc.text(pdfSafe(s.title), M + 10, y + 14);
    y += 28;

    s.rows?.forEach(([k, v]) => {
      // Label is drawn once at the top; the value may flow onto the next page.
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9.5);
      const label = doc.splitTextToSize(pdfSafe(k), LABEL_W - 8);
      ensure(label.length * 12.5);
      const top = y;
      const page = doc.getNumberOfPages();
      doc.setTextColor(100, 116, 139);
      label.forEach((line, i) => doc.text(line, M + 4, top + 9.5 + i * 12.5));
      write(String(v ?? '-'), M + LABEL_W, CW - LABEL_W);
      if (doc.getNumberOfPages() === page) y = Math.max(y, top + label.length * 12.5);
      y += 3;
    });

    if (s.table) {
      const cols = [110, CW - 110 - 120, 120];
      const row = (cells, bold) => {
        const heights = cells.map((c, i) => doc.splitTextToSize(pdfSafe(c), cols[i] - 8).length);
        const h = Math.max(...heights) * 12.5 + 6;
        ensure(h);
        let x = M;
        if (bold) {
          doc.setFillColor(248, 250, 252);
          doc.rect(M, y, CW, h, 'F');
        }
        cells.forEach((c, i) => {
          doc.setFont(i === 1 && !bold ? 'courier' : 'helvetica', bold ? 'bold' : 'normal');
          doc.setFontSize(9.5);
          doc.setTextColor(...(i === 2 && /^Yes/.test(c) ? [220, 38, 38] : [51, 65, 85]));
          doc.text(doc.splitTextToSize(pdfSafe(c), cols[i] - 8), x + 4, y + 13);
          x += cols[i];
        });
        y += h;
        doc.setDrawColor(226, 232, 240);
        doc.setLineWidth(0.5);
        doc.line(M, y, M + CW, y);
      };
      if (!s.table.rows.length) write(s.table.empty, M + 4, CW - 8, { color: [100, 116, 139] });
      else {
        row(s.table.head, true);
        s.table.rows.forEach((r) => row(r, false));
      }
      y += 4;
    }

    if (s.items) {
      if (!s.items.length && s.empty) write(s.empty, M + 4, CW - 8, { color: [100, 116, 139] });
      s.items.forEach((it) => {
        ensure(26);
        const markColor = it.mark === '[x]' ? [220, 38, 38] : it.mark === '[+]' ? [5, 150, 105] : [100, 116, 139];
        const startY = y;
        write(it.mark, M + 4, 22, { bold: true, color: markColor });
        y = startY;
        write(it.title, M + 28, CW - 32, { bold: true, color: [15, 23, 42] });
        if (it.detail) write(it.detail, M + 28, CW - 32);
        if (it.evidence) write(`Evidence: "${it.evidence}"`, M + 28, CW - 32, { font: 'courier', size: 9, color: [180, 83, 9] });
        y += 4;
      });
    }

    if (s.text) {
      write(s.text, M + 4, CW - 8, s.mono ? { font: 'courier', size: 9, lh: 11.5, color: [30, 41, 59] } : {});
    }
    y += 4;
  });

  ensure(40);
  y += 8;
  write(t('report.footer'), M, CW, { size: 9, color: [100, 116, 139] });

  // Page footers
  const pages = doc.getNumberOfPages();
  for (let i = 1; i <= pages; i += 1) {
    doc.setPage(i);
    doc.setDrawColor(226, 232, 240);
    doc.line(M, H - 30, W - M, H - 30);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text(`TrustMatrix incident report - Scan ${pdfSafe(scan.id)} - Helpline ${HELPLINE}`, M, H - 18);
    doc.text(`Page ${i} of ${pages}`, W - M, H - 18, { align: 'right' });
  }
  return doc.output('blob');
}

/** Build the PDF in the browser from the scan on screen and save it. */
export async function downloadScanReport(scan, user) {
  const blob = await buildDossierPdf(scan, user);
  downloadBlob(blob, `TrustMatrix_Report_${scan.id}.pdf`);
}
