// Tiny reusable form components for admin tabs.
export const Input = (props) => (
    <input
        {...props}
        className={`w-full h-10 rounded-lg border-2 border-[hsl(var(--brand-ink))]/15 bg-white px-3 text-sm font-medium focus:border-[hsl(var(--brand-blue-deep))] focus:outline-none disabled:bg-[hsl(var(--brand-ink))]/5 ${
            props.className || ""
        }`}
    />
);

export const Textarea = (props) => (
    <textarea
        {...props}
        className={`w-full rounded-lg border-2 border-[hsl(var(--brand-ink))]/15 bg-white px-3 py-2 text-sm font-medium focus:border-[hsl(var(--brand-blue-deep))] focus:outline-none ${
            props.className || ""
        }`}
    />
);

export const Field = ({ label, hint, children }) => (
    <label className="block">
        <span className="block text-[11px] font-bold opacity-75 mb-1">
            {label}
        </span>
        {children}
        {hint && (
            <span className="block text-[10px] opacity-55 mt-0.5">
                {hint}
            </span>
        )}
    </label>
);

export const Toggle = ({ checked, onChange, testId, label }) => (
    <label
        className={`inline-flex items-center gap-2 rounded-full px-3 h-9 cursor-pointer border-2 transition-all text-xs font-bold ${
            checked
                ? "bg-[hsl(var(--brand-blue-deep))] text-[hsl(var(--brand-cream))] border-[hsl(var(--brand-blue-deep))]"
                : "bg-white text-[hsl(var(--brand-ink))]/70 border-[hsl(var(--brand-ink))]/15"
        }`}
    >
        <input
            type="checkbox"
            className="sr-only"
            checked={!!checked}
            onChange={(e) => onChange(e.target.checked)}
            data-testid={testId}
        />
        <span
            className={`w-3.5 h-3.5 rounded-full ${checked ? "bg-[#9affa6]" : "bg-[hsl(var(--brand-ink))]/25"}`}
        />
        {label}
    </label>
);

export const numOrNull = (v) => {
    if (v === "" || v == null) return null;
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
};
