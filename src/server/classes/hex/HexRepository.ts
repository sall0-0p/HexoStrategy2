import {Hex, JsonHex} from "./Hex";
import raw from "shared/data/hexes.json";
import {CubePosition} from "../../../shared/classes/CubePosition";

export class HexRepository {
    private hexesById = new Map<string, Hex>;
    private hexesByCoords = new Map<string, Hex>;

    private static instance: HexRepository;
    private constructor() {
        for (const [id, rawDef] of pairs(raw as Record<string, JsonHex>)) {
            const hex = new Hex(id, rawDef);
            const hexPosition = hex.getPosition();
            this.hexesById.set(id, hex);
            this.hexesByCoords.set(`${hexPosition.q},${hexPosition.r},${hexPosition.s}`, hex);
        }

        this.hexesById.forEach((hex) =>
            hex.initNeighbors((coords) => this.getByPosition(coords)),
        );
    }

    public static getInstance(): HexRepository {
        if (!this.instance) {
            this.instance = new HexRepository();
        }
        return this.instance;
    }

    public getById(id: string): Hex | undefined {
        return this.hexesById.get(id);
    }

    public getByPosition(position: CubePosition) {
        return this.hexesByCoords.get(`${position.q},${position.r},${position.s}`);
    }

    public getAll(): Hex[] {
        let result: Hex[] = [];

        this.hexesById.forEach((hex) => {
            result.push(hex);
        })

        return result;
    }
}

export const hexRepository = HexRepository.getInstance();