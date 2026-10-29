import { useCallback, useEffect, useRef, useState } from 'react'
import type { PageData } from '../api/types'

/**
 * 通用分页加载 Hook，对应 Flutter 版 PagedListView + PageKeyController。
 * deps 变化（搜索词、筛选条件）时自动从第 0 页重新加载。
 */
export function usePaged<T>(fetcher: (page: number) => Promise<PageData<T>>, deps: unknown[]) {
  const [items, setItems] = useState<T[]>([])
  const [loading, setLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [total, setTotal] = useState<number | null>(null)
  const pageRef = useRef(0)
  const requestId = useRef(0)
  const fetcherRef = useRef(fetcher)
  fetcherRef.current = fetcher

  const load = useCallback(async (reset: boolean) => {
    const id = ++requestId.current
    const page = reset ? 0 : pageRef.current
    setLoading(true)
    setError(null)
    try {
      const res = await fetcherRef.current(page)
      if (id !== requestId.current) return
      setItems((prev) => (reset ? res.data : [...prev, ...res.data]))
      setHasMore(res.hasNext)
      setTotal(res.totalElements)
      pageRef.current = page + 1
    } catch (e: any) {
      if (id !== requestId.current) return
      setError(e?.message || '加载失败')
      setHasMore(false)
    } finally {
      if (id === requestId.current) {
        setLoading(false)
        setRefreshing(false)
      }
    }
  }, [])

  const refresh = useCallback(() => {
    setRefreshing(true)
    return load(true)
  }, [load])

  const loadMore = useCallback(() => {
    if (!loading && hasMore) load(false)
  }, [load, loading, hasMore])

  const reload = useCallback(() => load(true), [load])

  useEffect(() => {
    setItems([])
    setHasMore(true)
    load(true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  return { items, setItems, loading, refreshing, hasMore, error, total, refresh, loadMore, reload }
}

export type PagedState<T> = ReturnType<typeof usePaged<T>>
