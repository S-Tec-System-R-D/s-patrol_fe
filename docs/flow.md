# 모바일순찰 — 네비게이션 흐름 (flow.md)

> 입력: [`docs/screens.md`](./screens.md), [`docs/overview.md`](./overview.md)
> 목적: 사이트맵 + 화면 간 이동 경로 + 주요 사용자 시나리오.
> 표기: Mermaid 다이어그램 + 텍스트 설명. 구조는 `/*`(현장) / `/admin/*`(본사) 2분할.
>
> **Mermaid 표기 규칙(이 문서 한정)**
> 라우트·슬래시·콜론·`/*`·`?` 등 특수문자가 들어간 라벨은 모두 큰따옴표로 감싼다.
> 양방향은 `<-->|라벨|` 또는 단방향 두 개로 표기(Mermaid가 양방향 점선+라벨을 지원하지 않음).

---

## 0. 진입 / 공통 흐름

도메인 **s-patrol.co.kr** 진입 시점의 분기.
공개 영역: `/` 랜딩 = 현장 로그인 · `/admin/login` 본사 로그인(`spec 063` — `/login` 은 `/` 로 넘긴다). 두 로그인은 메뉴로 연결되지 않으며 URL 직접 접근.

```mermaid
%%{init: {'theme':'dark'}}%%
flowchart LR
    Visit([URL 진입]) --> Path{경로?}

    Path -- "/" --> Login["/ 랜딩 = 현장 로그인<br/>로그인 겸 서비스 소개"]
    Path -- "/login" --> OldLogin["/login (없앰)"] --> Login
    Path -- "/admin/login" --> AdminLogin["/admin/login<br/>본사 로그인"]
    Path -- "/*" or '/admin/*' --> Guard{AuthGuard}

    Guard -- "토큰 없음 + /*" --> Login
    Guard -- "토큰 없음 + /admin/*" --> AdminLogin
    Guard -- "본사 계정 + /*" --> AdminHome
    Guard -- "사업장 미선택 + /*" --> Login
    Guard -- "JWT role 확인" --> Role{"role?"}

    Role -- "매핑 밖 role" --> Login
    Role -- 현장관리자 --> ServiceHome["/zones 현장 홈"]
    Role -- Admin 3종 --> AdminHome["/admin/locations 본사 홈"]

    Login --> LoginPost{"응답 code?"}
    AdminLogin --> LoginPost
    LoginPost -- "1xx 본사" --> AdminHome
    LoginPost -- "202 근무자" --> Deny["토큰 저장 안 함<br/>안내 후 중단"]
    LoginPost -- "201 현장관리자" --> SiteFetch["UserSiteSelect 조회<br/>(토큰 저장 후)"]

    SiteFetch --> SiteCount{"children 개수?"}
    SiteCount -- "1개" --> SiteSave
    SiteCount -- "2개 이상" --> SitePick["사업장 선택 단계<br/>(로그인 카드 내)"]
    SiteCount -- "0개 · 조회 실패 · 403" --> SiteDeny["토큰 삭제<br/>안내 후 중단"]
    SitePick --> SiteSave["siteSeq · siteName 저장"]
    SiteSave --> ServiceHome
```

**규칙**

