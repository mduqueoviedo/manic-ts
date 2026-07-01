import { HEIGHT, WIDTH, Platform } from './map'

export class Player {
  x = 32
  y = 64
  vx = 0
  vy = 0
  width = 8
  height = 16
  onGround = true
  jumpDirection = 0
  jumpLocked = false

  update(
    dt: number,
    input: { left: boolean; right: boolean; jumpPressed: boolean },
    platforms: Platform[]
  ) {
    const speed = 60
    const gravity = 400
    const jumpSpeedY = -150
    const jumpSpeedX = 60

    if (!this.jumpLocked) {
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
    }

    if (input.jumpPressed && this.onGround && !this.jumpLocked) {
      this.vy = jumpSpeedY
      this.vx = this.jumpDirection * jumpSpeedX
      this.onGround = false
      this.jumpLocked = true
    }

    if (!this.onGround) {
      this.vy += gravity * dt
    }

    // Horizontal movement
    this.x += this.vx * dt
    this.clampToBoundsX()

    // Vertical movement
    this.y += this.vy * dt
    this.clampToBoundsY(platforms)
  }

  private checkCollision(x: number, y: number, platform: Platform): boolean {
    const right = x + this.width
    const bottom = y + this.height

    return (
      x < platform.x + platform.width &&
      right > platform.x &&
      y < platform.y + platform.height &&
      bottom > platform.y
    )
  }

  private clampToBoundsX() {
    if (this.x < 0) this.x = 0
    if (this.x + this.width > WIDTH) this.x = WIDTH - this.width
  }

  private clampToBoundsY(platforms: Platform[]) {
    // Check if player is below the map
    const groundY = HEIGHT - this.height
    if (this.y >= groundY) {
      this.y = groundY
      this.vy = 0
      this.onGround = true
      this.jumpLocked = false
      return
    }

    // Check collisions with platforms
    this.onGround = false
    let collided = false

    for (const platform of platforms) {
      if (!platform.solid || !this.checkCollision(this.x, this.y, platform)) continue

      const overlapTop = this.y + this.height - platform.y
      const overlapBottom = platform.y + platform.height - this.y
      const overlapLeft = this.x + this.width - platform.x
      const overlapRight = platform.x + platform.width - this.x

      const minOverlap = Math.min(overlapTop, overlapBottom, overlapLeft, overlapRight)

      // Landing on top (coming from above)
      if (minOverlap === overlapTop && this.vy > 0) {
        this.y = platform.y - this.height
        this.vy = 0
        this.onGround = true
        this.jumpLocked = false
        collided = true
        break
      }

      // Hit head (coming from below)
      if (minOverlap === overlapBottom && this.vy < 0) {
        this.y = platform.y + platform.height
        this.vy = 0
        collided = true
        break
      }

      // Colliding with side (shouldn't reach here in simple implementation)
      if (minOverlap === overlapLeft || minOverlap === overlapRight) {
        if (minOverlap === overlapLeft) this.x = platform.x - this.width
        else this.x = platform.x + platform.width
        collided = true
        break
      }
    }
  }

  render(ctx: CanvasRenderingContext2D, color: string) {
    ctx.fillStyle = color
    ctx.fillRect(Math.round(this.x), Math.round(this.y), this.width, this.height)
  }
}
