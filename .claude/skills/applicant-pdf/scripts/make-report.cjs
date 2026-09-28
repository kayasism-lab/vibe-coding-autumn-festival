// 시민참여 신청자 JSON(read-applicants.cjs 결과) → 인쇄용 HTML → Edge로 PDF 변환.
// 개인정보가 담기므로 PDF는 JSON과 같은 db-backups/ 폴더에만 만들고, 중간 HTML은 지운다.
//
// 사용: node .claude/skills/applicant-pdf/scripts/make-report.cjs <JSON 경로> [나이 경계]
//   나이 경계: 쉼표로 구분(기본 50,60 → 50세 미만 / 50세 이상~60세 미만 / 60세 이상)
//              none 이면 나이로 나누지 않고 한 섹션으로 만든다
const fs = require('fs')
const path = require('path')
const { execFileSync } = require('child_process')

const [jsonArg, boundArg = '50,60'] = process.argv.slice(2)
if (!jsonArg) throw new Error('JSON 경로를 넘겨주세요.')
const JSON_PATH = path.resolve(jsonArg)
const OUT = path.dirname(JSON_PATH)
const apps = JSON.parse(fs.readFileSync(JSON_PATH, 'utf-8'))
if (!apps.length) throw new Error('대상 신청자가 없습니다.')

const PROGRAM_LABEL = { short_play: '열린 단막극', reading: '열린 낭독극' }
const STATUS_LABEL = { pending: '심사중', approved: '승인', rejected: '반려' }
const programLabel = PROGRAM_LABEL[apps[0].programType] ?? apps[0].programType
const statusLabel = [...new Set(apps.map((a) => STATUS_LABEL[a.status] ?? a.status))].join('·')
const today = new Date(Date.now() + 9 * 3600e3).toISOString().slice(0, 10)

const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
const kst = (d, withTime = true) => {
  const t = new Date(new Date(d).getTime() + 9 * 3600e3)
  const p = (n) => String(n).padStart(2, '0')
  const date = `${t.getUTCFullYear()}-${p(t.getUTCMonth() + 1)}-${p(t.getUTCDate())}`
  return withTime ? `${date} ${p(t.getUTCHours())}:${p(t.getUTCMinutes())}` : date
}
const gender = (g) => (g === 'male' ? '남' : g === 'female' ? '여' : '-')
const yesNo = (v) => (v === true ? '예' : v === false ? '아니오' : '-')

// 나이 경계로 섹션을 만든다. 예) [50,60] → 50세 미만 / 50세 이상 ~ 60세 미만 / 60세 이상
function buildSections(arg) {
  if (arg === 'none') return [{ title: '전체', test: () => true }]
  const b = arg.split(',').map(Number).filter((n) => !Number.isNaN(n)).sort((x, y) => x - y)
  const sections = [{ title: `${b[0]}세 미만`, test: (a) => a.age < b[0] }]
  for (let i = 0; i < b.length - 1; i++) {
    const [lo, hi] = [b[i], b[i + 1]]
    sections.push({ title: `${lo}세 이상 ~ ${hi}세 미만`, test: (a) => a.age >= lo && a.age < hi })
  }
  const last = b[b.length - 1]
  sections.push({ title: `${last}세 이상`, test: (a) => a.age >= last })
  return sections
}
const SECTIONS = buildSections(boundArg)
// 섹션 안에서는 신청 순서대로
const sorted = [...apps].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
const groups = SECTIONS.map((s) => ({ ...s, items: sorted.filter(s.test) }))

// 쪽 번호 계산: 표지 1쪽, 섹션마다 명단 1쪽 + 신청자 1쪽씩
let page = 1
for (const g of groups) {
  g.page = ++page
  g.items = g.items.map((a) => ({ a, page: ++page }))
}
const totalPages = page

function answerOf(a, q) {
  const v = a.answers?.[q.id]
  return v !== undefined ? v : a[q.id]
}

function renderQuestions(a) {
  const qs = a.answeredQuestions || []
  const short = qs.filter((q) => q.type === 'yesno' || q.type === 'select' || q.type === 'text')
  const rest = qs.filter((q) => !short.includes(q))
  let html = ''
  if (short.length) {
    html += '<table class="qa-short">' + short.map((q) => {
      const v = answerOf(a, q)
      const val = typeof v === 'boolean' ? yesNo(v) : (v ?? '')
      return `<tr><th>${esc(q.label)}</th><td>${esc(val) || '<span class="muted">(응답 없음)</span>'}</td></tr>`
    }).join('') + '</table>'
  }
  for (const q of rest) {
    const v = answerOf(a, q)
    if (q.type === 'checkbox') {
      const chosen = Array.isArray(v) ? v : []
      const opts = q.options?.length ? q.options : chosen
      html += `<div class="block"><div class="q">${esc(q.label)}</div><ul class="checks">` +
        opts.map((o) => `<li class="${chosen.includes(o) ? 'on' : 'off'}">${chosen.includes(o) ? '☑' : '☐'} ${esc(o)}</li>`).join('') +
        '</ul></div>'
    } else {
      const text = Array.isArray(v) ? v.join(', ') : (v ?? '')
      html += `<div class="block"><div class="q">${esc(q.label)}</div><div class="a">${esc(text).trim() || '<span class="muted">(응답 없음)</span>'}</div></div>`
    }
  }
  return html
}

