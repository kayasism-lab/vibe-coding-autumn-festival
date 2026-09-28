# 만든 PDF 검사: 쪽수, 신청자마다 한 쪽에만 있는지, 마지막 답변·문의까지 그 쪽에 들어갔는지(잘림 확인).
# 눈으로 볼 수 있게 표지·첫 섹션·가장 긴 신청자 쪽을 이미지로 저장한다.
#
# 사용: python .claude/skills/applicant-pdf/scripts/check.py <PDF 경로> <JSON 경로> <이미지 저장 폴더>
import json, re, sys
import pdfplumber
import pypdfium2 as pdfium

sys.stdout.reconfigure(encoding='utf-8')
pdf_path, json_path, img_dir = sys.argv[1:4]
apps = json.load(open(json_path, encoding='utf-8'))
norm = lambda s: re.sub(r'\s+', '', s or '')

with pdfplumber.open(pdf_path) as pdf:
    texts = [norm(p.extract_text()) for p in pdf.pages]
print('총 쪽수', len(texts))

bad, longest = [], (0, 0)
for a in apps:
    # 전화번호는 칸이 좁으면 줄바꿈돼 못 찾을 수 있어 이름+나이로 쪽을 찾는다
    # 표지·섹션 명단 쪽은 빼고 신청자 쪽('신청일시' 칸이 있는 쪽)만 본다. 섹션 제목의 'NN세'와 겹치는 오탐 방지
    pages = [i for i, t in enumerate(texts) if '신청일시' in t and norm(a['name']) in t and f"{a['age']}세" in t]
    pages = [i for i in pages if norm(a.get('email')) in texts[i]] or pages
    values = [v for v in (a.get('answers') or {}).values() if isinstance(v, str) and v.strip()]
    values += [m['message'] for m in a.get('qna') or []]
    missing = [v for v in values if len(pages) == 1 and norm(v)[-10:] not in texts[pages[0]]]
    size = sum(len(v) for v in values)
    if pages and size > longest[0]:
        longest = (size, pages[0])
    if len(pages) != 1 or missing:
        bad.append({'나이': a['age'], '찾은 쪽': [p + 1 for p in pages], '빠진 답변 수': len(missing)})

print('잘림·중복 의심', bad if bad else '없음')

# PDF에는 연락처를 싣지 않는다. 신청자 전화번호·이메일, 그리고 전화번호·이메일 모양의 글자가 남았는지 본다
digits = lambda s: re.sub(r'\D', '', s or '')
all_digits = [re.sub(r'\D', '', t) for t in texts]
leaks = [i + 1 for a in apps for i, t in enumerate(texts)
         if (len(digits(a['phone'])) >= 9 and digits(a['phone']) in all_digits[i]) or norm(a.get('email')) in t]
patterns = [i + 1 for i, t in enumerate(texts) if re.search(r'01\d-?\d{3,4}-?\d{4}|[\w.+-]+@[\w-]+\.[\w.]+', t)]
print('연락처 노출', sorted(set(leaks + patterns)) or '없음')
doc = pdfium.PdfDocument(pdf_path)
for i in sorted({0, 1, longest[1]}):
    doc[i].render(scale=1.3).to_pil().save(f'{img_dir}/page{i + 1}.png')
print('확인용 이미지: 1쪽, 2쪽, 가장 긴 신청자', longest[1] + 1, '쪽')
