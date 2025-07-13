export interface TooltipComponent<Props = any> {
    frame: GuiObject,
    mount(container: Frame): void;
    update(props: Props): void;
    destroy(): void;
}