function renderQna(a) {
  if (!a.qna?.length) return ''
  return '<div class="block"><div class="q">문의·답변 내역</div>' + a.qna.map((m) =>
    `<div class="qna ${m.author}"><b>${m.author === 'admin' ? '담당자' : '신청자'}</b> <span class="muted">${kst(m.createdAt)}</span><div>${esc(m.message)}</div></div>`
  ).join('') + '</div>'
}

function applicantPage(g, { a, page }, idx) {
  return `<section class="page applicant"><div class="fit">
  <div class="topbar"><span>${esc(g.title)} · ${idx + 1} / ${g.items.length}</span><span>${programLabel} 시민 참여 신청 · ${esc(STATUS_LABEL[a.status] ?? a.status)}</span></div>
  <div class="who"><h2>${esc(a.name)}</h2><div class="meta">${a.age}세 · ${gender(a.gender)} · ${esc(a.residence)}</div></div>
  <table class="info">
    <tr><th>연락처</th><td class="nw">${esc(a.phone)}</td><th>이메일</th><td>${esc(a.email)}</td></tr>
    <tr><th>신청일시</th><td class="nw">${kst(a.createdAt)}</td><th>거주지</th><td>${esc(a.residence)}</td></tr>
    <tr><th>개인정보 동의</th><td>${yesNo(a.privacyAgreed)}</td><th>대본 유출 금지 동의</th><td>${yesNo(a.scriptAgreed)}</td></tr>
  </table>
  ${renderQuestions(a)}
  ${renderQna(a)}
  </div><div class="pno">${page} / ${totalPages}</div></section>`
}

