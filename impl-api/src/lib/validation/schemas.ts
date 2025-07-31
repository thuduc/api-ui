import { z } from 'zod'

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(10).optional(),
})

export const stationQuerySchema = paginationSchema.extend({
  coordinates: z.string().regex(/^-?\d+\.?\d*,-?\d+\.?\d*$/).optional(),
  search: z.string().optional(),
  country: z.string().length(2).optional(),
})

export const tripQuerySchema = paginationSchema.extend({
  origin: z.string().uuid(),
  destination: z.string().uuid(),
  date: z.string().datetime(),
  bicycles: z.coerce.boolean().optional(),
  dogs: z.coerce.boolean().optional(),
})

export const createBookingSchema = z.object({
  trip_id: z.string().uuid(),
  passenger_name: z.string().min(1),
  has_bicycle: z.boolean().default(false),
  has_dog: z.boolean().default(false),
})

export const cardSourceSchema = z.object({
  object: z.literal('card'),
  name: z.string().min(1),
  number: z.string().regex(/^\d{13,19}$/),
  cvc: z.string().regex(/^\d{3,4}$/),
  exp_month: z.number().int().min(1).max(12),
  exp_year: z.number().int().min(new Date().getFullYear()),
  address_line1: z.string().optional(),
  address_line2: z.string().optional(),
  address_city: z.string().optional(),
  address_country: z.string().length(2),
  address_post_code: z.string().optional(),
})

export const bankAccountSourceSchema = z.object({
  object: z.literal('bank_account'),
  name: z.string().min(1),
  number: z.string(),
  sort_code: z.string().regex(/^\d{6}$/),
  account_type: z.enum(['individual', 'company']),
  bank_name: z.string().min(1),
  country: z.string().length(2),
})

export const createPaymentSchema = z.object({
  amount: z.number().positive(),
  currency: z.enum(['bam', 'bgn', 'chf', 'eur', 'gbp', 'nok', 'sek', 'try']),
  source: z.discriminatedUnion('object', [cardSourceSchema, bankAccountSourceSchema]),
})