import { Text, View } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { initials } from '../utils/format'
import './common.scss'

const COLORS = ['#305680', '#008A00', '#D12730', '#F66716', '#6D4C41', '#5E35B1', '#00838F', '#AD1457']

function colorFor(text: string): string {
  let hash = 0
  for (let i = 0; i < text.length; i++) hash = (hash * 31 + text.charCodeAt(i)) | 0
  return COLORS[Math.abs(hash) % COLORS.length]
}

export default function Avatar({ text, size = 72 }: { text?: string | null; size?: number }) {
  const t = text || '?'
  return (
    <View
      className='avatar'
      style={{
        backgroundColor: colorFor(t),
        width: Taro.pxTransform(size),
        height: Taro.pxTransform(size),
        borderRadius: Taro.pxTransform(size / 2)
      }}
    >
      <Text className='avatar-text' style={{ fontSize: Taro.pxTransform(Math.round(size * 0.38)) }}>
        {initials(t)}
      </Text>
    </View>
  )
}
