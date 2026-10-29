import { Image } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { base64Encode } from '../utils/base64'
import { resolveIconPath } from './icons'

const cache: Record<string, string> = {}

function iconSrc(name: string, color: string): string {
  const key = `${name}|${color}`
  if (!cache[key]) {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="${color}" d="${resolveIconPath(
      name
    )}"/></svg>`
    cache[key] = `data:image/svg+xml;base64,${base64Encode(svg)}`
  }
  return cache[key]
}

interface Props {
  name: string
  size?: number
  color?: string
  className?: string
}

/** SVG 图标（尺寸单位为设计稿 px，750 宽）。 */
export default function Icon({ name, size = 44, color = '#303030', className }: Props) {
  return (
    <Image
      className={className}
      src={iconSrc(name, color)}
      style={{ width: Taro.pxTransform(size), height: Taro.pxTransform(size), flexShrink: 0 }}
      mode='aspectFit'
    />
  )
}
