export interface ApiResponse<T = any> {
  data?: T
  error?: string
  links?: {
    self?: string
    next?: string
    prev?: string
    [key: string]: string | undefined
  }
}

export interface PaginationParams {
  page?: number
  limit?: number
}

export interface StationQuery extends PaginationParams {
  coordinates?: string
  search?: string
  country?: string
}

export interface TripQuery extends PaginationParams {
  origin: string
  destination: string
  date: string
  bicycles?: boolean
  dogs?: boolean
}

export interface BookingPayment {
  amount: number
  currency: string
  source: CardSource | BankAccountSource
}

export interface CardSource {
  object: 'card'
  name: string
  number: string
  cvc: string
  exp_month: number
  exp_year: number
  address_line1?: string
  address_line2?: string
  address_city?: string
  address_country: string
  address_post_code?: string
}

export interface BankAccountSource {
  object: 'bank_account'
  name: string
  number: string
  sort_code: string
  account_type: 'individual' | 'company'
  bank_name: string
  country: string
}