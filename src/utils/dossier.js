import i18n from '../i18n/index.js';
import { formatDateTime, downloadBlob } from './formatters.js';
import { buildReasons } from './reasons.js';
import { buildReportPdf, scamIdFor, contentTypeFor, scamPatternFor } from './reportPdf.js';
import { TASK_STAGES, JOB_STAGES, HELPLINE, CYBERCRIME_URL } from './constants.js';

/**
 * Incident report for a scan, used for the 1930 helpline and the cybercrime.gov.in complaint.
 * Always in English (police portals work in English; jsPDF's built-in fonts are Latin-only).
 *
 * buildReportSections() is the single source; buildDossierText() and buildDossierPdf() only render it.
 */

const en = () => i18n.getFixedT('en');

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
      ['Scam ID', scamIdFor(scan)],
      ['Verdict', t(`verdict.${scan.verdict}`)],
      ['Risk score', `${scan.score} / 100`],
      ['Summary', scan.summary?.en || ''],
      ['Content type', contentTypeFor(scan)],
      ['Scam pattern', scamPatternFor(scan)],
      ['Scam stage reached', stageName(scan)],
      ['Reference', scan.id],
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

/** Structured PDF report (see reportPdf.js). `complainant` is the reporting user's name. */
export const buildDossierPdf = (scan, complainant) => buildReportPdf(scan, complainant);

/** Build the PDF in the browser from the scan on screen and save it. */
export async function downloadScanReport(scan, complainant) {
  const blob = await buildDossierPdf(scan, complainant);
  downloadBlob(blob, `TrustMatrix_${scamIdFor(scan)}.pdf`);
}
