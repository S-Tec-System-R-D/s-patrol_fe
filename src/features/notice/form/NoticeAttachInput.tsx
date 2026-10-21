import { PaperclipIcon, XIcon } from 'lucide-react'
import { useRef, useState } from 'react'

import AppButton from '@/components/app/AppButton'

import { addNoticeAttaches, formatFileSize, NOTICE_ATTACH_ACCEPT } from '../lib/noticeAttach'

interface NoticeAttachInputProps {
  files: File[]
  onChange: (files: File[]) => void
  disabled?: boolean
}

/**
 * 공지 첨부 입력 (`spec 040` T666).
 *
 * 이미지·파일을 **한 입력**으로 받는다 — 서버가 확장자로 `imageList`/`fileList` 를 나눈다(OQ-12).
 * 확장자·합계 용량은 고르는 단계에서 막는다(`lib/noticeAttach`).
 */
const NoticeAttachInput = ({ files, onChange, disabled }: NoticeAttachInputProps) => {
  const inputRef = useRef<HTMLInputElement>(null)
  const [error, setError] = useState<string | null>(null)

  const handlePick = (event: React.ChangeEvent<HTMLInputElement>) => {
    const result = addNoticeAttaches(files, [...(event.target.files ?? [])])
    setError(result.error)
    onChange(result.files)
    // 🔴 같은 파일을 지웠다가 다시 고르면 change 가 안 뜬다 — 값을 비운다
    event.target.value = ''
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-foreground">첨부</span>
        <AppButton
          type="button"
          variant="sub"
          icon={PaperclipIcon}
          iconSize={14}
          className="h-8 px-3"
          disabled={disabled}
          onClick={() => inputRef.current?.click()}
        >
          파일 선택
        </AppButton>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept={NOTICE_ATTACH_ACCEPT}
          className="hidden"
          aria-label="첨부 파일 선택"
          onChange={handlePick}
        />
      </div>

      {files.length > 0 && (
        <ul className="flex flex-col gap-1">
          {files.map((file, index) => (
            <li
              key={`${file.name}-${index}`}
              className="flex items-center gap-2 rounded-sm border border-border bg-surface px-3 py-1.5 text-sm"
            >
              <span className="min-w-0 flex-1 truncate text-foreground">{file.name}</span>
              <span className="shrink-0 text-xs text-muted-foreground">{formatFileSize(file.size)}</span>
              <button
                type="button"
                aria-label={`${file.name} 제거`}
                disabled={disabled}
                className="shrink-0 rounded-sm p-0.5 text-muted-foreground hover:text-foreground disabled:opacity-50"
                onClick={() => onChange(files.filter((_, i) => i !== index))}
              >
                <XIcon className="h-3.5 w-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}

      <p className="text-xs text-muted-foreground">이미지·PDF·Office·ZIP·TXT·CSV, 합계 28MB까지</p>
      {error && <p className="text-xs text-danger">{error}</p>}
    </div>
  )
}

export default NoticeAttachInput
