import type { Notice } from '../types/notice'

export const notices: Notice[] = [
  {
    id: '4',
    index: 4,
    title: '6월 정기 순찰 점검 안내',
    contentPreview: '6월 1일부터 정기 순찰 점검이 시행됩니다.',
    authorName: '이현장',
    createdAt: '2026-05-28',
    readByMe: false,
    isNew: true,
    hasAttachment: true,
    appPushSent: true,
    content:
      '6월 1일부터 정기 순찰 점검이 시행됩니다.\n\n각 구역 담당 근무자께서는 순찰 코스의 NFC 태그 및 QR 인증 지점이 정상 동작하는지 사전에 확인 부탁드립니다.\n\n이상이 있는 지점은 상황실로 즉시 보고해 주시기 바랍니다.',
    attachments: [
      { id: 'a1', fileName: '6월_순찰점검_안내.pdf' },
      { id: 'a2', fileName: '점검표_양식.xlsx' },
    ],
  },
  {
    id: '3',
    index: 3,
    title: '5월 순찰 교육 일정 안내',
    contentPreview: '5월 순찰 근무자 대상 안전 교육 일정을 안내드립니다.',
    authorName: '이현장',
    createdAt: '2026-05-20',
    readByMe: true,
    isNew: false,
    hasAttachment: true,
    appPushSent: true,
    content:
      '5월 순찰 근무자 대상 안전 교육 일정을 안내드립니다.\n\n교육 일시: 2026-05-25 14:00\n장소: 지하 1층 교육장\n\n대상자는 사전 등록 부탁드립니다.',
    attachments: [{ id: 'a3', fileName: '5월_교육_일정표.pdf' }],
  },
  {
    id: '2',
    index: 2,
    title: '야간 순찰 강화 공지',
    contentPreview: '최근 야간 시간대 외부인 출입 관련 민원이 접수되어 순찰을 강화합니다.',
    authorName: '이현장',
    createdAt: '2026-05-10',
    readByMe: true,
    isNew: false,
    hasAttachment: false,
    appPushSent: false,
    content:
      '최근 야간 시간대 외부인 출입 관련 민원이 접수되어, 22시~06시 순찰을 평소보다 강화합니다.\n\n해당 시간대 근무자께서는 외곽 지점 확인을 빠짐없이 진행해 주시기 바랍니다.',
    attachments: [],
  },
  {
    id: '1',
    index: 1,
    title: '시스템 점검 안내',
    contentPreview: '순찰 앱 시스템 점검이 예정되어 있어 안내드립니다.',
    authorName: '이현장',
    createdAt: '2026-04-30',
    readByMe: true,
    isNew: false,
    hasAttachment: true,
    appPushSent: false,
    content:
      '순찰 앱 시스템 점검이 예정되어 있어 안내드립니다.\n\n점검 일시: 2026-05-02 02:00 ~ 04:00\n점검 시간 동안 앱 접속이 일시 제한될 수 있습니다.',
    attachments: [{ id: 'a4', fileName: '점검_안내문.pdf' }],
  },
]