- `/` = 랜딩(공개 · `spec 062`) = **현장 로그인**(`spec 063`). 로그인 겸 서비스 소개 — 그 자리에서 로그인한다. 본사 로그인 링크 미노출. 로그인 상태여도 그대로 보인다(`/login` 과 같음).
- `/login` = **없앴다**(`spec 063`). 들어오면 `/` 로 넘긴다(즐겨찾기 보존). 현장 로그인은 **현장관리자만**(본사 계정은 막는다 — `spec 063`).
- `/admin/login` = 본사 로그인. URL 직접 접근. 시스템관리자/Master/Manager 사용. 랜딩과 같은 분할 디자인(`spec 063`).
- `/*` 미인증 → `/`(현장 로그인). `/admin/*` 미인증 → `/admin/login`.
- 🔴 **현장 영역은 사업장 미선택도 차단한다**(021). 토큰이 멀쩡해도 `siteSeq`가 없으면 현장 로그인(`/`, 063 전에는 `/login`)으로 되돌린다 — `siteSeq` 없이 조회하면 403이 아니라 `200` + 빈 목록이 와서(`api-spec.md:211`) 정상 응답인 빈 화면이 그려진다. **본사 영역은 이 체크에서 제외**.
- 🔴 **근무자 차단은 로그인 응답 시점**이다(020 실구현). 가드가 아니라 로그인 화면이 막는다 — 서버는 근무자에게도 토큰을 발급하므로(`code: 202`) **토큰을 저장하지 않고** 안내 후 중단한다. 저장 후 가드로 막으면 새로고침 시 통과할 여지가 생긴다.
- **착지 사이트는 응답 `code`가 정한다**(`1xx` 본사 / `2xx` 현장). 🔴 **단, 로그인한 화면과 계정 사이트가 다르면 막는다**(`spec 063`, 사용자 결정 2026-10-30 — 020 의 "화면과 무관" 을 뒤집었다): `/admin/login` 에서 현장관리자 → "현장관리자 계정은 현장 로그인을 이용해주세요" + `/` 링크, `/` 에서 본사 계정 → "관리자 계정입니다…" 안내만(본사 주소는 드러내지 않는다). 둘 다 토큰을 저장하지 않는다(근무자 차단과 같은 방식). 로그인 엔드포인트는 `Login/W/Login` **하나뿐**이다(`api-spec.md` §1-1).
- **권한 판단은 JWT `role`**이 하고, `code`는 저장하지 않는다(`CLAUDE.md` B4). JWT `role`이 매핑 밖 값이면(미실측 3종) 권한을 특정할 수 없어 가드가 로그인으로 보낸다.
- 🔴 **Admin 3종(`1xx`)은 무조건 본사 화면**(`/admin/locations`)으로 간다 — 사업장 선택 없음. 사업장 선택은 **현장관리자만**(소속 2개 이상일 때) 한다. 본사 → 현장 이동 링크도 없다(사용자 결정 2026-10-23, `spec 043` US4 철회).
- 🔴 **Admin 3종은 현장 화면에 들어가지 않는다**(사용자 결정 2026-10-23, `spec 999` US2) — 현장 URL 로 오면 가드가 **본사 홈**으로 보낸다. 판정은 사업장 미선택 검사보다 먼저다(전에는 `siteSeq` 가 없어 현장 로그인으로 튕겼다).
- 현장관리자는 `/*`만. `/admin/*` 접근 시 **`/403`**(`RequireRoute` — 확정, `spec 999`).
- **사업장 전환**(`spec 061`) — 로그인 뒤에도 레일 · floating nav 버튼으로 사업장을 바꾼다(선택지 2개 이상만). 저장값(`auth.siteSeq` · `auth.siteName`) 교체 → 전환 중 오버레이 → **항상 현장 홈 `/zones`**. 현장 영역은 `siteSeq` 를 key 로 통째 다시 그린다. 서버 호출은 목록 조회(`UserSiteSelect`)뿐이다(선택 확정 API 없음).

> **해소(020, 2026-10-06)**: 로그인 직후 첫 화면은 **현장 `/zones` · 본사 `/admin/locations`**다(`homePath()`·`paths`와 일치). 당초 현장 홈을 사이드바 첫 메뉴인 `/patrol/zones`로 잠정 가정했으나 코드는 `/zones`(순찰코스 관리)였고, 코드 쪽을 유지하기로 결정했다.
>
> **해소(021, 2026-10-07)**: 사업장 선택 단계가 로그인과 홈 사이에 들어갔다(위 다이어그램 반영).
>
> - **라우트가 아니라 로그인 카드 안의 단계**다. 선택 중에도 주소는 `/login` 그대로다 — 선택 확정 API가 없어 이 단계는 "목록 1회 조회 + 로컬 저장"뿐이라 라우트·가드를 둘 무게가 아니었다.
> - 현장은 **1개면 자동 진입**(선택 UI 스킵, 저장은 그대로), 2개 이상이면 선택. **0개·조회 실패·403은 토큰을 지우고 중단**한다.
> - **본사는 선택 단계가 없다** — 🔴 **확정(사용자 결정 2026-10-23)**. `spec 043` 에서 넣었다가(US4) 철회했다. `AdminSiteSelect` 는 관리그룹 트리 출처로만 쓴다.
> - `UserSiteSelect`는 `sign` 엔드포인트라 **토큰 저장이 호출보다 먼저**다. 그래서 "토큰 있음 + `siteSeq` 없음" 중간 상태가 생기고, **`AuthGuard`가 현장 영역에서 그 상태를 로그인으로 되돌린다**(본사 영역은 제외).

