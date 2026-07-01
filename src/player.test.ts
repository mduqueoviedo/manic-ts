import { describe, it, expect } from 'vitest'
import { WIDTH } from './map'
import { Player } from './player'

describe('Player', () => {
  it('jumps when on ground and jump input true', () => {
    const p = new Player()
    p.onGround = true
    p.vy = 0
    p.update(1 / 60, { left: false, right: false, jump: true })
    expect(p.vy).toBeLessThan(0)
    expect(p.onGround).toBe(false)
  })

  it('stores a horizontal jump direction when moving left and jumping', () => {
    const p = new Player()
    p.onGround = true
    p.update(1 / 60, { left: true, right: false, jump: true })
    expect(p.jumpDirection).toBe(-1)
    expect(p.vx).toBeLessThan(0)
  })

  it('accelerates downward due to gravity when in air', () => {
    const p = new Player()
    p.onGround = false
    p.vy = 0
    p.update(1 / 60, { left: false, right: false, jump: false })
    expect(p.vy).toBeGreaterThan(0)
  })

  it('clamps the player inside the level bounds', () => {
    const p = new Player()
    p.x = -10
    p.clampToBounds()
    expect(p.x).toBe(0)

    p.x = WIDTH + 10
    p.clampToBounds()
    expect(p.x).toBe(WIDTH - p.width)
  })
})
