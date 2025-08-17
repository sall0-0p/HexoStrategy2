import {RegionRepository} from "../../world/region/RegionRepository";
import {Hex} from "../../world/hex/Hex";
import {Region} from "../../world/region/Region";

export class StripeManager {
    private regionRepository = RegionRepository.getInstance();

    private static instance: StripeManager;
    private constructor() {

    }

    public applyToHex(hex: Hex, style: StripeStyle) {
        const stripes = hex.getModel().WaitForChild("Stripes") as MeshPart;
        const texture = stripes.WaitForChild("Texture") as Texture;
        const STUDS_PER_TILE = style.size ?? 1;
        const position = hex.getModel().GetPivot();

        texture.Color3 = style.color ?? Color3.fromRGB(255, 255, 255);
        texture.Transparency = style.transparency ?? 0;

        texture.StudsPerTileU = STUDS_PER_TILE;
        texture.StudsPerTileV = STUDS_PER_TILE;
        texture.OffsetStudsU = -(position.Position.X % STUDS_PER_TILE);
        texture.OffsetStudsV = -(position.Position.Z % STUDS_PER_TILE);
    }

    public applyToRegion(region: Region, style: StripeStyle) {
        region.getHexes().forEach((h) => this.applyToHex(h, style));
    }

    public clearRegion(region: Region) {
        this.applyToRegion(region, {
            transparency: 1,
        })
    }

    public clearHex(hex: Hex) {
        this.applyToHex(hex, {
            transparency: 1,
        })
    }

    public clearAll() {
        this.regionRepository.getAll().forEach((region) => {
            this.clearRegion(region);
        })
    }

    public static resetInstance() {
        this.instance?.clearAll();
    }

    public static getInstance(): StripeManager {
        if (!this.instance) {
            this.instance = new StripeManager();
        }

        return this.instance;
    }
}

export interface StripeStyle {
    color?: Color3,
    transparency?: number,
    size?: number,
}