'use client'

import { useState, useEffect } from 'react'
import { AdminSidebar } from '@/components/admin/admin-sidebar'
import { useAdminAccount } from '@/lib/use-admin-account'
import {
  resolveSeatStatus,
  seatStatusConfig,
  seatStatusOptions,
  type SeatStatusKey,
} from '@/lib/program-display'
import { adminFetch, getErrorMessage } from '@/lib/admin-fetch'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { getDefaultStartTime, getSuggestedTimes, getWeekdayName } from '@/lib/schedule-time-presets'
import type { ProgramType } from '@/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Plus, Edit, Trash2, Calendar, Clock, MapPin, Save, X } from 'lucide-react'

interface Schedule {
  _id: string
  programId?: {
    _id: string
    title: string
  }
  date: string
  venue: string
  time: string
  seatStatus: SeatStatusKey
  note?: string
}

interface Program {
  _id: string
  title: string
  // 유형에 따라 공연 시각 기본값이 달라진다
  type?: ProgramType
  theaterGroup?: string | null
}

type ScheduleFormData = {
  programId: string
  date: string
  time: string
  venue: string
  seatStatus: Schedule['seatStatus']
  note: string
}

export default function AdminSchedulesPage() {
  const [schedules, setSchedules] = useState<Schedule[]>([])
  const [programs, setPrograms] = useState<Program[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  // 저장에 실패한 사유. 값이 있으면 창을 닫지 않고 그대로 보여준다
  const [saveError, setSaveError] = useState('')
  const [editingSchedule, setEditingSchedule] = useState<Schedule | null>(null)
  const [formData, setFormData] = useState<ScheduleFormData>({
    programId: '',
    date: '',
    time: '',
    venue: '',
    // 새 회차는 '예매대기'로 시작한다 (서버 기본값과 같음)
    seatStatus: 'pending' as SeatStatusKey,
    note: '',
  })

  // 극단 담당자면 본인 극단 작품의 일정만 다루게 제한한다
  const { isGroupAccount, theaterGroup } = useAdminAccount()

  useEffect(() => {
    fetchSchedules()
    fetchPrograms()
  }, [])

  // 극단 담당자에게 보여줄 작품과 일정 (관리자는 전체)
  const visiblePrograms = programs.filter(
    (program) => !isGroupAccount || program.theaterGroup === theaterGroup
  )
  const visibleProgramIds = new Set(visiblePrograms.map((program) => program._id))

  // 눌러서 넣을 수 있는 시각과, 빈 칸에 미리 채워둘 시각
  const selectedProgram = programs.find((program) => program._id === formData.programId)
  const suggestedTimes = getSuggestedTimes(formData.date)
  const defaultStartTime = getDefaultStartTime(selectedProgram?.type, formData.date)

  // 새로 등록할 때 비어 있는 시간 칸만 채운다.
  // 이미 입력한 값이나 기존 회차의 시각을 말없이 바꿔버리면 안 되기 때문이다
  useEffect(() => {
    if (editingSchedule || formData.time || !defaultStartTime) return
    setFormData((prev) => (prev.time ? prev : { ...prev, time: defaultStartTime }))
  }, [editingSchedule, formData.time, defaultStartTime])
  const visibleSchedules = isGroupAccount
    ? schedules.filter((schedule) => schedule.programId && visibleProgramIds.has(schedule.programId._id))
    : schedules

  const fetchSchedules = async () => {
    try {
      const res = await fetch('/api/schedules')
      const data = await res.json()
      if (data.success) {
        setSchedules(data.data)
      }
    } catch (error) {
      console.error('Failed to fetch schedules:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchPrograms = async () => {
    try {
      const res = await fetch('/api/programs')
      const data = await res.json()
      if (data.success) {
        setPrograms(data.data)
      }
    } catch (error) {
      console.error('Failed to fetch programs:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaveError('')

    const url = editingSchedule 
      ? `/api/schedules/${editingSchedule._id}` 
      : '/api/schedules'
    const method = editingSchedule ? 'PUT' : 'POST'

    try {
      const res = await adminFetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (res.ok) {
        fetchSchedules()
        setIsDialogOpen(false)
        resetForm()
        return
      }

      // 실패했으면 창을 닫지 않는다. 입력한 내용을 다시 쓰지 않아도 되도록
      setSaveError(await getErrorMessage(res))
    } catch {
      setSaveError('저장 중 통신 문제가 생겼습니다. 잠시 후 다시 눌러주세요.')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('정말 삭제하시겠습니까?')) return

    try {
      const res = await adminFetch(`/api/schedules/${id}`, { method: 'DELETE' })
      if (res.ok) {
        fetchSchedules()
        return
      }
      alert(await getErrorMessage(res))
    } catch {
      alert('삭제 중 통신 문제가 생겼습니다. 잠시 후 다시 눌러주세요.')
    }
  }

  const handleEdit = (schedule: Schedule) => {
    setEditingSchedule(schedule)
    setFormData({
      programId: schedule.programId?._id || '',
      date: schedule.date.split('T')[0],
      time: schedule.time,
      venue: schedule.venue,
      seatStatus: schedule.seatStatus,
      note: schedule.note || '',
    })
    setSaveError('')
    setIsDialogOpen(true)
  }

  const resetForm = () => {
    setEditingSchedule(null)
    setSaveError('')
    setFormData({
      programId: '',
      date: '',
      time: '',
      venue: '',
      seatStatus: 'pending',
      note: '',
    })
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <AdminSidebar />
      
      <main className="flex-1 p-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">일정 관리</h1>
              <p className="text-gray-600 mt-1">공연 일정을 추가하고 관리합니다.</p>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={(open) => {
              setIsDialogOpen(open)
              if (!open) resetForm()
            }}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus className="h-4 w-4" />
                  일정 추가
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>
                    {editingSchedule ? '일정 수정' : '새 일정 추가'}
                  </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label>연결 프로그램 *</Label>
                    <Select
                      value={formData.programId}
                      onValueChange={(value) => setFormData({ ...formData, programId: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="프로그램 선택" />
                      </SelectTrigger>
                      <SelectContent>
                        {visiblePrograms.map((program) => (
                          <SelectItem key={program._id} value={program._id}>
                            {program.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>날짜 *</Label>
                      <Input
                        type="date"
                        value={formData.date}
                        onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>시간 *</Label>
                      <Input
                        type="time"
                        value={formData.time}
                        onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  {/* 자주 쓰는 시각을 눌러 넣게 돕는 것일 뿐, 여기 없는 시각도 위 칸에 직접 입력하면 된다 */}
                  {suggestedTimes.length > 0 && (
                    <div className="flex flex-wrap items-center gap-2 rounded-lg bg-muted/60 px-3 py-2">
                      <span className="text-xs text-muted-foreground">
                        {getWeekdayName(formData.date)}요일 · 자주 쓰는 시간
                      </span>
                      {suggestedTimes.map((time) => (
                        <Button
                          key={time}
                          type="button"
                          size="sm"
                          variant={formData.time === time ? 'default' : 'outline'}
                          className="h-7 px-2.5 text-xs"
                          onClick={() => setFormData({ ...formData, time })}
                        >
                          {time}
                        </Button>
                      ))}
                      <span className="text-xs text-muted-foreground/70">
                        다른 시간은 위 칸에 직접 입력
                      </span>
                    </div>
                  )}
                  
                  <div className="space-y-2">
                    <Label>공연장 *</Label>
                    <Input
                      value={formData.venue}
                      onChange={(e) => setFormData({ ...formData, venue: e.target.value })}
                      placeholder="예: 대학로 ○○소극장"
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>예매 상태</Label>
                    <Select
                      value={formData.seatStatus}
                      onValueChange={(value: SeatStatusKey) =>
                        setFormData({ ...formData, seatStatus: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {seatStatusOptions.map((status) => (
                          <SelectItem key={status} value={status}>
                            {seatStatusConfig[status].label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>메모</Label>
                    <Textarea
                      value={formData.note}
                      onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                      placeholder="추가 메모 (선택)"
                      rows={3}
                    />
                  </div>

                  {saveError && (
                    <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                      {saveError}
                    </p>
                  )}

                  <div className="flex justify-end gap-2 pt-4">
                    <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                      <X className="h-4 w-4 mr-2" />
                      취소
                    </Button>
                    <Button type="submit">
                      <Save className="h-4 w-4 mr-2" />
                      {editingSchedule ? '수정' : '저장'}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {isLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
            </div>
          ) : visibleSchedules.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-gray-500">
                등록된 일정이 없습니다.
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {visibleSchedules.map((schedule) => (
                <Card key={schedule._id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="space-y-2">
                        <div className="flex items-center gap-3">
                          <Badge className={seatStatusConfig[resolveSeatStatus(schedule.seatStatus)].className}>
                            {seatStatusConfig[resolveSeatStatus(schedule.seatStatus)].label}
                          </Badge>
                          <h3 className="font-semibold text-lg">
                            {schedule.programId?.title || '프로그램 미지정'}
                          </h3>
                        </div>
                        {schedule.programId && (
                          <p className="text-sm text-primary">
                            연결 프로그램: {schedule.programId.title}
                          </p>
                        )}
                        <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            {new Date(schedule.date).toLocaleDateString('ko-KR')}
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            {schedule.time}
                          </div>
                          <div className="flex items-center gap-1">
                            <MapPin className="h-4 w-4" />
                            {schedule.venue}
                          </div>
                        </div>
                        {schedule.note && (
                          <p className="text-sm text-gray-500">{schedule.note}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(schedule)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        {/* 일정 삭제는 관리자만 가능 (백엔드도 동일하게 제한) */}
                        {!isGroupAccount && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(schedule._id)}
                            className="text-red-600 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
