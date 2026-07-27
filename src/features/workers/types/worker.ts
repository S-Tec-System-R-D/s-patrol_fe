import type { FieldRole, UserStatus, WorkStatus } from '@/types/enum'

export interface WorkerAssignmentHistoryItem {
  id: string
  type: 'INITIAL' | 'TRANSFER' | 'RETURN'
  fromLocationName?: string
  toLocationName: string
  startedAt: string
  endedAt?: string
}

export interface WorkerSummary {
  id: string
  name: string
  phone: string
  role: FieldRole
  locationName: string
  isAssignedElsewhere: boolean
  currentAssignedLocation?: { id: string; name: string }
  workStatus: WorkStatus
  status: UserStatus
  registeredAt: string
}

export interface Worker extends WorkerSummary {
  assignmentHistory: WorkerAssignmentHistoryItem[]
}
