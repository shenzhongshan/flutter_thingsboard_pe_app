import { Button, Image, ScrollView, Text, View } from '@tarojs/components'
import Taro, { useRouter } from '@tarojs/taro'
import { useEffect, useState } from 'react'
import { getAttributes, getDevice, getDeviceProfileInfo, getLatestTimeseries } from '../../api/entities'
import type { Device, DeviceProfileInfo } from '../../api/types'
import { Field, Loading, Section } from '../../components/Cells'
import { createDashboardEntityState } from '../../core/dashboard'
import { hasGenericPermission } from '../../core/permissions'
import { authStore, isTenantAdmin } from '../../store/auth'
import { formatDateTime } from '../../utils/format'
import { openDashboard } from '../../utils/router'
import './index.scss'

type KV = { key: string; value: string; ts?: number }

function stringify(value: unknown): string {
  if (value === null || value === undefined) return '-'
  if (typeof value === 'object') return JSON.stringify(value)
  return String(value)
}

/** 设备详情，对应 Flutter 版 device_details_page 与 device_dashboard_navigation。 */
export default function DeviceDetailPage() {
  const { params } = useRouter()
  const id = params.id || ''
  const permissions = authStore.use((s) => s.permissions)
  const [device, setDevice] = useState<Device | null>(null)
  const [profile, setProfile] = useState<DeviceProfileInfo | null>(null)
  const [attributes, setAttributes] = useState<KV[]>([])
  const [telemetry, setTelemetry] = useState<KV[]>([])

  useEffect(() => {
    getDevice(id)
      .then((d) => {
        setDevice(d)
        Taro.setNavigationBarTitle({ title: d.label || d.name || '设备详情' })
        if (d.deviceProfileId?.id) getDeviceProfileInfo(d.deviceProfileId.id).then(setProfile).catch(() => undefined)
      })
      .catch(() => undefined)
    getAttributes('DEVICE', id)
      .then((list) => setAttributes(list.map((a) => ({ key: a.key, value: stringify(a.value), ts: a.lastUpdateTs }))))
      .catch(() => undefined)
    getLatestTimeseries('DEVICE', id)
      .then((map) =>
        setTelemetry(
          Object.keys(map).map((key) => ({ key, value: stringify(map[key]?.[0]?.value), ts: map[key]?.[0]?.ts }))
        )
      )
      .catch(() => undefined)
  }, [id])

  if (!device) return <Loading />

  const dashboardId = profile?.defaultDashboardId?.id
  const openDeviceDashboard = () => {
    if (!dashboardId) {
      if (isTenantAdmin()) {
        Taro.showToast({ title: '请在设备配置中设置移动端仪表板', icon: 'none' })
      }
      return
    }
    // 渲染部件需要 WIDGETS_BUNDLE / WIDGET_TYPE 读权限（PE）
    if (
      permissions &&
      (!hasGenericPermission(permissions, 'WIDGETS_BUNDLE', 'READ') ||
        !hasGenericPermission(permissions, 'WIDGET_TYPE', 'READ'))
    ) {
      Taro.showToast({ title: '没有权限执行该操作', icon: 'none' })
      return
    }
    openDashboard(dashboardId, device.label || device.name, {
      state: createDashboardEntityState(device.id, { entityName: device.name, entityLabel: device.label })
    })
  }

  return (
    <ScrollView className='page-scroll device-page' scrollY>
      <View className='device-head'>
        {profile?.image ? (
          <Image className='device-image' src={profile.image} mode='aspectFit' />
        ) : null}
        <View className='device-head-body'>
          <Text className='device-name'>{device.label || device.name}</Text>
          <Text className='muted'>{device.type}</Text>
        </View>
      </View>
      {(dashboardId || isTenantAdmin()) && (
        <View className='device-actions'>
          <Button className='btn' onClick={openDeviceDashboard}>
            打开设备仪表板
          </Button>
        </View>
      )}
      <Section title='基本信息'>
        <Field label='名称' value={device.name} />
        <Field label='标签' value={device.label} />
        <Field label='设备配置' value={device.type} />
        <Field label='创建时间' value={formatDateTime(device.createdTime)} />
        {device.additionalInfo?.description && <Field label='描述' value={device.additionalInfo.description} />}
      </Section>
      <Section title={`最新遥测（${telemetry.length}）`}>
        {telemetry.length === 0 && <Text className='muted kv-empty'>暂无遥测数据</Text>}
        {telemetry.map((t) => (
          <Field
            key={t.key}
            label={t.key}
            value={
              <View className='kv-value'>
                <Text>{t.value}</Text>
                <Text className='muted'>{formatDateTime(t.ts)}</Text>
              </View>
            }
          />
        ))}
      </Section>
      <Section title={`属性（${attributes.length}）`}>
        {attributes.length === 0 && <Text className='muted kv-empty'>暂无属性</Text>}
        {attributes.map((a) => (
          <Field key={a.key} label={a.key} value={a.value} />
        ))}
      </Section>
    </ScrollView>
  )
}
