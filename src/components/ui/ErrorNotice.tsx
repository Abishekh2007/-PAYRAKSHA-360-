// STUB: replaced by the ui-kit task. Contract: role="alert" containing the exact message; a "Try again" button when onRetry is given.
export interface ErrorNoticeProps { message: string; onRetry?: () => void; className?: string }

export function ErrorNotice({ message, onRetry, className = '' }: ErrorNoticeProps) {
  return (
    <div role="alert" className={className}>
      <span>{message}</span>
      {onRetry && <button type="button" onClick={onRetry}>Try again</button>}
    </div>
  );
}
