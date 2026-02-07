import { Code, Zap, Cog, Settings, LucideIcon } from 'lucide-react'

interface CourseIconProps {
  iconName: string
  size?: number
  className?: string
  color?: string
}

// component to render course icons based on icon name
// maps icon names to lucide-react icons for professional look
export function CourseIcon({ iconName, size = 24, className = '', color }: CourseIconProps) {
  const iconMap: Record<string, LucideIcon> = {
    Code,
    Zap,
    Cog,
    Settings,
  }

  const IconComponent = iconMap[iconName] || Code

  return (
    <IconComponent
      size={size}
      className={className}
      style={color ? { color } : undefined}
    />
  )
}
