import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

/**
 * https://vite.dev/config/
 *
 * 🔴 **dev 프록시가 있는 이유 — 실 백엔드에 CORS 설정이 없다.**
 *
 * 실측(2026-10-08): 백엔드가 `Access-Control-Allow-Origin` 을 **전혀 주지 않는다.**
 * preflight(OPTIONS)에는 204 를 주지만 CORS 헤더가 없어 브라우저가 응답을 버린다.
 * 그래서 `VITE_API_BASE_URL` 에 외부 주소를 직접 넣으면 **브라우저에서만 전부 실패**한다
 * (`curl` 은 CORS 를 적용하지 않아 API 실측에서는 드러나지 않았다 — `spec 022` Phase 8).
 *
 * 해법: 클라이언트는 **상대 경로**(`/api/...`)로 호출하고, dev 서버가 백엔드로 중계한다.
 * 브라우저 입장에서는 same-origin 이라 CORS 가 적용되지 않는다.
 *
 * 운영은 `CLAUDE.md` B4 대로 **도메인 + 백엔드 지정 prefix**(same-origin)이므로 이 문제가
 * 없다. 즉 프록시는 **로컬 개발 전용**이고, 백엔드 CORS 설정 요청과는 별개로 지금 당장
 * 개발을 막지 않기 위한 수단이다(`api-spec.md` §6-1 B-18).
 *
 * `VITE_API_PROXY_TARGET` 이 없으면(= mock 모드) 프록시를 **달지 않는다.** MSW 는 상대
 * 경로를 페이지 origin 에서 가로채므로 프록시가 없어야 정상 동작한다.
 */
export default defineConfig(({ mode }) => {
  // 세 번째 인자 ''(빈 prefix) — `VITE_` 접두사가 없는 키까지 읽으려면 필요하다.
  const env = loadEnv(mode, process.cwd(), '')
  const proxyTarget = env.VITE_API_PROXY_TARGET

  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    server: {
      host: true,
      ...(proxyTarget
        ? {
            proxy: {
              '/api': {
                target: proxyTarget,
                changeOrigin: true,
              },
            },
          }
        : {}),
    },
  }
})
