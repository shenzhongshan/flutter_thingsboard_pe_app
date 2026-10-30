import { Button, Input, Text, View } from '@tarojs/components'
import Taro, { useUnload } from '@tarojs/taro'
import { useEffect, useRef, useState } from 'react'
import { checkTwoFaVerificationCode, getAvailableTwoFaProviders, requestTwoFaVerificationCode } from '../../api/auth'
import { session } from '../../api/http'
import type { TwoFaProviderInfo } from '../../api/types'
import Icon from '../../components/Icon'
import { applyLoginResponse, authStore, showLoginError, TenantMismatchError } from '../../store/auth'
import { Routes, relaunch } from '../../utils/router'
import './index.scss'

const PROVIDER_LABELS: Record<TwoFaProviderInfo['type'], { title: string; hint: string; icon: string }> = {
  TOTP: { title: '身份验证器', hint: '请输入身份验证器 App 中显示的 6 位验证码', icon: 'lock' },
  SMS: { title: '短信', hint: '验证码已发送至手机', icon: 'send' },
  EMAIL: { title: '邮箱', hint: '验证码已发送至邮箱', icon: 'send' },
  BACKUP_CODE: { title: '备用验证码', hint: '请输入一个未使用过的备用验证码', icon: 'info' }
}

/** 双因素认证，对应 Flutter 版 lib/core/auth/2FA/confirm。 */
export default function TwoFactorPage() {
  const [providers, setProviders] = useState<TwoFaProviderInfo[]>([])
  const [provider, setProvider] = useState<TwoFaProviderInfo | null>(null)
  const [code, setCode] = useState('')
  const [countdown, setCountdown] = useState(0)
  const [loading, setLoading] = useState(false)
  const timer = useRef<ReturnType<typeof setInterval>>()
  const done = useRef(false)

  const startCountdown = (seconds: number) => {
    clearInterval(timer.current)
    setCountdown(seconds)
    timer.current = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) clearInterval(timer.current)
        return c - 1
      })
    }, 1000)
  }

  const sendCode = async (p: TwoFaProviderInfo) => {
    if (p.type !== 'SMS' && p.type !== 'EMAIL') return
    try {
      await requestTwoFaVerificationCode(p.type)
      startCountdown(p.minVerificationCodeSendPeriod || 30)
    } catch (_) {
      // 已提示
    }
  }

  const choose = (p: TwoFaProviderInfo) => {
    setProvider(p)
    setCode('')
    sendCode(p)
  }

  useEffect(() => {
    getAvailableTwoFaProviders()
      .then((list) => {
        setProviders(list)
        const def = list.find((p) => p.default) || list[0]
        if (def) choose(def)
      })
      .catch(() => undefined)
    return () => clearInterval(timer.current)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // 未完成验证就离开：丢弃预验证令牌
  useUnload(() => {
    if (!done.current && authStore.get().status === 'twoFactor') session.clearTokens()
  })

  const verify = async () => {
    if (!provider || !code.trim()) return
    setLoading(true)
    try {
      const res = await checkTwoFaVerificationCode(provider.type, code.trim())
      const status = await applyLoginResponse(res)
      if (status === 'authenticated') {
        done.current = true
        relaunch(Routes.main)
      }
    } catch (e) {
      showLoginError(e)
      if (e instanceof TenantMismatchError) {
        done.current = true
        relaunch(Routes.login)
      }
    } finally {
      setLoading(false)
    }
  }

  const label = provider ? PROVIDER_LABELS[provider.type] : null
  return (
    <View className='twofa-page'>
      {provider && label && (
        <View className='card twofa-card'>
          <View className='row twofa-head'>
            <Icon name={label.icon} size={48} color='#305680' />
            <Text className='twofa-title'>{label.title}验证</Text>
          </View>
          <Text className='muted twofa-hint'>
            {label.hint}
            {provider.contact ? ` ${provider.contact}` : ''}
          </Text>
          <Input
            className='form-input code-input'
            type={provider.type === 'BACKUP_CODE' ? 'text' : 'number'}
            maxlength={provider.type === 'BACKUP_CODE' ? 8 : 6}
            placeholder='验证码'
            value={code}
            focus
            onInput={(e) => setCode(e.detail.value)}
            onConfirm={verify}
          />
          <Button className='btn' loading={loading} disabled={loading || !code.trim()} onClick={verify}>
            验证
          </Button>
          {(provider.type === 'SMS' || provider.type === 'EMAIL') && (
            <View className='resend'>
              {countdown > 0 ? (
                <Text className='muted'>{countdown} 秒后可重新发送</Text>
              ) : (
                <Text className='link' onClick={() => sendCode(provider)}>
                  重新发送验证码
                </Text>
              )}
            </View>
          )}
        </View>
      )}
      {providers.length > 1 && (
        <View className='section'>
          <Text className='section-title'>选择其他验证方式</Text>
          <View className='card other-providers'>
            {providers
              .filter((p) => p.type !== provider?.type)
              .map((p) => (
                <View key={p.type} className='menu-item' onClick={() => choose(p)}>
                  <Icon name={PROVIDER_LABELS[p.type].icon} size={40} color='#305680' />
                  <Text className='menu-title'>{PROVIDER_LABELS[p.type].title}</Text>
                  <Icon name='chevron_right' size={40} color='#c0c0c0' />
                </View>
              ))}
          </View>
        </View>
      )}
      <View className='cancel'>
        <Text
          className='link'
          onClick={() => {
            session.clearTokens()
            Taro.navigateBack().catch(() => relaunch(Routes.login))
          }}
        >
          取消并返回登录
        </Text>
      </View>
    </View>
  )
}
