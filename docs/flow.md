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
공개 영역: `/` 랜딩 · `/login` 현장 로그인 · `/admin/login` 본사 로그인. 두 로그인은 메뉴로 연결되지 않으며 URL 직접 접근.

```mermaid
%%{init: {'theme':'dark'}}%%
flowchart LR
    Visit([URL 진입]) --> Path{경로?}

    Path -- "/" --> Landing["/ 랜딩<br/>현장 로그인 진입 링크"]
    Landing --> Login

    Path -- "/login" --> Login["/login<br/>현장 로그인"]
    Path -- "/admin/login" --> AdminLogin["/admin/login<br/>본사 로그인"]
    Path -- "/*" or '/admin/*' --> Guard{AuthGuard}

    Guard -- "토큰 없음 + /*" --> Login
    Guard -- "토큰 없음 + /admin/*" --> AdminLogin
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

    AdminHome <-->|좌측 하단 '현장 사이트로 이동'| ServiceHome
```

**규칙**

- `/` = 정적 랜딩(공개). 현장 로그인 링크만 노출. 본사 로그인 링크 미노출.
- `/login` = 현장 로그인. 현장관리자/Admin 3종 모두 사용.
- `/admin/login` = 본사 로그인. URL 직접 접근. 시스템관리자/Master/Manager 사용.
- `/*` 미인증 → `/login`. `/admin/*` 미인증 → `/admin/login`.
- 🔴 **현장 영역은 사업장 미선택도 차단한다**(021). 토큰이 멀쩡해도 `siteSeq`가 없으면 `/login`으로 되돌린다 — `siteSeq` 없이 조회하면 403이 아니라 `200` + 빈 목록이 와서(`api-spec.md:211`) 정상 응답인 빈 화면이 그려진다. **본사 영역은 이 체크에서 제외**.
- 🔴 **근무자 차단은 로그인 응답 시점**이다(020 실구현). 가드가 아니라 로그인 화면이 막는다 — 서버는 근무자에게도 토큰을 발급하므로(`code: 202`) **토큰을 저장하지 않고** 안내 후 중단한다. 저장 후 가드로 막으면 새로고침 시 통과할 여지가 생긴다.
- **착지 사이트는 응답 `code`가 정한다**(`1xx` 본사 / `2xx` 현장). 로그인 화면이 어느 쪽이었는지와 무관하다 — `/admin/login`에서 현장 계정으로 들어오면 현장 홈으로 간다. 로그인 엔드포인트는 `Login/W/Login` **하나뿐**이다(`api-spec.md` §1-1).
- **권한 판단은 JWT `role`**이 하고, `code`는 저장하지 않는다(`CLAUDE.md` B4). JWT `role`이 매핑 밖 값이면(미실측 3종) 권한을 특정할 수 없어 가드가 로그인으로 보낸다.
- Admin 3종은 양쪽 사이트 모두 진입 가능(단, 시작은 `code`가 정한 사이트). 본사 사이트 좌측 하단 "현장 사이트로 이동" 링크로 횡단.
- 현장관리자는 `/*`만. `/admin/*` 접근 시 403 또는 본인 영역 홈 리다이렉트(정책 미정).

> **해소(020, 2026-10-06)**: 로그인 직후 첫 화면은 **현장 `/zones` · 본사 `/admin/locations`**다(`homePath()`·`paths`와 일치). 당초 현장 홈을 사이드바 첫 메뉴인 `/patrol/zones`로 잠정 가정했으나 코드는 `/zones`(순찰코스 관리)였고, 코드 쪽을 유지하기로 결정했다.
>
> **해소(021, 2026-10-07)**: 사업장 선택 단계가 로그인과 홈 사이에 들어갔다(위 다이어그램 반영).
>
> - **라우트가 아니라 로그인 카드 안의 단계**다. 선택 중에도 주소는 `/login` 그대로다 — 선택 확정 API가 없어 이 단계는 "목록 1회 조회 + 로컬 저장"뿐이라 라우트·가드를 둘 무게가 아니었다.
> - 현장은 **1개면 자동 진입**(선택 UI 스킵, 저장은 그대로), 2개 이상이면 선택. **0개·조회 실패·403은 토큰을 지우고 중단**한다.
> - **본사는 선택 단계가 없다**(현행 유지). 본사 홈이 아직 placeholder라 `siteSeq` 소비처가 0개이고, `AdminSiteSelect` 평면 배열 응답이 미실측이다 → Phase 5에서 추가(`api-spec.md` OQ-1B).
> - `UserSiteSelect`는 `sign` 엔드포인트라 **토큰 저장이 호출보다 먼저**다. 그래서 "토큰 있음 + `siteSeq` 없음" 중간 상태가 생기고, **`AuthGuard`가 현장 영역에서 그 상태를 로그인으로 되돌린다**(본사 영역은 제외).

---

## 1. `/*` — 현장 운영 사이트 (현장관리자 기준)

### 1-1. 사이트맵

