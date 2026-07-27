export interface NoticeAttachment {
  id: string
  fileName: string
}

export interface NoticeSummary {
  id: string
  index: number
  title: string
  contentPreview: string
  authorName: string
  createdAt: string
  readByMe: boolean
  isNew: boolean
  hasAttachment: boolean
}

export interface Notice extends NoticeSummary {
  content: string
  appPushSent: boolean
  attachments: NoticeAttachment[]
}
