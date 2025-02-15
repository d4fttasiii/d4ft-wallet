export class MenuItem {
    label: string;
    icon?: string;
    route: string;
    isDisabled?: () => boolean;
    showDividerBelow?: boolean;
}