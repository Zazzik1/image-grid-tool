const MAX_ASPECT_RATIO_N = 20;
const FRACTION_DIGITS = 3;
const SCALING_FACTOR = 100;

export type AspectRatio = {
    label: string;
    widthComponent: number;
    heightComponent: number;
    factorFound: boolean;
};

export function getAspectRatio(width: number, height: number): AspectRatio {
    const target = (
        Math.floor((SCALING_FACTOR * width) / height) / SCALING_FACTOR
    ).toFixed(FRACTION_DIGITS);

    for (let i = 0; i < MAX_ASPECT_RATIO_N; i++) {
        for (let j = 0; j < MAX_ASPECT_RATIO_N; j++) {
            if (
                (Math.floor((SCALING_FACTOR * j) / i) / SCALING_FACTOR).toFixed(
                    FRACTION_DIGITS,
                ) === target
            ) {
                console.log(target);
                return {
                    label: `${j}:${i}`,
                    widthComponent: j,
                    heightComponent: i,
                    factorFound: true,
                };
            }
        }
    }
    return {
        label: `1:${(height / width).toFixed(2)}`,
        widthComponent: width,
        heightComponent: height,
        factorFound: false,
    };
}

export type Grid = {
    columns: number;
    rows: number;
};

export type GridSuggestion = {
    grid: Grid;
    aspectRatio: AspectRatio;
};

export function getGridSuggestion(img: HTMLImageElement): GridSuggestion {
    const aspectRatio = getAspectRatio(img.naturalWidth, img.naturalHeight);
    const { widthComponent, heightComponent, factorFound } = aspectRatio;
    const multiplier = Math.max(
        1,
        Math.ceil(img.naturalWidth / aspectRatio.widthComponent / 200),
        Math.ceil(img.naturalHeight / aspectRatio.heightComponent / 200),
    );
    // e.g. 1:1.01, 1:3.14
    if (!factorFound) {
        return {
            aspectRatio,
            grid: {
                columns: 4,
                rows: 4,
            },
        };
    }
    // e.g. 1:1, 4:5, 16:9
    return {
        aspectRatio,
        grid: {
            columns: Math.max(widthComponent * multiplier, 4),
            rows: Math.max(heightComponent * multiplier, 4),
        },
    };
}
