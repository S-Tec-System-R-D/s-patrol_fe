import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import AppButton from '@/components/app/AppButton'
import AppInput from '@/components/app/AppInput'
import { login } from '@/features/auth/api/login'
import { fetchUserSiteSelect } from '@/features/auth/api/userSiteSelect'
import { resolveLoginOutcome } from '@/features/auth/lib/loginResult'
import { toSiteOptions } from '@/features/auth/lib/siteOptions'
import { resolveSiteSelectOutcome } from '@/features/auth/lib/siteSelectOutcome'
import { loginSchema, type LoginFormData } from '@/features/auth/form/schema'
import { SiteSelectStep } from '@/features/auth/components/SiteSelectStep'
import type { SiteOption } from '@/features/auth/types/site'
import { clearTokens, setAccessToken, setRefreshToken } from '@/lib/auth/tokens'
import { setSite } from '@/lib/auth/site'
import { isServiceLoginCode } from '@/types/api'

/**
 * 로그인 폼. 현장(`/login`)·본사(`/admin/login`) **공용**.
 *
 * 로그인 엔드포인트가 하나뿐이고 사이트는 응답 `code`로만 갈리므로(`api-spec.md` §2-1)
 * 사이트별 차이는 **제목·안내 문구 2가지**뿐이다. 착지 경로는 `code`가 정하므로 prop이 아니다.
 *
 * 에러는 toast가 아니라 **폼 안 인라인**으로 보여준다 — 입력 오류를 고치는 자리가 폼이고,
 * 인터셉터 일괄 toast면 중복 노출이 된다(spec 020 §3 규칙 9).
 */

interface LoginFormProps {
  title: string
  description?: string
}

export const LoginForm = ({ title, description }: LoginFormProps) => {
  const navigate = useNavigate()
  const [submitError, setSubmitError] = useState<string | null>(null)

  // 사업장 선택 단계(spec 021). 라우트가 아니라 **카드 안의 단계**다 — 선택은
  // "목록 1회 조회 + 로컬 저장"뿐이라 라우트·가드를 건드릴 무게가 아니다.
  const [siteOptions, setSiteOptions] = useState<SiteOption[] | null>(null)
  const [entering, setEntering] = useState(false)
  // 착지 경로는 `code`가 정한다(020). 선택 단계를 거치는 동안 보관했다가 그대로 쓴다 —
  // 여기서 다시 계산하면 code 해석이 두 군데로 갈린다.
  const [landing, setLanding] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { loginId: '', loginPw: '' },
  })

  /**
   * 사업장 확정 → 홈 진입. **`auto`(1개)와 `choose`(선택)가 공유하는 단일 경로**다.
   *
   * 자동 진입에서만 저장을 빼먹는 실수를 구조로 막는다(spec 021 §3 규칙 10) —
   * `siteSeq` 없이 홈에 들어가면 조회가 `200` + 빈 목록으로 돌아와 조용히 틀린 화면이 된다.
   */
  const enterSite = (site: SiteOption, landing: string) => {
    setEntering(true)
    setSite(site.siteSeq, site.siteName)
    navigate(landing, { replace: true })
  }

  const onSubmit = async (values: LoginFormData) => {
    setSubmitError(null)
    try {
      const { code, accessToken, refreshToken } = await login(values)
      const outcome = resolveLoginOutcome(code)

      // 🔴 허용이 아니면 **토큰을 저장하지 않는다.** 저장 후 차단이 아니다 —
      // 저장하면 새로고침 시 토큰이 살아 있어 가드를 통과할 여지가 생긴다(spec 020 §3 규칙 4).
      if (outcome.kind !== 'allowed') {
        setSubmitError(outcome.message)
        return
      }

      // 🔴 토큰 저장이 UserSiteSelect 호출보다 **먼저**여야 한다 — `sign` 엔드포인트라
      // Authorization이 필요하고, 헤더는 요청 인터셉터가 getAccessToken()에서 붙인다.
      setAccessToken(accessToken)
      setRefreshToken(refreshToken)

      // 본사(1xx)는 사업장 선택이 없다. 본사 홈이 아직 placeholder라 siteSeq 소비처가
      // 0개이고, AdminSiteSelect 응답 형태도 미실측이다 → Phase 5(spec 021 §1).
      if (!isServiceLoginCode(code)) {
        navigate(outcome.landing, { replace: true })
        return
      }

      const siteOutcome = resolveSiteSelectOutcome(toSiteOptions(await fetchUserSiteSelect()))

      // 🔴 소속 사업장이 없으면 **토큰을 지우고** 로그인 단계에 남는다.
      // 남겨두면 "토큰 있음 + siteSeq 없음" 중간 상태가 되고, 새로고침 시 AuthGuard가
      // 통과시켜 siteSeq 없이 홈이 조회를 날린다 — 그 응답은 403이 아니라 200 + 빈 목록이라
      // 조용히 틀린 화면이 된다(api-spec.md:211).
      if (siteOutcome.kind === 'none') {
        clearTokens()
        setSubmitError(siteOutcome.message)
        return
      }

      if (siteOutcome.kind === 'auto') {
        enterSite(siteOutcome.site, outcome.landing)
        return
      }

      setSiteOptions(siteOutcome.options)
      setLanding(outcome.landing)
    } catch (error) {
      // 🔴 실패하면 **토큰을 남기지 않는다.** 이 catch는 두 호출을 함께 받는다 —
      // `login()` 실패(아직 저장 전이라 no-op)와 `fetchUserSiteSelect()` 실패다.
      // 후자에서는 토큰이 이미 저장돼 있어, 지우지 않으면 중간 상태가 그대로 남는다.
      // 네트워크·500뿐 아니라 **403**(현장 code인데 서버가 본사로 판정 — 두 SiteSelect는
      // 상호 배타, api-spec.md:286·287)도 여기로 온다. 추측으로 통과시키지 않는다(A1).
      clearTokens()

      // 019 인터셉터가 에러 3종·네트워크 실패를 ApiError 하나로 정규화해 둔다.
      // 여기서 형태를 다시 분기하지 않는다.
      setSubmitError(
        error instanceof Error ? error.message : '로그인에 실패했습니다. 다시 시도해주세요.'
      )
    }
  }

  return (
    <div className="flex min-h-svh items-center justify-center bg-background p-6">
      <div className="w-full max-w-sm space-y-6 rounded-md border border-border bg-card p-6 shadow-sm">
        {siteOptions !== null && landing !== null ? (
          <SiteSelectStep
            options={siteOptions}
            disabled={entering}
            onSelect={(site) => enterSite(site, landing)}
          />
        ) : (
          <>
            <div className="space-y-1 text-center">
              <h1 className="text-lg font-semibold">{title}</h1>
              {description && <p className="text-xs text-muted-foreground">{description}</p>}
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
              <AppInput
                label="사번"
                required
                autoComplete="username"
                placeholder="사번을 입력해주세요"
                error={errors.loginId?.message}
                {...register('loginId')}
              />
              <AppInput
                label="비밀번호"
                required
                variant="password"
                autoComplete="current-password"
                placeholder="비밀번호를 입력해주세요"
                error={errors.loginPw?.message}
                {...register('loginPw')}
              />

              {submitError && (
                <p role="alert" className="text-sm text-destructive">
                  {submitError}
                </p>
              )}

              {/* 제출 중 비활성 — 연타로 로그인 요청이 중복 나가는 것을 막는다 */}
              <AppButton size="full" type="submit" disabled={isSubmitting}>
                {isSubmitting ? '로그인 중…' : '로그인'}
              </AppButton>
            </form>
          </>
        )}
      </div>
    </div>
  )
}
