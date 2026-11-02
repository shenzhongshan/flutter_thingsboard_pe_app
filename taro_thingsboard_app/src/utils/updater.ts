import Taro from '@tarojs/taro'

/**
 * 触发微信小程序更新：微信在冷启动时自动检查新版本，这里监听结果并在下载完成后重启应用。
 * 返回 false 表示当前环境不支持（如 H5）或没有可用的新版本。
 */
export function applyMiniProgramUpdate(): Promise<boolean> {
  return new Promise((resolve) => {
    const getUpdateManager = (Taro as any).getUpdateManager
    if (typeof getUpdateManager !== 'function') {
      resolve(false)
      return
    }
    const manager = getUpdateManager()
    if (!manager) {
      resolve(false)
      return
    }
    Taro.showLoading({ title: '正在检查更新' })
    manager.onCheckForUpdate((res: { hasUpdate: boolean }) => {
      if (!res.hasUpdate) {
        Taro.hideLoading()
        resolve(false)
      }
    })
    manager.onUpdateReady(() => {
      Taro.hideLoading()
      resolve(true)
      manager.applyUpdate()
    })
    manager.onUpdateFailed(() => {
      Taro.hideLoading()
      Taro.showToast({ title: '新版本下载失败，请稍后重试', icon: 'none' })
      resolve(false)
    })
  })
}
