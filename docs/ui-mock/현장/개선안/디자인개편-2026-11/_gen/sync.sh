#!/bin/sh
# 목업을 전부 다시 만들어 위 폴더(현장)와 본사 폴더에 번호 붙은 이름으로 복사한다.
# 사용: sh sync.sh        — 다시 만들기
#       sh sync.sh thumb  — 랜딩의 화면 이미지(dash-thumb.png)도 다시 찍는다(프로젝트의 @playwright/test 를 쓴다)
# 🔴 스크립트를 임시 폴더로 복사해 거기서 돌린다 — 한글이 든 경로에서는 node 가 .cjs 를 읽다 죽는다
#    (Node 22.13 · Windows 에서 확인). 그래서 이 폴더에서 `node gen-*.cjs` 를 직접 돌리지 않는다.
set -e
D="$(cd "$(dirname "$0")" && pwd)"
T="$D/.."
B="$D/../../../../본사관리자/개선안/디자인개편-2026-11"
ROOT="$(cd "$D/../../../../../.." && pwd)"
# Windows(Git Bash)에서는 node 가 읽을 수 있게 C:/ 꼴로 바꾼다
PATROL_ROOT="$(cd "$ROOT" && pwd -W 2>/dev/null || echo "$ROOT")"
export PATROL_ROOT
W="$(mktemp -d)"
trap 'rm -rf "$W"' EXIT
cp "$D"/*.cjs "$D"/dash-thumb.png "$W/"
cd "$W"
node gen-a-list2.cjs > /dev/null    # gen-a · gen-a-list 를 함께 돌린다
node gen-a-detail2.cjs > /dev/null
node gen-a-detail3.cjs > /dev/null
node gen-a-batch34.cjs > /dev/null  # gen-a-detail 을 함께 돌린다
node gen-a-empty.cjs > /dev/null    # 비어 있을 때의 화면 셋
if [ "$1" = thumb ]; then node shot-thumb.cjs && cp dash-thumb.png "$D/"; fi
node gen-c-landing.cjs > /dev/null  # 로그인 겸 랜딩
node gen-b-admin.cjs > /dev/null    # 본사 세 화면 + 관리그룹 편집 창 + 안내 화면 둘
cp a-dashboard.html "$T/01-대시보드.html"
cp a-course-history.html "$T/02-순찰이력-코스.html"
cp a-point-history.html "$T/03-순찰이력-지점.html"
cp a-courses.html "$T/04-코스-목록.html"
cp a-course-detail.html "$T/05-코스-상세.html"
cp a-points.html "$T/06-지점-목록.html"
cp a-point-detail.html "$T/07-지점-상세.html"
cp a-users.html "$T/08-근무자-목록.html"
cp a-users-add.html "$T/09-근무자-추가-모달.html"
cp a-deployments.html "$T/10-배치관리.html"
cp a-notices.html "$T/11-공지사항-목록.html"
cp a-run-detail.html "$T/12-순찰이력-코스-상세.html"
cp a-check-detail.html "$T/13-순찰이력-지점-상세.html"
cp a-user-detail.html "$T/14-근무자-상세.html"
cp a-notice-detail.html "$T/15-공지사항-상세.html"
cp a-deploy-returns.html "$T/16-배치관리-복귀요청.html"
cp a-deploy-in.html "$T/17-배치관리-전입이력.html"
cp a-deploy-out.html "$T/18-배치관리-전출이력.html"
cp a-modal-confirm.html "$T/19-모달-삭제확인.html"
cp a-modal-reorder.html "$T/20-모달-지점순서편집.html"
cp a-modal-run.html "$T/21-모달-회차보기.html"
cp a-modal-reorder-menu.html "$T/22-모달-지점순서편집-줄메뉴.html"
cp a-modal-point-add.html "$T/23-모달-지점추가.html"
cp a-modal-point-add-empty.html "$T/24-모달-지점추가-검색결과없음.html"
cp c-403.html "$T/25-안내-권한없음.html"
cp c-404.html "$T/26-안내-찾을수없음.html"
cp a-users-empty.html "$T/27-근무자-목록-비어있음.html"
cp a-users-noresult.html "$T/28-근무자-목록-검색결과없음.html"
cp a-dashboard-empty.html "$T/29-대시보드-비어있음.html"
cp c-landing.html "$T/30-로그인-랜딩.html"
mkdir -p "$B"
cp b-sites.html "$B/01-사업장-목록.html"
cp b-site-detail.html "$B/02-사업장-상세.html"
cp b-admins.html "$B/03-관리자.html"
cp b-modal-group.html "$B/04-모달-관리그룹-편집.html"
echo "현장 $(ls "$T"/*.html | wc -l)장 · 본사 $(ls "$B"/*.html | wc -l)장"
