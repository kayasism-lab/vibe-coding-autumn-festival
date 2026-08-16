// 2026 가을연극축제(직장인들의 이중생활) 실제 축제 계획서 기준 초기 데이터 시딩.
// 서울시 민간축제 보조사업 계획서(2026)를 기준으로 작성. 공연 시간은 계획서에 정확히
// 명시되지 않은 경우 통상적인 주말 공연시간(토 2회/일 1회)으로 가정한 값이며,
// 실제 확정 시간이 나오면 관리자 화면(/admin/schedules)에서 수정해야 합니다.

import { connectDB } from '../lib/db.js'
import { Program, Schedule, TheaterGroup, Venue } from '../models/index.js'

await connectDB()

const venues = [
  {
    name: '마틴 센터',
    address: '서울시 종로구 성균관로 87',
    description: '극단 아해 공연이 열리는 종로구 소재 공연장입니다.',
    capacity: 200,
    facilities: ['음향시설', '조명시설'],
    order: 1,
  },
  {
    name: '경험과 상상',
    address: '서울시 영등포구 당산동5가 7-2',
    description: '극단 연극패청년 공연이 열리는 영등포구 소재 공연장입니다.',
    capacity: 200,
    facilities: ['음향시설', '조명시설'],
    order: 2,
  },
  {
    name: '성북마을극장',
    address: '서울시 성북구 동소문로20다길 10',
    description: '열린 단막극 공연이 열리는 성북구 소재 공연장입니다.',
    capacity: 200,
    facilities: ['음향시설', '조명시설'],
    order: 3,
  },
]

const theaterGroups = [
  {
    name: '극단 놀이터',
    color: 'bg-amber-500',
    bgGradient: 'from-amber-600 to-orange-500',
    founded: '2009년',
    description:
      "극단 [놀이'터']는 직장생활을 하며 연극의 꿈을 찾아가는 직장인 극단입니다. 평범한 일상에서 벗어나, 숨겨 두었던 자신만의 에너지와 열정을 쏟아낼 수 있는 곳으로 만 20세 이상이면 누구나 함께 할 수 있습니다.",
    highlights: ['직장인들의 연극 꿈을 실현하는 공간', '만 20세 이상 누구나 참여 가능', '뜨거운 열정으로 채우는 무대'],
    socialLinks: { website: 'https://cafe.daum.net/noliter2009', instagram: 'https://www.instagram.com/noliter2009/' },
    order: 1,
  },
  {
    name: '극단 아해',
    color: 'bg-rose-600',
    bgGradient: 'from-rose-700 to-pink-600',
    founded: '1978년',
    description:
      '극단 [아해]는 서울 성북구를 기반으로 활동하고 있으며, 1978년 창단 이후 48년을 이어온 대한민국 대표 직장인 극단입니다.',
    highlights: ['1978년 창단, 48년 역사', '80회 이상의 정기 공연', '각종 연극제 30회 이상 수상'],
    socialLinks: { website: 'https://cafe.daum.net/ahhai', instagram: 'https://www.instagram.com/ahhai1978/' },
    order: 2,
  },
  {
    name: '극단 좋은사람들',
    color: 'bg-violet-600',
    bgGradient: 'from-violet-700 to-purple-600',
    founded: '2005년',
    description:
      '2005년에 창단한 극단 [좋은사람들]은 다양한 직업을 가진 시민들이 모여 연극을 통해 삶을 풍요롭게 가꾸어 가고자 만든 직장인 중심의 연극 공동체입니다.',
    highlights: ['다양한 직업의 시민들이 모인 연극 공동체', '퇴근 후 창작 활동', '시민 참여형 문화 예술 추구'],
    socialLinks: { website: 'https://cafe.daum.net/qodntmxoq', instagram: 'https://www.instagram.com/goodpeople2005528/' },
    order: 3,
  },
  {
    name: '극단 연극패청년',
    color: 'bg-blue-600',
    bgGradient: 'from-blue-700 to-indigo-600',
    founded: '1990년',
    description:
      '영등포구청을 기반으로 활동하는 극단 [연극패청년]은 1990년 창단 이래 30년 넘게 무대를 지켜온 비영리 직장인 극단입니다.',
    highlights: ['1990년 창단, 30년 이상의 역사', '다수 연극제 수상 경력', '자체 연습실 및 제작 시스템 보유'],
    socialLinks: { website: 'https://cafe.daum.net/now102', instagram: 'https://www.instagram.com/play_youth/' },
    order: 4,
  },
  {
    name: '극단 함바꿈',
    color: 'bg-teal-600',
    bgGradient: 'from-teal-700 to-cyan-600',
    description: '극단 소개가 준비 중입니다. 곧 업데이트 예정입니다.',
    highlights: ['준비 중'],
    socialLinks: { website: 'https://cafe.daum.net/playhbg', instagram: 'https://www.instagram.com/playhbg/' },
    order: 5,
  },
]

