import { describe, it, expect } from 'vitest'
import { HEIGHT, WIDTH, testLevel } from './map'
import { Player } from './player'

describe('Player', () => {
  const emptyPlatforms = []

  it('starts on the ground and can jump immediately', () => {
    const p = new Player()
    expect(p.onGround).toBe(true)
    p.update(1 / 60, { left: false, right: false, jumpPressed: true }, emptyPlatforms)
    expect(p.vy).toBeLessThan(0)
  })

  it('jumps when on ground and jump input true', () => {
    const p = new Player()
    p.onGround = true
    p.vy = 0
    p.update(1 / 60, { left: false, right: false, jumpPressed: true }, emptyPlatforms)
    expect(p.vy).toBeLessThan(0)
    expect(p.onGround).toBe(false)
  })

  it('stores a horizontal jump direction when moving left and jumping', () => {
    const p = new Player()
    p.onGround = true
    p.update(1 / 60, { left: true, right: false, jumpPressed: true }, emptyPlatforms)
    expect(p.jumpDirection).toBe(-1)
    expect(p.vx).toBeLessThan(0)
  })

  it('accelerates downward due to gravity when in air', () => {
    const p = new Player()
    p.onGround = false
    p.y = 64
    p.vy = 0
    p.update(1 / 60, { left: false, right: false, jumpPressed: false }, emptyPlatforms)
    expect(p.vy).toBeGreaterThan(0)
  })

  it('allows another jump after landing on the ground', () => {
    const p = new Player()
    p.onGround = false
    p.y = HEIGHT - p.height
    p.vy = 0
    p.update(1 / 60, { left: false, right: false, jumpPressed: false }, emptyPlatforms)
    expect(p.onGround).toBe(true)

    p.update(1 / 60, { left: false, right: false, jumpPressed: true }, emptyPlatforms)
    expect(p.vy).toBeLessThan(0)
    expect(p.onGround).toBe(false)
  })

  it('keeps the jump trajectory fixed after takeoff', () => {
    const p = new Player()
    p.onGround = true
    p.update(1 / 60, { left: true, right: false, jumpPressed: true }, emptyPlatforms)
    expect(p.vx).toBeLessThan(0)

    p.update(1 / 60, { left: false, right: true, jumpPressed: false }, emptyPlatforms)
    expect(p.vx).toBeLessThan(0)
    expect(p.vy).toBeLessThan(0)
  })

  it('marks the player as grounded when landing exactly on the floor', () => {
    const p = new Player()
    p.onGround = false
    p.y = HEIGHT - p.height
    p.vy = 0
    p.update(1 / 60, { left: false, right: false, jumpPressed: false }, emptyPlatforms)
    expect(p.onGround).toBe(true)
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
})
