'use client'

import { useEffect, useState } from 'react'
import { AdminSidebar } from '@/components/admin/admin-sidebar'
import { UserFormDialog, type UserForm, type UserRole } from '@/components/admin/user-form-dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import { GROUP_PERMISSION_META, type GroupPermission } from '@/lib/admin-permissions'
import { adminFetch, getErrorMessage } from '@/lib/admin-fetch'

type User = {
  _id: string
  name: string
  email: string
  phone: string
  theaterGroupName: string
  theaterGroup?: string | null
  permissions?: GroupPermission[]
  role: UserRole
  createdAt: string
}

type TheaterGroupOption = { _id: string; name: string }

const emptyForm: UserForm = {
  name: '',
  email: '',
  phone: '',
  theaterGroup: '',
  permissions: [],
  role: 'normal',
  password: '',
}

const roleLabels: Record<UserRole, string> = {
  superadmin: '슈퍼관리자',
  admin: '관리자',
  group: '극단 담당자',
  normal: '일반회원',
}

// 부여된 추가 권한을 이름으로 바꿔 목록에 보여준다 (기본 권한은 모든 극단 계정이 갖고 있어 생략)
function grantedPermissionLabels(permissions?: GroupPermission[]) {
  if (!permissions?.length) return []
  return GROUP_PERMISSION_META.filter(
    (meta) => meta.grantable && permissions.includes(meta.key)
  ).map((meta) => meta.label)
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [theaterGroups, setTheaterGroups] = useState<TheaterGroupOption[]>([])
  const [form, setForm] = useState<UserForm>(emptyForm)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')

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
          setTheaterGroups(data.data.map((g: TheaterGroupOption) => ({ _id: g._id, name: g.name })))
        }
      })
  }, [])

  const openDialog = (user?: User) => {
    setErrorMessage('')
    setEditingUser(user || null)
    setForm(
      user
        ? {
            name: user.name,
            email: user.email,
            phone: user.phone,
            theaterGroup: user.theaterGroup || '',
            permissions: (user.permissions || []).filter((permission) =>
              GROUP_PERMISSION_META.some((meta) => meta.key === permission && meta.grantable)
            ),
            role: user.role,
            password: '',
          }
        : emptyForm
    )
    setIsDialogOpen(true)
  }

  const handleSave = async () => {
    setErrorMessage('')

    // 이름·아이디·비밀번호는 로그인에 반드시 필요한 값 (수정 시 비밀번호는 비워두면 기존 값 유지)
    if (!form.name.trim() || !form.email.trim()) {
      setErrorMessage('이름과 아이디를 입력해주세요.')
      return
    }

    if (!editingUser && !form.password.trim()) {
      setErrorMessage('비밀번호를 입력해주세요.')
      return
    }

    if (form.role === 'group' && !form.theaterGroup) {
      setErrorMessage('극단 담당자 계정은 담당 극단을 선택해야 합니다.')
      return
    }

    try {
      const res = await adminFetch(editingUser ? `/api/users/${editingUser._id}` : '/api/users', {
        method: editingUser ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })

      // 서버는 실패 사유를 error 필드로 보낸다 (예: 아이디 중복, 담당 극단 없음)
      if (!res.ok) {
        setErrorMessage(await getErrorMessage(res))
        return
      }

      await fetchUsers()
      setIsDialogOpen(false)
    } catch {
      setErrorMessage('저장 중 통신 문제가 생겼습니다. 잠시 후 다시 눌러주세요.')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('정말 삭제하시겠습니까?')) return
    const res = await adminFetch(`/api/users/${id}`, { method: 'DELETE' })
    if (res.ok) {
      fetchUsers()
      return
    }
    alert(await getErrorMessage(res))
  }

  return (
    <div className="flex min-h-screen bg-muted">
      <AdminSidebar />
      <main className="flex-1 pt-14 lg:pt-0">
        <div className="p-6 lg:p-8">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">사용자 관리</h1>
              <p className="text-muted-foreground">
                계정 유형과 극단 담당자의 관리 권한을 설정합니다.
              </p>
            </div>
            <Button onClick={() => openDialog()}><Plus className="mr-2 h-4 w-4" />사용자 추가</Button>
          </div>

          <div className="overflow-hidden rounded-xl border bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>이름</TableHead>
                  <TableHead>아이디</TableHead>
                  <TableHead>담당 극단</TableHead>
                  <TableHead>계정 유형</TableHead>
                  <TableHead>추가 권한</TableHead>
                  <TableHead className="text-right">관리</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow><TableCell colSpan={6} className="py-8 text-center">불러오는 중...</TableCell></TableRow>
                ) : users.map((user) => {
                  const granted = grantedPermissionLabels(user.permissions)
                  return (
                    <TableRow key={user._id}>
                      <TableCell className="font-medium">{user.name}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        {user.role === 'group' ? (
                          user.theaterGroupName
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell><Badge>{roleLabels[user.role]}</Badge></TableCell>
                      <TableCell>
                        {user.role !== 'group' ? (
                          <span className="text-muted-foreground">전체 권한</span>
                        ) : granted.length === 0 ? (
                          <span className="text-muted-foreground">기본 권한만</span>
                        ) : (
                          <div className="flex flex-wrap gap-1">
                            {granted.map((label) => (
                              <Badge key={label} variant="outline" className="font-normal">{label}</Badge>
                            ))}
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => openDialog(user)}><Pencil className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(user._id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        </div>
      </main>

      <UserFormDialog
        isOpen={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        isEditing={!!editingUser}
        form={form}
        setForm={setForm}
        theaterGroups={theaterGroups}
        errorMessage={errorMessage}
        onSave={handleSave}
      />
    </div>
  )
}
