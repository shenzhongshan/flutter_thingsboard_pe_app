import { Button, Input, ScrollView, Text, View } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useEffect, useState } from 'react'
import { saveUser } from '../api/entities'
import Avatar from '../components/Avatar'
import { MenuItem, Section } from '../components/Cells'
import { authStore } from '../store/auth'
import { fullName } from '../utils/format'
import { Routes, go } from '../utils/router'
import { AUTHORITY_LABELS } from './labels'
import { confirmLogout } from './MoreView'

/** 个人资料编辑，对应 Flutter 版 lib/modules/profile/profile_page.dart。 */
export default function ProfileView() {
  const user = authStore.use((s) => s.user)
  const [form, setForm] = useState({ email: '', firstName: '', lastName: '', phone: '' })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (user) {
      setForm({
        email: user.email || '',
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        phone: user.phone || ''
      })
    }
  }, [user])

  const dirty =
    !!user &&
    (form.email !== (user.email || '') ||
      form.firstName !== (user.firstName || '') ||
      form.lastName !== (user.lastName || '') ||
      form.phone !== (user.phone || ''))

  const save = async () => {
    if (!user) return
    if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) {
      Taro.showToast({ title: '请输入有效的邮箱地址', icon: 'none' })
      return
    }
    setSaving(true)
    try {
      const saved = await saveUser({
        ...user,
        email: form.email.trim(),
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        phone: form.phone.trim()
      })
      authStore.set({ user: saved })
      Taro.showToast({ title: '个人资料已保存', icon: 'success' })
    } catch (_) {
      // 已提示
    } finally {
      setSaving(false)
    }
  }

  const field = (key: keyof typeof form, label: string, type: 'text' | 'number' = 'text') => (
    <View className='form-item'>
      <Text className='form-label'>{label}</Text>
      <Input
        className='form-input'
        type={type}
        value={form[key]}
        onInput={(e) => setForm((f) => ({ ...f, [key]: e.detail.value }))}
      />
    </View>
  )

  return (
    <ScrollView className='view' scrollY>
      <View className='profile-top'>
        <Avatar text={fullName(user)} size={144} />
        <Text className='profile-header-name'>{fullName(user)}</Text>
        <Text className='muted'>{AUTHORITY_LABELS[user?.authority || ''] || user?.authority}</Text>
      </View>
      <View className='section'>
        <View className='card profile-form'>
          {field('email', '电子邮箱 *')}
          {field('firstName', '名')}
          {field('lastName', '姓')}
          {field('phone', '电话', 'number')}
          <Button className='btn' disabled={!dirty || saving} loading={saving} onClick={save}>
            保存
          </Button>
        </View>
      </View>
      <Section>
        <MenuItem icon='lock' title='修改密码' onClick={() => go(Routes.changePassword)} />
        <MenuItem icon='logout' title='退出登录' danger onClick={confirmLogout} />
      </Section>
    </ScrollView>
  )
}
