export interface PointType {
  id: string
  title: string
  description: string
  authenticationMethod: PointAuthenticationMethod
  createdAt?: Date
}

export type PointAuthenticationMethod = 'QR' | 'NFC'
