'use client'

import { useState, useEffect } from 'react'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { PageHeader } from '@/components/shared/page-header'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { MapPin, Users, Phone, ExternalLink, ChevronRight, Loader2 } from 'lucide-react'
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
}

// 기본 공연장 데이터 (DB에 데이터가 없을 경우)
const defaultVenues: Venue[] = [
  {
    _id: '1',
    name: '대학로 소극장 A',
    address: '서울특별시 종로구 대학로 128',
    description: '100석 규모의 아담한 소극장으로, 관객과 배우의 가까운 호흡이 가능합니다. 최신 음향 및 조명 시설을 갖추고 있습니다.',
    imageUrls: [],
    capacity: 100,
    facilities: ['음향시설', '조명시설', '분장실', '대기실', '주차장'],
    mapUrl: 'https://map.kakao.com',
    contactPhone: '02-1234-5678',
  },
  {
    _id: '2',
    name: '영등포 문화예술회관 소극장',
    address: '서울특별시 영등포구 당산로 123',
    description: '150석 규모의 공공 문화시설로, 다양한 공연이 열리는 복합 문화공간입니다.',
    imageUrls: [],
    capacity: 150,
    facilities: ['음향시설', '조명시설', '분장실', '휠체어 접근 가능', '주차장'],
    mapUrl: 'https://map.kakao.com',
    contactPhone: '02-2345-6789',
  },
]

export default function VenuesPage() {
  const [venues, setVenues] = useState<Venue[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedVenue, setSelectedVenue] = useState<Venue | null>(null)

  useEffect(() => {
    fetchVenues()
  }, [])

  const fetchVenues = async () => {
    try {
      const res = await fetch('/api/venues?active=true')
      const data = await res.json()
      if (data.success && data.data.length > 0) {
        setVenues(data.data)
        setSelectedVenue(data.data[0])
      } else {
        setVenues(defaultVenues)
        setSelectedVenue(defaultVenues[0])
      }
    } catch (error) {
      console.error('Failed to fetch venues:', error)
      setVenues(defaultVenues)
      setSelectedVenue(defaultVenues[0])
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <Header />
      <main className="pt-[9.5rem] min-h-screen bg-gradient-to-b from-background to-muted/30">
        <PageHeader
          title="공연장 안내"
          subtitle="Venues"
          description="2026 가을연극축제가 열리는 공연장을 소개합니다."
        />

        <section className="py-16">
          <div className="container mx-auto px-4">
            {isLoading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <div className="grid lg:grid-cols-3 gap-8">
                {/* 공연장 목록 */}
                <div className="lg:col-span-1 space-y-4">
                  <h2 className="text-lg font-semibold mb-4">공연장 목록</h2>
                  {venues.map((venue) => (
                    <Card
                      key={venue._id}
                      className={`cursor-pointer transition-all hover:shadow-md ${
                        selectedVenue?._id === venue._id
                          ? 'border-primary bg-primary/5'
                          : ''
                      }`}
                      onClick={() => setSelectedVenue(venue)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="font-semibold">{venue.name}</h3>
                            <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                              <MapPin className="h-3 w-3" />
                              {venue.address}
                            </p>
                            <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                              <Users className="h-3 w-3" />
                              {venue.capacity}석
                            </p>
                          </div>
                          <ChevronRight
                            className={`h-5 w-5 transition-transform ${
                              selectedVenue?._id === venue._id
                                ? 'text-primary rotate-90'
                                : 'text-muted-foreground'
                            }`}
                          />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* 선택된 공연장 상세 */}
                <div className="lg:col-span-2">
                  {selectedVenue && (
                    <Card className="overflow-hidden">
                      {/* 이미지 */}
                      <div className="relative h-64 lg:h-80 bg-gradient-to-br from-primary/20 to-accent/20">
                        {selectedVenue.imageUrls[0] ? (
                          <Image
                            src={selectedVenue.imageUrls[0]}
                            alt={selectedVenue.name}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <MapPin className="h-16 w-16 text-muted-foreground/30" />
                          </div>
                        )}
                      </div>

                      <CardContent className="p-6 space-y-6">
                        {/* 기본 정보 */}
                        <div>
                          <h2 className="text-2xl font-bold mb-2">{selectedVenue.name}</h2>
                          <p className="text-muted-foreground flex items-center gap-2">
                            <MapPin className="h-4 w-4" />
                            {selectedVenue.address}
                          </p>
                        </div>

                        {/* 설명 */}
                        {selectedVenue.description && (
                          <p className="text-foreground/80 leading-relaxed">
                            {selectedVenue.description}
                          </p>
                        )}

                        {/* 정보 그리드 */}
                        <div className="grid grid-cols-2 gap-4">
                          <div className="bg-muted/50 rounded-lg p-4">
                            <p className="text-sm text-muted-foreground">수용 인원</p>
                            <p className="text-xl font-bold text-primary">
                              {selectedVenue.capacity}석
                            </p>
                          </div>
                          {selectedVenue.contactPhone && (
                            <div className="bg-muted/50 rounded-lg p-4">
                              <p className="text-sm text-muted-foreground">연락처</p>
                              <p className="text-lg font-semibold flex items-center gap-2">
                                <Phone className="h-4 w-4" />
                                {selectedVenue.contactPhone}
                              </p>
                            </div>
                          )}
                        </div>

                        {/* 시설 */}
                        {selectedVenue.facilities.length > 0 && (
                          <div>
                            <h3 className="font-semibold mb-3">시설 안내</h3>
                            <div className="flex flex-wrap gap-2">
                              {selectedVenue.facilities.map((facility, index) => (
                                <span
                                  key={index}
                                  className="px-3 py-1 bg-primary/10 text-primary text-sm rounded-full"
                                >
                                  {facility}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* 지도 링크 */}
                        {selectedVenue.mapUrl && (
                          <Button asChild variant="outline" className="w-full">
                            <a
                              href={selectedVenue.mapUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <ExternalLink className="mr-2 h-4 w-4" />
                              지도에서 보기
                            </a>
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                  )}
                </div>
              </div>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}
