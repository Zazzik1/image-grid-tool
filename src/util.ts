const MAX_ASPECT_RATIO_N = 20;

export function getAspectRatio(
    width: number,
    height: number,
): {
    label: string;
    widthComponent: number;
    heightComponent: number;
    factorFound: boolean;
} {
    const target = (width / height).toFixed(3);
    for (let i = 0; i < MAX_ASPECT_RATIO_N; i++) {
        for (let j = 0; j < MAX_ASPECT_RATIO_N; j++) {
            if ((j / i).toFixed(3) === target) {
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
