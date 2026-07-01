import './styles.css'
import { testLevel, WIDTH, HEIGHT } from './map'
import { Player } from './player'
import { SpectrumPalette } from './palette'

const SCALE = 4

class Game {
  canvas: HTMLCanvasElement
  ctx: CanvasRenderingContext2D
  player: Player
  keys = { left: false, right: false, jumpPressed: false, jumpHeld: false }

  lastTime = 0
  accumulator = 0
  readonly step = 1000 / 60

  constructor(){
    const c = document.getElementById('game-canvas') as HTMLCanvasElement
    if (!c) throw new Error('Canvas not found')
    this.canvas = c
    this.canvas.width = WIDTH
    this.canvas.height = HEIGHT
    const ctx = this.canvas.getContext('2d')
    if (!ctx) throw new Error('2D Context not available')
    this.ctx = ctx
    this.ctx.imageSmoothingEnabled = false

    this.player = new Player()

    this.setupInput()
  }

  setupInput(){
    window.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowLeft') this.keys.left = true
      if (e.key === 'ArrowRight') this.keys.right = true
      if (e.key === ' ' || e.key === 'ArrowUp') {
        e.preventDefault()
        if (!e.repeat) {
          this.keys.jumpPressed = true
        }
        this.keys.jumpHeld = true
      }
    })
    window.addEventListener('keyup', (e) => {
      if (e.key === 'ArrowLeft') this.keys.left = false
      if (e.key === 'ArrowRight') this.keys.right = false
      if (e.key === ' ' || e.key === 'ArrowUp') {
        this.keys.jumpHeld = false
        this.keys.jumpPressed = false
      }
    })
  }

  start(){
    requestAnimationFrame(this.loop.bind(this))
  }

  loop(time: number){
    if (!this.lastTime) this.lastTime = time
    const delta = time - this.lastTime
    this.lastTime = time
    this.accumulator += delta

    while(this.accumulator >= this.step){
      this.update(this.step / 1000)
      this.accumulator -= this.step
    }

    this.render()
    requestAnimationFrame(this.loop.bind(this))
  }

  update(dt: number){
    this.player.update(dt, this.keys, testLevel.platforms)
    this.keys.jumpPressed = false
  }

  render(){
    // Spectrum-inspired background (deep blue)
    this.ctx.fillStyle = SpectrumPalette.blue
    this.ctx.fillRect(0, 0, WIDTH, HEIGHT)

    // Render platforms
    for (const platform of testLevel.platforms) {
      this.ctx.fillStyle = SpectrumPalette.cyan
      this.ctx.fillRect(platform.x, platform.y, platform.width, platform.height)
    }

    // Render player (red)
    this.player.render(this.ctx, SpectrumPalette.red)
  }
}

const game = new Game()
game.start()
