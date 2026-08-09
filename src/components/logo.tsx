import { cn } from "@/lib/utils";

/** Get Node network mark and wordmark. Scales with the wrapper font size. */
export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn("font-heading inline-flex items-center gap-2 font-bold", className)}>
      <svg
        viewBox="0 0 52 40"
        className="h-[1.2em] w-auto shrink-0"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden
      >
        <defs>
          <linearGradient
            id="get-node-logo-gradient"
            x1="7"
            y1="5"
            x2="45"
            y2="35"
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor="#B77A4E" />
            <stop offset="1" stopColor="#704329" />
          </linearGradient>
        </defs>
        <path d="M10 20 26 7 42 20 26 33 10 20Z M10 20H42" stroke="url(#get-node-logo-gradient)" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="10" cy="20" r="5" fill="url(#get-node-logo-gradient)" />
        <circle cx="26" cy="7" r="5" fill="url(#get-node-logo-gradient)" />
        <circle cx="42" cy="20" r="5" fill="url(#get-node-logo-gradient)" />
        <circle cx="26" cy="33" r="5" fill="url(#get-node-logo-gradient)" />
      </svg>
      <span className="text-foreground whitespace-nowrap">Get <span className="text-primary">Node</span></span>
    </span>
  );
}
