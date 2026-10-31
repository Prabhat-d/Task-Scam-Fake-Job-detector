import { useMemo, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { FlaskConical, UploadCloud, Download, CheckCircle2, XCircle, Play, FileSpreadsheet } from 'lucide-react';
import PageHeader from '../../components/common/PageHeader.jsx';
import Card from '../../components/common/Card.jsx';
import Button from '../../components/common/Button.jsx';
import VerdictChip from '../../components/common/VerdictChip.jsx';
import Pagination from '../../components/common/Pagination.jsx';
import KpiCard from '../../components/dashboard/KpiCard.jsx';
import { adminService } from '../../services/adminService.js';
import { downloadCSV, downloadBlob, formatBytes } from '../../utils/formatters.js';

const SAMPLE_CSV = 'text,label\n"Like YouTube videos and earn ₹50 per like. Join t.me/LikeEarn99",scam\n"Pay registration fee ₹1,500 for data entry job",scam\n"Interview at Infosys Limited. Confirm on the official portal. careers@infosys.com",genuine\n"Earn ₹30,000 per month typing work. WhatsApp +91 70112 45566",suspicious\n';

/** Batch evaluation of labelled samples → accuracy, precision, recall, F1, confusion matrix. */
export default function Evaluate() {
  const { t } = useTranslation();
  const [file, setFile] = useState(null);
  const [progress, setProgress] = useState(null);
  const [result, setResult] = useState(null);
  const [page, setPage] = useState(1);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: { 'text/csv': ['.csv'], 'application/zip': ['.zip'], 'application/x-zip-compressed': ['.zip'] },
    maxFiles: 1,
    onDropAccepted: ([f]) => {
      setFile(f);
      setResult(null);
    },
    onDropRejected: () => toast.error(t('admin.evaluate.badFile')),
  });

  const run = async () => {
    setProgress(0);
    setResult(null);
    try {
      const res = await adminService.evaluate(file, setProgress);
      setResult(res);
      setPage(1);
    } catch {
      toast.error(t('common.errorText'));
    } finally {
      setProgress(null);
    }
  };

  const pageRows = useMemo(() => result?.results.slice((page - 1) * 12, page * 12) || [], [result, page]);
  const m = result?.metrics;
  const maxCell = m ? Math.max(1, ...m.matrix.flat()) : 1;

  return (
    <>
      <PageHeader
        title={t('admin.evaluate.title')}
        description={t('admin.evaluate.subtitle')}
        actions={<Button variant="secondary" size="sm" icon={FileSpreadsheet} onClick={() => downloadBlob(new Blob([SAMPLE_CSV], { type: 'text/csv' }), 'trustmatrix_sample.csv')}>{t('admin.evaluate.sampleCsv')}</Button>}
      />

      <Card title={t('admin.evaluate.upload')} icon={UploadCloud} className="mb-6">
        <div
          {...getRootProps({
            className: `rounded-xl border-2 border-dashed px-6 py-8 text-center cursor-pointer transition-colors ${isDragActive ? 'border-primary bg-primary/5' : 'border-line bg-page dark:border-ink dark:bg-navy hover:border-primary/60'}`,
          })}
        >
          <input {...getInputProps()} aria-label={t('admin.evaluate.upload')} />
          <UploadCloud size={28} className="mx-auto text-primary mb-2" aria-hidden />
          <p className="font-medium text-heading">{file ? file.name : t('admin.evaluate.dropTitle')}</p>
          <p className="text-xs text-subtle mt-1">{file ? formatBytes(file.size) : t('admin.evaluate.dropHint')}</p>
        </div>
        <div className="mt-4 flex flex-col sm:flex-row sm:items-center gap-3">
          <Button icon={Play} onClick={run} loading={progress != null} disabled={progress != null}>{file ? t('admin.evaluate.run') : t('admin.evaluate.runSample')}</Button>
          {progress != null && (
            <div className="flex-1 flex items-center gap-3">
              <div className="h-2 flex-1 rounded-full bg-line dark:bg-ink overflow-hidden" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100} aria-label={t('admin.evaluate.running')}>
                <div className="h-full bg-primary transition-all" style={{ width: `${progress}%` }} />
              </div>
              <span className="mono text-xs text-subtle w-10 text-right">{progress}%</span>
            </div>
          )}
        </div>
      </Card>

      {result && (
        <>
          <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4 mb-6">
            <KpiCard label={t('admin.evaluate.accuracy')} value={m.accuracy} format="percent" tone="primary" icon={FlaskConical} hint={t('admin.evaluate.samples', { count: m.total })} />
            <KpiCard label={t('admin.evaluate.precision')} value={m.precision} format="percent" tone="teal" />
            <KpiCard label={t('admin.evaluate.recall')} value={m.recall} format="percent" tone="warning" />
            <KpiCard label={t('admin.evaluate.f1')} value={m.f1} format="percent" tone="success" />
          </div>

          <div className="grid xl:grid-cols-3 gap-6">
            <Card title={t('admin.evaluate.matrix')} subtitle={t('admin.evaluate.matrixSub')}>
              <div className="overflow-x-auto">
                <table className="w-full text-sm border-separate border-spacing-1">
                  <thead>
                    <tr>
                      <th className="text-[10px] text-subtle font-semibold text-left">{t('admin.evaluate.actualPredicted')}</th>
                      {m.labels.map((l) => <th key={l} className="text-xs text-subtle font-semibold">{t(`verdict.${l}`)}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {m.matrix.map((row, i) => (
                      <tr key={m.labels[i]}>
                        <th className="text-xs text-subtle font-semibold text-left pr-2">{t(`verdict.${m.labels[i]}`)}</th>
                        {row.map((v, j) => (
                          <td
                            key={j}
                            className={`h-14 text-center mono font-bold rounded-lg ${i === j ? 'text-white' : v ? 'text-danger' : 'text-subtle'}`}
                            style={{ background: i === j ? `rgba(59,130,246,${0.35 + (0.65 * v) / maxCell})` : v ? `rgba(239,68,68,${0.08 + (0.3 * v) / maxCell})` : undefined }}
                          >
                            {v}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>

            <Card
              className="xl:col-span-2"
              title={t('admin.evaluate.results')}
              bodyClassName="p-0"
              actions={<Button size="sm" variant="secondary" icon={Download} onClick={() => downloadCSV(result.results, `trustmatrix_evaluation_${Date.now()}.csv`)}>{t('admin.evaluate.export')}</Button>}
            >
              <div className="overflow-x-auto">
                <table className="table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>{t('admin.evaluate.colSample')}</th>
                      <th>{t('admin.evaluate.colActual')}</th>
                      <th>{t('admin.evaluate.colPredicted')}</th>
                      <th className="text-right">{t('admin.evaluate.colScore')}</th>
                      <th>{t('admin.evaluate.colCorrect')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pageRows.map((r) => (
                      <tr key={r.id}>
                        <td className="mono text-xs text-subtle">{r.id}</td>
                        <td className="max-w-xs"><p className="truncate text-xs" title={r.sample}>{r.sample}</p></td>
                        <td><VerdictChip verdict={r.actual} /></td>
                        <td><VerdictChip verdict={r.predicted} /></td>
                        <td className="text-right mono">{r.score}</td>
                        <td>
                          {r.correct ? (
                            <span className="inline-flex items-center gap-1 text-success text-xs font-semibold"><CheckCircle2 size={16} aria-hidden /> {t('common.yes')}</span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-danger text-xs font-semibold"><XCircle size={16} aria-hidden /> {t('common.no')}</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="px-4 pb-4">
                <Pagination page={page} pages={Math.ceil(result.results.length / 12)} onChange={setPage} />
              </div>
            </Card>
          </div>
        </>
      )}
    </>
  );
}
