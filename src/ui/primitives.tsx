import type { Child, FC } from "hono/jsx";
import type { Game } from "../db/schema";
import { isoToGerman } from "../lib/dates";

// ---- Brand icons ----

/** Golf ball (radial-gradient sphere). */
export const GolfBall: FC<{ size?: number; style?: string }> = ({
    size = 14,
    style,
}) => (
    <span
        class="pp-ball"
        style={`width:${size}px;height:${size}px;display:inline-block;${style ?? ""}`}
    />
);

/** Flag on a pole; the pennant waves (pp-wave) unless animate is false. */
export const FlagMark: FC<{
    size?: number;
    pole?: string;
    flag?: string;
    animate?: boolean;
}> = ({ size = 16, pole = "#16261F", flag = "#E2533B", animate = true }) => {
    const poleW = Math.max(2, size * 0.14);
    return (
        <span
            style={`position:relative;display:inline-flex;width:${size}px;height:${size}px;flex:none`}
        >
            <span
                style={`position:absolute;left:${size * 0.29}px;top:0;width:${poleW}px;height:${size * 0.93}px;background:${pole};border-radius:1px`}
            />
            <span
                style={`position:absolute;left:${size * 0.43}px;top:0;width:${size * 0.57}px;height:${size * 0.43}px;background:${flag};clip-path:polygon(0 0,100% 50%,0 100%);transform-origin:left center;${animate ? "animation:pp-wave 2.6s ease-in-out infinite" : ""}`}
            />
        </span>
    );
};

/** Rounded turf badge with a flag (and optional ball) — the app logo mark. */
export const BrandBadge: FC<{
    size?: number;
    withBall?: boolean;
    bg?: string;
}> = ({
    size = 46,
    withBall = false,
    bg = "linear-gradient(165deg,#2E8B57,#14442F)",
}) => (
    <span
        style={`position:relative;display:inline-flex;width:${size}px;height:${size}px;flex:none;align-items:center;justify-content:center;background:${bg};border-radius:${Math.round(size * 0.3)}px;box-shadow:0 6px 16px rgba(20,68,47,.3)`}
    >
        <FlagMark size={Math.round(size * 0.62)} pole="#FFFDF8" />
        {withBall ? (
            <GolfBall
                size={Math.round(size * 0.22)}
                style={`position:absolute;left:${size * 0.53}px;bottom:${size * 0.17}px`}
            />
        ) : null}
    </span>
);

/** Winner's trophy (Lucide-style outline) — for closed-round / leaderboard moments. */
export const TrophyMark: FC<{
    size?: number;
    color?: string;
    style?: string;
}> = ({ size = 36, color = "var(--pp-gold)", style }) => (
    <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke={color}
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
        aria-hidden="true"
        style={`display:block;${style ?? ""}`}
    >
        <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
        <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
        <path d="M4 22h16" />
        <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
        <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
        <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
    </svg>
);

// ---- Status pill ----

const STATUS_LABEL: Record<Game["status"], string> = {
    open: "Offen",
    locked: "Gesperrt",
    archived: "Archiviert",
};

export const StatusBadge: FC<{ status: Game["status"] }> = ({ status }) => (
    <span class={`pp-status pp-status--${status}`}>
        <span class="dot" />
        {STATUS_LABEL[status]}
    </span>
);

// ---- Form field ----

export const FieldError: FC<{ message: string }> = ({ message }) => (
    <span class="pp-field-error">
        <span class="bang">!</span>
        {message}
    </span>
);

export interface FieldProps {
    name: string;
    label: string;
    required?: boolean;
    optional?: boolean;
    type?: string;
    value?: string | number;
    placeholder?: string;
    error?: string;
    inputClass?: string;
    inputMode?: "numeric" | "text";
    autofocus?: boolean;
    min?: number;
    max?: number;
}

export const Field: FC<FieldProps> = (p) => (
    <label class="pp-label">
        <span>
            {p.label} {p.required ? <span class="pp-req">*</span> : null}
            {p.optional ? <span class="pp-opt">(optional)</span> : null}
        </span>
        <input
            name={p.name}
            type={p.type ?? "text"}
            value={p.value as string | undefined}
            placeholder={p.placeholder}
            inputmode={p.inputMode}
            min={p.min}
            max={p.max}
            autofocus={p.autofocus}
            aria-invalid={p.error ? "true" : undefined}
            class={`pp-input ${p.inputClass ?? ""} ${p.error ? "pp-input--invalid" : ""}`}
        />
        {p.error ? <FieldError message={p.error} /> : null}
    </label>
);

// ---- Themed date field ----
// Renders a typeable TT.MM.JJJJ text input plus a flag button that opens the
// mini-golf themed calendar popover (built client-side in src/client/admin.ts).
// The input itself carries the value, so it degrades to a plain typeable field
// without JS and the server keeps accepting ISO or German dates.

