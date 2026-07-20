import type { SVGProps } from "react";

interface IconProps extends SVGProps<SVGSVGElement> {
  size?: number;
}

function base(size: number, props: SVGProps<SVGSVGElement>) {
  return {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    ...props,
  };
}

export function IconMegaphone({ size = 18, ...props }: IconProps) {
  return (
    <svg {...base(size, props)}>
      <path d="M3 10v4a1 1 0 0 0 1 1h2l1.5 5H10l-1-5h1l8 4V6l-8 4H4a1 1 0 0 0-1 1Z" />
      <path d="M18 8.5v7" />
    </svg>
  );
}

export function IconUsers({ size = 18, ...props }: IconProps) {
  return (
    <svg {...base(size, props)}>
      <circle cx="8.5" cy="8" r="3" />
      <path d="M2.5 20a6 6 0 0 1 12 0" />
      <path d="M15.5 6.2a3 3 0 0 1 0 5.8" />
      <path d="M14.8 14.3A6 6 0 0 1 21.5 20" />
    </svg>
  );
}

export function IconShield({ size = 18, ...props }: IconProps) {
  return (
    <svg {...base(size, props)}>
      <path d="M12 3.5 5 6v5.4c0 4.6 3 7.8 7 9.1 4-1.3 7-4.5 7-9.1V6l-7-2.5Z" />
      <path d="m9.2 12 2 2 3.6-3.8" />
    </svg>
  );
}

export function IconBell({ size = 18, ...props }: IconProps) {
  return (
    <svg {...base(size, props)}>
      <path d="M6 10a6 6 0 0 1 12 0c0 4 1.5 5.5 1.5 5.5H4.5S6 14 6 10Z" />
      <path d="M10 19a2 2 0 0 0 4 0" />
    </svg>
  );
}

export function IconCheckCircle({ size = 18, ...props }: IconProps) {
  return (
    <svg {...base(size, props)}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="m8.3 12.3 2.4 2.4 5-5.2" />
    </svg>
  );
}

export function IconArchive({ size = 18, ...props }: IconProps) {
  return (
    <svg {...base(size, props)}>
      <rect x="3.5" y="4" width="17" height="4.2" rx="1" />
      <path d="M4.5 8.2v10a1 1 0 0 0 1 1h13a1 1 0 0 0 1-1v-10" />
      <path d="M10 12.5h4" />
    </svg>
  );
}

export function IconPlus({ size = 18, ...props }: IconProps) {
  return (
    <svg {...base(size, props)}>
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

export function IconClose({ size = 18, ...props }: IconProps) {
  return (
    <svg {...base(size, props)}>
      <path d="m6 6 12 12M18 6 6 18" />
    </svg>
  );
}

export function IconClock({ size = 18, ...props }: IconProps) {
  return (
    <svg {...base(size, props)}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V12l3 2" />
    </svg>
  );
}

export function IconLogOut({ size = 18, ...props }: IconProps) {
  return (
    <svg {...base(size, props)}>
      <path d="M9 19H5.5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1H9" />
      <path d="M15.5 16 20 12l-4.5-4" />
      <path d="M20 12H9" />
    </svg>
  );
}

export function IconInbox({ size = 18, ...props }: IconProps) {
  return (
    <svg {...base(size, props)}>
      <path d="M4 12.5 6 5h12l2 7.5" />
      <path d="M4 12.5v6a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-6h-5.2l-1 2H10.2l-1-2H4Z" />
    </svg>
  );
}

export function IconLayers({ size = 18, ...props }: IconProps) {
  return (
    <svg {...base(size, props)}>
      <path d="m12 3 8.5 4.5L12 12 3.5 7.5 12 3Z" />
      <path d="m3.5 12 8.5 4.5 8.5-4.5" />
      <path d="m3.5 16.5 8.5 4.5 8.5-4.5" />
    </svg>
  );
}

export function IconBuilding({ size = 18, ...props }: IconProps) {
  return (
    <svg {...base(size, props)}>
      <rect x="4" y="3.5" width="11" height="17" rx="1" />
      <path d="M15 9.5h5v11h-5" />
      <path d="M7.3 7.3h1M11.3 7.3h1M7.3 11h1M11.3 11h1M7.3 14.7h1M11.3 14.7h1" />
    </svg>
  );
}

export function IconSend({ size = 18, ...props }: IconProps) {
  return (
    <svg {...base(size, props)}>
      <path d="m4 4 16 8-16 8 4-8-4-8Z" />
      <path d="M8 12h6" />
    </svg>
  );
}

export function IconSparkles({ size = 18, ...props }: IconProps) {
  return (
    <svg {...base(size, props)}>
      <path d="M12 3.5c.4 2.6 1 4 1.9 4.9.9.9 2.3 1.5 4.9 1.9-2.6.4-4 1-4.9 1.9-.9.9-1.5 2.3-1.9 4.9-.4-2.6-1-4-1.9-4.9-.9-.9-2.3-1.5-4.9-1.9 2.6-.4 4-1 4.9-1.9.9-.9 1.5-2.3 1.9-4.9Z" />
      <path d="M19 15.5c.2 1.1.5 1.7.9 2.1.4.4 1 .7 2.1.9-1.1.2-1.7.5-2.1.9-.4.4-.7 1-.9 2.1-.2-1.1-.5-1.7-.9-2.1-.4-.4-1-.7-2.1-.9 1.1-.2 1.7-.5 2.1-.9.4-.4.7-1 .9-2.1Z" />
    </svg>
  );
}

export function IconArrowRight({ size = 18, ...props }: IconProps) {
  return (
    <svg {...base(size, props)}>
      <path d="M4 12h14" />
      <path d="m13 6 6 6-6 6" />
    </svg>
  );
}

export function IconArrowLeft({ size = 18, ...props }: IconProps) {
  return (
    <svg {...base(size, props)}>
      <path d="M20 12H6" />
      <path d="m11 18-6-6 6-6" />
    </svg>
  );
}

export function IconBriefcase({ size = 18, ...props }: IconProps) {
  return (
    <svg {...base(size, props)}>
      <rect x="3.5" y="7.5" width="17" height="12" rx="1.5" />
      <path d="M8.5 7.5V6a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v1.5" />
      <path d="M3.5 12.5h17" />
    </svg>
  );
}

export function IconLayoutGrid({ size = 18, ...props }: IconProps) {
  return (
    <svg {...base(size, props)}>
      <rect x="3.5" y="3.5" width="7.5" height="7.5" rx="1.3" />
      <rect x="13" y="3.5" width="7.5" height="7.5" rx="1.3" />
      <rect x="3.5" y="13" width="7.5" height="7.5" rx="1.3" />
      <rect x="13" y="13" width="7.5" height="7.5" rx="1.3" />
    </svg>
  );
}

export function IconTrendingUp({ size = 18, ...props }: IconProps) {
  return (
    <svg {...base(size, props)}>
      <path d="m3.5 16 5.5-6 4 3.5L20.5 6" />
      <path d="M15 6h5.5v5.5" />
    </svg>
  );
}
