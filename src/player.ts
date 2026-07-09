import { HEIGHT, type Platform } from './map'

const TICK_RATE = 1000 / 25
const HORIZONTAL_SPEED = 2
const FALL_SPEED = 2
const MAX_FALL_HEIGHT = 32
const JUMP_ARC = [
  4, 4, 3, 3, 3, 2, 2, 2, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0,
  0, 0, 0, 0, 0, 0, -1, -1, -1, -1, -2, -2, -2, -3, -3, -3, -4, -4,
]

export class Player {
  x = 32
  y = HEIGHT - 24
  width = 16
  height = 16

  vx = 0
  vy = 0
  onGround = true
  jumpDirection = 0
  jumpLocked = false

  direction: 'LEFT' | 'RIGHT' = 'RIGHT'

  private tickAccumulator = 0
  private jumpIntent = false
  private jumpActive = false
  private jumpFrame = 0
  private fallStartY = 0
  private dead = false

  update(dt: number, input: { left: boolean; right: boolean; jumpPressed: boolean }, platforms: Platform[]) {
    if (input.jumpPressed) {
      this.jumpIntent = true
    }

    this.tickAccumulator += dt * 1000
    const steps = Math.floor(this.tickAccumulator / TICK_RATE)

    if (steps > 0) {
      for (let i = 0; i < steps; i += 1) {
        this.gameTick(input, platforms)
      }
      this.tickAccumulator -= steps * TICK_RATE
      return
    }

    if (dt >= 1 / 60 || this.jumpIntent || !this.onGround || this.vx !== 0 || this.vy !== 0) {
      this.gameTick(input, platforms)
      this.tickAccumulator = 0
    }
  }

  private gameTick(input: { left: boolean; right: boolean; jumpPressed: boolean }, platforms: Platform[]) {
    if (this.dead) {
      return
    }

    if (this.onGround && this.jumpIntent && !this.jumpLocked) {
      this.onGround = false
      this.jumpLocked = true
      this.jumpActive = true
      this.jumpFrame = 0
      this.jumpDirection = input.left ? -1 : input.right ? 1 : 0
      this.vx = this.jumpDirection * HORIZONTAL_SPEED
      this.vy = -JUMP_ARC[0]
      this.fallStartY = this.y
    } else if (this.jumpActive) {
      this.jumpFrame += 1
      if (this.jumpFrame < JUMP_ARC.length) {
        this.vy = -JUMP_ARC[this.jumpFrame]
      } else {
        this.jumpActive = false
        this.vy = FALL_SPEED
      }
    } else if (!this.onGround) {
      this.vy = FALL_SPEED
    } else {
      this.vx = 0
      if (input.left) {
        this.vx = -HORIZONTAL_SPEED
        this.direction = 'LEFT'
        this.jumpDirection = -1
      } else if (input.right) {
        this.vx = HORIZONTAL_SPEED
        this.direction = 'RIGHT'
        this.jumpDirection = 1
      } else {
        this.jumpDirection = 0
      }
    }

    this.jumpIntent = false

    const nextX = this.x + this.vx
    if (this.collidesWithSolid(nextX, this.y, platforms)) {
      const wouldOverlapPlatform = platforms.some((platform) => {
        if (!platform.solid) {
          return false
        }

        const playerRight = nextX + this.width
        const playerBottom = this.y + this.height
        const platformRight = platform.x + platform.width
        const platformBottom = platform.y + platform.height

        return (
          nextX < platformRight &&
          playerRight > platform.x &&
          this.y < platformBottom &&
          playerBottom > platform.y
        )
      })

      if (!wouldOverlapPlatform) {
        this.x = nextX
      } else {
        this.vx = 0
      }
    } else {
      this.x = nextX
    }

    const nextY = this.y + this.vy
    const landingPlatform = this.findLandingPlatform(this.x, nextY, platforms)

    if (landingPlatform) {
      if (this.vy < 0) {
        this.vy = FALL_SPEED
        this.jumpActive = false
        this.jumpFrame = 0
      } else {
        this.y = landingPlatform.y - this.height
        this.onGround = true
        this.jumpLocked = false
        this.jumpActive = false
        this.jumpFrame = 0
        this.vy = 0
        if (this.y - this.fallStartY > MAX_FALL_HEIGHT && !this.onGround) {
          this.triggerDeath()
        }
      }
    } else {
      this.y = nextY
      this.onGround = this.isStandingOnSurface(this.x, this.y, platforms)
    }

    if (this.y + this.height >= HEIGHT) {
      this.y = HEIGHT - this.height
      this.onGround = true
      this.jumpLocked = false
      this.jumpActive = false
      this.jumpFrame = 0
      this.vy = 0
    }
  }

  private collidesWithSolid(x: number, y: number, platforms: Platform[]): boolean {
    const right = x + this.width
    const bottom = y + this.height

    return platforms.some((platform) => {
      if (!platform.solid) {
        return false
      }

      return (
        x < platform.x + platform.width &&
        right > platform.x &&
        y < platform.y + platform.height &&
        bottom > platform.y
      )
    })
  }

  private findLandingPlatform(x: number, y: number, platforms: Platform[]): Platform | undefined {
    const bottom = y + this.height

    return platforms.find((platform) => {
      if (!platform.solid) {
        return false
      }

      return (
        x < platform.x + platform.width &&
        x + this.width > platform.x &&
        bottom >= platform.y &&
        bottom <= platform.y + 2
      )
    })
  }

  private isStandingOnSurface(x: number, y: number, platforms: Platform[]): boolean {
    const feetY = y + this.height
    const floorContact = feetY >= HEIGHT

    if (floorContact) {
      return true
    }

    return platforms.some((platform) => {
      if (!platform.solid) {
        return false
      }

      return (
        x < platform.x + platform.width &&
        x + this.width > platform.x &&
        feetY >= platform.y &&
        feetY <= platform.y + 1
      )
    })
  }

  private triggerDeath() {
    this.dead = true
    this.x = 32
    this.y = 64
    this.vx = 0
    this.vy = 0
    this.onGround = true
    this.jumpDirection = 0
    this.jumpLocked = false
    this.jumpActive = false
    this.jumpFrame = 0
    this.direction = 'RIGHT'
  }

  render(ctx: CanvasRenderingContext2D, color: string) {
    ctx.fillStyle = color
    ctx.fillRect(Math.round(this.x), Math.round(this.y), this.width, this.height)
  }
}