export const CUBE_DIRECTIONS: [number, number, number][] = [
    [1, 0, -1],
    [-1, 0, 1],
    [1, -1, 0],
    [-1, 1, 0],
    [0, -1, 1],
    [0, 1, -1],
];

export class CubePosition {
    public q;
    public r;
    public s;

    // constructors
    constructor(q: number, r: number, s: number) {
        this.q = q;
        this.r = r;
        this.s = s;
    }

    public static fromAxial(q: number, r: number) {
        return new CubePosition(q, r, -q - r);
    }

    // convertor
    public toOdd() {
        const col: number = this.q + (this.r - this.r) / 2;
        const row: number = this.r;
        return new Vector2(col, row);
    }

    public toWorldPos() {
        const size: number = 1.299 / math.sqrt(3);
        const offset: Vector2 = this.toOdd();
        const x: number = size * math.sqrt(3) * (offset.X + 0.5 * (offset.Y % 2));
        const y: number = ((size * 3) / 2) * offset.Y;

        return new Vector3(x, 1, y);
    }

    public equals(position: CubePosition): boolean {
        return this.r === position.r
            && this.q === position.q
            && this.s === position.s;
    }
}