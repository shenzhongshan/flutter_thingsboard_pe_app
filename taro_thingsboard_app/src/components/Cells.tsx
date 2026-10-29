import { Text, View } from '@tarojs/components'
import type { ReactNode } from 'react'
import Icon from './Icon'
import './common.scss'

/** 详情页「标签：值」行。 */
export function Field({ label, value }: { label: string; value?: ReactNode }) {
  return (
    <View className='field'>
      <Text className='field-label'>{label}</Text>
      <View className='field-value'>{value === undefined || value === null || value === '' ? '-' : value}</View>
    </View>
  )
}

/** 菜单行（更多页、个人资料页）。 */
export function MenuItem({
  icon,
  title,
  onClick,
  badge,
  danger,
  extra
}: {
  icon?: string
  title: string
  onClick?: () => void
  badge?: number
  danger?: boolean
  extra?: ReactNode
}) {
  return (
    <View className='menu-item' hoverClass='hover' onClick={onClick}>
      {icon && <Icon name={icon} size={44} color={danger ? '#d12730' : '#305680'} />}
      <Text className={`menu-title ${danger ? 'danger' : ''}`}>{title}</Text>
      {!!badge && badge > 0 && <Text className='badge'>{badge > 99 ? '99+' : badge}</Text>}
      {extra}
      <Icon name='chevron_right' size={40} color='#c0c0c0' />
    </View>
  )
}

export function Section({ title, children, extra }: { title?: string; children: ReactNode; extra?: ReactNode }) {
  return (
    <View className='section'>
      {(title || extra) && (
        <View className='section-header'>
          <Text className='section-title'>{title}</Text>
          {extra}
        </View>
      )}
      <View className='card'>{children}</View>
    </View>
  )
}

export function Chip({
  label,
  active,
  color,
  onClick
}: {
  label: string
  active?: boolean
  color?: string
  onClick?: () => void
}) {
  return (
    <View
      className={`chip ${active ? 'chip-active' : ''}`}
      style={active && color ? { backgroundColor: color, borderColor: color } : undefined}
      onClick={onClick}
    >
      <Text>{label}</Text>
    </View>
  )
}

export function Segmented<T extends string>({
  options,
  value,
  onChange
}: {
  options: { value: T; label: string }[]
  value: T
  onChange: (v: T) => void
}) {
  return (
    <View className='segmented'>
      {options.map((o) => (
        <View
          key={o.value}
          className={`segmented-item ${o.value === value ? 'segmented-active' : ''}`}
          onClick={() => onChange(o.value)}
        >
          {o.label}
        </View>
      ))}
    </View>
  )
}

export function Loading({ text = '加载中…' }: { text?: string }) {
  return (
    <View className='empty'>
      <Text className='empty-text'>{text}</Text>
    </View>
  )
}
