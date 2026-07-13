import { InputHandler } from '../core/InputHandler';

export class MinerWilly {
    public x: number;
    public y: number;
    public width: number = 16;
    public height: number = 16;

    // Jump tracking variables
    private isJumping: boolean = false;
    private isFalling: boolean = false;
    private jumpFrame: number = 0;
    private jumpDirection: 'NONE' | 'LEFT' | 'RIGHT' = 'NONE';

    // Constant lookup array for vertical movement step per frame during a jump
    // First 18 frames are upward steps (-Y), next 18 frames are downward steps (+Y)
    private static readonly JUMP_OFFSET_TABLE: number[] = [
        -4, -4, -4, -3, -3, -3, -2, -2, -2, -1, -1, -1, 0, 0, 0, 0, 0, 0, // Ascent & Apex (Frames 0-17)
        0, 0, 0, 0, 0, 0, 1, 1, 1, 2, 2, 2, 3, 3, 3, 4, 4, 4  // Descent (Frames 18-35)
    ];

    // Fixed terminal velocity when falling freely (matching the last step of the jump table)
    private static readonly FALL_SPEED = 4;

    constructor(startX: number, startY: number) {
        this.x = startX;
        this.y = startY;
    }

    /**
     * Updates Willy's position and state based on player input and mechanics.
     */
    public update(input: InputHandler): void {
        if (this.isFalling) {
            this.handleFreeFall();
        } else
            if (!this.isJumping) {
                this.handleGroundMovement(input);
            } else {
                this.handleAirMovement();
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
    private handleAirMovement(): void {
        // 1. Apply rigid horizontal direction locked at launch phase
        if (this.jumpDirection === 'LEFT') {
            this.x -= 2;
        } else if (this.jumpDirection === 'RIGHT') {
            this.x += 2;
        }

        // 2. Apply precise vertical adjustment from lookup matrix
        const verticalOffset = MinerWilly.JUMP_OFFSET_TABLE[this.jumpFrame];
        this.y += verticalOffset;

        // 3. Advance clock or terminate jump execution loop
        this.jumpFrame++;
        if (this.jumpFrame >= MinerWilly.JUMP_OFFSET_TABLE.length) {
            this.isJumping = false;
            this.jumpDirection = 'NONE';
        }
    }

    /**
     * Handles vertical downward movement when walking off a platform ledge.
     * Horizontal input is completely ignored during this state.
     */
    private handleFreeFall(): void {
        this.y += MinerWilly.FALL_SPEED;

        // Temporary safety net until we implement proper tile collisions:
        // If Willy hits the baseline height where the green floor is, he lands.
        if (this.y >= 104) {
            this.y = 104;
            this.isFalling = false;
        }
    }

    /**
     * Visual rendering loop operation.
     */
    public render(ctx: CanvasRenderingContext2D): void {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(this.x, this.y, this.width, this.height);
    }
}