import type { AxiosInstance, AxiosResponse } from 'axios'
import axios, { AxiosError } from 'axios'
import type { ApiResponse } from '@/types/api'

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? ''

const api: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 5000,
})

// 요청 인터셉터 — 002에서 accessToken 주입 재도입 예정.

api.interceptors.response.use(
  (response: AxiosResponse) => {
    // T005: blob 우회 — 파일 다운로드 응답은 unwrap 하지 않는다.
    if (response.config.responseType === 'blob') {
      return response
    }

    // T006: ApiResponse 형식 검증 + 자동 unwrap
    const body = response.data as ApiResponse<unknown> | undefined
    const isApiResponse =
      body !== null &&
      typeof body === 'object' &&
      typeof (body as ApiResponse<unknown>).code === 'number' &&
      typeof (body as ApiResponse<unknown>).message === 'string' &&
      'data' in (body as ApiResponse<unknown>)

    if (!isApiResponse) {
      console.warn(response)
      throw new Error('알 수 없는 응답 형식')
    }

    if (body!.code !== 200) {
      throw new Error(body!.message)
    }

    response.data = body!.data
    return response
  },
  // T007: 네트워크 실패 정규화
  (error: AxiosError) => {
    if (!error.response) {
      return Promise.reject(new Error('네트워크 연결을 확인해주세요'))
    }
    return Promise.reject(error)
  }
)

export default api
