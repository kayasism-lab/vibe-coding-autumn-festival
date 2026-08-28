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
import { Plus, Pencil, Trash2, Loader2, Save, MapPin, Users } from 'lucide-react'
import Image from 'next/image'

interface Venue {
  _id: string
  name: string
  address: string
  description?: string
  imageUrls: string[]
  capacity: number
  facilities: string[]
  mapUrl?: string
  contactPhone?: string
  order: number
  isActive: boolean
}

const emptyVenue: Omit<Venue, '_id'> = {
  name: '',
  address: '',
  description: '',
  imageUrls: [],
  capacity: 100,
  facilities: [],
  mapUrl: '',
  contactPhone: '',
  order: 0,
  isActive: true,
}

export default function AdminVenuesPage() {
  const [venues, setVenues] = useState<Venue[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [editingVenue, setEditingVenue] = useState<Partial<Venue> | null>(null)
  const [facilitiesText, setFacilitiesText] = useState('')

  useEffect(() => {
    fetchVenues()
  }, [])

  const fetchVenues = async () => {
    try {
      const res = await fetch('/api/venues')
      const data = await res.json()
      if (data.success) {
        setVenues(data.data)
      }
    } catch (error) {
      console.error('Failed to fetch venues:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const openCreateDialog = () => {
    setEditingVenue({ ...emptyVenue, order: venues.length })
    setFacilitiesText('')
    setIsDialogOpen(true)
  }

  const openEditDialog = (venue: Venue) => {
    setEditingVenue({ ...venue })
    setFacilitiesText(venue.facilities.join('\n'))
    setIsDialogOpen(true)
  }

  const handleSave = async () => {
    if (!editingVenue || !editingVenue.name) return

    setIsSaving(true)
    try {
      const venueData = {
        ...editingVenue,
        facilities: facilitiesText.split('\n').filter((f) => f.trim()),
      }

      const isEditing = '_id' in editingVenue && editingVenue._id
      const url = isEditing ? `/api/venues/${editingVenue._id}` : '/api/venues'
      const method = isEditing ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(venueData),
      })

      if (res.ok) {
        fetchVenues()
        setIsDialogOpen(false)
        setEditingVenue(null)
      }
    } catch (error) {
      console.error('Failed to save venue:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('정말 이 공연장을 삭제하시겠습니까?')) return

    try {
      const res = await fetch(`/api/venues/${id}`, { method: 'DELETE' })
      if (res.ok) {
        fetchVenues()
      }
    } catch (error) {
      console.error('Failed to delete venue:', error)
    }
  }

  return (
    <div className="flex min-h-screen bg-muted/30">
      <AdminSidebar />
      <main className="flex-1 p-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold">공연장 관리</h1>
              <p className="text-muted-foreground mt-1">
                축제에서 사용하는 공연장 정보를 관리합니다.
              </p>
            </div>
            <Button onClick={openCreateDialog}>
              <Plus className="mr-2 h-4 w-4" />
              공연장 추가
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>공연장 목록</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : venues.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  등록된 공연장이 없습니다.
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-20">이미지</TableHead>
                      <TableHead>공연장명</TableHead>
                      <TableHead>주소</TableHead>
                      <TableHead>수용인원</TableHead>
                      <TableHead className="w-20">활성</TableHead>
                      <TableHead className="w-24">관리</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {venues.map((venue) => (
                      <TableRow key={venue._id}>
                        <TableCell>
                          {venue.imageUrls[0] ? (
                            <div className="relative w-16 h-12 rounded overflow-hidden">
                              <Image
                                src={venue.imageUrls[0]}
                                alt={venue.name}
                                fill
                                className="object-cover"
                              />
                            </div>
                          ) : (
                            <div className="w-16 h-12 rounded bg-muted flex items-center justify-center">
                              <MapPin className="h-5 w-5 text-muted-foreground" />
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="font-medium">{venue.name}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {venue.address}
                        </TableCell>
                        <TableCell>
                          <span className="flex items-center gap-1">
                            <Users className="h-4 w-4 text-muted-foreground" />
                            {venue.capacity}석
                          </span>
                        </TableCell>
                        <TableCell>
                          <span
                            className={`px-2 py-1 rounded text-xs ${
                              venue.isActive
                                ? 'bg-green-100 text-green-700'
                                : 'bg-gray-100 text-gray-700'
                            }`}
                          >
                            {venue.isActive ? '활성' : '비활성'}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => openEditDialog(venue)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDelete(venue._id)}
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
          <DialogContent className="max-w-2xl max-h-[90dvh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingVenue?._id ? '공연장 수정' : '새 공연장 추가'}
              </DialogTitle>
              <DialogDescription>공연장 정보를 입력해주세요.</DialogDescription>
            </DialogHeader>

            {editingVenue && (
              <div className="space-y-6 py-4">
                {/* 이미지 */}
                <div className="space-y-2">
                  <Label>공연장 이미지</Label>
                  <CloudinaryUpload
                    value={editingVenue.imageUrls || []}
                    onChange={(urls) =>
                      setEditingVenue({ ...editingVenue, imageUrls: urls as string[] })
                    }
                    multiple
                    maxFiles={5}
                    folder="autumn_festival/venues"
                    placeholder="공연장 이미지 업로드 (최대 5개)"
                  />
                </div>

                {/* 기본 정보 */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">공연장명 *</Label>
                    <Input
                      id="name"
                      value={editingVenue.name || ''}
                      onChange={(e) =>
                        setEditingVenue({ ...editingVenue, name: e.target.value })
                      }
                      placeholder="공연장 이름"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="capacity">수용인원 *</Label>
                    <Input
                      id="capacity"
                      type="number"
                      value={editingVenue.capacity || 100}
                      onChange={(e) =>
                        setEditingVenue({
                          ...editingVenue,
                          capacity: parseInt(e.target.value) || 100,
                        })
                      }
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address">주소 *</Label>
                  <Input
                    id="address"
                    value={editingVenue.address || ''}
                    onChange={(e) =>
                      setEditingVenue({ ...editingVenue, address: e.target.value })
                    }
                    placeholder="서울특별시 종로구..."
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">설명</Label>
                  <Textarea
                    id="description"
                    value={editingVenue.description || ''}
                    onChange={(e) =>
                      setEditingVenue({ ...editingVenue, description: e.target.value })
                    }
                    placeholder="공연장에 대한 설명"
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="contactPhone">연락처</Label>
                    <Input
                      id="contactPhone"
                      value={editingVenue.contactPhone || ''}
                      onChange={(e) =>
                        setEditingVenue({ ...editingVenue, contactPhone: e.target.value })
                      }
                      placeholder="02-0000-0000"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="mapUrl">지도 링크</Label>
                    <Input
                      id="mapUrl"
                      value={editingVenue.mapUrl || ''}
                      onChange={(e) =>
                        setEditingVenue({ ...editingVenue, mapUrl: e.target.value })
                      }
                      placeholder="https://map.kakao.com/..."
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="facilities">시설 안내 (줄바꿈으로 구분)</Label>
                  <Textarea
                    id="facilities"
                    value={facilitiesText}
                    onChange={(e) => setFacilitiesText(e.target.value)}
                    placeholder="음향시설&#10;조명시설&#10;분장실"
                    rows={4}
                  />
                </div>

                {/* 활성 상태 */}
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>활성 상태</Label>
                    <p className="text-sm text-muted-foreground">
                      비활성화하면 홈페이지에 표시되지 않습니다.
                    </p>
                  </div>
                  <Switch
                    checked={editingVenue.isActive}
                    onCheckedChange={(checked) =>
                      setEditingVenue({ ...editingVenue, isActive: checked })
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
