// STUB: replaced by the ui-kit task. Contract: a <button role="switch" aria-checked={checked} aria-label={label}>; click calls onChange(!checked).
export interface ToggleProps { checked: boolean; onChange: (next: boolean) => void; label: string; description?: string; disabled?: boolean; className?: string }

export function Toggle({ checked, onChange, label, description, disabled = false, className = '' }: ToggleProps) {
  return (
    <button type="button" role="switch" aria-checked={checked} aria-label={label} disabled={disabled} onClick={() => onChange(!checked)} className={className}>
      <span>{label}</span>
      {description && <span>{description}</span>}
    </button>
  );
}
