'use client'

import { useState, useEffect } from 'react'
import { AdminSidebar } from '@/components/admin/admin-sidebar'
import { CloudinaryUpload } from '@/components/admin/cloudinary-upload'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Plus,
  Pencil,
  Trash2,
  Loader2,
  Save,
  Instagram,
  Facebook,
  Youtube,
  Globe,
  BookOpen,
  GripVertical,
} from 'lucide-react'
import Image from 'next/image'
import { UpcomingShowFields } from '@/components/admin/upcoming-show-fields'
import type { UpcomingShow } from '@/types/index'

interface TheaterGroup {
  _id: string
  name: string
  description: string
  founded?: string
  members?: string
  imageUrl?: string
  highlights: string[]
  socialLinks: {
    website?: string
    instagram?: string
    facebook?: string
    youtube?: string
    blog?: string
  }
  upcomingShow?: UpcomingShow
  color: string
  bgGradient: string
  order: number
  isActive: boolean
}

const colorOptions = [
  { value: 'bg-orange-500', gradient: 'from-orange-500 to-amber-500', label: '오렌지' },
  { value: 'bg-pink-500', gradient: 'from-pink-500 to-rose-500', label: '핑크' },
  { value: 'bg-purple-500', gradient: 'from-purple-500 to-violet-500', label: '퍼플' },
  { value: 'bg-blue-500', gradient: 'from-blue-500 to-indigo-500', label: '블루' },
  { value: 'bg-teal-500', gradient: 'from-teal-500 to-cyan-500', label: '틸' },
  { value: 'bg-indigo-500', gradient: 'from-indigo-500 to-purple-500', label: '인디고' },
  { value: 'bg-red-500', gradient: 'from-red-500 to-rose-500', label: '레드' },
  { value: 'bg-green-500', gradient: 'from-green-500 to-emerald-500', label: '그린' },
]

const emptyGroup: Omit<TheaterGroup, '_id'> = {
  name: '',
  description: '',
  founded: '',
  members: '',
  imageUrl: '',
  highlights: [],
  socialLinks: {},
  color: 'bg-primary',
  bgGradient: 'from-primary to-primary/80',
  order: 0,
  isActive: true,
}

