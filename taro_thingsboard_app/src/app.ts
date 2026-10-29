import Taro, { useLaunch } from '@tarojs/taro'
import type { PropsWithChildren } from 'react'
import { restoreSession } from './store/auth'
import { appEvents } from './utils/events'
import { relaunchToLogin } from './utils/router'
import './app.scss'
import './components/common.scss'
import './views/views.scss'

// 任何接口返回 401 且无法刷新令牌时，回到登录页
appEvents.on('unauthorized', () => {
  const pages = Taro.getCurrentPages()
  const current = pages[pages.length - 1]?.route || ''
  if (!current.includes('pages/login') && !current.includes('pages/region') && !current.includes('pages/reset-password')) {
    relaunchToLogin()
  }
})

function App({ children }: PropsWithChildren) {
  useLaunch(() => {
    restoreSession()
  })
  return children
}

export default App
