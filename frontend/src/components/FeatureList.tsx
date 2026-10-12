import type { Icon } from "@phosphor-icons/react";

export interface Feature {
  icon: Icon;
  title: string;
  body: string;
}

interface FeatureListProps {
  features: Feature[];
  className?: string;
  /** "row" lays items out as columns on desktop (landing-page default).
   *  "col" keeps a single stacked column at every breakpoint, for narrow
   *  containers like a dashboard sidebar. */
  direction?: "row" | "col";
}

/** Icon+title+body rows, stacked on mobile and laid out as columns on
 *  desktop by default. Shared between the Landing page and the Dashboard
 *  so both describe the product the same way. */
export function FeatureList({
  features,
  className = "",
  direction = "row",
}: FeatureListProps) {
  return (
    <div
      className={`flex flex-col ${direction === "row" ? "lg:flex-row lg:gap-10" : ""} ${className}`}
    >
      {features.map(({ icon: Icon, title, body }) => (
        <div
          key={title}
          className={`flex items-start gap-3.5 py-4 [&+&]:border-t [&+&]:border-hairline ${
            direction === "row"
              ? "lg:flex-1 lg:flex-col lg:items-start lg:gap-4 lg:py-0 lg:[&+&]:border-t-0"
              : ""
          }`}
        >
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] bg-tint text-brand lg:h-11 lg:w-11">
            <Icon size={22} weight="regular" />
          </span>
          <div>
            <p className="mb-0.5 text-sm font-bold text-ink lg:text-[15px]">{title}</p>
            <p className="text-[13px] leading-relaxed text-ink-soft lg:max-w-[32ch] lg:text-sm">
              {body}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