const programs = [
  {
    title: '기획2팀',
    type: 'play' as const,
    company: '극단 아해',
    runtime: 90,
    synopsis: '전국직장인연극단체협의회 소속 극단 아해가 선보이는 2026 가을연극축제 개막작입니다. 자세한 줄거리는 추후 업데이트됩니다.',
    venue: '마틴 센터',
    price: { regular: 0 },
    order: 1,
    schedules: [
      { date: '2026-09-19', time: '14:00' },
      { date: '2026-09-19', time: '17:00' },
      { date: '2026-09-20', time: '15:00' },
    ],
  },
  {
    title: '시민참여 열린 낭독극',
    type: 'reading' as const,
    company: '전국직장인연극단체협의회',
    runtime: 60,
    synopsis:
      '연극 경험이 없는 시민도 전문 강사진과 약 3주간의 과정을 통해 자신의 이야기를 대본으로 완성하고 무대에서 발표하는 시민참여 프로그램입니다. 정확한 장소는 추후 공지됩니다.',
    venue: '서울 소재 모임공간(추후 공지)',
    price: { regular: 0 },
    openForApplication: true,
    order: 2,
    schedules: [{ date: '2026-10-24', time: '15:00' }],
  },
  {
    title: '네번째 사람',
    type: 'play' as const,
    company: '극단 연극패청년',
    runtime: 90,
    synopsis: '전국직장인연극단체협의회 소속 극단 연극패청년이 선보이는 2026 가을연극축제 두 번째 정극입니다. 자세한 줄거리는 추후 업데이트됩니다.',
    venue: '경험과 상상',
    price: { regular: 0 },
    order: 3,
    schedules: [
      { date: '2026-11-07', time: '14:00' },
      { date: '2026-11-07', time: '17:00' },
      { date: '2026-11-08', time: '15:00' },
    ],
  },
  {
    title: '열린 단막극',
    type: 'short_play' as const,
    company: '전국직장인연극단체협의회',
    runtime: 90,
    synopsis:
      '공개모집으로 선정된 시민과 직장인극단 배우들이 함께 만드는 30분 미만 단막극 3~4편으로 구성됩니다.',
    venue: '성북마을극장',
    price: { regular: 0 },
    openForApplication: true,
    order: 4,
    schedules: [
      { date: '2026-11-28', time: '14:00' },
      { date: '2026-11-28', time: '17:00' },
      { date: '2026-11-29', time: '15:00' },
    ],
  },
]

for (const venue of venues) {
  const exists = await Venue.findOne({ name: venue.name })
  if (exists) continue
  await Venue.create(venue)
  console.log(`공연장 등록: ${venue.name}`)
}

for (const group of theaterGroups) {
  const exists = await TheaterGroup.findOne({ name: group.name })
  if (exists) continue
  await TheaterGroup.create(group)
  console.log(`극단 등록: ${group.name}`)
}

for (const { schedules, ...programData } of programs) {
  let program = await Program.findOne({ title: programData.title, company: programData.company })
  if (!program) {
    program = await Program.create(programData)
    console.log(`프로그램 등록: ${programData.title}`)
  }

  for (const schedule of schedules) {
    const exists = await Schedule.findOne({
      programId: program._id,
      date: new Date(schedule.date),
      time: schedule.time,
    })
    if (exists) continue
    await Schedule.create({
      programId: program._id,
      date: new Date(schedule.date),
      time: schedule.time,
      venue: programData.venue,
    })
  }
  console.log(`일정 등록 완료: ${programData.title} (${schedules.length}회차)`)
}

console.log('축제 데이터 시딩이 완료되었습니다.')
process.exit(0)
