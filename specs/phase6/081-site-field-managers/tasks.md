# 081-site-field-managers tasks

> 입력: [`spec.md`](./spec.md). 태스크 ID 는 079 T1335 다음 — **T1336~**.

- [x] T1336 WF-1-0 실측 — 본사 토큰으로 현장 관리자(권한 6) 생성 · 새 계정 현장 로그인 · 수정 · 비밀번호 변경 · 삭제(전부 200) · `api-spec.md` 기록
- [x] T1337 추가 폼 in src/features/sites/form/AddFieldManagerForm.tsx — 보고 있는 사업장 · 권한 6 고정 · 근무자 추가와 같은 검증
- [x] T1338 현장관리자 카드 in src/features/sites/components/SiteFieldManagersCard.tsx — 목록(`UserList?codeSeq=6`) · `⋯`(정보 수정 · 비밀번호 변경 · 삭제) · 빈 상태 · 실패 + 다시 시도
- [x] T1339 사업장 상세 왼쪽 열 담당 관리자 아래에 배치 in src/pages/admin/locations/LocationDetailPage.tsx
- [x] T1340 테스트(카드 6건) · e2e S9(추가 → 삭제) · verify · test · 캡처 · screens · roadmap
