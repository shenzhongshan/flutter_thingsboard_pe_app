import { Button, Picker, ScrollView, Text, View } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useEffect, useState } from 'react'
import { entityField, findDevices } from '../../api/entities'
import type { EntityData } from '../../api/types'
import { Field, Section } from '../../components/Cells'
import SearchBar from '../../components/SearchBar'
import { authStore } from '../../store/auth'
import {
  liveTrackingStore,
  setTrackingInterval,
  setTrackingTarget,
  startTracking,
  stopTracking
} from '../../store/liveTracking'
import { formatDateTime, fullName } from '../../utils/format'
import './index.scss'

const INTERVALS = [5, 10, 30, 60, 300]

/** 实时位置追踪页，对应 Flutter 版 lib/modules/location_tracking。 */
export default function LiveTrackingPage() {
  const state = liveTrackingStore.use((s) => s)
  const user = authStore.use((s) => s.user)
  const [search, setSearch] = useState('')
  const [devices, setDevices] = useState<EntityData[]>([])

  useEffect(() => {
    if (state.active) return
    findDevices({ page: 0, pageSize: 20, textSearch: search })
      .then((res) => setDevices(res.data))
      .catch(() => undefined)
  }, [search, state.active])

  const toggle = async () => {
    if (state.active) {
      await stopTracking()
      return
    }
    try {
      await startTracking(fullName(user) || user?.email || '')
      Taro.showToast({ title: '已开始追踪', icon: 'success' })
    } catch (_) {
      Taro.showModal({
        title: '需要位置权限',
        content: '请在小程序设置中允许使用位置信息后重试。',
        confirmText: '去设置',
        success: (r) => r.confirm && Taro.openSetting()
      })
    }
  }

  return (
    <ScrollView className='page-scroll tracking-page' scrollY>
      <Section title='追踪状态'>
        <Field
          label='状态'
          value={<Text style={{ color: state.active ? '#008a00' : '#999' }}>{state.active ? '追踪中' : '未开始'}</Text>}
        />
        <Field label='目标设备' value={state.target?.name || '未选择'} />
        <Field
          label='上报间隔'
          value={
            <Picker
              mode='selector'
              range={INTERVALS.map((s) => `${s} 秒`)}
              value={Math.max(0, INTERVALS.indexOf(state.intervalSeconds))}
              onChange={(e) => setTrackingInterval(INTERVALS[Number(e.detail.value)])}
            >
              <Text className='link'>{state.intervalSeconds} 秒</Text>
            </Picker>
          }
        />
        {state.lastFix && (
          <>
            <Field label='最新位置' value={`${state.lastFix.latitude.toFixed(6)}, ${state.lastFix.longitude.toFixed(6)}`} />
            <Field label='精度' value={`${Math.round(state.lastFix.accuracy)} 米`} />
            <Field label='定位时间' value={formatDateTime(state.lastFix.ts)} />
          </>
        )}
        <Field label='已上报次数' value={String(state.sentCount)} />
        {state.error && <Field label='错误' value={<Text style={{ color: '#d12730' }}>{state.error}</Text>} />}
      </Section>
      <View className='tracking-actions'>
        <Button className={`btn ${state.active ? 'btn-danger' : ''}`} disabled={!state.target} onClick={toggle}>
          {state.active ? '停止追踪' : '开始追踪'}
        </Button>
        <Text className='muted tracking-note'>
          位置以遥测 latitude / longitude / accuracy / altitude / speed 上报，并写入服务端属性 gpsActive、gpsTrackedBy。
          小程序切到后台后微信会暂停定位。
        </Text>
      </View>
      {!state.active && (
        <Section title='选择目标设备'>
          <SearchBar placeholder='搜索设备' onSearch={setSearch} />
          {devices.map((d) => {
            const name = entityField(d, 'label') || entityField(d, 'name') || '-'
            const selected = state.target?.id.id === d.entityId.id
            return (
              <View
                key={d.entityId.id}
                className={`device-option ${selected ? 'selected' : ''}`}
                onClick={() => setTrackingTarget({ id: d.entityId, name })}
              >
                <Text>{name}</Text>
                <Text className='muted'>{entityField(d, 'type')}</Text>
              </View>
            )
          })}
        </Section>
      )}
    </ScrollView>
  )
}
