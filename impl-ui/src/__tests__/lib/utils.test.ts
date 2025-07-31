import { cn, formatPrice, formatDateTime, formatTime, formatDuration } from '@/lib/utils'

describe('utils', () => {
  describe('cn', () => {
    it('should combine class names', () => {
      expect(cn('class1', 'class2')).toBe('class1 class2')
      expect(cn('class1', undefined, 'class2')).toBe('class1 class2')
      expect(cn('class1', false && 'hidden', 'class2')).toBe('class1 class2')
    })
  })

  describe('formatPrice', () => {
    it('should format prices correctly', () => {
      expect(formatPrice(50)).toBe('€50.00')
      expect(formatPrice(49.99, 'GBP')).toBe('£49.99')
      expect(formatPrice(100, 'USD')).toBe('$100.00')
    })
  })

  describe('formatDateTime', () => {
    it('should format date and time correctly', () => {
      const date = '2024-02-01T10:00:00Z'
      const formatted = formatDateTime(date)
      expect(formatted).toContain('Feb')
      expect(formatted).toContain('2024')
    })
  })

  describe('formatTime', () => {
    it('should format time correctly', () => {
      const date = '2024-02-01T10:30:00Z'
      const formatted = formatTime(date)
      expect(formatted).toMatch(/\d{1,2}:\d{2}/)
    })
  })

  describe('formatDuration', () => {
    it('should calculate and format duration correctly', () => {
      expect(formatDuration(
        '2024-02-01T10:00:00Z',
        '2024-02-01T16:30:00Z'
      )).toBe('6h 30m')

      expect(formatDuration(
        '2024-02-01T10:00:00Z',
        '2024-02-01T10:45:00Z'
      )).toBe('45m')

      expect(formatDuration(
        '2024-02-01T10:00:00Z',
        '2024-02-01T12:00:00Z'
      )).toBe('2h 0m')
    })
  })
})