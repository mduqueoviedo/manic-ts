import { describe, it, expect } from 'vitest'
import { HEIGHT } from './map'
import { Player } from './player'

describe('Player', () => {
  const emptyPlatforms: Array<{ x: number; y: number; width: number; height: number; solid: boolean }> = []

  it('starts grounded and jumps straight up from standstill', () => {
    const p = new Player()

    p.update(1 / 60, { left: false, right: false, jumpPressed: true }, emptyPlatforms)

    expect(p.onGround).toBe(false)
    expect(p.vx).toBe(0)
    expect(p.jumpDirection).toBe(0)
    expect(p.vy).toBeLessThan(0)
  })

  it('keeps the horizontal direction locked while airborne', () => {
    const p = new Player()
    p.onGround = true

    p.update(1 / 60, { left: false, right: true, jumpPressed: true }, emptyPlatforms)
    expect(p.vx).toBe(2)
    expect(p.jumpDirection).toBe(1)

    p.update(1 / 60, { left: true, right: false, jumpPressed: false }, emptyPlatforms)

    expect(p.vx).toBe(2)
    expect(p.jumpDirection).toBe(1)
  })

  it('uses the rigid jump arc and then falls downward', () => {
    const p = new Player()
    p.onGround = true

    p.update(1 / 60, { left: false, right: false, jumpPressed: true }, emptyPlatforms)
    expect(p.vy).toBeLessThan(0)

    for (let i = 0; i < 30; i += 1) {
      p.update(1 / 60, { left: false, right: false, jumpPressed: false }, emptyPlatforms)
    }

    expect(p.vy).toBeGreaterThanOrEqual(0)
  })

  it('lands on a platform and resets jump lock', () => {
    const p = new Player()
    p.x = 16
    p.y = 30
    p.onGround = false
    p.vy = 100
    const platforms = [{ x: 16, y: 48, width: 64, height: 8, solid: true }]

    p.update(0.5, { left: false, right: false, jumpPressed: false }, platforms)

    expect(p.onGround).toBe(true)
    expect(p.jumpLocked).toBe(false)
  })

  it('allows horizontal movement while standing on a platform', () => {
    const p = new Player()
    p.x = 16
    p.y = 32
    p.onGround = true
    p.vy = 0
    const platforms = [{ x: 0, y: 48, width: 64, height: 8, solid: true }]

    p.update(1 / 25, { left: false, right: true, jumpPressed: false }, platforms)

    expect(p.x).toBe(18)
  })

  it('uses the floor as a grounded boundary', () => {
    const p = new Player()
    p.onGround = false
    p.y = HEIGHT - p.height
    p.vy = 0

    p.update(1 / 60, { left: false, right: false, jumpPressed: false }, emptyPlatforms)

    expect(p.onGround).toBe(true)
    expect(p.vy).toBe(0)
  })
})
