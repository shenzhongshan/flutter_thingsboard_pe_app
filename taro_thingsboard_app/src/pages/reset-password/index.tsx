import { Button, Input, Text, View } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useState } from 'react'
import { requestResetPasswordByEmail } from '../../api/auth'
import './index.scss'

/** 申请重置密码，对应 Flutter 版 lib/core/auth/reset_password。 */
export default function ResetPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async () => {
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) {
      Taro.showToast({ title: '请输入有效的邮箱地址', icon: 'none' })
      return
    }
    setLoading(true)
    try {
      await requestResetPasswordByEmail(email.trim())
      await Taro.showModal({
        title: '邮件已发送',
        content: '重置密码链接已发送到您的邮箱，请按邮件提示完成密码重置。',
        showCancel: false
      })
      Taro.navigateBack()
    } catch (_) {
      // 已提示
    } finally {
      setLoading(false)
    }
  }

  return (
    <View className='reset-page'>
      <Text className='reset-tip'>请输入与账号关联的电子邮箱地址，我们会向该地址发送重置密码链接。</Text>
      <View className='form-item'>
        <Input
          className='form-input'
          type='text'
          placeholder='电子邮箱'
          value={email}
          onInput={(e) => setEmail(e.detail.value)}
          onConfirm={submit}
        />
      </View>
      <Button className='btn' loading={loading} disabled={loading} onClick={submit}>
        发送重置链接
      </Button>
    </View>
  )
}
