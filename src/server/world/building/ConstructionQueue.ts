import {BuildingProject} from "./BuildingProject";

export class ConstructionQueue {
    private items: BuildingProject[] = [];

    public push(item: BuildingProject) {
        this.items.push(item);
    };

    public pop(): BuildingProject | undefined {
        return this.items.shift();
    }

    public get(index: number): BuildingProject | undefined {
        return this.items[index];
    }

    public peek(): BuildingProject | undefined {
        return this.items[0];
    }

    public toArray() {
        return [...this.items];
    }

    public move(id: string, toIndex: number): boolean {
        const n = this.items.size();

        if (toIndex < 0) toIndex = 0;
        if (toIndex >= n) toIndex = n - 1;

        const fromIndex = this.items.findIndex((i) => {
            return i.id === id;
        })
        if (fromIndex < 0) return false;

        const item = this.remove(fromIndex);
        if (!item) return false;

        return this.insertAt(item, toIndex);
    }

    public remove(index: number): BuildingProject | undefined {
        const n = this.items.size();
        if (index < 0 || index >= n) return undefined;

        const item = this.items[index];
        for (let i = index; i < n - 1; i++) {
            this.items[i] = this.items[i + 1];
        }
        this.items.pop();
        return item;
    }

    public removeById(id: string): BuildingProject | undefined {
        const index = this.items.findIndex((p) => p.id === id);
        return this.remove(index);
    }

    private insertAt(item: BuildingProject, index: number): boolean {
        const n = this.items.size();
        if (index < 0 || index > n) return false;

        this.items.push(item);
        for (let i = n - 1; i >= index; i--) {
            this.items[i + 1] = this.items[i];
        }
        this.items[index] = item;
        return true;
    }
}