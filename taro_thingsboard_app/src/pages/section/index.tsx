import { View } from '@tarojs/components'
import Taro, { useRouter } from '@tarojs/taro'
import { useEffect } from 'react'
import { PAGE_TITLES, type PageId } from '../../core/navigation'
import { readParam } from '../../utils/url'
import { renderView } from '../../views/registry'

/** 通用容器页：在独立页面中打开「更多」菜单里的功能，或带参数的设备列表。 */
export default function SectionPage() {
  const { params } = useRouter()
  const view = params.view || ''
  const title = readParam(params.title) || PAGE_TITLES[view as PageId] || ''
  const deviceType = readParam(params.deviceType) || undefined
  const active = params.active === 'true' ? true : params.active === 'false' ? false : undefined

  useEffect(() => {
    if (title) Taro.setNavigationBarTitle({ title })
  }, [title])

  return <View className='page'>{renderView(view, { deviceType, active })}</View>
}
