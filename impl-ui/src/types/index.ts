export interface Station {
  id: string
  name: string
  address: string
  countryCode: string
  timezone?: string
}

export interface Trip {
  id: string
  origin: string
  destination: string
  departure_time: string
  arrival_time: string
  operator: string
  price: number
  bicycles_allowed: boolean
  dogs_allowed: boolean
  links?: {
    self: string
    origin: string
    destination: string
  }
}

export interface Booking {
  id: string
  trip_id: string
  passenger_name: string
  has_bicycle: boolean
  has_dog: boolean
  status: 'pending' | 'confirmed' | 'cancelled'
  expires_at?: string
  created_at: string
  links?: {
    self: string
  }
}

export interface Payment {
  id: string
  amount: number
  currency: string
  source: CardSource | BankAccountSource
  status: 'pending' | 'succeeded' | 'failed'
  links?: {
    booking: string
  }
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

export interface ApiResponse<T> {
  data?: T
  links?: {
    self?: string
    next?: string
    prev?: string
    [key: string]: string | undefined
  }
}

export interface ProblemDetails {
  type?: string
  title: string
  status: number
  detail?: string
  instance?: string
}