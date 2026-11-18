import { addCourse, assignCoursePoints, type NewCourse } from '../api/build'
import { fetchSiteCourses } from '../api/siteData'
import { nextNameIndex } from '../lib/numbering'
import type { SimPoint } from '../types'
import { flag, list, number, text, type SimTask } from './types'

const COURSE_PREFIX = '시뮬 코스'

const pointNote = (point: SimPoint): string => {
  if (point.authMethod !== 10) return 'QR'
  return point.nfcTagId ? 'NFC' : 'NFC · 태그 없음(인증 불가)'
}

/**
 * 코스 추가 (`spec 082` US2).
 * 지점은 **고른 순서**가 순찰 순서다. 교대 허용은 기본으로 켠다(교대 시뮬을 바로 돌릴 수 있게).
 * 시간초과를 빨리 재현하려면 지점당 분을 1로 둔다.
 */
export const addCourseTask: SimTask = {
  id: 'add-course',
  group: '구축',
  name: '코스 추가',

  fields: ({ points, courses }) => [
    {
      type: 'text',
      name: 'courseName',
      label: '코스 이름',
      default: `${COURSE_PREFIX} ${nextNameIndex(courses.map((course) => course.courseName), COURSE_PREFIX)}`,
    },
    {
      type: 'checks',
      name: 'pointSeqs',
      label: '지점',
      default: [],
      hint: '고른 순서가 순찰 순서입니다.',
      options: points
        .filter((point) => point.useYn)
        .sort((a, b) => a.pointSeq - b.pointSeq)
        .map((point) => ({ value: point.pointSeq, label: point.pointName, note: pointNote(point) })),
    },
    {
      type: 'number',
      name: 'courseMin',
      label: '지점당 제한 시간(분)',
      default: 1,
      min: 1,
      max: 120,
      hint: '이 시간을 넘겨 인증하면 그 지점이 시간초과가 됩니다.',
    },
    { type: 'checkbox', name: 'switchYn', label: '교대 허용', default: true },
  ],

  validate: (values, { courses }) => {
    const courseName = text(values, 'courseName')
    if (!courseName) return '코스 이름을 입력해 주세요.'
    // 추가 뒤 목록에서 이름으로 찾으므로 같은 이름이 있으면 확인할 수 없다
    if (courses.some((course) => course.courseName === courseName)) return '같은 이름의 코스가 이미 있습니다.'
    if (list(values, 'pointSeqs').length === 0) return '지점을 하나 이상 골라 주세요.'
    const courseMin = number(values, 'courseMin')
    if (!Number.isInteger(courseMin) || courseMin < 1) return '지점당 제한 시간은 1분 이상이어야 합니다.'
    return null
  },

  summary: (values) =>
    `${text(values, 'courseName')} · 지점 ${list(values, 'pointSeqs').length}개 · 지점당 ${number(values, 'courseMin')}분`,

  run: async (ctx, values, { site }) => {
    const course: NewCourse = {
      courseName: text(values, 'courseName'),
      switchYn: flag(values, 'switchYn'),
      courseMin: number(values, 'courseMin'),
      pointSeqs: list(values, 'pointSeqs'),
    }

    const findCreated = async () => {
      const after = await fetchSiteCourses(site.siteSeq)
      const created = after.find((item) => item.courseName === course.courseName)
      if (!created) throw new Error('목록에 코스가 보이지 않습니다')
      return created
    }

    await ctx.step(`코스 추가 · ${course.courseName}`, () => addCourse(site.siteSeq, course))

    // 응답에 번호가 없다 — 목록에서 이름으로 찾는다
    const created = await ctx.step('코스 번호 찾기', findCreated, (found) => `코스 #${found.courseSeq}`)

    // 🔴 웹 AddCourse 는 지점을 무시한다(B-27) — 수정 API 로 한 번 더 넣는다
    await ctx.step(`지점 편성 · ${course.pointSeqs.length}개`, () =>
      assignCoursePoints(site.siteSeq, created.courseSeq, course)
    )

    await ctx.step(
      '목록 확인',
      async () => {
        const after = await findCreated()
        if (after.pointCount !== course.pointSeqs.length) {
          throw new Error(`지점이 ${after.pointCount}/${course.pointSeqs.length}개만 들어갔습니다`)
        }
        return after
      },
      (after) => `지점 ${after.pointCount}개 · 총 ${after.totalMin}분`
    )
  },
}