```mermaid
%%{init: {'theme':'dark'}}%%
flowchart TB
    Landing["/ 랜딩"]
    Login["/login 현장 로그인"]
    Landing --> Login

    subgraph Service["/* (현장)"]
        direction TB
        SBar([사이드바])
        SBar --> Patrol["/patrol/* 순찰이력"]
        SBar --> ZP["/zones, /points 구역·지점"]
        SBar --> Users["/users 사용자 관리"]
        SBar --> Deploy["/deployments 배치관리"]
        SBar --> Notice["/notice 공지사항"]

        Patrol --> PZ["/patrol/zones<br/>코스 이력"]
        Patrol --> PP["/patrol/points<br/>지점 이력"]
        PZ <-->|탭| PP

        ZP --> Z["/zones<br/>순찰코스 목록·설정"]
        ZP --> P["/points<br/>순찰지점 목록"]
        P --> PD["/points/:pointSeq<br/>지점 상세"]
        Z <-->|탭| P
    end

    Login -- 인증 성공 --> SBar
```

**탭 그룹**

- `/patrol/zones` ↔ `/patrol/points` — 순찰이력 탭(`PatrolLayout`)
- `/zones` ↔ `/points` — 구역·지점 탭(`CourseTabs`)
- `/points` → `/points/:pointSeq` — 행 클릭으로 상세 진입(`spec 027`). 🔴 **상세가 라우트라 새로고침·딥링크·뒤로가기가 보존된다** — 027 전에는 선택이 `useState` 였다. 상세의 브레드크럼 첫 조각이 목록 복귀 링크를 겸한다

### 1-2. 화면 간 이동 (모달·액션 포함)

페이지 단위 이동은 사이드바·탭이 대부분이고, 실 작업은 **모달**로 처리된다.

```mermaid
%%{init: {'theme':'dark'}}%%
flowchart LR
    Z["/zones<br/>코스 목록"] -- 코스 선택 --> ZD[코스 상세 패널]
    ZD -- "코스 추가/수정 버튼" --> ZForm[(코스 폼<br/>모달)]
    ZD -- "지점 추가" --> APAdd[(코스 내 지점 추가<br/>모달)]
    ZD -- "지점 행 수정" --> APEdit[(지점 시간·활성<br/>모달)]
    ZD -- "지점 행 삭제" --> Conf1[(확인<br/>모달)]

    P["/points<br/>지점 목록"] -- 지점 선택 --> PD[지점 상세 패널]
    PD -- "지점 추가/수정" --> PForm[(지점 폼<br/>모달)]
    PD -- "QR 다운로드" --> Dl[["QR 파일 다운로드"]]
    PD -- "삭제" --> Conf2[(확인<br/>모달)]

    PZ["/patrol/zones<br/>코스 이력"] -- 행 클릭 --> PZD[코스 이력 상세<br/>우측 패널·타임라인]
    PZ -- "Export" --> Exp[["Excel / PDF 다운로드"]]

    PP["/patrol/points<br/>지점 이력"] -- 행 클릭 --> PPD[(지점 기록 상세<br/>모달)]
    PP -- "Export" --> Exp

    Users["/users<br/>근무자 목록"] -- 행 선택 --> UD["근무자 상세 패널<br/>(배치 이력은 참고 표시)"]
    UD -- "근무자 추가" --> UForm[(근무자 폼<br/>모달)]
    UD -- "비밀번호" --> UPwd[(비밀번호 변경<br/>모달)]
    UD -- "삭제" --> Conf3[(확인<br/>모달)]

    Deploy["/deployments<br/>배치요청 큐"] -- "탭 전환" --> DTab["대기 / 처리 완료"]
    Deploy -- "행 선택" --> DReq[요청 상세 패널]
    DReq -- "승인" --> DApp[(승인 확인<br/>모달)]
    DReq -- "거부" --> DRej[(거부 모달<br/>사유 입력 선택)]

    Notice["/notice<br/>공지 목록"] -- 행 선택 --> NDet[공지 상세 패널]
    NDet -- "공지 작성/수정" --> NForm[(공지 폼<br/>모달 + 앱푸시 체크박스)]
    NDet -- "삭제" --> Conf4[(확인<br/>모달)]
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
    A(["/ 랜딩"]) --> B["/login"]
    B -- 인증 --> C["/* 홈"]
    C -- "사이드바 '사용자 관리'" --> D["/users"]
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
    Q -- "행 선택" --> D[요청 상세]
    D -- "승인" --> A1[(승인 확인 모달)]
    A1 -- "확정" --> H["근무자 소속 이동<br/>+ 배치 이력 자동 추가"]
    D -- "거부" --> R1[(거부 모달<br/>사유 입력 선택)]
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

#### S3. 순찰이력 조회 → 상세 → Export

```mermaid
%%{init: {'theme':'dark'}}%%
flowchart LR
    A["/patrol/zones"] -- "필터: 기간/구역/결과" --> A
    A -- 행 클릭 --> B[코스 이력 상세 패널<br/>타임라인]
    A <-->|탭| C["/patrol/points"]
    C -- "필터: 기간/코스/인증/순찰자/결과" --> C
    C -- 행 클릭 --> D[(지점 기록 상세<br/>첨부사진)]
    A -- "Export" --> E[["Excel / PDF"]]
    C -- "Export" --> E
