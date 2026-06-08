interface Props {
  value: number;
  onChange?: (v: number) => void;
  size?: number;
  readOnly?: boolean;
}

export default function StarRating({ value, onChange, size = 56, readOnly = false }: Props) {
  return (
    <div className="flex flex-row-reverse justify-center gap-2 select-none" dir="ltr">
      {[1, 2, 3, 4, 5].map((n) => {
        const filled = n <= value;
        return (
          <button
            key={n}
            type="button"
            aria-label={`${n} כוכבים`}
            disabled={readOnly}
            onClick={() => !readOnly && onChange?.(n)}
            className="transition active:scale-95 disabled:opacity-100"
            style={{ width: size, height: size }}
          >
            <svg viewBox="0 0 24 24" fill={filled ? "#facc15" : "none"} stroke={filled ? "#eab308" : "#cbd5e1"} strokeWidth="1.5">
              <path strokeLinejoin="round" d="M12 2.75l2.95 6.2 6.8.85-5.04 4.7 1.36 6.7L12 17.9l-6.07 3.3 1.36-6.7L2.25 9.8l6.8-.85z"/>
            </svg>
          </button>
        );
      })}
    </div>
  );
}
