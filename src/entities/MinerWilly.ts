import { InputHandler } from '../core/InputHandler';
import { TileMap } from '../world/TileMap';

export class MinerWilly {
    public x: number;
    public y: number;

    // Original animation frames live in a 16x16 cell, although Willy's visible
    // body does not fill the whole width of that cell.
    public static readonly SPRITE_WIDTH = 16;
    public static readonly SPRITE_HEIGHT = 16;

    // Fixed approximation for the collision body while the real sprite masks
    // and animation frames are not implemented yet.
    public static readonly COLLISION_WIDTH = 10;
    public static readonly COLLISION_HEIGHT = 16;
    private static readonly COLLISION_OFFSET_X =
        (MinerWilly.SPRITE_WIDTH - MinerWilly.COLLISION_WIDTH) / 2;

    public get collisionX(): number {
        return this.x + MinerWilly.COLLISION_OFFSET_X;
    }

    public get collisionY(): number {
        return this.y;
    }

    // Jump tracking variables
    private isJumping: boolean = false;
    private isFalling: boolean = false;
    private jumpFrame: number = 0;
    private jumpDirection: 'NONE' | 'LEFT' | 'RIGHT' = 'NONE';

    // Constant lookup array for vertical movement per frame during a jump.
    // It preserves a 36-frame, 30-pixel arc without pausing at the apex.
    private static readonly JUMP_OFFSET_TABLE: number[] = [
        -3, -3, -3,
        -2, -2, -2, -2, -2, -2,
        -1, -1, -1, -1, -1, -1, -1, -1, -1,
        1, 1, 1, 1, 1, 1, 1, 1, 1,
        2, 2, 2, 2, 2, 2,
        3, 3, 3,
    ];
    private static readonly JUMP_DESCENT_START_FRAME =
        MinerWilly.JUMP_OFFSET_TABLE.findIndex((offset) => offset > 0);

    // Fixed downward speed used after walking off a platform.
    private static readonly FALL_SPEED = 4;

    constructor(startX: number, startY: number) {
        this.x = startX;
        this.y = startY;
    }

    /**
     * Updates Willy's position and state based on player input and mechanics.
     */
    public update(input: InputHandler, tileMap: TileMap): void {
        if (this.isFalling) {
            this.handleFreeFall(tileMap);
            return;
        }

        if (this.isJumping) {
            this.handleAirMovement(tileMap);
        } else {
            this.handleGroundMovement(input);
        }

        if (!this.isJumping && !this.hasSolidSupport(tileMap)) {
            this.isFalling = true;
        }
    }

    /**
     * Standard horizontal walking movement when touching solid ground.
     */
    private handleGroundMovement(input: InputHandler): void {
        if (input.isLeftPressed) {
            this.x -= 2;
        } else if (input.isRightPressed) {
            this.x += 2;
        }

        // Initiate jump sequences
        if (input.isJumpPressed) {
            this.isJumping = true;
            this.jumpFrame = 0;

            // Lock horizontal trajectory instantly at the frame of launch
            if (input.isLeftPressed) {
                this.jumpDirection = 'LEFT';
            } else if (input.isRightPressed) {
                this.jumpDirection = 'RIGHT';
            } else {
                this.jumpDirection = 'NONE';
            }
        }
    }

    /**
     * Strict frame-by-frame arc processing for mid-air movement.
     */
    private handleAirMovement(tileMap: TileMap): void {
        // 1. Apply rigid horizontal direction locked at launch phase
        if (this.jumpDirection === 'LEFT') {
            this.x -= 2;
        } else if (this.jumpDirection === 'RIGHT') {
            this.x += 2;
        }

        // 2. Apply precise vertical adjustment from lookup matrix
        const verticalOffset = MinerWilly.JUMP_OFFSET_TABLE[this.jumpFrame];

        if (verticalOffset < 0 && this.resolveCeilingCollision(tileMap, this.y + verticalOffset)) {
            this.jumpFrame = MinerWilly.JUMP_DESCENT_START_FRAME;
            return;
        }

        if (verticalOffset > 0 && this.tryLandOnSolid(tileMap, this.y + verticalOffset)) {
            return;
        }

        this.y += verticalOffset;

        // 3. Advance clock or terminate jump execution loop
        this.jumpFrame++;
        if (this.jumpFrame >= MinerWilly.JUMP_OFFSET_TABLE.length) {
            this.isJumping = false;
            this.jumpDirection = 'NONE';
        }
    }

    /**
     * Checks the map directly below both sides of Willy's collision body.
     */
    private hasSolidSupport(tileMap: TileMap): boolean {
        const feetY = this.collisionY + MinerWilly.COLLISION_HEIGHT;
        return this.hasSolidAtHeight(tileMap, feetY);
    }

    /**
     * Stops upward movement when Willy's head enters a fully solid tile.
     */
    private resolveCeilingCollision(tileMap: TileMap, nextY: number): boolean {
        if (!this.hasSolidAtHeight(tileMap, nextY)) {
            return false;
        }

        const tileBottom = Math.floor(nextY / TileMap.TILE_SIZE) * TileMap.TILE_SIZE
            + TileMap.TILE_SIZE;
        this.y = tileBottom;
        return true;
    }

    /**
     * Lands Willy when his feet cross the top of a fully solid tile.
     */
    private tryLandOnSolid(tileMap: TileMap, nextY: number): boolean {
        const previousFeetY = this.collisionY + MinerWilly.COLLISION_HEIGHT;
        const nextFeetY = nextY + MinerWilly.COLLISION_HEIGHT;
        const tileTop = Math.floor(nextFeetY / TileMap.TILE_SIZE) * TileMap.TILE_SIZE;

        if (previousFeetY > tileTop || !this.hasSolidAtHeight(tileMap, nextFeetY)) {
            return false;
        }

        this.y = tileTop - MinerWilly.COLLISION_HEIGHT;
        this.isJumping = false;
        this.isFalling = false;
        this.jumpFrame = 0;
        this.jumpDirection = 'NONE';
        return true;
    }

    /**
     * Checks both horizontal edges of Willy's collision body at a given height.
     */
    private hasSolidAtHeight(tileMap: TileMap, y: number): boolean {
        const leftTile = tileMap.getTileAtPixel(this.collisionX, y);
        const rightTile = tileMap.getTileAtPixel(
            this.collisionX + MinerWilly.COLLISION_WIDTH - 1,
            y,
        );

        return tileMap.isSolidTile(leftTile) || tileMap.isSolidTile(rightTile);
    }

    /**
     * Handles vertical downward movement after a jump arc or leaving a ledge.
     * Horizontal input is completely ignored during this state.
     */
    private handleFreeFall(tileMap: TileMap): void {
        const nextY = this.y + MinerWilly.FALL_SPEED;

        if (!this.tryLandOnSolid(tileMap, nextY)) {
            this.y = nextY;
        }
    }

    /**
     * Visual rendering loop operation.
     */
    public render(ctx: CanvasRenderingContext2D): void {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(
            this.collisionX,
            this.collisionY,
            MinerWilly.COLLISION_WIDTH,
            MinerWilly.COLLISION_HEIGHT,
        );
    }
}