---

## 1. `/*` — 현장 운영 사이트 (현장관리자 기준)

### 1-1. 사이트맵

```mermaid
%%{init: {'theme':'dark'}}%%
flowchart TB
    Login["/ 랜딩 = 현장 로그인"]

    subgraph Service["/* (현장)"]
        direction TB
        SBar([사이드바])
        SBar --> Patrol["/patrol/* 순찰이력"]
        SBar --> ZP["/zones, /points 구역·지점"]
        SBar --> Users["/users 근무자"]
        SBar --> Deploy["/deployments 배치관리"]
        SBar --> Notice["/notice 공지사항"]

        Patrol --> PZ["/patrol/zones<br/>코스 이력"]
        Patrol --> PP["/patrol/points<br/>지점 이력"]
        PZ <-->|탭| PP
        PZ --> PZD["/patrol/zones/:historySeq<br/>코스 순찰 상세"]
        PP --> PPD["/patrol/points/:detailSeq<br/>지점 인증 상세"]

        ZP --> Z["/zones<br/>순찰코스 목록"]
        ZP --> P["/points<br/>순찰지점 목록"]
        Z --> ZD["/zones/:courseSeq<br/>코스 상세"]
        P --> PD["/points/:pointSeq<br/>지점 상세"]
        PD -- "소속 코스 행" --> ZD
        Z <-->|탭| P
    end

    Login -- 인증 성공 --> SBar
```

**탭 그룹**

- `/patrol/zones` ↔ `/patrol/points` — 순찰이력 탭(`PatrolHistoryTabs`. ⚠️ 구 `PatrolLayout` 은 `spec 009` 에서 폐기됐다)
- `/patrol/points` → `/patrol/points/:detailSeq` — 행 클릭으로 **인증 1건** 진입(`spec 037`). 🔴 키가 `pointSeq` 가 아니라 **`detailSeq`** 다 — 같은 지점이 하루에 여러 번 찍히고 회차마다 결과가 다르다. 🔴 **기록 모달을 대체한다**(`PatrolRecordDialog` 삭제). 못 찾았을 때 안내 블록 **안에** `순찰이력 목록으로` 링크를 따로 두는 것도 023·027·036 과 같다
- `/zones` ↔ `/points` — 구역·지점 탭(`CourseTabs`)
- `/points` → `/points/:pointSeq` — 행 클릭으로 상세 진입(`spec 027`). 🔴 **상세가 라우트라 새로고침·딥링크·뒤로가기가 보존된다** — 027 전에는 선택이 `useState` 였다. 상세의 브레드크럼 첫 조각이 목록 복귀 링크를 겸한다
- `/zones` → `/zones/:courseSeq` — **같은 구조**(`spec 023`). ⚠️ 코스 상세는 **못 찾았을 때 브레드크럼만으로 부족**했다 — 할 수 있는 일이 하나도 없는 화면에서는 브레드크럼이 빠져나갈 길로 읽히지 않아(브라우저 확인 2026-10-12) 안내 블록 **안에** `코스 목록으로` 링크를 따로 둔다
- `/points/:pointSeq` → `/zones/:courseSeq` — **지점 상세의 소속 코스 행이 링크**다(`spec 023` Phase 5). 🔴 코스 활성여부 점을 채우는 대신 **링크로 보낸다** — 점 하나를 채우려면 지점 상세마다 코스 목록 조회(+페이징)가 붙는데, 코스 상세에 가면 활성여부·편성·최근 순찰을 다 볼 수 있다

