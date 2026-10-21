import api from '@/lib/axios'
import type { UpdateDeploymentEndDateRequest } from '../types/deployment'

/**
 * 복귀일 지정 (`spec 039` T656) — 요청서 8번.
 *
 * 근무자가 종료일을 입력하지 않았거나 조기 복귀할 때 **목적지 관리자**가 정한다(전입 이력에서).
 * 🔴 **가정 경로·메서드**다(API 미개발 — 미실측 가정). 성공은 `data: true` 로 보고 반환값을 쓰지 않는다.
 */

const UPDATE_DEPLOYMENT_END_DATE_PATH = '/api/v1/Deployment/W/sign/UpdateDeploymentEndDate'

export const updateDeploymentEndDate = async (body: UpdateDeploymentEndDateRequest): Promise<void> => {
  await api.post(UPDATE_DEPLOYMENT_END_DATE_PATH, body)
}
