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

export function rotateImage(
    image: HTMLImageElement,
    angle: number,
): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) return reject(new Error('ctx == null'));

        const normalized = ((angle % 360) + 360) % 360;
        const swapSides = normalized === 90 || normalized === 270;

        canvas.width = swapSides ? image.naturalHeight : image.naturalWidth;
        canvas.height = swapSides ? image.naturalWidth : image.naturalHeight;

        ctx.save();
        ctx.translate(canvas.width / 2, canvas.height / 2);
        ctx.rotate((normalized * Math.PI) / 180);

        ctx.drawImage(image, -image.naturalWidth / 2, -image.naturalHeight / 2);

        ctx.restore();

        const newImage = new Image();
        newImage.onload = () => resolve(newImage);
        newImage.onerror = reject;
        newImage.src = canvas.toDataURL();
    });
}

export function getCellId(x: number, y: number) {
    let col = x + 1;
    let letters = '';

    while (col > 0) {
        col--;
        letters = String.fromCharCode(65 + (col % 26)) + letters;
        col = Math.floor(col / 26);
    }

    return `${letters}${y + 1}`;
}

export function gcd(a: number, b: number): number {
    if (b === 0) return Math.abs(a);
    return gcd(b, a % b);
}

export function getGridStep(
    gridRatioX: number,
    gridRatioY: number,
    cellRatioX: number,
    cellRatioY: number,
): {
    deltaC: number;
    deltaR: number;
} {
    // deltaC / deltaR = (gridX / gridY) * (cellY / cellX)
    const numerator = gridRatioX * cellRatioY;
    const denominator = gridRatioY * cellRatioX;

    const commonDivisor = gcd(numerator, denominator);

    return {
        deltaC: numerator / commonDivisor,
        deltaR: denominator / commonDivisor,
    };
}

export function mirrorImageVertically(
    image: HTMLImageElement,
): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) return reject(new Error('ctx == null'));

        canvas.width = image.naturalWidth;
        canvas.height = image.naturalHeight;

        ctx.save();
        ctx.scale(1, -1);
        ctx.translate(0, -image.naturalHeight);
        ctx.drawImage(image, 0, 0);
        ctx.restore();

        const newImage = new Image();
        newImage.onload = () => resolve(newImage);
        newImage.onerror = reject;
        newImage.src = canvas.toDataURL();
    });
}
export function mirrorImageHorizontally(
    image: HTMLImageElement,
): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) return reject(new Error('ctx == null'));

        canvas.width = image.naturalWidth;
        canvas.height = image.naturalHeight;

        ctx.save();
        ctx.scale(-1, 1);
        ctx.translate(-image.naturalWidth, 0);
        ctx.drawImage(image, 0, 0);
        ctx.restore();

        const newImage = new Image();
        newImage.onload = () => resolve(newImage);
        newImage.onerror = reject;
        newImage.src = canvas.toDataURL();
    });
}

/**
 * @param imageData image data to process
 * @param min 0-100
 * @param max 0-100
 * @returns
 */
export function thresholdImage(
    imageData: ImageData,
    min: number,
    max: number,
): ImageData {
    const { width, height, data } = imageData;

    const minVal = min / 100;
    const maxVal = max / 100;

    const output = new ImageData(width, height);
    const out = output.data;

    for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];

        const luminance = getLuminance(r, g, b);
        const value = luminance >= minVal && luminance <= maxVal ? 255 : 0;

        out[i] = value; // r
        out[i + 1] = value; // g
        out[i + 2] = value; // b
        out[i + 3] = 255; // alpha
    }

    return output;
}

/**
 * Applies a log-polar transformation using a complex logarithmic mapping.
 */
export function applyLogPolarTransform(imageData: ImageData): ImageData {
    const { width, height, data } = imageData;

    const output = new ImageData(width, height);
    const out = output.data;

    const cx = width / 2;
    const cy = height / 2;

    // maximum radius to fit inside image
    const maxRadius = Math.min(cx, cy);
    const logMaxR = Math.log(maxRadius);

    const epsilon = 1e-6;

    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            // map pixels to log-polar space
            const a = (x / width) * logMaxR + epsilon;
            const b = (y / height) * 2 * Math.PI - Math.PI;

            // inverse log:
            // w = e^(a + ib) = (e^a) * (cosb + i*sinb))
            // r = sqrt((e^a * cosb)^2 + (e^a * sinb)^2) = e^a
            // theta = b
            const r = Math.exp(a);

            const srcX = Math.floor(cx + r * Math.cos(b));
            const srcY = Math.floor(cy + r * Math.sin(b));

            const dstIdx = (y * width + x) * 4;

            if (srcX >= 0 && srcX < width && srcY >= 0 && srcY < height) {
                const srcIdx = (srcY * width + srcX) * 4;

                out[dstIdx] = data[srcIdx];
                out[dstIdx + 1] = data[srcIdx + 1];
                out[dstIdx + 2] = data[srcIdx + 2];
                out[dstIdx + 3] = data[srcIdx + 3];
            } else {
                // fill missing pixels (transparent)
                out[dstIdx] = 0;
                out[dstIdx + 1] = 0;
                out[dstIdx + 2] = 0;
                out[dstIdx + 3] = 0;
            }
        }
    }

    return output;
}

/**
 * Applies the complex exponential transform `e^z`, where `z = a + ib` is derived from pixel coordinates.
 */
export function applyComplexExpTransform(imageData: ImageData): ImageData {
    return imageData; // TODO
}

/**
 * Applies a scaling and rotation to the image by multiplying each pixel position
 * by the complex number `z = a + ib`.
 */
export function scaleAndRotateImage(
    imageData: ImageData,
    // a: number,
    // b: number,
): ImageData {
    return imageData; // TODO
}
