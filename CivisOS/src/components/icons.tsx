import type { ReactNode, SVGProps } from 'react'

type IconProps = SVGProps<SVGSVGElement> & { size?: number }

function Icon({ size = 18, children, ...props }: IconProps & { children: ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      {...props}
    >
      {children}
    </svg>
  )
}

export function IconDashboard(p: IconProps) {
  return (
    <Icon {...p}>
      <rect x="3" y="3" width="7" height="9" rx="1.5" />
      <rect x="14" y="3" width="7" height="5" rx="1.5" />
      <rect x="14" y="12" width="7" height="9" rx="1.5" />
      <rect x="3" y="16" width="7" height="5" rx="1.5" />
    </Icon>
  )
}

export function IconUsers(p: IconProps) {
  return (
    <Icon {...p}>
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="3" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a3 3 0 0 1 0 5.74" />
    </Icon>
  )
}

export function IconClock(p: IconProps) {
  return (
    <Icon {...p}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </Icon>
  )
}

export function IconCar(p: IconProps) {
  return (
    <Icon {...p}>
      <path d="M5 17h14v2a1 1 0 0 1-1 1h-1a1 1 0 0 1-1-1v-1H8v1a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1v-2Z" />
      <path d="M5 17 6.5 9.5A2 2 0 0 1 8.45 8h7.1a2 2 0 0 1 1.95 1.5L19 17" />
      <circle cx="7.5" cy="17" r="1.2" />
      <circle cx="16.5" cy="17" r="1.2" />
    </Icon>
  )
}

export function IconMap(p: IconProps) {
  return (
    <Icon {...p}>
      <path d="M9 18 3 15V5l6 3 6-3 6 3v10l-6-3-6 3Z" />
      <path d="M9 8v10" />
      <path d="M15 5v10" />
    </Icon>
  )
}

export function IconSparkle(p: IconProps) {
  return (
    <Icon {...p}>
      <path d="M5 12h4l2-7 2 7h4l-3.2 2.5 1.2 4.5L11 16.5 6.8 19l1.2-4.5L5 12Z" />
    </Icon>
  )
}

export function IconClipboard(p: IconProps) {
  return (
    <Icon {...p}>
      <rect x="7" y="4" width="10" height="16" rx="2" />
      <path d="M9 4h6v2a1 1 0 0 1-1 1h-4a1 1 0 0 1-1-1V4Z" />
      <path d="M9 12h6" />
      <path d="M9 15h4" />
    </Icon>
  )
}

export function IconBell(p: IconProps) {
  return (
    <Icon {...p}>
      <path d="M6 9a6 6 0 0 1 12 0c0 7 2 7 2 9H4c0-2 2-2 2-9Z" />
      <path d="M10 20a2 2 0 0 0 4 0" />
    </Icon>
  )
}

export function IconChat(p: IconProps) {
  return (
    <Icon {...p}>
      <path d="M21 12a8 8 0 0 1-8 8H7l-4 3V12a8 8 0 1 1 18 0Z" />
    </Icon>
  )
}

export function IconChart(p: IconProps) {
  return (
    <Icon {...p}>
      <path d="M4 19V5" />
      <path d="M4 19h16" />
      <path d="M8 15v-4" />
      <path d="M12 15V8" />
      <path d="M16 15v-6" />
    </Icon>
  )
}

export function IconBot(p: IconProps) {
  return (
    <Icon {...p}>
      <rect x="5" y="8" width="14" height="10" rx="3" />
      <path d="M12 4v4" />
      <circle cx="9" cy="13" r="1" fill="currentColor" stroke="none" />
      <circle cx="15" cy="13" r="1" fill="currentColor" stroke="none" />
    </Icon>
  )
}

export function IconWrench(p: IconProps) {
  return (
    <Icon {...p}>
      <path d="M14.7 6.3a4 4 0 0 0-5.4 5.4L4 17v3h3l5.3-5.3a4 4 0 0 0 5.4-5.4l-2.5 2.5-2.5-2.5 2.5-2.5Z" />
    </Icon>
  )
}

export function IconFile(p: IconProps) {
  return (
    <Icon {...p}>
      <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8l-5-5Z" />
      <path d="M14 3v5h5" />
    </Icon>
  )
}

export function IconShield(p: IconProps) {
  return (
    <Icon {...p}>
      <path d="M12 3 5 6v6c0 5 3.5 7.5 7 9 3.5-1.5 7-4 7-9V6l-7-3Z" />
    </Icon>
  )
}

export function IconPlus(p: IconProps) {
  return (
    <Icon {...p}>
      <path d="M12 5v14" />
      <path d="M5 12h14" />
    </Icon>
  )
}

export function IconUserPlus(p: IconProps) {
  return (
    <Icon {...p}>
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="3" />
      <path d="M19 8v6" />
      <path d="M22 11h-6" />
    </Icon>
  )
}

export function IconActivity(p: IconProps) {
  return (
    <Icon {...p}>
      <path d="M22 12h-4l-3 8L9 4l-3 8H2" />
    </Icon>
  )
}

export function IconCheck(p: IconProps) {
  return (
    <Icon {...p}>
      <path d="M20 6 9 17l-5-5" />
    </Icon>
  )
}

export function IconInfo(p: IconProps) {
  return (
    <Icon {...p}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 8h.01" />
      <path d="M11 12h1v4h1" />
    </Icon>
  )
}

export function IconChevron(p: IconProps) {
  return (
    <Icon {...p}>
      <path d="m6 9 6 6 6-6" />
    </Icon>
  )
}

export function IconMenu(p: IconProps) {
  return (
    <Icon {...p}>
      <path d="M4 7h16" />
      <path d="M4 12h16" />
      <path d="M4 17h16" />
    </Icon>
  )
}

export function IconLogout(p: IconProps) {
  return (
    <Icon {...p}>
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <path d="m16 17 5-5-5-5" />
      <path d="M21 12H9" />
    </Icon>
  )
}
