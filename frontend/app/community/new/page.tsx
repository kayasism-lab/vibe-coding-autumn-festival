'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { CloudinaryUpload } from '@/components/admin/cloudinary-upload'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

export default function NewCommunityPostPage() {
  const router = useRouter()
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    title: '',
    content: '',
    imageUrls: [] as string[],
  })

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setError('')

    const res = await fetch('/api/community', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    const data = await res.json()

    if (!data.success) {
      if (res.status === 401) {
        router.push('/login')
        return
      }
      setError(data.error || '게시글 등록에 실패했습니다. 로그인 후 다시 시도해주세요.')
      return
    }

    router.push('/community')
    router.refresh()
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-[8.25rem]">
        <section className="mx-auto max-w-2xl px-4 py-12">
          <Card>
            <CardHeader><CardTitle>커뮤니티 글쓰기</CardTitle></CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-5">
                <Field label="제목"><Input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></Field>
                <Field label="내용"><Textarea required rows={8} value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} /></Field>
                <Field label="사진">
                  <CloudinaryUpload
                    value={form.imageUrls}
                    onChange={(imageUrls) => setForm({ ...form, imageUrls: imageUrls as string[] })}
                    multiple
                    maxFiles={10}
                    folder="autumn_festival/community"
                    placeholder="커뮤니티 사진 업로드"
                  />
                </Field>
                {error && <p className="text-sm text-destructive">{error}</p>}
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => router.push('/community')}>취소</Button>
                  <Button type="submit">등록</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </section>
      </main>
      <Footer />
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="space-y-2"><Label>{label}</Label>{children}</div>
}
