'use client'

import { useEffect, useState } from 'react'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight, X, Play } from 'lucide-react'

type GalleryItem = {
  _id: string
  type: 'photo' | 'video'
  title: string
  url: string
  thumbnailUrl?: string
  createdAt: string
}

export default function GalleryPage() {
  const [items, setItems] = useState<GalleryItem[]>([])
  const [selectedYear, setSelectedYear] = useState('전체')
  const [selectedItem, setSelectedItem] = useState<GalleryItem | null>(null)
  const [currentIndex, setCurrentIndex] = useState(0)

  useEffect(() => {
    fetch('/api/gallery')
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setItems(data.data)
      })
  }, [])

  const years = ['전체', ...Array.from(new Set(items.map((item) => new Date(item.createdAt).getFullYear().toString()))).sort().reverse()]
  const filteredItems = selectedYear === '전체' ? items : items.filter((item) => new Date(item.createdAt).getFullYear().toString() === selectedYear)

  const openLightbox = (item: GalleryItem) => {
    setCurrentIndex(filteredItems.findIndex((candidate) => candidate._id === item._id))
    setSelectedItem(item)
  }

  const navigateLightbox = (direction: 'prev' | 'next') => {
    if (filteredItems.length === 0) return
    let nextIndex = direction === 'prev' ? currentIndex - 1 : currentIndex + 1
    if (nextIndex < 0) nextIndex = filteredItems.length - 1
    if (nextIndex >= filteredItems.length) nextIndex = 0
    setCurrentIndex(nextIndex)
    setSelectedItem(filteredItems[nextIndex])
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1">
        <section className="relative py-20 bg-gradient-to-br from-primary/10 via-background to-accent/10">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-4xl lg:text-5xl font-bold mb-4">갤러리</h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">가을연극축제의 순간들을 사진과 영상으로 만나보세요.</p>
          </div>
        </section>
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="flex justify-center gap-2 mb-10">
              {years.map((year) => <Button key={year} variant={selectedYear === year ? 'default' : 'outline'} onClick={() => setSelectedYear(year)}>{year}</Button>)}
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredItems.map((item) => (
                <button key={item._id} onClick={() => openLightbox(item)} className="group relative aspect-[4/3] rounded-xl overflow-hidden bg-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-primary">
                  <img src={item.thumbnailUrl || item.url} alt={item.title} className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                  <div className="absolute inset-0 bg-gradient-to-t from-foreground/80 via-foreground/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="absolute bottom-0 left-0 right-0 p-4 text-left translate-y-4 group-hover:translate-y-0 opacity-0 group-hover:opacity-100 transition-all">
                    <p className="text-white font-medium">{item.title}</p>
                    <p className="text-white/70 text-sm">{new Date(item.createdAt).getFullYear()}</p>
                  </div>
                  {item.type === 'video' && <div className="absolute inset-0 flex items-center justify-center"><div className="w-16 h-16 rounded-full bg-white/90 flex items-center justify-center shadow-lg"><Play className="h-6 w-6 text-primary ml-1" /></div></div>}
                </button>
              ))}
            </div>
            {filteredItems.length === 0 && <div className="text-center py-20 text-muted-foreground">등록된 갤러리가 없습니다.</div>}
          </div>
        </section>
      </main>
      <Footer />
      <Dialog open={!!selectedItem} onOpenChange={() => setSelectedItem(null)}>
        <DialogContent className="max-w-5xl p-0 bg-foreground/95 border-none">
          <div className="relative">
            <button onClick={() => setSelectedItem(null)} className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20"><X className="h-5 w-5" /></button>
            <button onClick={() => navigateLightbox('prev')} className="absolute left-4 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20"><ChevronLeft className="h-5 w-5" /></button>
            <button onClick={() => navigateLightbox('next')} className="absolute right-4 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20"><ChevronRight className="h-5 w-5" /></button>
            <div className="aspect-video">{selectedItem && <img src={selectedItem.url} alt={selectedItem.title} className="w-full h-full object-contain" />}</div>
            <div className="p-4 text-center"><p className="text-white font-medium">{selectedItem?.title}</p></div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
