export const CANVAS_HEIGHT = 600;

export const availableRatios = [
    {
        value: 'free',
        widthComponent: 1,
        heightComponent: 1,
        force: false,
    },
    {
        value: '1:1',
        widthComponent: 1,
        heightComponent: 1,
        force: true,
    },
    {
        value: '3:2',
        widthComponent: 3,
        heightComponent: 2,
        force: true,
    },
    {
        value: '4:3',
        widthComponent: 4,
        heightComponent: 3,
        force: true,
    },
    {
        value: '5:4',
        widthComponent: 5,
        heightComponent: 4,
        force: true,
    },
    {
        value: '16:9',
        widthComponent: 16,
        heightComponent: 9,
        force: true,
    },
    {
        value: 'custom',
        widthComponent: 1,
        heightComponent: 1,
        force: true,
    },
] as const;

export type AvailableRatio = (typeof availableRatios)[number]['value'];

export const orientations = [
    {
        value: 'horizontal',
        title: 'Horizontal',
    },
    {
        value: 'vertical',
        title: 'Vertical',
    },
] as const;

export type Orientation = (typeof orientations)[number]['value'];
