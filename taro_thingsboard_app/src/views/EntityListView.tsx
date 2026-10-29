import { Text, View } from '@tarojs/components'
import { useState } from 'react'
import { getAuditLogs, getTenants, getUserAssets, getUserCustomers } from '../api/entities'
import type { PageData } from '../api/types'
import Avatar from '../components/Avatar'
import Icon from '../components/Icon'
import PagedList from '../components/PagedList'
import SearchBar from '../components/SearchBar'
import { usePaged } from '../components/usePaged'
import { putTransient } from '../store/transient'
import { formatDate, formatDateTime } from '../utils/format'
import { Routes, go } from '../utils/router'
import { actionTypeLabel, entityTypeLabel } from './labels'

export type EntityListKind = 'customers' | 'assets' | 'tenants' | 'auditLogs'

interface ListRow {
  id: string
  title: string
  subtitle?: string
  aside?: string
  status?: 'SUCCESS' | 'FAILURE'
  raw: any
}

const CONFIG: Record<
  EntityListKind,
  { placeholder: string; empty: string; fetch: (page: number, text: string) => Promise<PageData<any>>; map: (e: any) => ListRow }
> = {
  customers: {
    placeholder: '搜索客户',
    empty: '暂无客户',
    fetch: (page, text) => getUserCustomers({ page, textSearch: text }),
    map: (e) => ({ id: e.id.id, title: e.title || e.name, subtitle: e.email || [e.country, e.city].filter(Boolean).join(' · '), aside: formatDate(e.createdTime), raw: e })
  },
  assets: {
    placeholder: '搜索资产',
    empty: '暂无资产',
    fetch: (page, text) => getUserAssets({ page, textSearch: text }),
    map: (e) => ({ id: e.id.id, title: e.label || e.name, subtitle: e.assetProfileName || e.type, aside: formatDate(e.createdTime), raw: e })
  },
  tenants: {
    placeholder: '搜索租户',
    empty: '暂无租户',
    fetch: (page, text) => getTenants({ page, textSearch: text }),
    map: (e) => ({ id: e.id.id, title: e.title || e.name, subtitle: e.email || [e.country, e.city].filter(Boolean).join(' · '), aside: formatDate(e.createdTime), raw: e })
  },
  auditLogs: {
    placeholder: '搜索审计日志',
    empty: '暂无审计日志',
    fetch: (page, text) => getAuditLogs({ page, textSearch: text }),
    map: (e) => ({
      id: e.id.id,
      title: `${entityTypeLabel(e.entityId?.entityType)} · ${e.entityName || '-'}`,
      subtitle: `${actionTypeLabel(e.actionType)} · ${e.userName || '-'}`,
      aside: formatDateTime(e.createdTime),
      status: e.actionStatus,
      raw: e
    })
  }
}

const DETAIL_KIND: Record<EntityListKind, string> = {
  customers: 'customer',
  assets: 'asset',
  tenants: 'tenant',
  auditLogs: 'auditLog'
}

/** 客户 / 资产 / 租户 / 审计日志通用列表，对应 Flutter 版 core/entity/entities_list。 */
export default function EntityListView({ kind }: { kind: EntityListKind }) {
  const cfg = CONFIG[kind]
  const [search, setSearch] = useState('')
  const paged = usePaged<ListRow>(
    async (page) => {
      const res = await cfg.fetch(page, search)
      return { ...res, data: res.data.map(cfg.map) }
    },
    [kind, search]
  )

  const openDetail = (row: ListRow) => {
    if (kind === 'auditLogs') {
      // 审计日志没有单独的详情接口，直接把数据带到详情页
      putTransient(`auditLog:${row.id}`, row.raw)
    }
    go(Routes.entityDetail, { kind: DETAIL_KIND[kind], id: row.id })
  }

  return (
    <View className='view'>
      <SearchBar placeholder={cfg.placeholder} onSearch={setSearch} />
      <PagedList
        state={paged}
        keyOf={(r) => r.id}
        emptyText={cfg.empty}
        renderItem={(r) => (
          <View className='list-card' hoverClass='hover' onClick={() => openDetail(r)}>
            {kind === 'auditLogs' ? (
              <View className='stripe' style={{ backgroundColor: r.status === 'FAILURE' ? '#d12730' : '#008a00' }} />
            ) : (
              <Avatar text={r.title} />
            )}
            <View className='list-card-body'>
              <Text className='list-card-title'>{r.title}</Text>
              {r.subtitle && <Text className='list-card-sub'>{r.subtitle}</Text>}
              {r.aside && <Text className='muted'>{r.aside}</Text>}
            </View>
            <Icon name='chevron_right' size={40} color='#c0c0c0' />
          </View>
        )}
      />
    </View>
  )
}
