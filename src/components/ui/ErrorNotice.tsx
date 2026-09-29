import { AlertTriangle } from 'lucide-react';

export interface ErrorNoticeProps { message: string; title?: string; onRetry?: () => void; className?: string }

export function ErrorNotice({ message, title, onRetry, className = '' }: ErrorNoticeProps) {
  return (
    <div role="alert" className={`glass p-4 border-risk-high/40 bg-risk-high/10 text-risk-high flex flex-col gap-3 ${className}`.trim()}>
      <div className="flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
        <div className="flex flex-col gap-1 flex-1">
          {title && <h3 className="font-semibold text-risk-high">{title}</h3>}
          <span className="text-sm opacity-90">{message}</span>
        </div>
      </div>
      {onRetry && (
        <div className="flex justify-end">
          <button type="button" onClick={onRetry} className="btn-danger px-3 py-1.5 text-xs rounded-lg">
            Try again
          </button>
        </div>
      )}
    </div>
  );
}