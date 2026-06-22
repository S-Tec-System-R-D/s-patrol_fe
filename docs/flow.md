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

    Guard -- 미인증 + /* --> Login
    Guard -- 미인증 + /admin/* --> AdminLogin
    Guard -- 인증됨 --> Role{"role?"}

    Role -- 근무자 --> Deny["WEB 접근 불가<br/>→ 로그인 + 안내"]
    Role -- 현장관리자 --> ServiceHome["/* 홈"]
    Role -- Admin 3종 --> SiteSelect{사이트 선택}

    SiteSelect -- 본사 운영 --> AdminHome["/admin/* 홈"]
    SiteSelect -- 현장 운영 --> ServiceHome

    Login -- 인증 성공 --> ServiceHome
    AdminLogin -- 인증 성공 --> AdminHome

    AdminHome <-->|좌측 하단 '현장 사이트로 이동'| ServiceHome
```

**규칙**

- `/` = 정적 랜딩(공개). 현장 로그인 링크만 노출. 본사 로그인 링크 미노출.
- `/login` = 현장 로그인. 현장관리자/Admin 3종 모두 사용.
- `/admin/login` = 본사 로그인. URL 직접 접근. 시스템관리자/Master/Manager 사용.
- `/*` 미인증 → `/login`. `/admin/*` 미인증 → `/admin/login`.
- 근무자 role → WEB 접근 불가(APP 전용). 로그인 화면에서 메시지 처리.
- Admin 3종은 양쪽 사이트 모두 진입 가능(단, 시작은 본인이 로그인한 사이트). 본사 사이트 좌측 하단 "현장 사이트로 이동" 링크로 횡단.
- 현장관리자는 `/*`만. `/admin/*` 접근 시 403 또는 본인 영역 홈 리다이렉트(정책 미정).

> **Open**: 로그인 직후 첫 화면(`/*` 홈)이 어디인가. 현재 사이드바 첫 메뉴는 "순찰이력"이므로 잠정 `/patrol/zones`로 가정. `/admin/*` 홈도 마찬가지로 사이드바 첫 메뉴 = `/admin/locations`로 가정.

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
        SBar --> Notice["/notice 공지사항"]

        Patrol --> PZ["/patrol/zones<br/>코스 이력"]
        Patrol --> PP["/patrol/points<br/>지점 이력"]
        PZ <-->|탭| PP

        ZP --> Z["/zones<br/>순찰코스 목록·설정"]
        ZP --> P["/points<br/>순찰지점 목록·설정"]
        Z <-->|탭| P
    end

    Login -- 인증 성공 --> SBar
```

**탭 그룹**

- `/patrol/zones` ↔ `/patrol/points` — 순찰이력 탭(`PatrolLayout`)
- `/zones` ↔ `/points` — 구역·지점 탭(`LocationLayout`)

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

    Users["/users<br/>근무자 목록"] -- 행 선택 --> UD[근무자 상세 패널]
    UD -- "근무자 추가" --> UForm[(근무자 폼<br/>모달)]
    UD -- "배치 변경" --> UDeploy[(배치 변경<br/>모달)]
    UD -- "복귀" --> UReturn[(배치 복귀<br/>모달)]
    UD -- "비밀번호" --> UPwd[(비밀번호 변경<br/>모달)]
    UD -- "삭제" --> Conf3[(확인<br/>모달)]

    Notice["/notice<br/>공지 목록"] -- 행 선택 --> NDet[공지 상세 패널]
    NDet -- "공지 작성/수정" --> NForm[(공지 폼<br/>모달 + 앱푸시 체크박스)]
    NDet -- "삭제" --> Conf4[(확인<br/>모달)]
```

**원칙**

- 좌측 목록 → 우측 상세 패널 패턴이 거의 모든 화면 공통.
- 모달 닫힘 → 직전 페이지로 복귀(URL 변경 없음). 검색 상태는 URL 쿼리스트링이라 영향 없음.
- 모든 검색·필터는 URL 쿼리스트링에 저장 → 새로고침 보존, 뒤로가기로 이전 필터 복원.

### 1-3. 주요 시나리오

#### S1. 첫 로그인 → 근무자 등록 → 배치

현장관리자가 새 근무자를 사업장에 배치하기까지.

```mermaid
%%{init: {'theme':'dark'}}%%
flowchart LR
    A(["/ 랜딩"]) --> B["/login"]
    B -- 인증 --> C["/* 홈"]
    C -- "사이드바 '사용자 관리'" --> D["/users"]
    D -- "근무자 추가" --> E[(근무자 폼)]
    E -- 등록 --> D
    D -- 새 근무자 행 선택 --> F[근무자 상세]
    F -- "배치 변경" --> G[(배치 변경 모달)]
    G -- 변경 완료 --> F
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
