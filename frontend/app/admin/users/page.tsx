'use client'

import { useEffect, useState } from 'react'
import { AdminSidebar } from '@/components/admin/admin-sidebar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Pencil, Plus, Trash2 } from 'lucide-react'

type UserRole = 'superadmin' | 'admin' | 'group' | 'normal'
type User = {
  _id: string
  name: string
  email: string
  phone: string
  theaterGroupName: string
  role: UserRole
  createdAt: string
}

const emptyForm = {
  name: '',
  email: '',
  phone: '',
  theaterGroupName: '없음',
  role: 'normal' as UserRole,
  password: '',
}

const roleLabels = {
  superadmin: '슈퍼관리자',
  admin: '관리자',
  group: '극단 담당자',
  normal: '일반회원',
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [theaterGroupNames, setTheaterGroupNames] = useState<string[]>([])
  const [form, setForm] = useState(emptyForm)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  const fetchUsers = async () => {
    const res = await fetch('/api/users')
    const data = await res.json()
    if (data.success) setUsers(data.data)
    setIsLoading(false)
  }

  useEffect(() => {
    fetchUsers()
    fetch('/api/theater-groups')
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setTheaterGroupNames(data.data.map((g: { name: string }) => g.name))
        }
      })
  }, [])

  const openDialog = (user?: User) => {
    setEditingUser(user || null)
    setForm(user ? {
      name: user.name,
      email: user.email,
      phone: user.phone,
      theaterGroupName: user.theaterGroupName,
      role: user.role,
      password: '',
    } : emptyForm)
    setIsDialogOpen(true)
  }

  const handleSave = async () => {
    const res = await fetch(editingUser ? `/api/users/${editingUser._id}` : '/api/users', {
      method: editingUser ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    if (res.ok) {
      await fetchUsers()
      setIsDialogOpen(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('정말 삭제하시겠습니까?')) return
    const res = await fetch(`/api/users/${id}`, { method: 'DELETE' })
    if (res.ok) fetchUsers()
  }

  return (
    <div className="flex min-h-screen bg-muted">
      <AdminSidebar />
      <main className="flex-1 pt-14 lg:pt-0">
        <div className="p-6 lg:p-8">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">사용자 관리</h1>
              <p className="text-muted-foreground">회원과 관리자 권한을 관리합니다.</p>
            </div>
            <Button onClick={() => openDialog()}><Plus className="mr-2 h-4 w-4" />사용자 추가</Button>
          </div>
          <div className="overflow-hidden rounded-xl border bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>이름</TableHead>
                  <TableHead>이메일</TableHead>
                  <TableHead>연락처</TableHead>
                  <TableHead>소속 극단</TableHead>
                  <TableHead>권한</TableHead>
                  <TableHead className="text-right">관리</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow><TableCell colSpan={6} className="py-8 text-center">불러오는 중...</TableCell></TableRow>
                ) : users.map((user) => (
                  <TableRow key={user._id}>
                    <TableCell className="font-medium">{user.name}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>{user.phone}</TableCell>
                    <TableCell>{user.theaterGroupName}</TableCell>
                    <TableCell><Badge>{roleLabels[user.role]}</Badge></TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => openDialog(user)}><Pencil className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(user._id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </main>
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editingUser ? '사용자 수정' : '사용자 추가'}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <Field label="이름"><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
            <Field label="이메일"><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></Field>
            <Field label="연락처"><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></Field>
            <Field label="권한">
              <Select value={form.role} onValueChange={(role: UserRole) => setForm({ ...form, role })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="superadmin">슈퍼관리자</SelectItem>
                  <SelectItem value="admin">관리자</SelectItem>
                  <SelectItem value="group">극단 담당자</SelectItem>
                  <SelectItem value="normal">일반회원</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Field label="소속 극단">
              {form.role === 'group' ? (
                <Select
                  value={form.theaterGroupName}
                  onValueChange={(theaterGroupName) => setForm({ ...form, theaterGroupName })}
                >
                  <SelectTrigger><SelectValue placeholder="극단 선택" /></SelectTrigger>
                  <SelectContent>
                    {theaterGroupNames.map((name) => (
                      <SelectItem key={name} value={name}>{name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Input value={form.theaterGroupName} onChange={(e) => setForm({ ...form, theaterGroupName: e.target.value })} />
              )}
              {form.role === 'group' && (
                <p className="text-xs text-muted-foreground">
                  참여 극단 목록의 이름과 정확히 일치해야 해당 극단 데이터를 관리할 수 있습니다.
                </p>
              )}
            </Field>
            <Field label={editingUser ? '새 비밀번호' : '비밀번호'}><Input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /></Field>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>취소</Button>
            <Button onClick={handleSave}>저장</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="space-y-2"><Label>{label}</Label>{children}</div>
}
