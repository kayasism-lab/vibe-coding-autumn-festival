import sanitizeHtml from 'sanitize-html'

/**
 * 공지 본문에 넣은 HTML을 안전하게 걸러낸다.
 *
 * 꾸민 공지를 그대로 올릴 수 있게 HTML 입력을 허용하되, 그대로 화면에 그리면
 * 스크립트를 심어 방문자 브라우저에서 실행시킬 수 있다(XSS).
 * 그래서 저장하는 시점에 허용한 태그·속성만 남기고 나머지는 지운다.
 * 저장된 값 자체가 안전해지므로 화면 쪽에서 다시 걸러낼 필요가 없다.
 */

/** 글을 꾸미는 데 쓰는 태그만 남긴다. script·iframe·form 등은 목록에 없으므로 지워진다 */
const ALLOWED_TAGS = [
  'div', 'p', 'span', 'br', 'hr',
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'ul', 'ol', 'li',
  'strong', 'b', 'em', 'i', 'u', 's', 'small', 'mark',
  'blockquote', 'pre', 'code',
  'a', 'img',
  'table', 'thead', 'tbody', 'tfoot', 'tr', 'th', 'td', 'caption',
]

/**
 * style 속성으로 쓸 수 있는 CSS.
 * 꾸미기에 필요한 것만 열어둔다. position 같은 값은 화면을 덮는 데 쓰일 수 있어 뺐다.
 */
const ALLOWED_STYLES: Record<string, RegExp[]> = {
  color: [/^.*$/],
  'background-color': [/^.*$/],
  background: [/^(?!.*url\s*\().*$/i], // 그라데이션은 허용하되 외부 이미지 불러오기는 막는다
  'font-size': [/^.*$/],
  'font-weight': [/^.*$/],
  'font-family': [/^.*$/],
  'font-style': [/^.*$/],
  'text-align': [/^.*$/],
  'text-decoration': [/^.*$/],
  'letter-spacing': [/^.*$/],
  'line-height': [/^.*$/],
  margin: [/^.*$/], 'margin-top': [/^.*$/], 'margin-right': [/^.*$/],
  'margin-bottom': [/^.*$/], 'margin-left': [/^.*$/],
  padding: [/^.*$/], 'padding-top': [/^.*$/], 'padding-right': [/^.*$/],
  'padding-bottom': [/^.*$/], 'padding-left': [/^.*$/],
  border: [/^.*$/], 'border-top': [/^.*$/], 'border-right': [/^.*$/],
  'border-bottom': [/^.*$/], 'border-left': [/^.*$/],
  'border-radius': [/^.*$/], 'border-color': [/^.*$/],
  width: [/^.*$/], 'max-width': [/^.*$/], 'min-width': [/^.*$/],
  height: [/^.*$/], 'max-height': [/^.*$/], 'min-height': [/^.*$/],
  display: [/^(block|inline|inline-block|flex|inline-flex|grid|inline-grid|none|table|table-cell)$/i],
  'flex-wrap': [/^.*$/], 'flex-direction': [/^.*$/], 'justify-content': [/^.*$/],
  'align-items': [/^.*$/], gap: [/^.*$/],
  'grid-template-columns': [/^.*$/], 'grid-column': [/^.*$/], 'grid-row': [/^.*$/],
  'box-shadow': [/^.*$/],
  overflow: [/^.*$/],
  'vertical-align': [/^.*$/],
  'white-space': [/^.*$/],
  'object-fit': [/^.*$/],
}

const OPTIONS: sanitizeHtml.IOptions = {
  allowedTags: ALLOWED_TAGS,
  allowedAttributes: {
    '*': ['style', 'class'],
    a: ['href', 'target', 'rel', 'style', 'class'],
    img: ['src', 'alt', 'width', 'height', 'style', 'class'],
    td: ['colspan', 'rowspan', 'style', 'class'],
    th: ['colspan', 'rowspan', 'style', 'class'],
  },
  allowedStyles: { '*': ALLOWED_STYLES },
  // javascript: 같은 주소로 스크립트를 실행시키지 못하게 통로를 제한한다
  allowedSchemes: ['http', 'https', 'mailto', 'tel'],
  allowedSchemesByTag: { img: ['http', 'https', 'data'] },
  // 바깥 링크는 새 창으로 열고, 원래 창을 조작하지 못하게 rel을 붙인다
  transformTags: {
    a: sanitizeHtml.simpleTransform('a', { target: '_blank', rel: 'noopener noreferrer' }),
  },
  // 주석 안에 숨겨 넣는 수법을 막는다
  allowedClasses: false as unknown as sanitizeHtml.IOptions['allowedClasses'],
}

/** 입력이 HTML인지 (태그가 들어 있는지) */
export function looksLikeHtml(content: string): boolean {
  return /<[a-z][\s\S]*>/i.test(content)
}

/** 공지 본문을 안전하게 만든다. 평범한 글은 그대로 둔다 */
export function sanitizeNoticeContent(content: unknown): unknown {
  if (typeof content !== 'string') return content
  if (!looksLikeHtml(content)) return content

  return sanitizeHtml(content, OPTIONS)
}
