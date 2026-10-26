import { InfoIcon, PhoneIcon, PlusIcon, XIcon } from 'lucide-react'

import AppDetailCard from '@/components/app/AppDetailCard'
import AppLinkButton from '@/components/app/AppLinkButton'
import { cn } from '@/lib/utils'

/**
 * 비상연락망 카드 — **목업 UI** (`spec 044` T808 자리 카드 → `048` 목업 화면, 사용자 결정 2026-10-26).
 *
 * 🔴 **API 가 없다**(B-57). 아래 담당자 · 요일 편성은 **예시 데이터**이고 서버와 무관하다(msw 도 없다).
 * 버튼 · 칩 해제는 모두 막는다 — 눌러지면 저장되는 줄 안다. 안내 줄로 예시 화면임을 밝힌다.
 * 구성은 목업(`ui-mock/본사관리자/사업장/헬스체크.png`): 요일 7행(담당자 칩 + 추가) + 담당자 풀.
 * 아바타는 그리지 않는다(관리자 상세 모달과 같은 판단 — 045). 풀은 상자 대신 행 목록이다(카드 안 카드 회피).
 */

interface SampleContact {
  id: number
  name: string
  title: string
  phone: string
}

const SAMPLE_CONTACTS: SampleContact[] = [
  { id: 1, name: '김보안', title: '현장소장', phone: '010-1000-2000' },
  { id: 2, name: '박관제', title: '관제팀장', phone: '010-1000-3000' },
  { id: 3, name: '이당직', title: '당직주임', phone: '010-1000-4000' },
]

const SAMPLE_WEEK: { day: string; weekend: boolean; contactIds: number[] }[] = [
  { day: '월', weekend: false, contactIds: [1, 2] },
  { day: '화', weekend: false, contactIds: [1] },
  { day: '수', weekend: false, contactIds: [2, 3] },
  { day: '목', weekend: false, contactIds: [1] },
  { day: '금', weekend: false, contactIds: [2] },
  { day: '토', weekend: true, contactIds: [3] },
  { day: '일', weekend: true, contactIds: [3] },
]

const contactOf = (id: number) => SAMPLE_CONTACTS.find((contact) => contact.id === id)

const EmergencyContactCard = () => (
  <AppDetailCard
    icon={PhoneIcon}
    title="비상연락망"
    badge={<span className="text-caption text-muted-foreground">담당자 {SAMPLE_CONTACTS.length}명</span>}
  >
    <p className="text-caption text-muted-foreground">
      헬스체크 이상 감지 시 요일별로 지정된 담당자에게 알림이 발송됩니다.
    </p>
    <p className="flex items-start gap-2 rounded-md bg-muted px-3 py-2.5 text-caption text-muted-foreground">
      <InfoIcon className="mt-0.5 size-3.5 shrink-0" />
      비상연락망은 준비 중입니다(API 미지원). 아래는 예시 화면이며 저장되지 않습니다.
    </p>

    <table aria-label="요일별 담당자" className="w-full text-body">
      <thead>
        <tr className="border-b border-border text-left text-caption text-muted-foreground">
          <th scope="col" className="w-14 px-2 py-2 font-medium">
            요일
          </th>
          <th scope="col" className="px-2 py-2 font-medium">
            담당자
          </th>
        </tr>
      </thead>
      <tbody>
        {SAMPLE_WEEK.map((row) => (
          <tr key={row.day} className="border-b border-border last:border-0">
            <th
              scope="row"
              className={cn('px-2 py-2 text-left font-semibold', row.weekend ? 'text-danger' : 'text-foreground')}
            >
              {row.day}
            </th>
            <td className="px-2 py-2">
              <div className="flex flex-wrap items-center gap-1.5">
                {row.contactIds.map((id) => {
                  const contact = contactOf(id)
                  return (
                    contact && (
                      <span
                        key={id}
                        className="inline-flex items-center gap-1.5 rounded-full bg-muted py-0.5 pr-1 pl-2.5 text-caption"
                      >
                        <span className="font-semibold text-foreground">{contact.name}</span>
                        <span className="text-muted-foreground">{contact.title}</span>
                        <button
                          type="button"
                          aria-label={`${row.day}요일 ${contact.name} 해제`}
                          disabled
                          className="grid size-5 place-items-center rounded-full text-muted-foreground disabled:cursor-not-allowed"
                        >
                          <XIcon className="size-3" />
                        </button>
                      </span>
                    )
                  )
                })}
                <AppLinkButton icon={PlusIcon} aria-label={`${row.day}요일 담당자 추가`} disabled>
                  추가
                </AppLinkButton>
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>

    <section aria-label="담당자 풀" className="flex flex-col gap-1 border-t border-border pt-4">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-caption font-semibold text-muted-foreground">담당자 풀</h3>
        <AppLinkButton icon={PlusIcon} disabled>
          담당자 추가
        </AppLinkButton>
      </div>
      <ul className="flex flex-col gap-1">
        {SAMPLE_CONTACTS.map((contact) => (
          <li key={contact.id} className="flex items-center gap-2.5 rounded-md px-2 py-2 hover:bg-muted/40">
            <span className="font-semibold text-foreground">{contact.name}</span>
            <span className="text-caption text-muted-foreground">{contact.title}</span>
            <span className="ml-auto text-caption tabular-nums text-muted-foreground">{contact.phone}</span>
          </li>
        ))}
      </ul>
    </section>
  </AppDetailCard>
)

export default EmergencyContactCard
