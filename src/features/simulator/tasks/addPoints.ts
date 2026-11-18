import { addPoint } from '../api/build'
import { fetchSitePoints } from '../api/siteData'
import { nextNameIndex } from '../lib/numbering'
import { number, text, type SimTask } from './types'

/** 새 지점의 기준 좌표 — 테스트 사업장 근처. 서버가 GPS 를 검사하지 않아 값 자체는 의미가 없다 */
const BASE_LAT = 37.4936
const BASE_LNG = 127.0781
const STEP = 0.0001

type Method = 'qr' | 'nfc' | 'mix'

/**
 * 지점 일괄 추가 (`spec 082` US2).
 * QR 코드는 서버가 만든다. NFC 는 태그 값이 **서버 전체에서 겹치면 500** 이라 실행마다 다른 값을 만든다.
 */
export const addPointsTask: SimTask = {
  id: 'add-points',
  group: '구축',
  name: '지점 일괄 추가',

  fields: () => [
    { type: 'number', name: 'count', label: '개수', default: 3, min: 1, max: 50 },
    {
      type: 'select',
      name: 'method',
      label: '인증 방식',
      default: 'qr',
      options: [
        { value: 'qr', label: 'QR' },
        { value: 'nfc', label: 'NFC' },
        { value: 'mix', label: 'QR · NFC 번갈아' },
      ],
    },
    { type: 'text', name: 'prefix', label: '이름 접두어', default: '시뮬 지점' },
  ],

  validate: (values) => {
    if (!text(values, 'prefix')) return '이름 접두어를 입력해 주세요.'
    const count = number(values, 'count')
    if (!Number.isInteger(count) || count < 1 || count > 50) return '개수는 1~50 사이여야 합니다.'
    return null
  },

  summary: (values) => {
    const label = { qr: 'QR', nfc: 'NFC', mix: 'QR · NFC' }[text(values, 'method') as Method]
    return `${number(values, 'count')}개 · ${label}`
  },

  run: async (ctx, values, { site, points }) => {
    const count = number(values, 'count')
    const prefix = text(values, 'prefix')
    const method = text(values, 'method') as Method
    const firstIndex = nextNameIndex(points.map((point) => point.pointName), prefix)
    // 실행마다 달라지는 꼬리 — NFC 태그 값이 이전 실행과 겹치지 않게 한다
    const runTag = Date.now().toString(36).toUpperCase()
    const names: string[] = []

    ctx.setProgress(0, count)
    for (let index = 0; index < count; index += 1) {
      const isNfc = method === 'nfc' || (method === 'mix' && index % 2 === 1)
      const name = `${prefix} ${firstIndex + index}`
      names.push(name)
      await ctx.step(`지점 추가 · ${name} (${isNfc ? 'NFC' : 'QR'})`, () =>
        addPoint(site.siteSeq, {
          name,
          authMethod: isNfc ? 10 : 9,
          ...(isNfc ? { nfcTagId: `SIM-${site.siteSeq}-${runTag}-${index + 1}` } : {}),
          gpsLat: BASE_LAT + STEP * index,
          gpsLng: BASE_LNG + STEP * index,
        })
      )
      ctx.setProgress(index + 1, count)
    }

    await ctx.step(
      '목록 확인',
      async () => {
        const after = await fetchSitePoints(site.siteSeq)
        const found = names.filter((name) => after.some((point) => point.pointName === name))
        if (found.length !== names.length) {
          throw new Error(`목록에 ${found.length}/${names.length}개만 보입니다`)
        }
        return found.length
      },
      (found) => `${found}개 확인`
    )
  },
}
