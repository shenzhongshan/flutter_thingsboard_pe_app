import { Button, Input, Text, View } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useState } from 'react'
import { session } from '../../api/http'
import Icon from '../../components/Icon'
import { REGIONS, type Region } from '../../config'
import { StorageKeys, getItem, setItem } from '../../utils/storage'
import { normalizeEndpoint } from '../../utils/url'
import './index.scss'

/** 区域 / 服务器选择，对应 Flutter 版 lib/core/select_region。 */
export default function RegionPage() {
  const [region, setRegion] = useState<Region>(getItem<Region>(StorageKeys.region) || 'northAmerica')
  const [custom, setCustom] = useState(
    getItem<Region>(StorageKeys.region) === 'custom' ? session.getEndpoint() : ''
  )

  const onSave = () => {
    const cfg = REGIONS.find((r) => r.id === region)!
    const host = region === 'custom' ? normalizeEndpoint(custom) : cfg.host!
    if (!/^https?:\/\/[^/\s]+/.test(host)) {
      Taro.showToast({ title: '请输入有效的服务器地址', icon: 'none' })
      return
    }
    if (session.getEndpoint() !== host) session.clearTokens()
    session.setEndpoint(host)
    setItem(StorageKeys.region, region)
    Taro.navigateBack().catch(() => Taro.reLaunch({ url: '/pages/login/index' }))
  }

  return (
    <View className='region-page'>
      <Text className='region-tip'>请选择您的 ThingsBoard 服务器所在区域，或填写私有部署的服务器地址。</Text>
      <View className='card region-card'>
        {REGIONS.map((r) => (
          <View key={r.id} className='region-item' onClick={() => setRegion(r.id)}>
            <Text className='region-label'>{r.label}</Text>
            {region === r.id && <Icon name='check' size={44} color='#305680' />}
          </View>
        ))}
      </View>
      {region === 'custom' && (
        <View className='form-item custom-input'>
          <Text className='form-label'>服务器地址</Text>
          <Input
            className='form-input'
            placeholder='https://iot.example.com'
            value={custom}
            onInput={(e) => setCustom(e.detail.value)}
          />
          <Text className='muted note'>
            注意：小程序只能访问在微信公众平台「开发管理 → 服务器域名」中配置过的 HTTPS 域名。
          </Text>
        </View>
      )}
      <Button className='btn save-btn' onClick={onSave}>
        确定
      </Button>
    </View>
  )
}
