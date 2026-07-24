export interface PointType {
  id: string
  title: string
  description: string
  authenticationMethod: PointAuthenticationMethod
  nfcTagId?: string // authenticationMethod === 'NFC' 일 때, 14자리 HEX (데모값)
  createdAt?: Date
}

export type PointAuthenticationMethod = 'QR' | 'NFC'
