import {
    getAspectRatio,
    getCellId,
    getGridSuggestion,
    getLineThicknessSuggestion,
    GridSuggestion,
    thresholdImage,
} from '@/util';
import { describe, expect, it } from 'vitest';
import { ImageData } from 'canvas';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
(global as any).ImageData = ImageData;

type Result = ReturnType<typeof getAspectRatio>;

describe('getAspectRatio', () => {
    it.for([
        [1280, 720, 16, 9, true],
        [720, 1280, 9, 16, true],
        [1080, 1080, 1, 1, true],
        [2222, 3333, 2, 3, true],
        [3333, 2222, 3, 2, true],
        [400, 500, 4, 5, true],
        [500, 400, 5, 4, true],
        [853, 1280, 2, 3, true],
        [1280, 853, 3, 2, true],
        [1200, 801, 3, 2, false],
        [862, 1080, 4, 5, false],
    ])(
        '%i:%i -> %i:%i (factor found: %s)',
        ([
            width,
            height,
            expectedWidthComponent,
            expectedHeightComponent,
            factorFound,
        ]) => {
            expect(
                getAspectRatio(width as number, height as number)
            ).toStrictEqual<Result>({
                factorFound: factorFound as boolean,
                label: `${expectedWidthComponent}:${expectedHeightComponent}`,
                widthComponent: expectedWidthComponent as number,
                heightComponent: expectedHeightComponent as number,
            });
        }
    );
    it('prime:prime -> finds a close aspect ratio', () => {
        const primeA = 20 ** 2 - 1;
        const primeB = 30 ** 2 - 1;
        const result = getAspectRatio(primeA, primeB);
        expect(result.factorFound).toBe(true);
        expect(result.label).toBe('4:9');
        expect(
            (result.widthComponent / result.heightComponent).toFixed(2)
        ).toBe((primeA / primeB).toFixed(2));
    });
});

describe('getGridSuggestion', () => {
    it.for([
        [1080, 1080, 6, 6],
        [720, 900, 5, 4],
        [720, 720, 4, 4],
        [89, 89, 4, 4],
        [736, 1204, 18, 11],
        [4000, 6000, 30, 20],
        [1725, 1725, 9, 9],
        [627, 209, 4, 12],
    ])(
        '%i:%i -> %i rows, %i columns',
        ([imgWidth, imgHeight, expectedRows, expectedColumns]) => {
            const img = {
                naturalWidth: imgWidth,
                naturalHeight: imgHeight,
            } as HTMLImageElement;
            expect(getGridSuggestion(img)).toStrictEqual<GridSuggestion>({
                aspectRatio: getAspectRatio(
                    img.naturalWidth,
                    img.naturalHeight
                ),
                grid: {
                    rows: expectedRows as number,
                    columns: expectedColumns as number,
                },
            });
        }
    );
});

describe('getLineThicknessSuggestion', () => {
    it.for([
        [100, 100, 1],
        [3000, 100, 3],
        [100, 3000, 3],
        [3000, 3000, 3],
        [2001, 100, 3],
    ])('%i:%i -> %ipx', ([width, height, expectedLineThickness]) => {
        expect(getLineThicknessSuggestion(width, height)).toBe(
            expectedLineThickness
        );
    });
});

describe('getCellId', () => {
    it('works as expected', () => {
        expect(getCellId(0, 0)).toBe('A1');
        expect(getCellId(0, 1)).toBe('A2');
        expect(getCellId(3, 100)).toBe('D101');
        expect(getCellId(25, 4)).toBe('Z5');
        expect(getCellId(26, 4)).toBe('AA5');
        expect(getCellId(52, 4)).toBe('BA5');
        expect(getCellId(54, 4)).toBe('BC5');
        expect(getCellId(701, 4)).toBe('ZZ5');
    });
});

describe('thresholdImage', () => {
    it('converts image to black and white correctly', () => {
        const width = 2;
        const height = 2;

        // [R, G, B, A, R, G, B, A, ...]
        const data = new Uint8ClampedArray([
            0, 0, 0, 255,

            255, 255, 255, 255,

            128, 128, 128, 255,

            200, 50, 50, 255,
        ]);

        const imageData = new ImageData(data, width, height);

        const min = 20;
        const max = 60;

        // @ts-expect-error mocked ImageData
        const result = thresholdImage(imageData, min, max);

        const expected = new Uint8ClampedArray([
            0, 0, 0, 255,

            0, 0, 0, 255,

            255, 255, 255, 255,

            0, 0, 0, 255,
        ]);

        // ...x - workaround for test issue (mixed ImageData implementations jsdom vs canvas)
        expect([...result.data]).toEqual([...expected]);
    });
});
