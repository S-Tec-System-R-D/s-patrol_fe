import type { CheckDetailRow, PointHistoryDetail } from '@/features/course-history/types'

/**
 * 지점 인증 상세의 메모를 **코스 쪽 모양으로** 옮긴다 (`spec 037` T554).
 *
 * ## 🔴 어댑터를 만드는 이유 — B-35
 *
 * **같은 데이터에 이름이 셋 다 다르다**(실측 2026-10-16, `detailSeq 186`). `memoSeq`·
 * `attachSeq`·URL 이 **같은 값**인데 응답마다 이름이 바뀐다:
 *
 * | | 코스(`CheckDetails`) | 지점(`PointHistoryDetail`) |
 * |---|---|---|
 * | 메모 배열 | `memos` | **`memoList`** |
 * | 첨부 배열 | `attaches` | **`attachList`** |
 * | 이미지 URL | `imagePath` | **`attachPath`** |
 * | 확장자 | `fileExt` | **없다** |
 *
 * 🔴 **`CheckDetailMemo` 컴포넌트를 복제하지 않기 위한 어댑터다.** 그 컴포넌트에는 036 이
 * 쌓은 판단이 들어 있다 — 메타를 패널 머리에 **한 번만** 적기 · 첨부마다 **따로** 실패
 * 상태를 들기(B-40 폴백) · `whitespace-pre-line` · "처리 상태" 칸을 만들지 않기. 복제하면
 * 그 판단이 두 벌이 되고, 백엔드가 B-40 을 고쳤을 때 한쪽만 고쳐진다.
 *
 * 🔴 **`CLAUDE.md` B4 의 어댑터 조건 ①**(목록↔상세 필드명 차이)에 정확히 해당한다 —
 * 조건에 없으면 어댑터를 만들지 않는 것이 규약이고, 이 경우는 조건에 **있다**.
 *
 * ⚠️ **방향은 한쪽이다**(지점 → 코스 모양). 코스 쪽을 지점 모양으로 바꾸면 036 의 소비처
 * 전부가 움직인다.
 *
 * ✅ **백엔드가 이름을 통일하면 이 파일이 사라진다** — `spec 035` 로 전달된 요청에 들어
 * 있다. 그때 `memoList`→`memos` 한 줄 수정으로 끝나도록 **변환만** 둔다(표시 로직 없음).
 */

/**
 * 🔴 **`fileExt` 를 파일명에서 만들지 않는다.**
 *
 * 지점 응답에는 확장자 필드가 **없다**. 파일명에서 뽑아 채울 수도 있지만, 그러면 **서버가
 * 준 값과 우리가 추측한 값이 같은 필드에 섞인다** — 나중에 "이 확장자는 어디서 왔나" 를
 * 알 수 없다. `CheckDetailMemo` 는 `fileExt` 를 **쓰지 않으므로**(파일명·URL 만 쓴다) 빈
 * 문자열로 두고, 필요해지면 그때 백엔드에 요청한다(A1).
 */
const UNKNOWN_EXT = ''

/**
 * `PointHistoryDetail` → `CheckDetailRow`.
 *
 * 🔴 **행 전체를 만든다**(메모 배열만 바꾸지 않는다). `CheckDetailMemo` 가 메타
 * (`userName`·`checkDt`)를 그리므로 행을 받아야 하고, 쪼개면 prop 이 5개가 된다(036 판단).
 *
 * ⚠️ **상세에 없는 필드는 "없음" 으로 채운다** — `orderNo`(회차 안의 순번)는 `historySeq`
 * 가 없어 알 수 없고(`spec 037` US4), `gpsLat`/`gpsLng` 는 상세 응답에 **있으므로** 그대로
 * 옮긴다. 🔴 `orderNo` 에 **1 이나 0 을 의미 있게 쓰지 않는다** — 메모 패널이 쓰지 않는
 * 값이고, 뜻이 있는 것처럼 채우면 나중에 누가 "코스 내 순서" 로 읽는다.
 *
 * ⚠️ **`overtimeYn` 의 철자가 상세에서 다르다**(소문자 t, B-4) — 여기서 흡수한다.
 */
export const toCheckDetailRow = (detail: PointHistoryDetail): CheckDetailRow => ({
  detailSeq: detail.detailSeq,
  pointSeq: detail.pointSeq,
  pointName: detail.pointName,
  status: detail.status,
  checkDt: detail.checkDt,
  authMethod: detail.authMethod,
  // 🔴 코스 쪽은 `checkUserSeq` 다 — 지점 쪽 `userSeq` 와 같은 값이다
  checkUserSeq: detail.userSeq,
  userName: detail.userName,
  // ⚠️ 알 수 없다(회차 식별자가 없다) — 쓰이지 않는 자리를 0 으로 둔다
  orderNo: 0,
  gpsLat: detail.gpsLat,
  gpsLng: detail.gpsLng,
  // ⚠️ 상세는 소문자 t 다(B-4)
  overtimeYn: detail.overtimeYn,
  memos: detail.memoList.map((memo) => ({
    memoSeq: memo.memoSeq,
    memo: memo.memo,
    /**
     * ⚠️ **코스 쪽 `attaches` 는 nullable 이고 지점 쪽 `attachList` 는 배열**이다.
     * 🔴 그래도 **`?? []` 를 넣는다** — 실측 1건(`detailSeq 186`)으로 확정한 구조이고,
     * 다른 행에서 `null` 이 와도 화면이 터지지 않아야 한다(코스 쪽에서 실제로 `null` 이 온다).
     */
    attaches: (memo.attachList ?? []).map((attach) => ({
      attachSeq: attach.attachSeq,
      // 🔴 이름만 다르고 값은 같은 절대 URL 이다. **똑같이 404 다**(B-40)
      imagePath: attach.attachPath,
      fileName: attach.fileName,
      fileExt: UNKNOWN_EXT,
    })),
  })),
})
