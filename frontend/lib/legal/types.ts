// 개인정보처리방침·이용약관 같은 법적 고지 문서의 공통 구조 정의
// 문서 내용(lib/legal/*.ts)과 화면 렌더링(components/shared/legal-document.tsx)을
// 분리해두면, 법 개정으로 문구만 바뀔 때 내용 파일 하나만 고치면 된다.

/** 조항 안에 들어가는 본문 조각 */
export type LegalBlock =
  | { type: 'text'; value: string }
  | { type: 'list'; items: string[] }
  | { type: 'table'; headers: string[]; rows: string[][] }

/** 문서의 조항 하나 (예: "제1조 (개인정보의 처리 목적)") */
export interface LegalSection {
  title: string
  blocks: LegalBlock[]
}

export interface LegalDocument {
  /** 페이지 제목 */
  title: string
  /** 히어로 영역에 들어갈 영문 표기 */
  subtitle: string
  /** 문서 성격을 한 줄로 설명 */
  description: string
  /** 시행일자. 확정 전에는 null로 두고 초안 안내를 노출한다 */
  effectiveDate: string | null
  sections: LegalSection[]
  /**
   * 아직 확정되지 않아 본문에 [확인 필요]로 남아 있는 항목들.
   * 비어 있지 않으면 페이지 상단에 초안 경고가 표시된다.
   * 법적 고지 문서가 미완성 상태로 공개되는 것을 막기 위한 장치.
   */
  pendingItems: string[]
}
