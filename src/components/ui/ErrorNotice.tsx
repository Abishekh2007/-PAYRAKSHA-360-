import { AlertTriangle } from 'lucide-react';

export interface ErrorNoticeProps { message: string; title?: string; onRetry?: () => void; className?: string }

export function ErrorNotice({ message, title, onRetry, className = '' }: ErrorNoticeProps) {
  return (
    <div
      role="alert"
      className={`border border-red-500/40 bg-red-500/10 rounded-sm p-3 flex flex-col gap-2 ${className}`.trim()}
    >
      <p aria-hidden="true" className="font-mono text-[10px] tracking-[0.3em] text-red-300">// ENGINE NOTICE</p>
      <div className="flex items-start gap-2">
        <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-red-400" aria-hidden="true" />
        <div className="flex flex-col gap-1 flex-1">
          {title && <h3 className="font-semibold text-red-300 text-sm">{title}</h3>}
          <span className="text-sm text-red-100">{message}</span>
        </div>
      </div>
      {onRetry && (
        <div className="flex justify-end">
          <button type="button" onClick={onRetry} className="font-mono text-[10px] uppercase tracking-[0.14em] border border-red-500/50 text-red-300 bg-red-500/10 hover:bg-red-500/20 px-2 py-1 rounded-sm transition-colors">
            Try again
          </button>
        </div>
      )}
    </div>
  );
}
