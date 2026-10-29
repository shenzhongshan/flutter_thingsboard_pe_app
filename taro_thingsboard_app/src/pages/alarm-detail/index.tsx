import { Button, Input, Picker, ScrollView, Text, View } from '@tarojs/components'
import Taro, { useRouter } from '@tarojs/taro'
import { useCallback, useEffect, useState } from 'react'
import {
  ackAlarm,
  assignAlarm,
  clearAlarm,
  deleteAlarmComment,
  getAlarmComments,
  getAlarmInfo,
  getUsersForAssign,
  saveAlarmComment,
  unassignAlarm
} from '../../api/alarms'
import type { AlarmComment, AlarmInfo, UserInfoShort } from '../../api/types'
import Avatar from '../../components/Avatar'
import { Field, Loading, Section } from '../../components/Cells'
import { SEVERITY_COLORS, SEVERITY_LABELS, alarmStatusText } from '../../core/alarm'
import { hasGenericPermission } from '../../core/permissions'
import { authStore } from '../../store/auth'
import { appEvents } from '../../utils/events'
import { formatDateTime, fullName, timeAgo } from '../../utils/format'
import { entityTypeLabel } from '../../views/labels'
import './index.scss'

/** 告警详情 + 活动（评论），对应 Flutter 版 alarm_details_page 与 alarm activity。 */
export default function AlarmDetailPage() {
  const { params } = useRouter()
  const alarmId = params.id || ''
  const userId = authStore.use((s) => s.authUser?.userId)
  const authority = authStore.use((s) => s.authUser?.authority)
  const permissions = authStore.use((s) => s.permissions)
  const canWrite = authority !== 'SYS_ADMIN' && (!permissions || hasGenericPermission(permissions, 'ALARM', 'WRITE'))

  const [alarm, setAlarm] = useState<AlarmInfo | null>(null)
  const [comments, setComments] = useState<AlarmComment[]>([])
  const [commentsPage, setCommentsPage] = useState(0)
  const [hasMoreComments, setHasMoreComments] = useState(false)
  const [users, setUsers] = useState<UserInfoShort[]>([])
  const [text, setText] = useState('')
  const [editing, setEditing] = useState<AlarmComment | null>(null)
  const [busy, setBusy] = useState(false)

  const loadAlarm = useCallback(() => getAlarmInfo(alarmId).then(setAlarm).catch(() => undefined), [alarmId])

  const loadComments = useCallback(
    async (page: number) => {
      try {
        const res = await getAlarmComments(alarmId, page)
        setComments((prev) => (page === 0 ? res.data : [...prev, ...res.data]))
        setHasMoreComments(res.hasNext)
        setCommentsPage(page)
      } catch (_) {
        // 已提示
      }
    },
    [alarmId]
  )

  useEffect(() => {
    loadAlarm()
    loadComments(0)
    getUsersForAssign(alarmId, 0)
      .then((res) => setUsers(res.data))
      .catch(() => undefined)
  }, [alarmId, loadAlarm, loadComments])

  const runAction = async (fn: () => Promise<AlarmInfo>, success: string) => {
    setBusy(true)
    try {
      await fn()
      Taro.showToast({ title: success, icon: 'success' })
      await loadAlarm()
      loadComments(0)
      appEvents.emit('alarmChanged', alarmId)
    } catch (_) {
      // 已提示
    } finally {
      setBusy(false)
    }
  }

  const confirmAction = async (title: string, fn: () => Promise<AlarmInfo>, success: string) => {
    const { confirm } = await Taro.showModal({ title, content: `确定要${title}吗？` })
    if (confirm) runAction(fn, success)
  }

  const assigneeOptions = ['取消指派', ...users.map((u) => fullName(u) || u.email)]
  const onAssign = (index: number) => {
    if (index === 0) {
      if (alarm?.assigneeId) runAction(() => unassignAlarm(alarmId), '已取消指派')
    } else {
      runAction(() => assignAlarm(alarmId, users[index - 1].id.id), '指派成功')
    }
  }

  const submitComment = async () => {
    const value = text.trim()
    if (!value) return
    try {
      await saveAlarmComment(alarmId, value, editing?.id?.id)
      setText('')
      setEditing(null)
      loadComments(0)
    } catch (_) {
      // 已提示
    }
  }

  const onCommentLongPress = async (c: AlarmComment) => {
    if (c.type !== 'OTHER' || c.userId?.id !== userId || !c.id) return
    try {
      const { tapIndex } = await Taro.showActionSheet({ itemList: ['编辑', '删除'] })
      if (tapIndex === 0) {
        setEditing(c)
        setText(c.comment.text)
      } else {
        const { confirm } = await Taro.showModal({ title: '删除评论', content: '确定要删除这条评论吗？' })
        if (confirm) {
          await deleteAlarmComment(alarmId, c.id.id)
          loadComments(0)
        }
      }
    } catch (_) {
      // 取消
    }
  }

  if (!alarm) return <Loading />

  const color = SEVERITY_COLORS[alarm.severity]
  return (
    <View className='page'>
      <ScrollView
        className='page-scroll'
        scrollY
        onScrollToLower={() => hasMoreComments && loadComments(commentsPage + 1)}
      >
        <View className='alarm-head' style={{ borderLeftColor: color }}>
          <Text className='alarm-type'>{alarm.type}</Text>
          <View className='row'>
            <Text className='tag' style={{ backgroundColor: color }}>
              {SEVERITY_LABELS[alarm.severity]}
            </Text>
            <Text className='muted'>{alarmStatusText(alarm)}</Text>
          </View>
        </View>

        <Section title='基本信息'>
          <Field label='告警源' value={alarm.originatorLabel || alarm.originatorName} />
          <Field label='告警源类型' value={entityTypeLabel(alarm.originator?.entityType)} />
          <Field label='开始时间' value={formatDateTime(alarm.startTs)} />
          <Field label='结束时间' value={formatDateTime(alarm.endTs)} />
          {!!alarm.ackTs && <Field label='确认时间' value={formatDateTime(alarm.ackTs)} />}
          {!!alarm.clearTs && <Field label='清除时间' value={formatDateTime(alarm.clearTs)} />}
          <Field
            label='指派给'
            value={
              canWrite ? (
                <Picker mode='selector' range={assigneeOptions} onChange={(e) => onAssign(Number(e.detail.value))}>
                  <Text className='link'>{alarm.assignee ? fullName(alarm.assignee) : '未指派（点击指派）'}</Text>
                </Picker>
              ) : alarm.assignee ? (
                fullName(alarm.assignee)
              ) : (
                '未指派'
              )
            }
          />
        </Section>

        {alarm.details && Object.keys(alarm.details).length > 0 && (
          <Section title='详情'>
            <Text className='details-json' userSelect>
              {JSON.stringify(alarm.details, null, 2)}
            </Text>
          </Section>
        )}

        {canWrite && (!alarm.acknowledged || !alarm.cleared) && (
          <View className='alarm-actions'>
            {!alarm.acknowledged && (
              <Button className='btn btn-outline' disabled={busy} onClick={() => confirmAction('确认告警', () => ackAlarm(alarmId), '已确认')}>
                确认
              </Button>
            )}
            {!alarm.cleared && (
              <Button className='btn btn-danger' disabled={busy} onClick={() => confirmAction('清除告警', () => clearAlarm(alarmId), '已清除')}>
                清除
              </Button>
            )}
          </View>
        )}

        <Section title='活动'>
          {comments.length === 0 && <Text className='muted no-comments'>暂无活动</Text>}
          {comments.map((c, i) => {
            const name = c.type === 'SYSTEM' ? '系统' : fullName(c) || '-'
            return (
              <View key={c.id?.id || i} className='comment' onLongPress={() => onCommentLongPress(c)}>
                <Avatar text={name} size={64} />
                <View className='comment-body'>
                  <View className='row-between'>
                    <Text className='comment-author'>{name}</Text>
                    <Text className='muted'>{timeAgo(c.createdTime)}</Text>
                  </View>
                  <Text className={`comment-text ${c.type === 'SYSTEM' ? 'system' : ''}`}>{c.comment?.text}</Text>
                  {c.comment?.edited && <Text className='muted'>已编辑</Text>}
                </View>
              </View>
            )
          })}
        </Section>
      </ScrollView>
      {canWrite && (
        <View className='comment-bar'>
          {editing && (
            <Text
              className='link cancel-edit'
              onClick={() => {
                setEditing(null)
                setText('')
              }}
            >
              取消
            </Text>
          )}
          <Input
            className='comment-input'
            placeholder={editing ? '编辑评论' : '添加评论…'}
            value={text}
            confirmType='send'
            onInput={(e) => setText(e.detail.value)}
            onConfirm={submitComment}
          />
          <Button className='btn btn-small' disabled={!text.trim()} onClick={submitComment}>
            发送
          </Button>
        </View>
      )}
    </View>
  )
}
