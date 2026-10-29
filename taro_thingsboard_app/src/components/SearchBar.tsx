import { Input, View } from '@tarojs/components'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import Icon from './Icon'
import './common.scss'

interface Props {
  placeholder?: string
  onSearch: (text: string) => void
  /** 右侧附加内容（如筛选按钮） */
  extra?: ReactNode
}

/** 带防抖的搜索框，对应 Flutter 版列表页 AppBar 中的搜索。 */
export default function SearchBar({ placeholder = '搜索', onSearch, extra }: Props) {
  const [value, setValue] = useState('')
  const timer = useRef<ReturnType<typeof setTimeout>>()
  const onSearchRef = useRef(onSearch)
  onSearchRef.current = onSearch

  useEffect(() => () => clearTimeout(timer.current), [])

  const onInput = (text: string) => {
    setValue(text)
    clearTimeout(timer.current)
    timer.current = setTimeout(() => onSearchRef.current(text.trim()), 400)
  }

  return (
    <View className='search-bar'>
      <View className='search-input-wrap'>
        <Icon name='search' size={36} color='#9e9e9e' />
        <Input
          className='search-input'
          value={value}
          placeholder={placeholder}
          confirmType='search'
          onInput={(e) => onInput(e.detail.value)}
          onConfirm={(e) => {
            clearTimeout(timer.current)
            onSearchRef.current(e.detail.value.trim())
          }}
        />
        {value && (
          <View onClick={() => onInput('')}>
            <Icon name='close' size={32} color='#9e9e9e' />
          </View>
        )}
      </View>
      {extra}
    </View>
  )
}
