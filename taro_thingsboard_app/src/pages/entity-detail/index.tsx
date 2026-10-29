import { ScrollView, Text, View } from '@tarojs/components'
import Taro, { useRouter } from '@tarojs/taro'
import { useEffect, useState } from 'react'
import { getAsset, getCustomer, getTenant } from '../../api/entities'
import type { AuditLog } from '../../api/types'
import Avatar from '../../components/Avatar'
import { Field, Loading, Section } from '../../components/Cells'
import { peekTransient } from '../../store/transient'
import { formatDateTime } from '../../utils/format'
import { actionTypeLabel, entityTypeLabel } from '../../views/labels'
import './index.scss'

type Kind = 'customer' | 'asset' | 'tenant' | 'auditLog'

const TITLES: Record<Kind, string> = {
  customer: '客户详情',
  asset: '资产详情',
  tenant: '租户详情',
  auditLog: '审计日志详情'
}

function ContactFields({ e }: { e: any }) {
  return (
    <>
      <Field label='电子邮箱' value={e.email} />
      <Field label='电话' value={e.phone} />
      <Field label='国家' value={e.country} />
      <Field label='省/州' value={e.state} />
      <Field label='城市' value={e.city} />
      <Field label='地址' value={[e.address, e.address2].filter(Boolean).join(' ')} />
      <Field label='邮编' value={e.zip} />
    </>
  )
}

/** 客户 / 资产 / 租户 / 审计日志详情，对应 Flutter 版 *_details_page.dart。 */
export default function EntityDetailPage() {
  const { params } = useRouter()
  const kind = (params.kind || 'asset') as Kind
  const id = params.id || ''
  const [entity, setEntity] = useState<any>(null)

  useEffect(() => {
    Taro.setNavigationBarTitle({ title: TITLES[kind] })
    if (kind === 'auditLog') {
      setEntity(peekTransient<AuditLog>(`auditLog:${id}`) || null)
      return
    }
    const loader = kind === 'customer' ? getCustomer : kind === 'tenant' ? getTenant : getAsset
    loader(id).then(setEntity).catch(() => undefined)
  }, [kind, id])

  if (!entity) return <Loading />

  if (kind === 'auditLog') {
    const log = entity as AuditLog
    return (
      <ScrollView className='page-scroll detail-page' scrollY>
        <Section title='基本信息'>
          <Field label='时间' value={formatDateTime(log.createdTime)} />
          <Field label='实体类型' value={entityTypeLabel(log.entityId?.entityType)} />
          <Field label='实体名称' value={log.entityName} />
          <Field label='用户' value={log.userName} />
          <Field label='操作类型' value={actionTypeLabel(log.actionType)} />
          <Field
            label='状态'
            value={
              <Text style={{ color: log.actionStatus === 'FAILURE' ? '#d12730' : '#008a00' }}>
                {log.actionStatus === 'FAILURE' ? '失败' : '成功'}
              </Text>
            }
          />
        </Section>
        <Section title='操作数据'>
          <Text className='json' userSelect>
            {JSON.stringify(log.actionData ?? {}, null, 2)}
          </Text>
        </Section>
        {log.actionStatus === 'FAILURE' && (
          <Section title='失败详情'>
            <Text className='json' userSelect>
              {log.actionFailureDetails}
            </Text>
          </Section>
        )}
      </ScrollView>
    )
  }

  const title = entity.title || entity.label || entity.name
  return (
    <ScrollView className='page-scroll detail-page' scrollY>
      <View className='detail-head'>
        <Avatar text={title} size={120} />
        <Text className='detail-title'>{title}</Text>
        {kind === 'asset' && <Text className='muted'>{entity.assetProfileName || entity.type}</Text>}
      </View>
      <Section title='基本信息'>
        {kind === 'asset' ? (
          <>
            <Field label='名称' value={entity.name} />
            <Field label='标签' value={entity.label} />
            <Field label='资产配置' value={entity.assetProfileName || entity.type} />
          </>
        ) : (
          <Field label='名称' value={entity.title} />
        )}
        <Field label='创建时间' value={formatDateTime(entity.createdTime)} />
        {entity.additionalInfo?.description && <Field label='描述' value={entity.additionalInfo.description} />}
      </Section>
      {kind !== 'asset' && (
        <Section title='联系信息'>
          <ContactFields e={entity} />
        </Section>
      )}
    </ScrollView>
  )
}
