'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { PageHeader } from '@/components/shared/page-header'
import { ImagePlus, PenLine, Trash2 } from 'lucide-react'

type Post = {
  _id: string
  title: string
  content: string
  imageUrls: string[]
  authorId: string
  authorName: string
  createdAt: string
}

type CurrentUser = {
  id: string
  role: 'superadmin' | 'admin' | 'normal'
}

export default function CommunityPage() {
  const [posts, setPosts] = useState<Post[]>([])
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const fetchPosts = async () => {
    const res = await fetch('/api/community')
    const data = await res.json()
    if (data.success) setPosts(data.data)
    setIsLoading(false)
  }

  useEffect(() => {
    fetchPosts()
    fetch('/api/auth/me')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.success) setCurrentUser(data.data)
      })
  }, [])

  const handleDelete = async (id: string) => {
    if (!confirm('게시글을 삭제하시겠습니까?')) return
    const res = await fetch(`/api/community/${id}`, { method: 'DELETE' })
    if (res.ok) fetchPosts()
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-[9.5rem]">
        <PageHeader subtitle="Community" title="커뮤니티" description="회원들이 축제 사진과 이야기를 공유하는 공간입니다." />
        <section className="mx-auto max-w-5xl px-4 py-12">
          <div className="mb-6 flex justify-end">
            <Button asChild><Link href="/community/new"><PenLine className="mr-2 h-4 w-4" />글쓰기</Link></Button>
          </div>
          {isLoading ? (
            <Card><CardContent className="py-12 text-center text-muted-foreground">불러오는 중...</CardContent></Card>
          ) : posts.length === 0 ? (
            <Card><CardContent className="py-12 text-center text-muted-foreground">등록된 게시글이 없습니다.</CardContent></Card>
          ) : (
            <div className="space-y-4">
              {posts.map((post) => (
                <Card key={post._id}>
                  <CardContent className="p-5">
                    <div className="mb-3 flex items-start justify-between gap-4">
                      <div>
                        <h2 className="text-lg font-semibold">{post.title}</h2>
                        <p className="text-sm text-muted-foreground">{post.authorName} · {new Date(post.createdAt).toLocaleDateString('ko-KR')}</p>
                      </div>
                      {canDeletePost(currentUser, post) && (
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(post._id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      )}
                    </div>
                    <p className="whitespace-pre-line text-sm leading-relaxed text-foreground/80">{post.content}</p>
                    {post.imageUrls.length > 0 && (
                      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                        {post.imageUrls.map((url) => (
                          <div key={url} className="relative aspect-video overflow-hidden rounded-md bg-muted">
                            <img src={url} alt={post.title} className="h-full w-full object-cover" />
                          </div>
                        ))}
                      </div>
                    )}
                    {post.imageUrls.length === 0 && <ImagePlus className="mt-4 h-5 w-5 text-muted-foreground" />}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </section>
      </main>
      <Footer />
    </div>
  )
}

function canDeletePost(user: CurrentUser | null, post: Post) {
  if (!user) return false
  return user.role === 'superadmin' || user.role === 'admin' || post.authorId === user.id
}
