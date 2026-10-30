import i18n from '../i18n/index.js';
import { formatDateTime } from './formatters.js';

/**
 * Plain-text incident dossier for the cybercrime.gov.in complaint form.
 * Always generated in English (the portal and police work in English; PDF fonts are Latin-only).
 */
export function buildDossierText(scan, user) {
  const t = i18n.getFixedT('en');
  const lines = [];
  lines.push(t('report.dossierTitle'));
  lines.push('='.repeat(48));
  lines.push(`${t('report.scanId')}: ${scan.id}`);
  lines.push(`${t('report.generated')}: ${formatDateTime(new Date(), 'en')}`);
  if (user) lines.push(`${t('report.victim')}: ${user.name}${user.phone ? `, ${user.phone}` : ''}, ${user.email}`);
  lines.push(`${t('report.category')}: ${t('report.categoryValue')}`);
  lines.push(`${t('report.verdict')}: ${t(`verdict.${scan.verdict}`)} (${t('report.risk')} ${scan.score}/100)`);
  if (scan.amountPaid) lines.push(`${t('report.amountLost')}: INR ${scan.amountPaid}`);
  lines.push('');
  lines.push(`${t('report.suspectDetails')}:`);
  const ents = scan.entities?.filter((e) => e.type !== 'amount') || [];
  if (!ents.length) lines.push(`- ${t('report.none')}`);
  ents.forEach((e) => lines.push(`- ${t(`entity.${e.type}`)}: ${e.value}${e.seenCount ? ` (${t('report.reportedBefore', { count: e.seenCount })})` : ''}`));
  if (scan.company?.name) lines.push(`- ${t('report.companyClaimed')}: ${scan.company.queried || scan.company.name} – MCA: ${t(`mca.status.${scan.company.status}`)}`);
  if (scan.domain?.hrEmail) lines.push(`- ${t('report.hrEmail')}: ${scan.domain.hrEmail}`);
  const amounts = scan.entities?.filter((e) => e.type === 'amount').map((e) => e.value.replace('₹', 'INR ')) || [];
  if (amounts.length) {
    lines.push('');
    lines.push(`${t('report.amountsMentioned')}: ${amounts.join(', ')}`);
  }
  lines.push('');
  lines.push(`${t('report.timeline')}:`);
  lines.push(`- ${formatDateTime(scan.createdAt, 'en')}: ${t('report.timelineScanned')}`);
  (scan.redFlags || []).forEach((f) => lines.push(`- ${f.title?.en || f.title}: "${(f.evidence || '').replace('₹', 'INR ')}"`));
  lines.push('');
  lines.push(`${t('report.summary')}:`);
  lines.push((scan.explanation?.en || '').replace(/₹/g, 'INR '));
  lines.push('');
  lines.push(t('report.footer'));
  return lines.join('\n');
}

/** Builds the dossier as a PDF Blob (jsPDF is loaded on demand to keep the bundle small). */
export async function buildDossierPdf(scan, user) {
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const text = buildDossierText(scan, user);
  const margin = 48;
  const width = doc.internal.pageSize.getWidth() - margin * 2;

  doc.setFillColor(59, 130, 246);
  doc.rect(0, 0, doc.internal.pageSize.getWidth(), 6, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(15, 23, 42);
  doc.text('JobKavach', margin, 48);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(51, 65, 85);

  let y = 76;
  // jsPDF's built-in fonts are Latin-only; strip characters it cannot draw.
  const safe = text.replace(/[^\x20-\x7E\n]/g, '');
  doc.splitTextToSize(safe, width).forEach((line) => {
    if (y > doc.internal.pageSize.getHeight() - margin) {
      doc.addPage();
      y = margin;
    }
    doc.text(line, margin, y);
    y += 14;
  });
  return doc.output('blob');
}
