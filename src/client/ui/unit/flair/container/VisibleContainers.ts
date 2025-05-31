import {Container} from "./Container";

export class VisibleContainers {
    private static visible = new Set<Container>();

    public static getVisibleContainers() {
        return this.visible;
    }

    public static markAsVisible(container: Container) {
        this.visible.add(container);
    }

    public static unmarkAsVisible(container: Container) {
        this.visible.delete(container);
    }
}