```

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
        ASB([사이드바])
        ASB --> Loc["/admin/locations<br/>사업장 관리"]
        ASB --> Adm["/admin/admins<br/>관리자 관리"]

        Loc --> LocList["목록: 좌측 그룹 트리<br/>+ 우측 사업장 테이블"]
        Loc --> LocDet["/admin/locations/:id<br/>사업장 상세"]
        LocDet --> TabBasic[기본정보 탭]
        LocDet --> TabHealth["헬스체크 탭<br/>+ 비상연락망"]
    end

    AdminLogin -- 인증 성공 --> ASB
    Admin -. 좌측 하단 링크 .-> Svc["/* (현장 사이트로 이동)"]
```

### 2-2. 화면 간 이동 (모달·액션 포함)

```mermaid
%%{init: {'theme':'dark'}}%%
flowchart LR
    LL["/admin/locations"] -- "트리 노드 '+'" --> GAdd[(그룹 추가 모달)]
    LL -- "트리 노드 '…'" --> GMenu{그룹 메뉴}
    GMenu -- 수정 --> GEdit[(그룹 수정 모달)]
    GMenu -- 삭제 --> GDel[(그룹 삭제 확인)]

    LL -- "사업장 추가" --> SAdd[(사업장 폼)]
    LL -- 사업장 행 클릭 --> LD["/admin/locations/:id<br/>상세"]

    LD -- "기본정보 수정" --> SEdit[(사업장 수정 모달)]
    LD -- "운영중지/재개" --> Conf1[(확인)]
    LD -- "담당 관리자 지정" --> AAssign[(관리자 다중선택)]
    LD -- "사업장 삭제" --> SDel[(패스워드 확인 모달)]

    LD -- "헬스체크 탭" --> LH[헬스체크 설정]
    LH -- "사용 토글" --> LH
    LH -- "요일별 담당자 추가" --> AddCnt[(담당자 선택 모달)]

    AA["/admin/admins"] -- 행 선택 --> AD[관리자 상세 패널]
    AD -- "관리자 추가" --> AForm[(관리자 폼)]
    AD -- "사업장 추가(할당)" --> ASite[(사업장 다중선택)]
    AD -- "비밀번호" --> APwd[(비밀번호 모달)]
    AD -- "비활성화" --> Conf2[(확인)]
    AD -- "관리자 삭제" --> Conf3[(확인)]
```

### 2-3. 주요 시나리오

#### A1. 신규 사업장 온보딩

그룹 트리 생성 → 사업장 추가 → 담당 관리자 지정 → 헬스체크 설정.

```mermaid
%%{init: {'theme':'dark'}}%%
flowchart LR
    A["/admin/locations"] -- "트리에서 부모 그룹 '+'" --> B[(그룹 추가)]
    B --> A
    A -- "사업장 추가" --> C[(사업장 폼)]
    C -- 등록 --> D[사업장 상세 기본정보]
    D -- "담당 관리자 지정" --> E[(관리자 다중선택)]
    E --> D
    D -- "헬스체크 탭" --> F[헬스체크 설정]
    F -- "사용·시간·주기·반복 + 요일별 비상연락망" --> G([설정 완료])
```

#### A2. 관리자 신규 + 사업장 할당

```mermaid
%%{init: {'theme':'dark'}}%%
flowchart LR
    A["/admin/admins"] -- "관리자 추가" --> B[(관리자 폼<br/>권한·소속그룹·초기비번)]
    B -- 등록 --> C[새 관리자 행 선택]
    C -- "사업장 추가" --> D[(담당 사업장 다중선택)]
    D -- 추가 --> C
```

**권한 규칙**

- 시스템관리자 → Master 생성 가능
- Master → Manager 생성 가능
- Manager → 사용자 생성 불가 (할당받은 사업장만 관리)

#### A3. 사업장 삭제 (위험 동선)

```mermaid
%%{init: {'theme':'dark'}}%%
flowchart LR
    A["/admin/locations/:id"] -- "사업장 삭제" --> B[(패스워드 확인 모달)]
    B -- 일치 --> C{"사업장 사용 중인지<br/>리소스 검사"}
    C -- 사용중 --> D[(차단 안내)]
    C -- 가능 --> E[삭제 처리] --> F["/admin/locations 목록"]
    B -- 불일치 --> B
```

> **Open**: 사업장 사용 중일 때(=배치된 근무자·진행 중 코스 존재) 차단 로직은 백엔드 책임인지, 프론트 사전 안내가 필요한지 미정.

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

    G1A -- 무 --> L401A["/login + 401 안내"]
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
