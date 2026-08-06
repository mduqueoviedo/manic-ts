import type { PlayerInput } from '../core/InputHandler';
import {
    definePixelMask,
    expandPixelMaskHorizontally,
    maskOverlapsRectangle,
    mirrorPixelMask,
    renderPixelMask,
    type PixelMask,
} from '../collision/PixelMask';
import { TileMap } from '../world/TileMap';

const LAST_PIXEL_OFFSET = 1;
type HorizontalDirection = 'NONE' | 'LEFT' | 'RIGHT';
type ConveyorControlMode = 'NONE' | 'WALK' | 'STAND';

export class MinerWilly {
    public x: number;
    public y: number;
    private previousX: number;
    private previousY: number;

    // Original animation frames live in a 16x16 cell, although Willy's visible
    // body does not fill the whole width of that cell.
    public static readonly SPRITE_WIDTH = 16;
    public static readonly SPRITE_HEIGHT = 16;

    // Terrain remains tile-envelope based while hazards and level objects use
    // the occupied pixels of the current animation frame.
    public static readonly COLLISION_WIDTH = 9;
    public static readonly COLLISION_HEIGHT = MinerWilly.SPRITE_HEIGHT;
    private static readonly COLLISION_OFFSET_X = 4;
    private static readonly DEADLY_MASK_EXPANSION = 1;

    // Movement parameters shared by every state that can move Willy.
    private static readonly HORIZONTAL_SPEED = 2;
    private static readonly FALL_SPEED = 4;
    private static readonly JUMP_START_FRAME = 0;
    // The source sheet bakes a two-pixel horizontal advance into each phase.
    // These masks cancel that offset because world movement already advances
    // Willy by two pixels per tick. The cycle starts at its third source phase
    // to preserve Central Cavern's initial silhouette.
    private static readonly RIGHT_MASKS: readonly PixelMask[] = [
        definePixelMask([
            '.........##.....',
            '......#####.....',
            '.....#####......',
            '......##.#......',
            '......#####.....',
            '......####......',
            '.......##.......',
            '......####......',
            '.....######.....',
            '.....######.....',
            '....####.###....',
            '....#####.##....',
            '......####......',
            '.....###.##.....',
            '.....##.###.....',
            '.....###.###....',
        ]),
        definePixelMask([
            '.........##.....',
            '......#####.....',
            '.....#####......',
            '......##.#......',
            '......#####.....',
            '......####......',
            '.......##.......',
            '......####......',
            '.....######.....',
            '....########....',
            '...##########...',
            '...##.####.##...',
            '......#####.....',
            '.....###.##.#...',
            '....##....###...',
            '....###....#....',
        ]),
        definePixelMask([
            '.........##.....',
            '......#####.....',
            '.....#####......',
            '......##.#......',
            '......#####.....',
            '......####......',
            '.......##.......',
            '......####......',
            '.....######.....',
            '.....######.....',
            '....####.###....',
            '....#####.##....',
            '......####......',
            '.....###.##.....',
            '.....##.###.....',
            '.....###.###....',
        ]),
        definePixelMask([
            '.........##.....',
            '......#####.....',
            '.....#####......',
            '......##.#......',
            '......#####.....',
            '......####......',
            '.......##.......',
            '......####......',
            '.....##.###.....',
            '.....##.###.....',
            '.....##.###.....',
            '.....###.##.....',
            '......####......',
            '.......##.......',
            '.......##.......',
            '.......###......',
        ]),
    ];
    private static readonly LEFT_MASKS: readonly PixelMask[] =
        MinerWilly.RIGHT_MASKS.map(mirrorPixelMask);

    public get collisionX(): number {
        return this.x + MinerWilly.COLLISION_OFFSET_X;
    }

    public get collisionY(): number {
        return this.y;
    }

    private get collisionRight(): number {
        return this.collisionX
            + MinerWilly.COLLISION_WIDTH
            - LAST_PIXEL_OFFSET;
    }

    private get collisionBottom(): number {
        return this.collisionY
            + MinerWilly.COLLISION_HEIGHT
            - LAST_PIXEL_OFFSET;
    }

