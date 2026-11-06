// Runtime validation coverage for: realtime order event filtering
import { describe, expect, it } from 'vitest'
import { isOrderEventForUser, isVersionNewer } from './realtime-client'

describe('realtime order events', () => {
  const event = {
    eventId: 'order:order-1:2',
    resource: 'order' as const,
    orderId: 'order-1',
    userId: 'user:ana',
    version: 2,
    order: { id: 'order-1', userId: 'user:ana', version: 2 } as never,
  }

  it('accepts an order event for the current user and order', () => {
    expect(isOrderEventForUser(event, { id: 'user:ana' }, 'order-1')).toBe(true)
  })

  it('rejects events belonging to another user', () => {
    expect(isOrderEventForUser(event, { id: 'user:bruno' }, 'order-1')).toBe(false)
  })

  it('rejects stale versions', () => {
    expect(isVersionNewer(2, 2)).toBe(false)
    expect(isVersionNewer(2, 1)).toBe(true)
    expect(isVersionNewer(1, 2)).toBe(false)
  })
})
