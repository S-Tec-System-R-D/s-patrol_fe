import type { SimBlocker } from '../config'

/** 실행할 수 없는 환경일 때 화면 대신 보이는 안내 (`spec 082`) */
const NOTICE: Record<SimBlocker, { title: string; body: string }> = {
  mock: {
    title: 'mock 모드입니다',
    body: '시뮬레이터는 실제 테스트 서버에 데이터를 만듭니다. 개발 서버를 npm run dev:real 로 다시 띄워 주세요.',
  },
  'no-app-url': {
    title: '앱 서버 주소가 없습니다',
    body: '.env.real 에 VITE_APP_API_BASE_URL 을 넣어 주세요.',
  },
  'no-account': {
    title: '계정이 없습니다',
    body: '.env.real.local 에 VITE_SIM_ADMIN_ID · VITE_SIM_ADMIN_PW · VITE_SIM_WORKER_PW 를 넣고 개발 서버를 다시 띄워 주세요. 키 설명은 .env.example 에 있습니다.',
  },
  localhost: {
    title: 'localhost 로 열었습니다',
    body: '앱 서버는 개발 PC의 IP 주소로 연 페이지만 허용합니다(CORS). 주소창의 localhost 를 PC IP 로 바꿔 열어 주세요. 예: http://123.2.156.229:5173/dev/simulator',
  },
}

export function SimBlockedNotice({ blockers }: { blockers: SimBlocker[] }) {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-background p-6 text-foreground">
      <div className="w-full max-w-lg rounded-lg border bg-card p-5">
        <p className="text-xs font-medium tracking-wide text-primary">SIMULATOR</p>
        <h1 className="mt-1 text-base font-semibold">지금은 실행할 수 없습니다</h1>
        <ul className="mt-4 flex flex-col gap-3">
          {blockers.map((blocker) => (
            <li key={blocker} className="border-l-2 border-primary/60 pl-3">
              <p className="text-sm font-medium">{NOTICE[blocker].title}</p>
              <p className="mt-0.5 text-sm text-muted-foreground">{NOTICE[blocker].body}</p>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