### 1-2. 화면 간 이동 (모달·액션 포함)

페이지 단위 이동은 사이드바·탭이 대부분이고, 실 작업은 **모달**로 처리된다.

```mermaid
%%{init: {'theme':'dark'}}%%
flowchart LR
    Z["/zones<br/>코스 목록"] -- "행 클릭" --> ZD["/zones/:courseSeq<br/>코스 상세"]
    Z -- "코스 생성" --> ZAdd[(코스 폼<br/>모달)]
    ZD -- "기본정보 수정 아이콘" --> ZForm[(코스 폼<br/>모달)]
    ZD -- "토글 2종" --> ZTog[(활성화·교대 확인<br/>모달)]
    ZD -- "삭제" --> Conf1[(확인<br/>모달)]
    ZD -- "지점 순서 편집 아이콘" --> ZEdit["편집 모드<br/>(모달 아님)"]
    ZEdit -- "지점 추가" --> APAdd[(코스 내 지점 추가<br/>모달)]
    ZEdit -- "드래그·구간시간·제거" --> ZEdit
    ZEdit -- "저장" --> ZD

    P["/points<br/>지점 목록"] -- "행 클릭" --> PD["/points/:pointSeq<br/>지점 상세"]
    PD -- "지점 추가/수정" --> PForm[(지점 폼<br/>모달)]
    PD -- "QR 다운로드" --> Dl[["QR 파일 다운로드"]]
    PD -- "삭제" --> Conf2[(확인<br/>모달)]

    PZ["/patrol/zones<br/>코스 이력"] -- 행 클릭 --> PZD["/patrol/zones/:historySeq<br/>코스 순찰 상세"]
    %% 🔴 Export 는 서버 엔드포인트가 없어 036·037 범위 밖이다 — 버튼도 두지 않았다

    PP["/patrol/points<br/>지점 이력"] -- 행 클릭 --> PPD["/patrol/points/:detailSeq<br/>지점 인증 상세"]
    PPD -- "순찰코스" --> ZD

    Users["/users<br/>근무자 목록"] -- 행 클릭 --> UD["/users/:userSeq<br/>근무자 상세 페이지"]
    UD -- "근무자 추가" --> UForm[(근무자 폼<br/>모달)]
    UD -- "비밀번호" --> UPwd[(비밀번호 변경<br/>모달)]
    UD -- "삭제" --> Conf3[(확인<br/>모달)]

    Deploy["/deployments<br/>배치관리"] -- "탭" --> DTab["배치 요청 · 복귀 요청 · 전입 이력 · 전출 이력"]
    Deploy -- "KPI 클릭" --> DTab
    DTab -- "승인(즉시)" --> DApp["요청 제거 + 이력 1건"]
    DTab -- "거부" --> DRej[(거부 모달<br/>사유 필수)]

    Notice["/notice<br/>공지 목록"] -- 행 클릭 --> NDet["/notice/:noticeSeq<br/>공지 상세 페이지"]
    Notice -- "공지 작성" --> NForm[(공지 폼<br/>모달 + 앱푸시 체크박스)]
    NDet -- "수정" --> NForm
    NDet -- "삭제" --> Conf4[(확인<br/>모달)]
    Conf4 -- "확인" --> Notice
```

**원칙**

- 좌측 목록 → 우측 상세 패널 패턴이 거의 모든 화면 공통.
- 모달 닫힘 → 직전 페이지로 복귀(URL 변경 없음). 검색 상태는 URL 쿼리스트링이라 영향 없음.
- 모든 검색·필터는 URL 쿼리스트링에 저장 → 새로고침 보존, 뒤로가기로 이전 필터 복원.

### 1-3. 주요 시나리오

#### S1. 첫 로그인 → 근무자 등록

