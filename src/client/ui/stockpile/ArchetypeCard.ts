import {StockpileWindow} from "./StockpileWindow";
import {EquipmentArchetype} from "../../../shared/constants/EquipmentArchetype";
import {ReplicatedStorage} from "@rbxts/services";
import {EquipmentArchetypeDef, EquipmentArchetypeDefs} from "../../../shared/data/ts/EquipmentArchetypeDefs";
import {BaseEquipmentType} from "../../systems/equipment/type/BaseEquipmentType";
import {TypeCard} from "./TypeCard";

const template = ReplicatedStorage.WaitForChild("Assets")
    .WaitForChild("UI")
    .WaitForChild("Stockpile")
    .WaitForChild("ArchetypeCard") as Frame;

export class ArchetypeCard {
    private frame: Frame;
    private def: EquipmentArchetypeDef;
    private cards: Map<BaseEquipmentType, TypeCard> = new Map();
    private isUnfolded: boolean = false;
    private button: TextButton;

    public constructor(
        private readonly stockpileWindow: StockpileWindow,
        private readonly archetype: EquipmentArchetype,
    ) {
        this.def = EquipmentArchetypeDefs[this.archetype];
        this.frame = template.Clone();
        this.frame.Parent = this.stockpileWindow.getFrame()
            .WaitForChild("Body")
            .WaitForChild("Center")
            .WaitForChild("List")
            .WaitForChild("Container") as ScrollingFrame;
        this.button = this.frame.WaitForChild("Container")
            .WaitForChild("Main")
            .WaitForChild("Left")
            .WaitForChild("ButtonContainer")
            .WaitForChild("TextButton") as TextButton;

        this.populate();
        this.update();
    }

    public unfold() {
        this.cards.clear();
        this.isUnfolded = true;
        this.getTypes().forEach((n, t) => {
            this.cards.set(t, new TypeCard(this, t));
        });
        (this.button.WaitForChild("ImageLabel") as ImageLabel).Rotation = 90;
    }

    public fold() {
        this.isUnfolded = false;
        this.cards.forEach((c) => {
            c.destroy();
        });
        this.cards.clear();
        (this.button.WaitForChild("ImageLabel") as ImageLabel).Rotation = 0;
    }

    private populate() {
        // Archetype label
        const label = this.frame.WaitForChild("Container")
            .WaitForChild("Main")
            .WaitForChild("Left")
            .WaitForChild("TextLabel") as TextLabel;
        label.Text = this.def.name;

        // Archetype icon
        const shadow = this.frame.WaitForChild("Container")
            .WaitForChild("Main")
            .WaitForChild("Right")
            .WaitForChild("Container")
            .WaitForChild("IconContainer")
            .WaitForChild("Shadow") as ImageLabel;
        const iconLabel = shadow.WaitForChild("Icon") as ImageLabel;
        const top = this.getTopType();
        if (top && top.getIcon() !== "") {
            shadow.Image = top.getIcon();
            iconLabel.Image = top.getIcon();
        } else {
            shadow.Image = this.def.genericIcon;
            iconLabel.Image = this.def.genericIcon;
        }

        // Fold / Unfold button
        const conn = this.button.MouseButton1Click.Connect(() => {
            if (this.isUnfolded) {
                this.fold();
            } else {
                this.unfold();
            }
        })

        this.frame.Destroying.Once(() => conn.Disconnect());
    }

    private getTopType() {
        const items = [...this.getEquipment()
            .getStockpile()
            .getStockpile()
            .get(this.archetype) || new ReadonlyMap<BaseEquipmentType, number>];
        items.sort((a, b) => a[1] < b[1]);
        const topItem = items[0];
        if (topItem) {
            return topItem[0];
        }
    }

    public update() {
        const container = this.frame.WaitForChild("Container")
            .WaitForChild("Main")
            .WaitForChild("Right")
            .WaitForChild("Container")
            .WaitForChild("NumbersContainer")
            .WaitForChild("Container") as Frame;
        const totalLabel = container.WaitForChild("Total")
            .WaitForChild("TextLabel") as TextLabel;
        const dailyLabel = container.WaitForChild("Daily")
            .WaitForChild("TextLabel") as TextLabel;

        const total = this.getEquipment().getStockpile().getCountForArchetype(this.archetype) ?? 0;
        const demanded = this.getEquipment().getTotalNeededForArchetype(this.archetype) ?? 0;
        const balance = total - demanded;
        totalLabel.Text = this.formatNumber(balance);

        // Color
        if (balance > 0) {
            totalLabel.TextColor3 = Color3.fromRGB(83, 193, 86);
        } else if (balance < 0) {
            totalLabel.TextColor3 = Color3.fromRGB(255,73,66);
        } else {
            totalLabel.TextColor3 = Color3.fromRGB(255, 255, 255);
        }

        if (this.isUnfolded) {
            this.cards.forEach((c) => c.update());

            this.getTypes().forEach((n, t) => {
                if (!this.cards.has(t)) {
                    this.cards.set(t, new TypeCard(this, t));
                }
            })

            this.cards.forEach((c) => {
                if (this.getEquipment().getStockpile().getCountForType(c.getType()) <= 0) {
                    c.destroy();
                    this.cards.delete(c.getType());
                }
            })
        }
    }

    public formatNumber(n: number, showDecimalsBelow10k = false): string {
        const abs = math.abs(n);
        const sign = n < 0 ? "-" : "";

        // Below 1ks
        if (abs < 1000) {
            if (showDecimalsBelow10k) {
                // show with two decimals
                return sign + string.format("%.2f", abs);
            } else {
                return sign + tostring(abs);
            }
        }

        // Thousands (10k – 999,999)
        if (abs < 1_000_000) {
            const val = abs / 1_000;
            // one decimal place, e.g. 10.2K
            const truncated = math.floor(val * 10) / 10;
            return sign + string.format("%.1fK", truncated);
        }

        // Millions (≥ 1,000,000)
        const val = abs / 1_000_000;
        const truncated = math.floor(val * 10) / 10;
        return sign + string.format("%.1fM", truncated);
    }

    public getFrame() {
        return this.frame;
    }

    public getArchetype() {
        return this.archetype;
    }

    public getEquipment() {
        return this.stockpileWindow.getNation().getEquipment();
    }

    public getTypes() {
        return this.getEquipment().getStockpile().getForArchetype(this.archetype);
    }
}