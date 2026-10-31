/** Shared constants used across the app. */

export const HELPLINE = '1930';
export const CYBERCRIME_URL = 'https://cybercrime.gov.in';

/** Task-scam script stages (i18n keys under stages.task.*). */
export const TASK_STAGES = ['hook', 'trustPayout', 'privateGroup', 'prepaidTasks', 'escalation', 'exitFee'];
/** Fake job-offer stages (i18n keys under stages.job.*). */
export const JOB_STAGES = ['offer', 'feeDemand', 'verificationFee', 'pressure'];

export const VERDICTS = ['scam', 'suspicious', 'genuine'];
export const SCAN_TYPES = ['chat', 'offer_letter', 'job_post', 'screenshot'];
export const ENTITY_TYPES = ['upi', 'phone', 'telegram', 'link', 'domain', 'amount'];

/** The 6 processing steps (i18n keys under processing.steps.*). */
export const PROCESSING_STEPS = ['ocr', 'patterns', 'mca', 'domain', 'stage', 'explain'];

/** Chart colours in the required order: primary, teal, warning, danger, success. */
export const CHART_COLORS = ['#3b82f6', '#0d9488', '#f59e0b', '#ef4444', '#10b981'];
export const VERDICT_COLORS = { scam: '#ef4444', suspicious: '#f59e0b', genuine: '#10b981' };

export const ACCEPTED_FILES = {
  'image/png': ['.png'],
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/webp': ['.webp'],
  'application/pdf': ['.pdf'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
  'text/plain': ['.txt'],
};
export const MAX_FILE_SIZE = 10 * 1024 * 1024;