현장관리자가 새 근무자를 자기 사업장 소속으로 등록. 사업장 이동(파견/복귀)은 근무자가 APP에서 요청하는 방식 → **S1-A** 참조.

```mermaid
%%{init: {'theme':'dark'}}%%
flowchart LR
    A(["/ 랜딩 = 현장 로그인"]) -- 인증 --> C["/* 홈"]
    C -- "사이드바 '근무자'" --> D["/users"]
    D -- "근무자 추가" --> E[(근무자 폼)]
    E -- 등록 --> D
    D -- 새 근무자 행 선택 --> F["근무자 상세<br/>(배치 이력 참고)"]
```

#### S1-A. 배치 요청 승인 / 거부 (신규)

근무자가 APP에서 배치·복귀를 요청하면 **목적지 사업장 관리자**의 큐에 진입.
관리자 액션은 승인·거부 2가지. 근무자는 언제든 취소 가능.

```mermaid
%%{init: {'theme':'dark'}}%%
flowchart LR
    APP(["근무자 APP<br/>배치·복귀 요청"]) -. "목적지 관리자 큐" .-> Q["/deployments<br/>대기 큐"]
    Q -- "승인(즉시, 모달 없음)" --> H["근무자 소속 이동<br/>+ 배치 이력 자동 추가"]
    Q -- "거부" --> R1[(거부 모달<br/>사유 필수)]
    R1 -- "확정" --> Q
    APP -. "근무자 취소" .-> Q
```

#### S2. 순찰지점 신규 + 순찰코스 구성

지점을 먼저 만들고, 코스에 묶고, 순서·소요시간을 설정.

```mermaid
%%{init: {'theme':'dark'}}%%
flowchart LR
    A["/points"] -- "지점 추가" --> B[("지점 폼: QR/NFC")]
    B -- 등록 --> A
    A -- 탭 전환 --> C["/zones"]
    C -- "코스 추가" --> D[(코스 폼)]
    D -- 생성 --> E[새 코스 상세]
    E -- "지점 추가" --> F[(지점 선택 모달)]
    F -- 추가 --> E
    E -- "지점 드래그 정렬" --> E
    E -- "지점 행 수정" --> G[(소요시간·활성 모달)]
    G --> E
```

#### S3. 순찰이력 조회 → 상세

> 🔴 **Export 를 뺐다**(2026-10-20). Excel/PDF **엔드포인트가 서버에 없고**(swagger 전수)
> 036·037 모두 범위 밖으로 뒀다 — 버튼도 두지 않았다. 생기면 두 화면 공용 액션으로 넣는다.
> 🔴 **상세 둘 다 패널·모달이 아니라 페이지다**(036·037) — 선택이 `useState` 면 새로고침에
> 날아가고, 목업의 상세 구성이 패널 분량이 아니었다.

```mermaid
%%{init: {'theme':'dark'}}%%
flowchart LR
    A["/patrol/zones<br/>코스 이력"] -- "필터: 기간/코스/결과 + 순찰자 검색" --> A
    A -- 행 클릭 --> B["/patrol/zones/:historySeq<br/>코스 순찰 상세"]
    A <-->|탭| C["/patrol/points<br/>지점 이력"]
    C -- "필터: 기간/코스/인증수단/결과 + 순찰자 검색" --> C
    C -- 행 클릭 --> D["/patrol/points/:detailSeq<br/>지점 인증 상세"]
    D -- "순찰코스" --> Z["/zones/:courseSeq<br/>코스 관리 상세"]
```

⚠️ **지점 인증 상세에서 "코스 순찰 상세" 로 갈 수 없다** — `PointHistoryDetail` 에
`courseSeq` 만 있고 **`historySeq` 가 없어서**(`api-spec.md` §5-2 20번) 회차를 지목할 수
없다. 그래서 링크는 **코스 관리 상세**로 간다. 회신되면 회차 링크가 열린다(`spec 037` US4).

#### S4. 공지사항 작성 → APP 알림 트리거

