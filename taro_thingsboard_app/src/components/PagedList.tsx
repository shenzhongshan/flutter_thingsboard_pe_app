import { ScrollView, Text, View } from '@tarojs/components'
import type { ReactNode } from 'react'
import type { PagedState } from './usePaged'
import Icon from './Icon'
import './common.scss'

interface Props<T> {
  state: PagedState<T>
  renderItem: (item: T, index: number) => ReactNode
  keyOf: (item: T, index: number) => string
  header?: ReactNode
  emptyText?: string
  className?: string
}

/** 可下拉刷新、触底加载的列表。 */
export default function PagedList<T>({ state, renderItem, keyOf, header, emptyText = '暂无数据', className }: Props<T>) {
  const { items, loading, refreshing, hasMore, error } = state
  return (
    <ScrollView
      className={`paged-list ${className || ''}`}
      scrollY
      enhanced
      refresherEnabled
      refresherTriggered={refreshing}
      onRefresherRefresh={() => state.refresh()}
      onScrollToLower={() => state.loadMore()}
      lowerThreshold={120}
    >
      {header}
      {items.map((item, index) => (
        <View key={keyOf(item, index)}>{renderItem(item, index)}</View>
      ))}
      {!loading && !error && items.length === 0 && (
        <View className='empty'>
          <Icon name='info' size={72} color='#c0c0c0' />
          <Text className='empty-text'>{emptyText}</Text>
        </View>
      )}
      {error && (
        <View className='empty' onClick={() => state.reload()}>
          <Icon name='error_outline' size={72} color='#d12730' />
          <Text className='empty-text'>{error}，点击重试</Text>
        </View>
      )}
      {loading && !refreshing && <View className='list-footer'>加载中…</View>}
      {!loading && !hasMore && items.length > 0 && <View className='list-footer'>没有更多了</View>}
    </ScrollView>
  )
}
