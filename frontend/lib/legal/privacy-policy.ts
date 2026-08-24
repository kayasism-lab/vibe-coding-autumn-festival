import type { LegalDocument } from './types'
import { ORGANIZATION } from './organization'
import { processingSections } from './privacy-sections-processing'
import { rightsSections } from './privacy-sections-rights'

// 개인정보 보호법 제30조와 시행령 제31조가 요구하는 기재사항을 모두 담은 문서.
// 조항이 많아 파일 하나로 두면 300줄을 넘겨, 성격에 따라 두 파일로 나눠 조립한다.
//   - privacy-sections-processing : 제1~6조 (수집·보유·파기·제공·위탁)
//   - privacy-sections-rights     : 제7~13조 (국외이전·권리·안전조치·책임자)

export const privacyPolicy: LegalDocument = {
  title: '개인정보처리방침',
  subtitle: 'Privacy Policy',
  description: `${ORGANIZATION}는 정보주체의 개인정보를 보호하고 관련 고충을 신속하게 처리하기 위하여\n다음과 같이 개인정보처리방침을 수립·공개합니다.`,

  // 개정할 때마다 새 시행일로 교체한다. 처리방침은 개정 전까지 계속 효력이 유지되므로
  // 종료일 개념이 없다.
  effectiveDate: '2026년 9월 1일',

  // 여기에 항목이 남아 있으면 페이지 상단에 초안 경고가 뜬다.
  // 법적 고지 문서가 빈칸을 가진 채 정식 공개되는 것을 막기 위한 장치이므로,
  // 값을 채우기 전에 이 배열만 비우는 일이 없도록 한다.
  // 확정되지 않은 항목이 없으므로 초안 경고를 띄우지 않는다.
  pendingItems: [],

  sections: [...processingSections, ...rightsSections],
}
