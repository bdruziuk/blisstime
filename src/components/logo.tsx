import { cn } from "@/lib/utils";

/**
 * EasyService brand logo: a red gradient swoosh checkmark + "easy service"
 * wordmark. The mark scales with the wrapper's font-size, so sizing is just
 * a text-size class (e.g. text-lg, text-2xl).
 */
export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn("font-heading inline-flex items-center gap-2 font-bold", className)}>
      <svg
        viewBox="0 0 54 40"
        className="h-[1.2em] w-auto shrink-0"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden
      >
        <defs>
          <linearGradient
            id="es-logo-gradient"
            x1="8"
            y1="4"
            x2="30"
            y2="38"
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor="#F26451" />
            <stop offset="1" stopColor="#D2382A" />
          </linearGradient>
        </defs>
        <path
          d="M6 23 L18 34 C 28 21 40 11 50 5"
          stroke="url(#es-logo-gradient)"
          strokeWidth="7.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <span className="text-foreground">easy service</span>
    </span>
  );
}