export interface DateFieldProps {
    name: string;
    label: string;
    required?: boolean;
    optional?: boolean;
    value?: string;
    error?: string;
}

export const DateField: FC<DateFieldProps> = (p) => {
    const raw = (p.value ?? "").trim();
    // Stored values are ISO (YYYY-MM-DD); show them in German. A failed submit may
    // echo back whatever was typed — keep that verbatim so the user can fix it.
    const display = isoToGerman(raw) || raw;
    return (
        <label class="pp-label">
            <span>
                {p.label} {p.required ? <span class="pp-req">*</span> : null}
                {p.optional ? <span class="pp-opt">(optional)</span> : null}
            </span>
            <div class="pp-datepicker" data-datepicker>
                <input
                    name={p.name}
                    type="text"
                    value={display}
                    placeholder="TT.MM.JJJJ"
                    inputmode="numeric"
                    autocomplete="off"
                    data-dp-input
                    aria-invalid={p.error ? "true" : undefined}
                    class={`pp-input pp-datepicker__input ${p.error ? "pp-input--invalid" : ""}`}
                />
                <button
                    type="button"
                    class="pp-datepicker__btn"
                    data-dp-toggle
                    aria-label="Kalender öffnen"
                    aria-haspopup="dialog"
                    aria-expanded="false"
                >
                    <span class="pp-datepicker__flag" aria-hidden="true" />
                </button>
            </div>
            {p.error ? <FieldError message={p.error} /> : null}
        </label>
    );
};

// ---- QR (served by the public /qr route) ----

export const QrImg: FC<{
    publicId: string;
    target: "entry" | "board";
    size: number;
    rounded?: number;
}> = ({ publicId, target, size, rounded = 14 }) => (
    <span
        class="pp-qr"
        style={`width:${size}px;height:${size}px;border-radius:${rounded}px;padding:${Math.round(size * 0.08)}px`}
    >
        <img
            src={`/g/${publicId}/qr?target=${target}`}
            alt="QR-Code"
            width={size}
            height={size}
        />
    </span>
);

// ---- Toast (SSR fallback; the client also builds these dynamically) ----

export const Toast: FC<{ message: string; id?: string }> = ({
    message,
    id,
}) => (
    <div id={id} class="pp-toast" role="status">
        <span class="check">✓</span>
        {message}
    </div>
);

// ---- Confetti ----

const CONFETTI = [
    {
        left: 16,
        top: 18,
        w: 8,
        h: 12,
        color: "#F2C14E",
        round: 2,
        dur: 2.4,
        delay: 0,
    },
    {
        left: 38,
        top: 12,
        w: 9,
        h: 9,
        color: "#E2533B",
        round: 50,
        dur: 2.8,
        delay: 0.4,
    },
    {
        left: 62,
        top: 16,
        w: 8,
        h: 12,
        color: "#2E8B57",
        round: 2,
        dur: 2.2,
        delay: 0.7,
    },
    {
        left: 80,
        top: 13,
        w: 9,
        h: 9,
        color: "#D8A72B",
        round: 50,
        dur: 2.6,
        delay: 0.2,
    },
    {
        left: 50,
        top: 20,
        w: 8,
        h: 12,
        color: "#F2C14E",
        round: 2,
        dur: 3,
        delay: 1,
    },
];

export const Confetti: FC<{ class?: string }> = ({ class: cls }) => (
    <div class={`pp-confetti ${cls ?? ""}`} aria-hidden="true">
        {CONFETTI.map((c) => (
            <span
                key={`${c.left}-${c.top}`}
                style={`left:${c.left}%;top:${c.top}%;width:${c.w}px;height:${c.h}px;background:${c.color};border-radius:${c.round}${c.round === 50 ? "%" : "px"};animation-duration:${c.dur}s;animation-delay:${c.delay}s`}
            />
        ))}
    </div>
);

// ---- Generic page section helpers reused across admin screens ----

export const BrowserlessHead: FC<{
    eyebrow?: string;
    title: string;
    children?: Child;
}> = ({ eyebrow, title, children }) => (
    <div style="display:flex;align-items:center;gap:16px;margin-bottom:24px;flex-wrap:wrap">
        <div>
            {eyebrow ? (
                <div
                    class="pp-mono"
                    style="font-size:11px;color:var(--pp-text-faint);margin-bottom:2px"
                >
                    {eyebrow}
                </div>
            ) : null}
            <h2
                class="pp-h"
                style="margin:0;font-weight:800;font-size:26px;color:var(--pp-turf-to)"
            >
                {title}
            </h2>
        </div>
        {children}
    </div>
);
