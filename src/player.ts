import { HEIGHT, WIDTH } from './map'

export class Player {
  x = 32
  y = 112
  vx = 0
  vy = 0
  width = 8
  height = 16
  onGround = true
  jumpDirection = 0

  update(dt: number, input: { left: boolean; right: boolean; jumpPressed: boolean }) {
    const speed = 60
    const gravity = 400
    const jumpSpeedY = -150
    const jumpSpeedX = 60

    if (input.left) {
      this.vx = -speed
      this.jumpDirection = -1
    } else if (input.right) {
      this.vx = speed
      this.jumpDirection = 1
    } else {
      this.vx = 0
      this.jumpDirection = 0
    }

    if (input.jumpPressed && this.onGround) {
      this.vy = jumpSpeedY
      this.vx = this.jumpDirection * jumpSpeedX
      this.onGround = false
    }

    this.vy += gravity * dt
    this.x += this.vx * dt
    this.y += this.vy * dt

    this.clampToBounds()

    // Simple ground collision
    const groundY = HEIGHT - this.height
    if (this.y >= groundY) {
      this.y = groundY
      this.vy = 0
      this.onGround = true
    }
  }

  clampToBounds() {
    if (this.x < 0) {
      this.x = 0
    } else if (this.x + this.width > WIDTH) {
      this.x = WIDTH - this.width
    }

    if (this.y < 0) {
      this.y = 0
    } else if (this.y + this.height > HEIGHT) {
      this.y = HEIGHT - this.height
    }
  }

  render(ctx: CanvasRenderingContext2D) {
    ctx.fillStyle = '#fff'
    ctx.fillRect(Math.round(this.x), Math.round(this.y), this.width, this.height)
  }
}
