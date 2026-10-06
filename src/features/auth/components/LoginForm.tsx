import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import AppButton from '@/components/app/AppButton'
import AppInput from '@/components/app/AppInput'
import { login } from '@/features/auth/api/login'
import { resolveLoginOutcome } from '@/features/auth/lib/loginResult'
import { loginSchema, type LoginFormData } from '@/features/auth/form/schema'
import { setAccessToken, setRefreshToken } from '@/lib/auth/tokens'

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

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { loginId: '', loginPw: '' },
  })

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

      setAccessToken(accessToken)
      setRefreshToken(refreshToken)
      navigate(outcome.landing, { replace: true })
    } catch (error) {
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
      </div>
    </div>
  )
}
