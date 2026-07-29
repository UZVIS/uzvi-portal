import type { SVGProps } from "react";

export {
  IconUsers,
  IconBriefcase,
  IconLayoutGrid,
  IconTrendingUp,
  IconArrowRight,
  IconArrowLeft,
  IconPlus,
  IconClose,
  IconClock,
  IconCheckCircle,
  IconSparkles,
  IconSend,
  IconBuilding,
  IconLogOut,
} from "../../../shared/components/icons";

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

export function IconTarget({ size = 18, ...props }: IconProps) {
  return (
    <svg {...base(size, props)}>
      <circle cx="12" cy="12" r="8.5" />
      <circle cx="12" cy="12" r="4.5" />
      <circle cx="12" cy="12" r="0.8" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function IconCopyWarn({ size = 18, ...props }: IconProps) {
  return (
    <svg {...base(size, props)}>
      <rect x="8.5" y="8.5" width="11" height="11" rx="2" />
      <path d="M5.5 15.5h-1a2 2 0 0 1-2-2v-9a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  );
}

export function IconStar({ size = 18, ...props }: IconProps) {
  return (
    <svg {...base(size, props)}>
      <path d="m12 3.5 2.4 5 5.5.7-4 3.9.9 5.5-4.8-2.6-4.8 2.6.9-5.5-4-3.9 5.5-.7L12 3.5Z" />
    </svg>
  );
}

export function IconUserCheck({ size = 18, ...props }: IconProps) {
  return (
    <svg {...base(size, props)}>
      <circle cx="9" cy="8" r="3.2" />
      <path d="M2.8 20a6.2 6.2 0 0 1 12.4 0" />
      <path d="m15.5 12.5 2 2 3.7-3.9" />
    </svg>
  );
}

export function IconFilter({ size = 18, ...props }: IconProps) {
  return (
    <svg {...base(size, props)}>
      <path d="M3.5 5h17L14 12.5V19l-4 2v-8.5L3.5 5Z" />
    </svg>
  );
}

export function IconMail({ size = 18, ...props }: IconProps) {
  return (
    <svg {...base(size, props)}>
      <rect x="3" y="5.5" width="18" height="13" rx="2" />
      <path d="m4 7 8 6 8-6" />
    </svg>
  );
}

export function IconFileText({ size = 18, ...props }: IconProps) {
  return (
    <svg {...base(size, props)}>
      <path d="M7 3.5h7l4 4V20a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4.5a1 1 0 0 1 1-1Z" />
      <path d="M14 3.5V8h4" />
      <path d="M9 12.5h6M9 16h6" />
    </svg>
  );
}

export function IconEdit({ size = 18, ...props }: IconProps) {
  return (
    <svg {...base(size, props)}>
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
    </svg>
  );
}

export function IconTrash({ size = 18, ...props }: IconProps) {
  return (
    <svg {...base(size, props)}>
      <path d="M4 7h16" />
      <path d="M9.5 7V4.8c0-.7.6-1.3 1.3-1.3h2.4c.7 0 1.3.6 1.3 1.3V7" />
      <path d="M6.5 7 7.3 19.4c.05.9.8 1.6 1.7 1.6h6c.9 0 1.65-.7 1.7-1.6L17.5 7" />
      <path d="M10.2 11v6M13.8 11v6" />
    </svg>
  );
}