```mermaid
%%{init: {'theme':'dark'}}%%
flowchart LR
    A["/notice"] -- "공지 작성" --> B[(공지 폼)]
    B -- "'저장 시 앱 푸시 발송' 체크 + 등록" --> C[목록에 새 공지]
    C -. 백엔드가 APP 푸시 .-> APP([근무자 APP 알림])
```

---

## 2. `/admin/*` — 본사 관리 사이트 (시스템관리자 기준)

### 2-1. 사이트맵

```mermaid
%%{init: {'theme':'dark'}}%%
flowchart TB
    AdminLogin["/admin/login<br/>본사 로그인<br/>(URL 직접 접근)"]

    subgraph Admin["/admin/* (본사)"]
        direction TB
        ASB([레일 — ADMIN])
        ASB --> Loc["/admin/locations<br/>사업장 관리"]
        ASB --> Adm["/admin/admins<br/>관리자 관리"]

        Loc --> LocList["목록: 좌측 관리그룹 트리<br/>+ 우측 사업장 테이블(044)"]
        Loc --> LocDet["/admin/locations/:id<br/>사업장 상세"]
        LocDet --> CardBasic["좌: 기본정보 + 수정·삭제"]
        LocDet --> CardRight["우: 담당 관리자 · 헬스체크 · 비상연락망(044 — 탭 없음)"]
    end

    AdminLogin -- 인증 성공 --> ASB
```

### 2-2. 화면 간 이동 (모달·액션 포함)

```mermaid
%%{init: {'theme':'dark'}}%%
flowchart LR
    LL["/admin/locations"] -- "트리 머리 편집 버튼" --> GEditM[(관리그룹 편집 모달)]
    GEditM -- "+ 본부 추가 · + 지사 추가" --> GAdd[(그룹명 입력)]
    GEditM -- "이름 변경" --> GEdit[(그룹명 입력)]
    GEditM -- "삭제" --> GDel[("단계그룹 삭제 확인<br/>하위·사업장 연쇄")]

    LL -- "사업장 추가" --> SAdd[(사업장 폼)]
    LL -- 사업장 행 클릭 --> LD["/admin/locations/:id<br/>상세"]

    LD -- "정보 수정" --> SEdit[(사업장 수정 모달)]
    LD -- "삭제" --> SDel[("삭제 확인<br/>하위·코스·지점·근무자 영향")]
    SDel -- 확인 --> LL

    LD -- "헬스체크 사용 토글" --> LH{"저장된 값이 있나"}
    LH -- 있음 --> LD
    LH -- "없음" --> HForm[(헬스체크 설정 모달)]
    LD -- "헬스체크 수정" --> HForm
    HForm -- 저장 --> LD

    AA["/admin/admins"] -- 행 선택 --> AD[(관리자 상세 모달)]
    AD -- "그룹 추가(시스템관리자 · Master)" --> AGroup[(담당 그룹 다중선택)]
    AGroup -- "그룹마다 읽기 → UpdateGroup" --> AD
    AD -- "해제(Master 본인이면 확인)" --> AD
```

- 🔴 관리자 추가 · 수정 · 비밀번호 · 삭제는 **막혀 있다**(B-59 — 관리자 API 없음). 활성화 · 비활성화는 없다(`spec 045`).

### 2-3. 주요 시나리오

#### A1. 신규 사업장 온보딩

그룹 트리 생성 → 사업장 추가(목록에 머문다 — 서버가 새 ID 를 주지 않는다) → 상세 → 헬스체크 설정. 담당 관리자 지정은 관리자 메뉴(045, 그룹 단위). 비상연락망은 API 대기(B-57).

```mermaid
%%{init: {'theme':'dark'}}%%
flowchart LR
    A["/admin/locations"] -- "편집 모달에서 '+ 지사 추가'" --> B[(그룹 추가)]
    B --> A
    A -- "사업장 추가" --> C[(사업장 폼)]
    C -- 등록 --> A
    A -- 새 행 클릭 --> D[사업장 상세]
    D -- "헬스체크 사용 토글(값 없음)" --> F[(헬스체크 설정 모달)]
    F -- "시간·주기·타임아웃·반복·예외 저장 = 켜기" --> G([설정 완료])
```

