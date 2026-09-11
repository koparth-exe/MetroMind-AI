import { useState, useRef } from 'react';
import { CloudUpload, Upload, FileText, CheckCircle2, AlertTriangle, LoaderCircle, RotateCcw, ShieldAlert, Sparkles } from 'lucide-react';
import { Button } from '@/components/metro-shell';
import type { TransportMode } from '@/lib/transport-mode';
import type { UploadState } from './types';

interface DataUploadWorkspaceProps {
  transportMode: TransportMode;
  onFileUpload: (file: File) => void;
  isPending: boolean;
  isSuccess: boolean;
  isError: boolean;
  errorMessage?: string;
  uploadedFileName?: string;
  onResetDemo: () => void;
  onClearState: () => void;
}

export function DataUploadWorkspace({
  transportMode,
  onFileUpload,
  isPending,
  isSuccess,
  isError,
  errorMessage,
  uploadedFileName,
  onResetDemo,
  onClearState,
}: DataUploadWorkspaceProps) {
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isBus = transportMode === 'BUS';

  const handleFileDrop = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) onFileUpload(file);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onFileUpload(file);
      // Reset input value so same file can be re-selected if desired
      e.target.value = '';
    }
  };

  return (
    <section
      aria-label="Data Ingestion Workspace"
      className="signal-card rounded-2xl p-5 sm:p-6 border border-border/80 bg-card/95 shadow-xs flex flex-col justify-between"
    >
      <div>
        {/* Header */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-border/70 pb-3.5">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-primary" aria-hidden="true" />
            <h2 className="font-display text-base font-bold tracking-tight text-foreground sm:text-lg">
              Data Ingestion Workspace
            </h2>
            <span className="rounded-full border border-border/70 bg-muted/50 px-2.5 py-0.5 font-mono-ui text-[9px] font-bold uppercase tracking-wider text-muted-foreground">
              CSV / UTF-8
            </span>
          </div>
          <span className="font-mono-ui text-[10px] text-muted-foreground">
            Target pipeline: <strong className="text-foreground">{isBus ? 'BEST Bus' : 'Suburban Railway'}</strong>
          </span>
        </div>

        {/* Dropzone Container */}
        <label
          htmlFor="csv-upload"
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleFileDrop}
          className={`mt-4 relative grid min-h-[220px] cursor-pointer place-items-center rounded-xl border border-dashed p-6 text-center transition-all duration-200 sm:min-h-[240px] sm:p-8 ${
            dragOver
              ? 'border-primary bg-primary/[.09] shadow-sm ring-2 ring-primary/20'
              : isPending
              ? 'border-primary/50 bg-primary/[.04] cursor-wait'
              : isError
              ? 'border-risk-high/40 bg-risk-high/[.03] hover:border-risk-high/70'
              : isSuccess
              ? 'border-risk-low/40 bg-risk-low/[.03] hover:border-risk-low/70'
              : 'border-primary/40 bg-primary/[.02] hover:bg-primary/[.06] hover:border-primary/80'
          }`}
        >
          <input
            ref={fileInputRef}
            id="csv-upload"
            type="file"
            accept=".csv,text/csv"
            disabled={isPending}
            className="sr-only"
            onChange={handleFileSelect}
            data-testid="input-csv-upload"
            aria-label="Upload timetable CSV dataset"
          />

          <div className="max-w-md">
            {isPending ? (
              <div className="flex flex-col items-center gap-3">
                <div className="grid h-12 w-12 place-items-center rounded-xl bg-primary/15 text-primary shadow-xs">
                  <LoaderCircle size={24} className="animate-spin text-primary" />
                </div>
                <div className="font-display text-base font-bold text-foreground">
                  Validating Timetable CSV…
                </div>
                <p className="text-xs text-muted-foreground">
                  Parsing timetable observations, validating column types, and checking schema invariants against domain registry.
                </p>
                <div className="mt-2 h-1.5 w-48 overflow-hidden rounded-full bg-muted">
                  <div className="h-full w-full rounded-full bg-primary animate-pulse" />
                </div>
              </div>
            ) : isSuccess ? (
              <div className="flex flex-col items-center gap-2.5">
                <div className="grid h-12 w-12 place-items-center rounded-xl bg-risk-low/15 text-risk-low shadow-xs">
                  <CheckCircle2 size={24} />
                </div>
                <div className="font-display text-base font-bold text-foreground">
                  Dataset Ingested & Activated
                </div>
                <p className="font-mono-ui text-xs text-muted-foreground font-semibold">
                  {uploadedFileName || 'Custom CSV'}
                </p>
                <span className="rounded-full bg-risk-low/10 px-3 py-1 font-mono-ui text-[10px] font-bold uppercase text-risk-low border border-risk-low/30">
                  Ready for Model Training & Risk Evaluation
                </span>
                <div className="mt-3 inline-flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-muted transition-colors">
                  <Upload size={13} /> Replace with another CSV
                </div>
              </div>
            ) : isError ? (
              <div className="flex flex-col items-center gap-2.5">
                <div className="grid h-12 w-12 place-items-center rounded-xl bg-risk-high/15 text-risk-high shadow-xs">
                  <ShieldAlert size={24} />
                </div>
                <div className="font-display text-base font-bold text-foreground">
                  CSV Validation Rejected
                </div>
                <p className="text-xs text-risk-high/90 max-w-sm">
                  {errorMessage || 'The uploaded CSV file does not satisfy MetroMind schema requirements.'}
                </p>
                <div className="mt-2 flex items-center gap-2">
                  <div className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-bold text-foreground hover:bg-muted shadow-2xs">
                    <Upload size={12} /> Choose another file
                  </div>
                </div>
              </div>
            ) : (
              <div>
                <div className="mx-auto grid h-12 w-12 place-items-center rounded-xl bg-primary/10 text-primary shadow-xs transition-transform group-hover:scale-105">
                  <CloudUpload size={24} />
                </div>
                <div className="mt-3.5 font-display text-base font-bold text-foreground">
                  Drop a timetable CSV here, or browse files
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  Required columns: <span className="font-mono-ui font-semibold text-foreground">timestamp, route_id, station_id, passenger_count</span>
                </p>
                <div className="mt-4 inline-flex items-center gap-2 rounded-lg border border-border/80 bg-card px-3.5 py-2 text-xs font-bold text-foreground shadow-xs hover:bg-muted/80 transition-colors">
                  <Upload size={13} /> Select local CSV
                </div>
              </div>
            )}
          </div>
        </label>

        {/* Diagnostic Error Alert if validation failed */}
        {isError && (
          <div
            data-testid="status-upload-error"
            className="mt-3.5 rounded-xl border border-risk-high/30 bg-risk-high/[.07] p-4 text-xs text-foreground"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-start gap-2.5">
                <AlertTriangle size={15} className="text-risk-high shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <div className="font-bold text-risk-high">Schema Validation Error</div>
                  <p className="text-[11px] leading-relaxed text-muted-foreground">
                    {errorMessage || 'CSV validation failed. Ensure your file contains valid route IDs, positive passenger counts, and proper ISO-8601 timestamps.'}
                  </p>
                </div>
              </div>
              <Button
                onClick={onResetDemo}
                variant="outline"
                testId="button-restore-demo-error"
                className="shrink-0 font-mono-ui text-[10px] font-bold border-risk-high/30 text-foreground hover:bg-risk-high/10"
              >
                <RotateCcw size={11} /> Restore Demo
              </Button>
            </div>
          </div>
        )}

        {/* Success Confirmation Toast */}
        {isSuccess && (
          <div
            data-testid="status-upload-success"
            className="mt-3.5 flex items-center justify-between gap-2 rounded-xl border border-risk-low/30 bg-risk-low/[.07] p-3 text-xs text-foreground"
          >
            <div className="flex items-center gap-2">
              <CheckCircle2 size={15} className="text-risk-low shrink-0" />
              <span className="font-medium">
                New timetable dataset successfully validated and made active in pipeline.
              </span>
            </div>
            <button
              onClick={onClearState}
              className="font-mono-ui text-[10px] text-muted-foreground hover:text-foreground underline"
            >
              Dismiss
            </button>
          </div>
        )}
      </div>

      {/* Technical Contract Footnote */}
      <div className="mt-4 pt-3.5 border-t border-border/60 flex flex-wrap items-center justify-between gap-2 font-mono-ui text-[10px] text-muted-foreground">
        <span>ISO-8601 timestamps · Header row mandatory</span>
        <span className="text-foreground font-semibold">Max recommended rows: 50,000</span>
      </div>
    </section>
  );
}
