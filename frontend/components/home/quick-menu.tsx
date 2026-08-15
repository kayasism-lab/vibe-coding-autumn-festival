import Link from 'next/link'
import { Calendar, Ticket, MessageCircle, Images, Info, MapPin, Users, Heart } from 'lucide-react'

const quickMenuItems = [
  {
    href: '/about',
    icon: Info,
    title: '축제소개',
    color: 'bg-blue-500',
  },
  {
    href: '/programs',
    icon: Users,
    title: '프로그램',
    color: 'bg-purple-500',
  },
  {
    href: '/schedule',
    icon: Calendar,
    title: '공연일정',
    color: 'bg-green-500',
  },
  {
    href: '/tickets',
    icon: Ticket,
    title: '예매안내',
    color: 'bg-orange-500',
  },
  {
    href: '/notices',
    icon: MessageCircle,
    title: '공지사항',
    color: 'bg-pink-500',
  },
  {
    href: '/gallery',
    icon: Images,
    title: '갤러리',
    color: 'bg-teal-500',
  },
  {
    href: '/sponsors',
    icon: Heart,
    title: '후원안내',
    color: 'bg-red-500',
  },
  {
    href: '/contact',
    icon: MapPin,
    title: '오시는길',
    color: 'bg-indigo-500',
  },
]

export function QuickMenu() {
  return (
    <section className="py-16 lg:py-20 bg-muted/50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <p className="text-xs font-medium tracking-widest uppercase text-primary mb-2">
            Quick Menu
          </p>
          <h2 className="text-2xl sm:text-3xl font-bold text-foreground">
            바로가기
          </h2>
        </div>

        <div className="grid grid-cols-4 md:grid-cols-8 gap-4">
          {quickMenuItems.map((item) => {
            const Icon = item.icon
            return (
              <Link
                key={item.href}
                href={item.href}
                className="group flex flex-col items-center text-center"
              >
                <div className={`w-14 h-14 sm:w-16 sm:h-16 ${item.color} rounded-2xl flex items-center justify-center mb-3 shadow-lg group-hover:scale-110 group-hover:shadow-xl transition-all duration-300`}>
                  <Icon className="h-6 w-6 sm:h-7 sm:w-7 text-white" />
                </div>
                <h3 className="text-xs sm:text-sm font-medium text-foreground">
                  {item.title}
                </h3>
              </Link>
            )
          })}
        </div>
      </div>
    </section>
  )
}
