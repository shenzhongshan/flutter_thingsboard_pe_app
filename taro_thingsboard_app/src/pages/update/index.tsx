import { Button, ScrollView, Text, View } from '@tarojs/components'
import Taro, { useDidShow } from '@tarojs/taro'
import Icon from '../../components/Icon'
import { compareVersions } from '../../core/version'
import { versionStore } from '../../store/version'
import { getAppVersion } from '../../utils/appInfo'
import { Routes } from '../../utils/router'
import { applyMiniProgramUpdate } from '../../utils/updater'
import './index.scss'

/** 强制更新页，对应 Flutter 版 lib/modules/version/view/update_required_page.dart。 */
export default function UpdatePage() {
  const info = versionStore.use((s) => s.info)
  const current = getAppVersion()

  // 用户更新后返回（或服务器调低了最低版本）时，不再停留在此页
  useDidShow(() => {
    if (!info?.minVersion || compareVersions(current, info.minVersion) >= 0) {
      Taro.reLaunch({ url: Routes.main })
    }
  })

  const update = async () => {
    if (!(await applyMiniProgramUpdate())) {
      Taro.showModal({
        title: '暂未获取到新版本',
        content: '请在微信中删除本小程序后重新搜索打开，或稍后再试。',
        showCancel: false
      })
    }
  }

  return (
    <ScrollView className='update-page' scrollY>
      <View className='update-head'>
        <Icon name='refresh' size={120} color='#305680' />
        <Text className='update-title'>需要更新到新版本</Text>
        <Text className='muted'>
          当前版本 {current}，最低要求 {info?.minVersion || '-'}
        </Text>
      </View>
      {!!info?.minVersionReleaseNotes && (
        <View className='card update-notes'>
          <Text className='update-notes-title'>更新说明</Text>
          <Text className='update-notes-text' userSelect>
            {info.minVersionReleaseNotes}
          </Text>
        </View>
      )}
      <View className='update-actions'>
        <Button className='btn' onClick={update}>
          立即更新
        </Button>
      </View>
    </ScrollView>
  )
}
