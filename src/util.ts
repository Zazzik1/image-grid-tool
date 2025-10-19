const MAX_ASPECT_RATIO_N = 20;
const FRACTION_DIGITS = 3;
const SCALING_FACTOR = 100;

export function getAspectRatio(
    width: number,
    height: number,
): {
    label: string;
    widthComponent: number;
    heightComponent: number;
    factorFound: boolean;
} {
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