    public overlapsRectangle(
        x: number,
        y: number,
        width: number,
        height: number,
    ): boolean {
        return maskOverlapsRectangle(
            this.collisionMask,
            this.x,
            this.y,
            x,
            y,
            width,
            height,
        );
    }

    // Jump tracking variables
    private isJumping: boolean = false;
    private isFalling: boolean = false;
    private jumpFrame: number = MinerWilly.JUMP_START_FRAME;
    private jumpDirection: HorizontalDirection = 'NONE';
    private jumpOriginY: number | undefined;
    private conveyorControlMode: ConveyorControlMode = 'NONE';
    private conveyorControlDirection: HorizontalDirection = 'NONE';
    private stationaryConveyorJumpDirection: HorizontalDirection = 'NONE';
    private facing: 'LEFT' | 'RIGHT' = 'RIGHT';
    private animationFrame = 0;

    public get collisionMask(): PixelMask {
        const masks = this.facing === 'LEFT'
            ? MinerWilly.LEFT_MASKS
            : MinerWilly.RIGHT_MASKS;

        return masks[this.animationFrame];
    }

    public get deadlyCollisionMask(): PixelMask {
        return expandPixelMaskHorizontally(
            this.collisionMask,
            MinerWilly.DEADLY_MASK_EXPANSION,
        );
    }

    public get isGrounded(): boolean {
        return !this.isJumping && !this.isFalling;
    }

    // Constant lookup array for vertical movement per frame during a jump.
    // It preserves an 18-frame, 20-pixel arc without pausing at the apex.
    private static readonly JUMP_OFFSET_TABLE: readonly number[] = [
        -4, -3, -3,
        -2, -2, -2, -2,
        -1, -1,
        1, 1,
        2, 2, 2, 2,
        3, 3, 4,
    ];
    constructor(startX: number, startY: number) {
        this.x = startX;
        this.y = startY;
        this.previousX = startX;
        this.previousY = startY;
    }

    /**
     * Updates Willy's position and state based on player input and mechanics.
     */
    public update(input: PlayerInput, tileMap: TileMap): void {
        this.previousX = this.x;
        this.previousY = this.y;

        if (
            this.stationaryConveyorJumpDirection !== 'NONE'
            && !this.isDirectionPressed(
                input,
                this.stationaryConveyorJumpDirection,
            )
        ) {
            this.stationaryConveyorJumpDirection = 'NONE';
        }

        if (!this.isJumping && !this.isFalling && !this.hasSupport(tileMap)) {
            this.isFalling = true;
            this.clearConveyorControl();
        }

        if (this.isFalling) {
            this.handleFreeFall(input, tileMap);
            this.keepWithinCavernBounds();
            return;
        }

        if (this.isJumping) {
            this.handleAirMovement(input, tileMap);
        } else {
            this.handleGroundMovement(input, tileMap);
        }

        this.keepWithinCavernBounds();

        if (!this.isJumping && !this.hasSupport(tileMap)) {
            this.isFalling = true;
        }
    }

