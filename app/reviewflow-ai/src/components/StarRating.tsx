import { KeyboardEvent, useId } from "react";

interface Props {
  value: number;
  onChange?: (v: number) => void;
  readOnly?: boolean;
  /** px; defaults to a fluid size that fits a 360px phone with card padding */
  size?: number | string;
  showLabel?: boolean;
}

const LABELS: Record<number, string> = { 1: "גרוע", 2: "לא טוב", 3: "סביר", 4: "טוב", 5: "מעולה" };
const ARIA: Record<number, string> = { 1: "כוכב אחד", 2: "שני כוכבים", 3: "שלושה כוכבים", 4: "ארבעה כוכבים", 5: "חמישה כוכבים" };

export default function StarRating({ value, onChange, readOnly = false, size, showLabel = true }: Props) {
  const id = useId();
  const dim = size ?? "clamp(40px, 13vw, 56px)";

  if (readOnly) {
    return (
      <div className="inline-flex gap-1" role="img" aria-label={`דירוג ${value} מתוך 5`}>
        {[1, 2, 3, 4, 5].map((n) => <Star key={n} filled={n <= value} dim={typeof size === "number" ? size : 18} />)}
      </div>
    );
  }

  function onKey(e: KeyboardEvent<HTMLDivElement>) {
    if (!onChange) return;
    // RTL: ArrowLeft increases (moves toward the 5th star on the left)
    if (e.key === "ArrowLeft" || e.key === "ArrowUp") { e.preventDefault(); onChange(Math.min(5, (value || 0) + 1)); }
    if (e.key === "ArrowRight" || e.key === "ArrowDown") { e.preventDefault(); onChange(Math.max(1, (value || 1) - 1)); }
    if (/^[1-5]$/.test(e.key)) onChange(Number(e.key));
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <div role="radiogroup" aria-labelledby={`${id}-label`} onKeyDown={onKey} className="flex justify-center gap-2 select-none">
        {[1, 2, 3, 4, 5].map((n) => {
          const filled = n <= value;
          return (
            <button
              key={n}
              type="button"
              role="radio"
              aria-checked={value === n}
              aria-label={ARIA[n]}
              tabIndex={value === n || (!value && n === 1) ? 0 : -1}
              onClick={() => onChange?.(n)}
              className="rounded-full transition active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
              style={{ width: dim, height: dim }}
            >
              <Star filled={filled} dim="100%" />
            </button>
          );
        })}
      </div>
      <span id={`${id}-label`} className="text-sm font-medium text-slate-600 min-h-[1.25rem]" aria-live="polite">
        {showLabel && value ? LABELS[value] : "בחרו דירוג"}
      </span>
    </div>
  );
}

function Star({ filled, dim }: { filled: boolean; dim: number | string }) {
  return (
    <svg viewBox="0 0 24 24" width={dim} height={dim} fill={filled ? "#facc15" : "none"} stroke={filled ? "#eab308" : "#cbd5e1"} strokeWidth="1.5" aria-hidden="true">
      <path strokeLinejoin="round" d="M12 2.75l2.95 6.2 6.8.85-5.04 4.7 1.36 6.7L12 17.9l-6.07 3.3 1.36-6.7L2.25 9.8l6.8-.85z" />
    </svg>
  );
}