function sectionPage(g) {
  const rows = g.items.map(({ a, page }, i) =>
    `<tr><td>${i + 1}</td><td>${esc(a.name)}</td><td>${a.age}</td><td>${gender(a.gender)}</td><td>${esc(a.residence)}</td><td>${kst(a.createdAt, false)}</td><td>${page}쪽</td></tr>`).join('')
  return `<section class="page divider"><div class="fit">
  <div class="sec-label">섹션</div><h1>${esc(g.title)}</h1><p class="count">${g.items.length}명</p>
  ${g.items.length ? `<table class="list"><tr><th>#</th><th>이름</th><th>나이</th><th>성별</th><th>거주지</th><th>신청일</th><th>쪽</th></tr>${rows}</table>` : '<p class="muted">해당 신청자가 없습니다.</p>'}
  </div><div class="pno">${g.page} / ${totalPages}</div></section>`
}

const cover = `<section class="page cover"><div class="fit">
  <div class="sec-label">2026 가을연극축제 「직장인들의 이중생활」</div>
  <h1>${programLabel}<br>시민 참여 신청자 현황</h1>
  <p class="sub">${statusLabel} 신청자${boundArg === 'none' ? '' : ' · 나이대별 정리'}</p>
  <table class="summary">
    ${groups.map((g) => `<tr><th>${esc(g.title)}</th><td>${g.items.length}명</td><td class="muted">${g.page}쪽부터</td></tr>`).join('')}
    <tr class="total"><th>합계</th><td>${apps.length}명</td><td></td></tr>
  </table>
  <ul class="notes">
    <li>기준: ${today} DB 조회</li>
    <li>대상: ${programLabel} 신청 중 <b>${statusLabel}</b> 상태</li>
    <li>나이는 신청서에 적은 만 나이 기준, 섹션 안에서는 신청 순서대로 정렬</li>
    <li>신청자 한 명당 한 쪽. 내용이 긴 경우 글자 크기를 줄여 한 쪽에 맞춤</li>
  </ul>
  <p class="warn">개인정보가 포함된 문서입니다. 심사 용도로만 사용하고 외부로 공유하지 마세요.</p>
  </div><div class="pno">1 / ${totalPages}</div></section>`

const css = `
@page { size: A4; margin: 0 }
* { box-sizing: border-box }
body { margin: 0; font-family: 'Malgun Gothic', sans-serif; color: #1f1a17; -webkit-print-color-adjust: exact; print-color-adjust: exact }
.page { width: 210mm; height: 297mm; padding: 14mm 15mm 16mm; position: relative; page-break-after: always; overflow: hidden }
.fit { height: 100%; overflow: hidden; font-size: 10.5pt; line-height: 1.55 }
.pno { position: absolute; bottom: 7mm; right: 15mm; font-size: 8pt; color: #8a7f78 }
.muted { color: #8a7f78 }
.topbar { display: flex; justify-content: space-between; font-size: .8em; color: #fff; background: #8c2e24; padding: .45em .9em; border-radius: 4px }
.who { display: flex; align-items: baseline; gap: .8em; margin: .8em 0 .5em; border-bottom: 2px solid #e9b458; padding-bottom: .3em }
.who h2 { margin: 0; font-size: 1.9em }
.who .meta { font-size: 1.1em; color: #5b4f48 }
table { border-collapse: collapse; width: 100% }
.info th, .info td, .qa-short th, .qa-short td { border: 1px solid #e3d9cf; padding: .3em .6em; text-align: left; vertical-align: top }
.nw { white-space: nowrap }
.info th, .qa-short th { background: #f6f2ed; font-weight: 600; white-space: nowrap; width: 1%; }
.qa-short { margin-top: .7em }
.qa-short th { white-space: normal; width: 62% }
.block { margin-top: .75em }
.q { font-weight: 700; color: #8a3f29; margin-bottom: .2em }
.a { white-space: pre-wrap; background: #faf7f3; border-left: 3px solid #e9b458; padding: .45em .7em }
.checks { list-style: none; margin: 0; padding: .3em .7em; background: #faf7f3 }
.checks .off { color: #b3261e; font-weight: 700 }
.qna { border-left: 3px solid #cfc4ba; padding: .25em .7em; margin: .3em 0; white-space: pre-wrap }
.qna.admin { border-color: #8c2e24; background: #fbf4f2 }
.cover .fit, .divider .fit { font-size: 11pt }
.cover h1 { font-size: 30pt; line-height: 1.25; margin: .4em 0 .2em }
.sec-label { color: #a24334; font-weight: 700; letter-spacing: .05em }
.sub { font-size: 14pt; color: #5b4f48; margin-top: 0 }
.summary { width: 70%; margin: 10mm 0 8mm; font-size: 13pt }
.summary th, .summary td { border-bottom: 1px solid #e3d9cf; padding: .5em .4em; text-align: left }
.summary .total th, .summary .total td { border-top: 2px solid #1f1a17; font-weight: 700 }
.notes { color: #5b4f48; padding-left: 1.2em }
.warn { margin-top: 10mm; padding: .7em 1em; background: #fff6e7; border: 1px solid #edcf9c; border-radius: 6px }
.divider h1 { font-size: 26pt; margin: .1em 0 0 }
.count { font-size: 14pt; color: #5b4f48; margin: .2em 0 1em }
.list th, .list td { border-bottom: 1px solid #e3d9cf; padding: .35em .5em; text-align: left }
.list th { background: #f6f2ed }
`
// 넘치는 쪽은 글자 크기를 0.25pt씩 줄여 한 쪽에 맞춘다 (최소 6.5pt)
const fitScript = `
document.querySelectorAll('.fit').forEach(el => {
  let size = parseFloat(getComputedStyle(el).fontSize) * 0.75
  while (el.scrollHeight > el.clientHeight + 1 && size > 6.5) { size -= 0.25; el.style.fontSize = size + 'pt' }
  if (el.scrollHeight > el.clientHeight + 1) el.dataset.overflow = '1'
  el.dataset.size = size
})
document.title = 'fit-done'
`
const html = `<!doctype html><html lang="ko"><head><meta charset="utf-8"><title>${programLabel} ${statusLabel} 신청자</title><style>${css}</style></head><body>
${cover}
${groups.map((g) => sectionPage(g) + g.items.map((it, i) => applicantPage(g, it, i)).join('')).join('')}
<script>${fitScript}</script></body></html>`

// HTML → PDF: Edge 헤드리스 인쇄. 글자 줄이기 스크립트가 돌 시간을 virtual-time-budget으로 준다
const htmlPath = path.join(OUT, '_report.html')
const pdfPath = path.join(OUT, `${programLabel.replace(/\s/g, '')}_${statusLabel}_신청자_${today}.pdf`)
fs.writeFileSync(htmlPath, html)
const EDGE = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'
const profile = path.join(require('os').tmpdir(), 'applicant-pdf-edge-profile')
try {
  execFileSync(EDGE, [
    '--headless=new', '--disable-gpu', '--no-pdf-header-footer', '--virtual-time-budget=10000',
    `--user-data-dir=${profile}`, `--print-to-pdf=${pdfPath}`, 'file:///' + htmlPath.replace(/\\/g, '/'),
  ], { stdio: 'ignore' })
} finally {
  // 개인정보가 담긴 중간 파일은 남기지 않는다
  fs.rmSync(htmlPath, { force: true })
  fs.rmSync(profile, { recursive: true, force: true })
}
console.log('PDF 생성 →', pdfPath)
console.log('총', totalPages, '쪽 /', groups.map((g) => `${g.title} ${g.items.length}명`).join(', '))