export default function AdminTheaterGroupsPage() {
  const [groups, setGroups] = useState<TheaterGroup[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [editingGroup, setEditingGroup] = useState<Partial<TheaterGroup> | null>(null)
  const [highlightsText, setHighlightsText] = useState('')

  useEffect(() => {
    fetchGroups()
  }, [])

  const fetchGroups = async () => {
    try {
      const res = await fetch('/api/theater-groups')
      const data = await res.json()
      if (data.success) {
        setGroups(data.data)
      }
    } catch (error) {
      console.error('Failed to fetch groups:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const openCreateDialog = () => {
    setEditingGroup({ ...emptyGroup, order: groups.length })
    setHighlightsText('')
    setIsDialogOpen(true)
  }

  const openEditDialog = (group: TheaterGroup) => {
    setEditingGroup({ ...group })
    setHighlightsText(group.highlights.join('\n'))
    setIsDialogOpen(true)
  }

  const handleSave = async () => {
    if (!editingGroup || !editingGroup.name) return

    setIsSaving(true)
    try {
      const groupData = {
        ...editingGroup,
        highlights: highlightsText.split('\n').filter((h) => h.trim()),
        // undefined는 JSON에서 아예 빠져 서버가 기존 값을 그대로 두므로,
        // "등록 안 함"으로 되돌렸을 때 지워지도록 null을 명시해서 보낸다
        upcomingShow: editingGroup.upcomingShow ?? null,
      }

      const isEditing = '_id' in editingGroup && editingGroup._id
      const url = isEditing
        ? `/api/theater-groups/${editingGroup._id}`
        : '/api/theater-groups'
      const method = isEditing ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(groupData),
      })

      if (res.ok) {
        fetchGroups()
        setIsDialogOpen(false)
        setEditingGroup(null)
      }
    } catch (error) {
      console.error('Failed to save group:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('정말 이 극단을 삭제하시겠습니까?')) return

    try {
      const res = await fetch(`/api/theater-groups/${id}`, { method: 'DELETE' })
      if (res.ok) {
        fetchGroups()
      }
    } catch (error) {
      console.error('Failed to delete group:', error)
    }
  }

  const handleColorSelect = (color: string, gradient: string) => {
    if (editingGroup) {
      setEditingGroup({ ...editingGroup, color, bgGradient: gradient })
    }
  }

  return (
    <div className="flex min-h-screen bg-muted/30">
      <AdminSidebar />
      <main className="flex-1 p-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold">참여 극단 관리</h1>
              <p className="text-muted-foreground mt-1">
                축제에 참여하는 극단 정보를 관리합니다.
              </p>
            </div>
            <Button onClick={openCreateDialog}>
              <Plus className="mr-2 h-4 w-4" />
              극단 추가
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>극단 목록</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : groups.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  등록된 극단이 없습니다.
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12"></TableHead>
                      <TableHead className="w-20">이미지</TableHead>
                      <TableHead>극단명</TableHead>
                      <TableHead>창단</TableHead>
                      <TableHead>SNS</TableHead>
                      <TableHead className="w-20">활성</TableHead>
                      <TableHead className="w-24">관리</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {groups.map((group) => (
                      <TableRow key={group._id}>
                        <TableCell>
                          <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
                        </TableCell>
                        <TableCell>
                          {group.imageUrl ? (
                            <div className="relative w-16 h-12 rounded overflow-hidden">
                              <Image
                                src={group.imageUrl}
                                alt={group.name}
                                fill
                                className="object-cover"
                              />
                            </div>
                          ) : (
                            <div
                              className={`w-16 h-12 rounded bg-gradient-to-r ${group.bgGradient} flex items-center justify-center`}
                            >
                              <span className="text-white text-xs font-bold">
                                {group.name.charAt(0)}
                              </span>
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="font-medium">{group.name}</TableCell>
                        <TableCell>{group.founded || '-'}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            {group.socialLinks.website && (
                              <Globe className="h-4 w-4 text-muted-foreground" />
                            )}
                            {group.socialLinks.instagram && (
                              <Instagram className="h-4 w-4 text-muted-foreground" />
                            )}
                            {group.socialLinks.facebook && (
                              <Facebook className="h-4 w-4 text-muted-foreground" />
                            )}
                            {group.socialLinks.youtube && (
                              <Youtube className="h-4 w-4 text-muted-foreground" />
                            )}
                            {group.socialLinks.blog && (
                              <BookOpen className="h-4 w-4 text-muted-foreground" />
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <span
                            className={`px-2 py-1 rounded text-xs ${
                              group.isActive
                                ? 'bg-green-100 text-green-700'
                                : 'bg-gray-100 text-gray-700'
                            }`}
                          >
                            {group.isActive ? '활성' : '비활성'}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => openEditDialog(group)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDelete(group._id)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Edit/Create Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingGroup?._id ? '극단 수정' : '새 극단 추가'}
              </DialogTitle>
              <DialogDescription>
                극단 정보를 입력해주세요.
              </DialogDescription>
            </DialogHeader>

            {editingGroup && (
              <div className="space-y-6 py-4">
                {/* 대표 이미지 */}
                <div className="space-y-2">
                  <Label>대표 이미지</Label>
                  <CloudinaryUpload
                    value={editingGroup.imageUrl || ''}
                    onChange={(url) =>
                      setEditingGroup({ ...editingGroup, imageUrl: url as string })
                    }
                    folder="autumn_festival/theater-groups"
                    placeholder="극단 대표 이미지 업로드 (권장: 16:9)"
                  />
                </div>

                {/* 기본 정보 */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">극단명 *</Label>
                    <Input
                      id="name"
                      value={editingGroup.name || ''}
                      onChange={(e) =>
                        setEditingGroup({ ...editingGroup, name: e.target.value })
                      }
                      placeholder="극단 이름"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="founded">창단년도</Label>
                    <Input
                      id="founded"
                      value={editingGroup.founded || ''}
                      onChange={(e) =>
                        setEditingGroup({ ...editingGroup, founded: e.target.value })
                      }
                      placeholder="예: 2005년"
                    />
                  </div>
                </div>

                {/* 소개 */}
                <div className="space-y-2">
                  <Label htmlFor="description">극단 소개 *</Label>
                  <Textarea
                    id="description"
                    value={editingGroup.description || ''}
                    onChange={(e) =>
                      setEditingGroup({ ...editingGroup, description: e.target.value })
                    }
                    placeholder="극단을 소개하는 내용을 작성해주세요"
                    rows={4}
                  />
                </div>

                {/* 주요 활동 */}
                <div className="space-y-2">
                  <Label htmlFor="highlights">주요 활동 (줄바꿈으로 구분)</Label>
                  <Textarea
                    id="highlights"
                    value={highlightsText}
                    onChange={(e) => setHighlightsText(e.target.value)}
                    placeholder="주요 활동 내용을 한 줄씩 입력해주세요"
                    rows={3}
                  />
                </div>

                {/* 테마 색상 */}
                <div className="space-y-2">
                  <Label>테마 색상</Label>
                  <div className="flex flex-wrap gap-2">
                    {colorOptions.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => handleColorSelect(option.value, option.gradient)}
                        className={`w-8 h-8 rounded-full bg-gradient-to-r ${option.gradient} ${
                          editingGroup.color === option.value
                            ? 'ring-2 ring-offset-2 ring-primary'
                            : ''
                        }`}
                        title={option.label}
                      />
                    ))}
                  </div>
                </div>

                {/* SNS 링크 */}
                <div className="space-y-4">
                  <Label>SNS 및 웹사이트</Label>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground flex items-center gap-1">
                        <Globe className="h-3 w-3" /> 홈페이지
                      </Label>
                      <Input
                        value={editingGroup.socialLinks?.website || ''}
                        onChange={(e) =>
                          setEditingGroup({
                            ...editingGroup,
                            socialLinks: {
                              ...editingGroup.socialLinks,
                              website: e.target.value,
                            },
                          })
                        }
                        placeholder="https://..."
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground flex items-center gap-1">
                        <Instagram className="h-3 w-3" /> Instagram
                      </Label>
                      <Input
                        value={editingGroup.socialLinks?.instagram || ''}
                        onChange={(e) =>
                          setEditingGroup({
                            ...editingGroup,
                            socialLinks: {
                              ...editingGroup.socialLinks,
                              instagram: e.target.value,
                            },
                          })
                        }
                        placeholder="https://instagram.com/..."
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground flex items-center gap-1">
                        <Facebook className="h-3 w-3" /> Facebook
                      </Label>
                      <Input
                        value={editingGroup.socialLinks?.facebook || ''}
                        onChange={(e) =>
                          setEditingGroup({
                            ...editingGroup,
                            socialLinks: {
                              ...editingGroup.socialLinks,
                              facebook: e.target.value,
                            },
                          })
                        }
                        placeholder="https://facebook.com/..."
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground flex items-center gap-1">
                        <Youtube className="h-3 w-3" /> YouTube
                      </Label>
                      <Input
                        value={editingGroup.socialLinks?.youtube || ''}
                        onChange={(e) =>
                          setEditingGroup({
                            ...editingGroup,
                            socialLinks: {
                              ...editingGroup.socialLinks,
                              youtube: e.target.value,
                            },
                          })
                        }
                        placeholder="https://youtube.com/..."
                      />
                    </div>
                    <div className="col-span-2 space-y-2">
                      <Label className="text-xs text-muted-foreground flex items-center gap-1">
                        <BookOpen className="h-3 w-3" /> 블로그
                      </Label>
                      <Input
                        value={editingGroup.socialLinks?.blog || ''}
                        onChange={(e) =>
                          setEditingGroup({
                            ...editingGroup,
                            socialLinks: {
                              ...editingGroup.socialLinks,
                              blog: e.target.value,
                            },
                          })
                        }
                        placeholder="https://blog.naver.com/..."
                      />
                    </div>
                  </div>
                </div>

                {/* 앞으로의 공연정보 */}
                <UpcomingShowFields
                  value={editingGroup.upcomingShow}
                  onChange={(upcomingShow) =>
                    setEditingGroup({ ...editingGroup, upcomingShow })
                  }
                />

                {/* 활성 상태 */}
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>활성 상태</Label>
                    <p className="text-sm text-muted-foreground">
                      비활성화하면 홈페이지에 표시되지 않습니다.
                    </p>
                  </div>
                  <Switch
                    checked={editingGroup.isActive}
                    onCheckedChange={(checked) =>
                      setEditingGroup({ ...editingGroup, isActive: checked })
                    }
                  />
                </div>

                {/* 저장 버튼 */}
                <div className="flex justify-end gap-2 pt-4 border-t">
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                    취소
                  </Button>
                  <Button onClick={handleSave} disabled={isSaving}>
                    {isSaving ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        저장 중...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        저장
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </main>
    </div>
  )
}