#### A2. 관리자 담당 그룹 할당 (`spec 045`)

관리자 신규 등록은 **API 대기**(B-59)라 지금은 기존 관리자에게 그룹을 맡기는 동선만 있다. 할당은 **그룹 단위**다(사업장 단위 없음 — B-58).

```mermaid
%%{init: {'theme':'dark'}}%%
flowchart LR
    A["/admin/admins"] -- 행 선택 --> C[(관리자 상세 모달)]
    C -- "그룹 추가" --> D[(담당 그룹 다중선택<br/>회사 · 이미 맡은 그룹 제외)]
    D -- 추가 --> C
```

**권한 규칙**

- 시스템관리자 → Master 생성 · Master → Manager 생성(관리자 API 가 오면 화면이 건다 — 서버 검사 없음, B-60)
- 할당 변경: 시스템관리자 · Master(**자기 할당 그룹만** — 서버 403). Manager 는 조작 없음
- Master · Manager 의 트리(`AdminSiteSelect`)는 **할당된 그룹만** 온다(실측 2026-10-23)

#### A3. 사업장 삭제 (위험 동선)

```mermaid
%%{init: {'theme':'dark'}}%%
flowchart LR
    A["/admin/locations/:id"] -- "삭제" --> B[("삭제 확인<br/>하위 사업장·코스·지점·근무자 수")]
    B -- 확인 --> E["DeleteSite<br/>하위 사업장·지점 연쇄(B-54)"] --> F["/admin/locations?group=지사"]
    B -- 취소 --> A
```

> **044 결정**: 패스워드 재확인은 하지 않는다(검증 API 없음). 서버는 사용 중이어도 막지 않고 하위까지 지운다(B-54 — 의도 확인 요청 중). 그래서 확인창에 영향 범위를 쓴다.

---

## 3. 횡단 / 공통 흐름

### 3-1. 검색·필터 상태 보존

모든 목록 화면에서 검색·필터는 **URL 쿼리스트링**에 저장.

```mermaid
%%{init: {'theme':'dark'}}%%
flowchart LR
    A[목록 화면<br/>필터 적용] -- URL 갱신 --> B["/path?from=...&to=...&result=..."]
    B -- 새로고침 --> A
    B -- 뒤로가기 --> Prev[이전 필터]
    B -- 상세 진입 후 복귀 --> A
```

### 3-2. 가드 실패 / 오류

```mermaid
%%{init: {'theme':'dark'}}%%
flowchart LR
    Req([라우트 진입]) --> Area{영역?}
    Area -- "/*" --> G1A{인증?}
    Area -- "/admin/*" --> G1B{인증?}

    G1A -- 무 --> L401A["/ 현장 로그인 + 401 안내"]
    G1A -- 유 --> G2{권한 일치?}
    G1B -- 무 --> L401B["/admin/login + 401 안내"]
    G1B -- 유 --> G2

    G2 -- 무 --> P403[(403 화면 or 홈 리다이렉트)]
    G2 -- 유 --> Path[정상 진입]

    Path --> G3{경로 존재?}
    G3 -- 무 --> N404[404]
```

> **Open**: 403일 때 별도 화면을 보여줄지, 본인 영역 홈으로 리다이렉트할지 미정(screens.md Open Q와 동일).

---

## 4. Open Questions

- [ ] 로그인 직후 첫 화면(현장 / 본사 각각의 "홈")의 명시적 라우트
- [ ] 403 발생 시 정책: 별도 화면 vs 본인 영역 홈 리다이렉트
- [ ] 사업장 삭제 시 사용 중 검사의 책임 위치(프론트 사전 안내 여부)
- [ ] 사이트 간 전환(`/admin/*` ↔ `/*`) 시 직전 위치 기억 필요 여부
- [ ] 모달 내부에서 다른 모달로 체이닝되는 동선(예: 사업장 상세 → 담당 관리자 지정 모달 → 관리자 신규 모달)의 허용 깊이
