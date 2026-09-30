import { formatLogDate, formatLogTime, rehearsalLabels, type RehearsalLog, type RehearsalTeam } from '@/lib/rehearsal'
import { toFitUrl } from '@/lib/cloudinary-url'
import { LogFileList } from '@/components/admin/rehearsal/log-files'

/**
 * 연습일지 한 건을 문서 모양으로 보여준다.
 *
 * 화면과 인쇄(PDF 저장)에 같은 모양을 쓴다. 나중에 여러 건을 한 번에 PDF로 뽑을 때도
 * 이 순서(머리글 → 기본 정보 표 → 연출 코멘트 → 주제·내용 → 사진 → 작성 기록)를 그대로 따르면 된다.
 * 단막극과 낭독극은 모양이 같고, 팀 종류에 따라 이름(연출↔메인강사, 연출 코멘트↔강사 코멘트)만 바뀐다.
 */
export function RehearsalLogDocument({ log, team }: { log: RehearsalLog; team: RehearsalTeam | null }) {
  const absentees = log.roster.filter((name) => !log.attendees.includes(name))
  const labels = rehearsalLabels(team)

  return (
    <article className="rehearsal-document rounded-xl border bg-card p-5 sm:p-8 print:rounded-none print:border-0 print:p-0">
      {/* A4 한 장 기준 여백. 브라우저 인쇄 창에서 'PDF로 저장'을 고르면 이 크기로 나온다 */}
      <style>{`@media print { @page { size: A4; margin: 14mm 14mm 16mm; } }`}</style>

      <header className="mb-5 border-b-2 border-foreground pb-3">
        <p className="text-xs tracking-widest text-muted-foreground">2026 가을연극축제 · {labels.program} 연습일지</p>
        <div className="mt-1 flex flex-wrap items-baseline justify-between gap-2">
          <h1 className="text-2xl font-bold">#{log.sessionNo}번째 연습</h1>
          {/* 낭독극은 팀명이 따로 없고 윗줄에 이미 '열린 낭독극'이 있어 되풀이하지 않는다 */}
          {team?.kind !== 'reading' && <p className="text-base font-semibold">{team?.name ?? ''}</p>}
        </div>
      </header>

      <table className="mb-5 w-full border-collapse text-sm">
        <tbody>
          {team?.kind !== 'reading' && <InfoRow label="작품명">{team?.title}</InfoRow>}
          <InfoRow label="날짜">{formatLogDate(log.date)}</InfoRow>
          <InfoRow label="시간">{formatLogTime(log.startTime, log.endTime) || '-'}</InfoRow>
          <InfoRow label={labels.leader}>
            {team?.director}
            {team?.kind === 'reading'
              ? !!team.instructors?.length && <span className="ml-3 text-muted-foreground">강사 {team.instructors.join(', ')}</span>
              : team?.assistantDirector && <span className="ml-3 text-muted-foreground">조연출 {team.assistantDirector}</span>}
          </InfoRow>
          <InfoRow label={`출석 ${log.attendees.length}/${log.roster.length}`}>
            {log.attendees.join(', ') || '-'}
            {absentees.length > 0 && (
              <span className="mt-0.5 block text-xs text-muted-foreground">결석: {absentees.join(', ')}</span>
            )}
          </InfoRow>
        </tbody>
      </table>

      {log.directorComment && (
        <section className="mb-5 break-inside-avoid rounded-lg border-l-4 border-primary bg-primary/5 p-4 print:bg-transparent">
          <h2 className="mb-1 text-sm font-bold text-primary">{labels.comment}</h2>
          <p className="whitespace-pre-wrap text-sm leading-relaxed">{log.directorComment}</p>
        </section>
      )}

      <section className="mb-5">
        <h2 className="mb-1 text-sm font-bold text-muted-foreground">연습 주제</h2>
        <p className="text-base font-semibold">{log.topic || '-'}</p>
      </section>

      <section className="mb-5">
        <h2 className="mb-1 text-sm font-bold text-muted-foreground">연습 내용</h2>
        <p className="whitespace-pre-wrap text-sm leading-relaxed">{log.content || '-'}</p>
      </section>

      {log.photos.length > 0 && (
        <section className="mb-5">
          <h2 className="mb-2 text-sm font-bold text-muted-foreground">사진</h2>
          <div className="grid grid-cols-2 gap-2">
            {log.photos.map((url) => (
              <a key={url} href={url} target="_blank" rel="noreferrer" className="block break-inside-avoid">
                {/* 원본 대신 줄인 사진을 받는다 (Cloudinary 대역폭 절약, 인쇄에도 충분한 크기) */}
                <img src={toFitUrl(url, 900)} alt="연습 사진" className="w-full rounded-md border object-contain" loading="lazy" />
              </a>
            ))}
          </div>
        </section>
      )}

      {!!log.files?.length && (
        <section className="mb-5 break-inside-avoid">
          <h2 className="mb-2 text-sm font-bold text-muted-foreground">첨부 파일</h2>
          <LogFileList files={log.files} />
        </section>
      )}

      <footer className="border-t pt-2 text-xs text-muted-foreground">
        작성 {log.createdByName || '-'}
        {log.updatedByName && log.updatedByName !== log.createdByName && ` · 마지막 수정 ${log.updatedByName}`}
      </footer>
    </article>
  )
}

function InfoRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <tr className="border-b">
      <th className="w-28 whitespace-nowrap bg-muted/60 px-3 py-2 text-left align-top font-medium print:bg-transparent">
        {label}
      </th>
      <td className="px-3 py-2">{children}</td>
    </tr>
  )
}
