import type { ReactNode } from 'react'
import { DownloadIcon, PaperclipIcon } from 'lucide-react'

import { MemoAttach } from '@/features/patrol-zones/components/detail/CheckDetailMemo'
import type { NoticeDetail } from '../../types/notice'

/**
 * 공지 내용 — 본문 · 이미지 · 첨부파일을 **카드 하나에** 담는다 (`spec 026` US2).
 *
 * 🔴 **2열을 버렸다**(사용자 결정 2026-10-20). 우측 열은 기본정보 카드 때문에 있었는데 그것이
 * 부제로 올라가고, 이미지는 본문의 일부라 본문 곁에 붙으면서 **우측에 첨부파일만 남았다** —
 * 이미지·파일이 없는 공지가 대부분이라 그 열은 거의 늘 빈다.
 *
 * 🔴 이미지·첨부 영역은 **있을 때만** 구분선과 함께 붙는다 — 빈 영역은 "있어야 하는데 없다" 로 읽힌다.
 */

const Section = ({ label, children }: { label: string; children: ReactNode }) => (
  <section className="flex flex-col gap-2 border-t border-border pt-4">
    <h3 className="text-label font-medium text-muted-foreground">{label}</h3>
    {children}
  </section>
)

const NoticeContentCard = ({ notice }: { notice: NoticeDetail }) => (
  <div className="flex flex-col gap-4 rounded-lg border border-border bg-card p-6">
    {/* 🔴 **본문만 `text-sm`(14px) + `leading-relaxed`** — 공용 `text-body`(12.5px)는 표·메타용
        밀도라 읽으러 오는 긴 글에는 작았다(사용자 요청 2026-10-20) */}
    <p className="whitespace-pre-line break-words text-sm leading-relaxed text-foreground">
      {notice.description}
    </p>

    {notice.imageList.length > 0 && (
      <Section label={`이미지 ${notice.imageList.length}`}>
        {/* 🔴 폴백 썸네일은 036 `MemoAttach` 를 그대로 쓴다(`patterns.md` §15) — 첨부마다
            실패 상태를 든다. 지금은 전부 404 라(B-40) 폴백만 보이고, 회신되면 저절로 뜬다.
            ⚠️ 응답 이름이 코스 첨부와 달라(`attachPath`·`attachName`·`attachExt`) 여기서 옮긴다 */}
        <ul className="flex flex-wrap gap-3">
          {notice.imageList.map((image) => (
            <li key={image.attachSeq}>
              <MemoAttach
                attach={{
                  attachSeq: image.attachSeq,
                  imagePath: image.attachPath,
                  fileName: image.attachName,
                  fileExt: image.attachExt,
                }}
              />
            </li>
          ))}
        </ul>
      </Section>
    )}

    {notice.fileList.length > 0 && (
      <Section label={`첨부파일 ${notice.fileList.length}`}>
        {/* ⚠️ 링크도 지금은 404 다(B-40). 열기 전에는 실패를 알 수 없어 폴백을 두지 않는다 */}
        <ul className="flex flex-col gap-1">
          {notice.fileList.map((file) => (
            <li key={file.attachSeq}>
              <a
                href={file.attachPath}
                target="_blank"
                rel="noreferrer"
                className="flex w-fit max-w-full items-center gap-2 rounded-sm px-2 py-1.5 text-body text-foreground hover:bg-muted"
              >
                <PaperclipIcon size={14} className="shrink-0 text-muted-foreground" aria-hidden />
                <span className="min-w-0 truncate" title={file.attachName}>
                  {file.attachName}
                </span>
                <DownloadIcon size={14} className="shrink-0 text-muted-foreground" aria-hidden />
              </a>
            </li>
          ))}
        </ul>
      </Section>
    )}
  </div>
)

export default NoticeContentCard
