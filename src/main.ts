import './styles.css'
import { testMap, TILE_SIZE, WIDTH, HEIGHT } from './map'
import { Player } from './player'

const SCALE = 4

class Game {
  canvas: HTMLCanvasElement
  ctx: CanvasRenderingContext2D
  player: Player
  keys = { left: false, right: false, jump: false }

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
      if (e.key === ' ' || e.key === 'ArrowUp') this.keys.jump = true
    })
    window.addEventListener('keyup', (e) => {
      if (e.key === 'ArrowLeft') this.keys.left = false
      if (e.key === 'ArrowRight') this.keys.right = false
      if (e.key === ' ' || e.key === 'ArrowUp') this.keys.jump = false
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
    this.player.update(dt, this.keys)
  }

  render(){
    this.ctx.clearRect(0,0,WIDTH,HEIGHT)
    // Render the simple background
    this.ctx.fillStyle = '#012'
    this.ctx.fillRect(0,0,WIDTH,HEIGHT)

    // Render the test map (floor)
    this.ctx.fillStyle = '#444'
    for(let y=0;y<testMap.length;y++){
      for(let x=0;x<testMap[y].length;x++){
        if (testMap[y][x] === 1) this.ctx.fillRect(x*TILE_SIZE, y*TILE_SIZE, TILE_SIZE, TILE_SIZE)
      }
    }

    this.player.render(this.ctx)
  }
}

const game = new Game()
game.start()
