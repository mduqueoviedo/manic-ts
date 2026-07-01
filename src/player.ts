import { TILE_SIZE } from './map'

export class Player {
  x = 32
  y = 64
  vx = 0
  vy = 0
  width = 8
  height = 16
  onGround = false

  update(dt: number, input: { left: boolean; right: boolean; jump: boolean }){
    const speed = 60
    const gravity = 400
    const jumpSpeed = -150

    if (input.left) this.vx = -speed
    else if (input.right) this.vx = speed
    else this.vx = 0

    if (input.jump && this.onGround) {
      this.vy = jumpSpeed
      this.onGround = false
    }

    this.vy += gravity * dt
    this.x += this.vx * dt
    this.y += this.vy * dt

    // simple ground collision
    const groundY = 128 - this.height
    if (this.y > groundY) { this.y = groundY; this.vy = 0; this.onGround = true }
  }

  render(ctx: CanvasRenderingContext2D){
    ctx.fillStyle = '#fff'
    ctx.fillRect(Math.round(this.x), Math.round(this.y), this.width, this.height)
  }
}
