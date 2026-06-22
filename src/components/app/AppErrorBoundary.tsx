import { Component, type ErrorInfo, type ReactNode } from 'react'

interface AppErrorBoundaryProps {
  children: ReactNode
  /** 정적 fallback. 우선순위: fallbackRender > fallback. */
  fallback?: ReactNode
  /** 에러 객체를 받아 렌더. 풍부한 fallback 필요 시 사용. */
  fallbackRender?: (error: Error) => ReactNode
}

interface AppErrorBoundaryState {
  error: Error | null
}

/**
 * 페이지 단위 안전망.
 * - 라우터 안에서 발생한 렌더 에러는 react-router v7의 `errorElement`가 1순위.
 * - 라우터 외부 컴포넌트나 특정 영역만 감싸고 싶을 때 본 컴포넌트 사용.
 * - 신규 라이브러리 의존성 없음(React class component만 사용).
 *
 * 가이드: `design-system.md` §4 콘텐츠 톤(에러 메시지)을 따라 fallback 작성.
 */
export class AppErrorBoundary extends Component<
  AppErrorBoundaryProps,
  AppErrorBoundaryState
> {
  state: AppErrorBoundaryState = { error: null }

  static getDerivedStateFromError(error: Error): AppErrorBoundaryState {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    // 운영 환경에서는 외부 로거로 보내야 하나 본 spec 범위 외.
    // 일단 콘솔로만 남긴다.
    console.error('[AppErrorBoundary]', error, info.componentStack)
  }

  render(): ReactNode {
    const { error } = this.state
    const { children, fallback, fallbackRender } = this.props
    if (!error) return children
    if (fallbackRender) return fallbackRender(error)
    if (fallback) return fallback
    return (
      <div className="p-8 text-sm text-text-secondary">
        문제가 발생했습니다. 잠시 후 다시 시도해주세요.
      </div>
    )
  }
}