    /**
     * Standard horizontal walking movement when touching solid ground.
     */
    private handleGroundMovement(input: PlayerInput, tileMap: TileMap): void {
        const conveyorDirection = tileMap.getConveyorDirectionBelow(
            this.collisionX,
            MinerWilly.COLLISION_WIDTH,
            this.collisionY + MinerWilly.COLLISION_HEIGHT,
        );
        const hasOpposingControl =
            this.conveyorControlMode !== 'NONE'
            && this.isDirectionOppositeToConveyor(
                this.conveyorControlDirection,
                conveyorDirection,
            )
            && this.isDirectionPressed(input, this.conveyorControlDirection);

        if (!hasOpposingControl) {
            this.clearConveyorControl();
        }

        if (input.isJumpPressed) {
            this.isJumping = true;
            this.jumpFrame = MinerWilly.JUMP_START_FRAME;
            this.jumpOriginY = this.y;

            // Lock horizontal trajectory instantly at the frame of launch
            if (hasOpposingControl && this.conveyorControlMode === 'WALK') {
                this.jumpDirection = this.conveyorControlDirection;
            } else if (
                hasOpposingControl
                && this.conveyorControlMode === 'STAND'
            ) {
                this.jumpDirection = 'NONE';
                this.stationaryConveyorJumpDirection =
                    this.conveyorControlDirection;
            } else if (conveyorDirection < 0) {
                this.jumpDirection = 'LEFT';
            } else if (conveyorDirection > 0) {
                this.jumpDirection = 'RIGHT';
            } else if (input.isLeftPressed) {
                this.jumpDirection = 'LEFT';
            } else if (input.isRightPressed) {
                this.jumpDirection = 'RIGHT';
            } else {
                this.jumpDirection = 'NONE';
            }
            this.clearConveyorControl();

            // The launch input is also the first arc frame. Deferring this
            // until the next update creates a visible one-tick pause.
            this.handleAirMovement(input, tileMap);
            return;
        }

        if (hasOpposingControl && this.conveyorControlMode === 'WALK') {
            const offset = this.conveyorControlDirection === 'LEFT'
                ? -MinerWilly.HORIZONTAL_SPEED
                : MinerWilly.HORIZONTAL_SPEED;

            if (!this.moveHorizontally(tileMap, offset)) {
                this.clearConveyorControl();
                this.moveWithConveyor(tileMap, conveyorDirection);
            }
            return;
        }

        if (hasOpposingControl && this.conveyorControlMode === 'STAND') {
            return;
        }

        if (conveyorDirection < 0) {
            this.moveHorizontally(tileMap, -MinerWilly.HORIZONTAL_SPEED);
        } else if (conveyorDirection > 0) {
            this.moveHorizontally(tileMap, MinerWilly.HORIZONTAL_SPEED);
        } else if (input.isLeftPressed) {
            this.moveHorizontally(tileMap, -MinerWilly.HORIZONTAL_SPEED);
        } else if (input.isRightPressed) {
            this.moveHorizontally(tileMap, MinerWilly.HORIZONTAL_SPEED);
        }
    }

    /**
     * Strict frame-by-frame arc processing for mid-air movement.
     */
    private handleAirMovement(input: PlayerInput, tileMap: TileMap): void {
        // 1. Apply the vertical arc and resolve head or landing collisions.
        const verticalOffset = MinerWilly.JUMP_OFFSET_TABLE[this.jumpFrame];

        if (verticalOffset < 0 && this.resolveCeilingCollision(tileMap, this.y + verticalOffset)) {
            this.isJumping = false;
            this.isFalling = true;
            this.jumpFrame = MinerWilly.JUMP_START_FRAME;
            this.jumpDirection = 'NONE';
            return;
        }

        const landingDirection = this.jumpDirection;

        if (verticalOffset > 0 && this.tryLandOnSurface(tileMap, this.y + verticalOffset)) {
            if (landingDirection === 'LEFT') {
                this.moveHorizontally(tileMap, -MinerWilly.HORIZONTAL_SPEED);
            } else if (landingDirection === 'RIGHT') {
                this.moveHorizontally(tileMap, MinerWilly.HORIZONTAL_SPEED);
            }

            this.rememberConveyorLanding(input, tileMap, landingDirection);

            return;
        }

        this.y += verticalOffset;

        // 2. Try the locked horizontal step from Willy's new vertical position.
        if (this.jumpDirection === 'LEFT') {
            this.moveHorizontally(tileMap, -MinerWilly.HORIZONTAL_SPEED);
        } else if (this.jumpDirection === 'RIGHT') {
            this.moveHorizontally(tileMap, MinerWilly.HORIZONTAL_SPEED);
        }

        // 3. Advance the jump clock or terminate the arc.
        this.jumpFrame++;
        if (this.jumpFrame >= MinerWilly.JUMP_OFFSET_TABLE.length) {
            this.isJumping = false;
        }
    }

