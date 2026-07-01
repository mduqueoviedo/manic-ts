import { describe, it, expect } from 'vitest'
import { Player } from './player'

describe('Player', () => {
  it('jumps when on ground and jump input true', () => {
    const p = new Player()
    p.onGround = true
    p.vy = 0
    p.update(1/60, { left: false, right: false, jump: true })
    expect(p.vy).toBeLessThan(0)
    expect(p.onGround).toBe(false)
  })

  it('accelerates downward due to gravity when in air', () => {
    const p = new Player()
    p.onGround = false
    p.vy = 0
    p.update(1/60, { left: false, right: false, jump: false })
    expect(p.vy).toBeGreaterThan(0)
  })
})
