import { WebView } from '@tarojs/components'
import Taro, { useRouter } from '@tarojs/taro'
import { useEffect, useState } from 'react'
import { refreshJwtToken, session } from '../../api/http'
import { Loading } from '../../components/Cells'
import { buildDashboardUrl } from '../../core/dashboard'
import { isTokenExpired } from '../../utils/jwt'
import { readParam } from '../../utils/url'

/**
 * 仪表板页（web-view），对应 Flutter 版 lib/modules/dashboard（InAppWebView）。
 * 注意：需在微信公众平台「开发管理 → 业务域名」中配置 ThingsBoard 服务器域名。
 */
export default function DashboardPage() {
  const { params } = useRouter()
  const [src, setSrc] = useState('')

  useEffect(() => {
    const title = readParam(params.title)
    if (title) Taro.setNavigationBarTitle({ title })
    ;(async () => {
      // 进入前确保令牌有效，避免 Web UI 打开后立即跳转到登录页
      const token = session.getToken()
      if (token && isTokenExpired(token, 120)) await refreshJwtToken()
      setSrc(
        buildDashboardUrl(
          session.getEndpoint(),
          params.id || '',
          { token: session.getToken(), refreshToken: session.getRefreshToken() },
          {
            state: readParam(params.state) || undefined,
            hideToolbar: params.hideToolbar === '1'
          }
        )
      )
    })()
  }, [params.id, params.state, params.title, params.hideToolbar])

  if (!src) return <Loading />
  return <WebView src={src} />
}