    /**
     * Checks the map directly below both sides of Willy's collision body.
     */
    private hasSupport(tileMap: TileMap): boolean {
        const feetY = this.collisionY + MinerWilly.COLLISION_HEIGHT;
        return this.hasSupportAtHeight(tileMap, feetY);
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
     * Lands Willy when his feet cross the top of a supporting surface.
     */
    private tryLandOnSurface(tileMap: TileMap, nextY: number): boolean {
        const previousFeetY = this.collisionY + MinerWilly.COLLISION_HEIGHT;
        const nextFeetY = nextY + MinerWilly.COLLISION_HEIGHT;
        const tileTop = Math.floor(nextFeetY / TileMap.TILE_SIZE) * TileMap.TILE_SIZE;

        if (previousFeetY > tileTop || !this.hasSupportAtHeight(tileMap, nextFeetY)) {
            return false;
        }

        this.y = tileTop - MinerWilly.COLLISION_HEIGHT;
        this.isJumping = false;
        this.isFalling = false;
        this.jumpFrame = MinerWilly.JUMP_START_FRAME;
        this.jumpDirection = 'NONE';
        return true;
    }

    /**
     * Checks both horizontal edges of Willy's collision body at a given height.
     */
    private hasSolidAtHeight(tileMap: TileMap, y: number): boolean {
        const leftTile = tileMap.getTileAtPixel(this.collisionX, y);
        const rightTile = tileMap.getTileAtPixel(this.collisionRight, y);

        return tileMap.isSolidTile(leftTile) || tileMap.isSolidTile(rightTile);
    }

    private hasSupportAtHeight(tileMap: TileMap, y: number): boolean {
        const leftTile = tileMap.getTileAtPixel(this.collisionX, y);
        const rightTile = tileMap.getTileAtPixel(this.collisionRight, y);

        return tileMap.isSupportTile(leftTile) || tileMap.isSupportTile(rightTile);
    }

    /**
     * Selects the control retained after landing against a conveyor. A normal
     * landing preserves opposing travel, while landing below the jump origin
     * holds Willy still. A vertical jump from that stationary state resumes it.
     */
    private rememberConveyorLanding(
        input: PlayerInput,
        tileMap: TileMap,
        landingDirection: HorizontalDirection,
    ): void {
        const conveyorDirection = tileMap.getConveyorDirectionBelow(
            this.collisionX,
            MinerWilly.COLLISION_WIDTH,
            this.collisionY + MinerWilly.COLLISION_HEIGHT,
        );
        const opposingDirection: HorizontalDirection = conveyorDirection < 0
            ? 'RIGHT'
            : conveyorDirection > 0
                ? 'LEFT'
                : 'NONE';
        const isOpposingDirectionPressed = this.isDirectionPressed(
            input,
            opposingDirection,
        );
        const landedBelowJumpOrigin =
            this.jumpOriginY !== undefined
            && this.y > this.jumpOriginY;
        const resumesStationaryControl =
            this.stationaryConveyorJumpDirection === opposingDirection;

        this.clearConveyorControl();

        if (
            isOpposingDirectionPressed
            && (landedBelowJumpOrigin || resumesStationaryControl)
        ) {
            this.conveyorControlMode = 'STAND';
            this.conveyorControlDirection = opposingDirection;
        } else if (
            isOpposingDirectionPressed
            && landingDirection === opposingDirection
        ) {
            this.conveyorControlMode = 'WALK';
            this.conveyorControlDirection = opposingDirection;
        }

        this.jumpOriginY = undefined;
        this.stationaryConveyorJumpDirection = 'NONE';
    }

    private clearConveyorControl(): void {
        this.conveyorControlMode = 'NONE';
        this.conveyorControlDirection = 'NONE';
    }

    private isDirectionPressed(
        input: PlayerInput,
        direction: HorizontalDirection,
    ): boolean {
        return direction === 'LEFT'
            ? input.isLeftPressed
            : direction === 'RIGHT' && input.isRightPressed;
    }

    private isDirectionOppositeToConveyor(
        direction: HorizontalDirection,
        conveyorDirection: -1 | 0 | 1,
    ): boolean {
        return (direction === 'LEFT' && conveyorDirection > 0)
            || (direction === 'RIGHT' && conveyorDirection < 0);
    }

    private moveWithConveyor(
        tileMap: TileMap,
        conveyorDirection: -1 | 0 | 1,
    ): void {
        if (conveyorDirection !== 0) {
            this.moveHorizontally(
                tileMap,
                conveyorDirection * MinerWilly.HORIZONTAL_SPEED,
            );
        }
    }

    /**
     * Applies one horizontal step when Willy's path is clear. A blocked step
     * does not discard the jump direction, so movement can resume later.
     */
    private moveHorizontally(tileMap: TileMap, offset: number): boolean {
        const nextX = this.x + offset;
        const nextCollisionX = nextX + MinerWilly.COLLISION_OFFSET_X;
        const leadingEdgeX = offset < 0
            ? nextCollisionX
            : this.collisionRight + offset;

        if (!this.hasSolidAtVerticalEdge(tileMap, leadingEdgeX)) {
            this.x = nextX;
            this.facing = offset < 0 ? 'LEFT' : 'RIGHT';
            this.animationFrame = (
                this.animationFrame
                + (offset < 0 ? -1 : 1)
                + MinerWilly.RIGHT_MASKS.length
            ) % MinerWilly.RIGHT_MASKS.length;
            return true;
        }

        const column = Math.floor(
            (leadingEdgeX - TileMap.ORIGIN_X) / TileMap.TILE_SIZE,
        );
        const tileLeft = TileMap.ORIGIN_X + column * TileMap.TILE_SIZE;

        this.x = offset < 0
            ? tileLeft + TileMap.TILE_SIZE - MinerWilly.COLLISION_OFFSET_X
            : tileLeft
                - MinerWilly.COLLISION_WIDTH
                - MinerWilly.COLLISION_OFFSET_X;
        return false;
    }

    /**
     * Checks every tile row touched by one vertical edge of Willy's body.
     */
    private hasSolidAtVerticalEdge(tileMap: TileMap, x: number): boolean {
        const top = this.collisionY;
        const bottom = this.collisionBottom;
        let y = top;

        while (y <= bottom) {
            if (tileMap.isSolidTile(tileMap.getTileAtPixel(x, y))) {
                return true;
            }

            y = (Math.floor(y / TileMap.TILE_SIZE) + 1) * TileMap.TILE_SIZE;
        }

        return false;
    }

    /**
     * Keeps Willy's provisional collision body inside the cavern viewport.
     */
    private keepWithinCavernBounds(): void {
        const currentCollisionX = this.collisionX;
        const constrainedCollisionX = Math.max(
            TileMap.ORIGIN_X,
            Math.min(
                currentCollisionX,
                TileMap.RIGHT - MinerWilly.COLLISION_WIDTH,
            ),
        );

        if (constrainedCollisionX !== currentCollisionX) {
            this.x = constrainedCollisionX - MinerWilly.COLLISION_OFFSET_X;
        }
    }

    /**
     * Handles vertical downward movement after a jump arc or leaving a ledge.
     * Horizontal input is completely ignored during this state.
     */
    private handleFreeFall(input: PlayerInput, tileMap: TileMap): void {
        const nextY = this.y + MinerWilly.FALL_SPEED;
        const landingDirection = this.jumpDirection;

        if (this.tryLandOnSurface(tileMap, nextY)) {
            this.rememberConveyorLanding(input, tileMap, landingDirection);
        } else {
            this.y = nextY;
        }
    }

    /**
     * Visual rendering loop operation.
     */
    public render(
        ctx: CanvasRenderingContext2D,
        interpolationAlpha: number,
    ): void {
        const renderX = this.interpolateCoordinate(
            this.previousX,
            this.x,
            interpolationAlpha,
        );
        const renderY = this.interpolateCoordinate(
            this.previousY,
            this.y,
            interpolationAlpha,
        );

        ctx.fillStyle = '#ffffff';
        renderPixelMask(ctx, this.collisionMask, renderX, renderY);
    }

    private interpolateCoordinate(
        previous: number,
        current: number,
        interpolationAlpha: number,
    ): number {
        return Math.round(
            previous + (current - previous) * interpolationAlpha,
        );
    }
}
