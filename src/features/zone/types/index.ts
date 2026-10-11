/**
 * ⚠️ **잔존 레거시** — `spec 023` Phase 2 에서 `features/zone` 의 mock 셸을 걷어내고
 * 남은 것이다. `CourseDiagramCard` 하나가 `ZonePointType` 을 참조하고 있어서, 그 카드를
 * 서버 타입(`CourseDetailPoint`)으로 전환하는 **Phase 3(T357)에서 함께 사라진다.**
 *
 * 🔴 새 코드에서 쓰지 않는다. 코스 타입은 `features/courses/types` 다.
 */
export * from './point'
