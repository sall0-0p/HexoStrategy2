export interface TooltipComponent<Props = any> {
    mount(container: Frame): void;
    update(props: Props): void;
    destroy(): void;
}