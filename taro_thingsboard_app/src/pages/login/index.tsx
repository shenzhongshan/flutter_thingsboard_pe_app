import { Button, Input, Text, View } from '@tarojs/components'
import Taro, { useDidShow } from '@tarojs/taro'
import { useState } from 'react'
import { exchangeQrSecret, getLoginMobileInfo } from '../../api/auth'
import { session } from '../../api/http'
import Icon from '../../components/Icon'
import { FIXED_API_ENDPOINT } from '../../config'
import { applyLoginResponse, loginWithPassword, type AuthStatus } from '../../store/auth'
import { Routes, go, relaunch } from '../../utils/router'
import { normalizeEndpoint, parseUrl } from '../../utils/url'
import './index.scss'

function afterLogin(status: AuthStatus) {
  if (status === 'twoFactor') {
    go(Routes.twoFactor)
  } else if (status === 'mfaSetupRequired') {
    Taro.showModal({
      title: '需要配置双因素认证',
      content: '平台要求您的账号启用双因素认证，请先在 ThingsBoard 网页端完成配置后再登录。',
      showCancel: false
    })
  } else if (status === 'authenticated') {
    relaunch(Routes.main)
  }
}

/** 登录页，对应 Flutter 版 lib/core/auth/login/view/login_page.dart。 */
export default function LoginPage() {
  const [endpoint, setEndpoint] = useState(session.getEndpoint())
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [oauthCount, setOauthCount] = useState(0)

  useDidShow(() => {
    const current = session.getEndpoint()
    setEndpoint(current)
    if (!current) return
    getLoginMobileInfo()
      .then((info) => setOauthCount(info?.oAuth2ClientLoginInfos?.length || 0))
      .catch(() => setOauthCount(0))
  })

  const onLogin = async () => {
    if (!session.getEndpoint()) {
      go(Routes.region)
      return
    }
    if (!username.trim() || !password) {
      Taro.showToast({ title: '请输入用户名和密码', icon: 'none' })
      return
    }
    setLoading(true)
    try {
      afterLogin(await loginWithPassword(username.trim(), password))
    } catch (_) {
      // 错误提示已由 http 层统一处理
    } finally {
      setLoading(false)
    }
  }

  /** 扫码登录：扫描 ThingsBoard 网页端「移动应用二维码」，对应 Flutter 版 noauth 流程。 */
  const onScan = async () => {
    let result: string
    try {
      result = (await Taro.scanCode({ onlyFromCamera: false, scanType: ['qrCode'] })).result
    } catch (_) {
      return
    }
    const url = parseUrl(result)
    if (!url) {
      Taro.showToast({ title: '无法识别的二维码', icon: 'none' })
      return
    }
    const host = normalizeEndpoint(url.query.host || url.origin)
    const secret = url.query.secret
    if (FIXED_API_ENDPOINT && host !== normalizeEndpoint(FIXED_API_ENDPOINT)) {
      Taro.showToast({ title: '二维码不属于当前服务器', icon: 'none' })
      return
    }
    session.setEndpoint(host)
    setEndpoint(host)
    if (!secret) {
      Taro.showToast({ title: `已切换服务器：${host}`, icon: 'none' })
      return
    }
    Taro.showLoading({ title: '正在登录' })
    try {
      const res = await exchangeQrSecret(host, secret)
      afterLogin(await applyLoginResponse(res))
    } catch (_) {
      // 已提示
    } finally {
      Taro.hideLoading()
    }
  }

  return (
    <View className='login-page'>
      <View className='login-hero'>
        <Text className='login-logo'>ThingsBoard</Text>
        <Text className='login-sub'>Professional Edition</Text>
      </View>
      <View className='login-form'>
        <Text className='login-title'>登录您的账号</Text>
        {!FIXED_API_ENDPOINT && (
          <View className='server-row' onClick={() => go(Routes.region)}>
            <Icon name='language' size={36} color='#305680' />
            <Text className='server-text'>{endpoint || '请选择服务器'}</Text>
            <Text className='link'>切换</Text>
          </View>
        )}
        <View className='form-item'>
          <Input
            className='form-input'
            type='text'
            placeholder='用户名（电子邮箱）'
            value={username}
            onInput={(e) => setUsername(e.detail.value)}
          />
        </View>
        <View className='form-item password-wrap'>
          <Input
            className='form-input password-input'
            password={!showPassword}
            placeholder='密码'
            value={password}
            onInput={(e) => setPassword(e.detail.value)}
            onConfirm={onLogin}
          />
          <View className='password-eye' onClick={() => setShowPassword(!showPassword)}>
            <Icon name='visibility' size={40} color={showPassword ? '#305680' : '#9e9e9e'} />
          </View>
        </View>
        <View className='forgot'>
          <Text className='link' onClick={() => go(Routes.resetPassword)}>
            忘记密码？
          </Text>
        </View>
        <Button className='btn' loading={loading} disabled={loading} onClick={onLogin}>
          登录
        </Button>
        <View className='divider'>
          <View className='divider-line' />
          <Text className='muted'>或</Text>
          <View className='divider-line' />
        </View>
        <Button className='btn btn-outline' onClick={onScan}>
          <Icon name='qr_code_scanner' size={40} color='#305680' />
          <Text className='scan-text'>扫码登录</Text>
        </Button>
        {oauthCount > 0 && (
          <Text className='muted oauth-hint'>
            该服务器配置了 {oauthCount} 个第三方登录方式，小程序暂不支持 OAuth2 跳转登录，可在网页端生成二维码后扫码登录。
          </Text>
        )}
      </View>
    </View>
  )
}
