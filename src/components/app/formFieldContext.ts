import { createContext, useContext } from 'react'

/**
 * `AppFormField` → 안쪽 컨트롤(`AppInput` · `AppSelect`) 연결 (`spec 999` US3 — OQ-F).
 *
 * 라벨 `htmlFor` · 도움말 `aria-describedby` 를 잇는 값이다. 자식이 `Controller` 등으로 감싸져 있어도 닿도록
 * cloneElement 대신 컨텍스트로 내린다(사업장 폼 — `Controller` → `AppSelect`).
 * 컴포넌트 파일과 분리했다 — `react-refresh/only-export-components`.
 */
export interface FormFieldIds {
  id: string
  /** 도움말 · 에러 문구의 id(있을 때만) */
  describedBy?: string
  invalid: boolean
}

export const FormFieldContext = createContext<FormFieldIds | null>(null)

export const useFormFieldIds = () => useContext(FormFieldContext)
