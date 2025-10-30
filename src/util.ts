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

export function srgbToLinear(colorValue: number): number {
    const srgb = colorValue / 255;

    // apply the inverse gamma correction
    if (srgb <= 0.03928) {
        return srgb / 12.92;
    } else {
        // ((sRGB + 0.055) / 1.055) ^ 2.4
        return Math.pow((srgb + 0.055) / 1.055, 2.4);
    }
}

export function getLuminance(r: number, g: number, b: number): number {
    const rLinear = srgbToLinear(r);
    const gLinear = srgbToLinear(g);
    const bLinear = srgbToLinear(b);

    // standard formula for relative luminance (Rec. 709 / sRGB):
    // L = 0.2126 * R + 0.7152 * G + 0.0722 * B
    // https://en.wikipedia.org/wiki/Relative_luminance
    return 0.2126 * rLinear + 0.7152 * gLinear + 0.0722 * bLinear;
}

export function getContrastColor(r: number, g: number, b: number): string {
    const L = getLuminance(r, g, b);
    return L > 0.5 ? '#000000' : '#FFFFFF';
}

/**
 * Returns average color for the image on canvas,
 * sampled every `step` px for better performance.
 */
export function getAverageColor(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    step: number = 10,
) {
    const data = ctx.getImageData(0, 0, width, height).data;
    let r = 0,
        g = 0,
        b = 0,
        count = 0;

    for (let i = 0; i < data.length; i += 4 * step) {
        r += data[i];
        g += data[i + 1];
        b += data[i + 2];
        count++;
    }

    return {
        r: Math.round(r / count),
        g: Math.round(g / count),
        b: Math.round(b / count),
    };
}

export function getGridColorSuggestion(img: HTMLImageElement) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    const avg = getAverageColor(ctx, canvas.width, canvas.height);
    return getContrastColor(avg.r, avg.g, avg.b);
}
