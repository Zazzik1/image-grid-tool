const MAX_ASPECT_RATIO_N = 30;
const FRACTION_DIGITS = 3;

export type AspectRatio = {
    label: string;
    widthComponent: number;
    heightComponent: number;
    factorFound: boolean;
};

export function getAspectRatio(width: number, height: number): AspectRatio {
    const ratio = width / height;

    let bestI = 1;
    let bestJ = 1;
    let bestDiff = Infinity;

    for (let i = 1; i <= MAX_ASPECT_RATIO_N; i++) {
        const j = Math.round(i * ratio);
        if (j > MAX_ASPECT_RATIO_N) continue;

        const diff = Math.abs(ratio - j / i);
        if (diff < bestDiff) {
            bestDiff = diff;
            bestI = i;
            bestJ = j;
        }
        if (diff === 0) break;
    }

    const factorFound = bestDiff < 1 / Math.pow(10, FRACTION_DIGITS);
    const label = `${bestJ}:${bestI}`;

    return {
        label,
        widthComponent: bestJ,
        heightComponent: bestI,
        factorFound,
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
    const { widthComponent, heightComponent } = aspectRatio;
    const multiplier = Math.max(
        1,
        Math.ceil(img.naturalWidth / aspectRatio.widthComponent / 200),
        Math.ceil(img.naturalHeight / aspectRatio.heightComponent / 200),
    );

    let columns = widthComponent * multiplier;
    let rows = heightComponent * multiplier;
    if (columns < 4 || rows < 4) {
        /**
         * scales both columns and rows by the factor
         * that provides at least 4 in rows or columns
         * e.g. transforms 1:0.5 to 4:12
         */
        const factor = Math.pow(
            2,
            Math.ceil(Math.log2(4 / Math.min(columns, rows))),
        );
        columns *= factor;
        rows *= factor;
    }
    // e.g. 1:1, 4:5, 16:9
    return {
        aspectRatio,
        grid: {
            columns,
            rows,
        },
    };
}

const LINE_THICKNESS_TRESHOLD = 2000;
export function getLineThicknessSuggestion(
    width: number,
    height: number,
): number {
    if (width > LINE_THICKNESS_TRESHOLD || height > LINE_THICKNESS_TRESHOLD) {
        return 3;
    }
    return 1;
}
