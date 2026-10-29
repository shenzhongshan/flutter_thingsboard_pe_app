import { Button, Input, Text, View } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useState } from 'react'
import { changePassword } from '../../api/auth'
import { session } from '../../api/http'
import './index.scss'

/** 修改密码，对应 Flutter 版 lib/modules/profile/change_password_page.dart。 */
export default function ChangePasswordPage() {
  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async () => {
    if (!current || !next) {
      Taro.showToast({ title: '请填写当前密码和新密码', icon: 'none' })
      return
    }
    if (next !== confirm) {
      Taro.showToast({ title: '两次输入的新密码不一致', icon: 'none' })
      return
    }
    setLoading(true)
    try {
      const res = await changePassword(current, next)
      // 服务器会使旧会话失效并返回新令牌
      if (res?.token) session.setTokens(res.token, res.refreshToken)
      Taro.showToast({ title: '密码已修改', icon: 'success' })
      setTimeout(() => Taro.navigateBack(), 800)
    } catch (_) {
      // 已提示（例如密码策略不满足）
    } finally {
      setLoading(false)
    }
  }

  const input = (label: string, value: string, set: (v: string) => void) => (
    <View className='form-item'>
      <Text className='form-label'>{label}</Text>
      <Input className='form-input' password value={value} onInput={(e) => set(e.detail.value)} />
    </View>
  )

  return (
    <View className='change-password-page'>
      {input('当前密码', current, setCurrent)}
      {input('新密码', next, setNext)}
      {input('确认新密码', confirm, setConfirm)}
      <Button className='btn' loading={loading} disabled={loading} onClick={submit}>
        修改密码
      </Button>
    </View>
  )
}
