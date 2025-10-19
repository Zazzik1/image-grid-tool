import { getAspectRatio, getGridSuggestion, GridSuggestion } from '@/util';
import { describe, expect, it } from 'vitest';

type Result = ReturnType<typeof getAspectRatio>;

describe('getAspectRatio', () => {
    it.for([
        [1280, 720, 16, 9],
        [720, 1280, 9, 16],
        [1080, 1080, 1, 1],
        [2222, 3333, 2, 3],
        [3333, 2222, 3, 2],
        [400, 500, 4, 5],
        [500, 400, 5, 4],
        [853, 1280, 2, 3],
        [1280, 853, 3, 2],
        // [1200, 801, 3, 2], // TODO: known issue
        // [862, 1080, 5, 4], // TODO: known issue
    ])(
        '%i:%i -> %i:%i',
        ([width, height, expectedWidthComponent, expectedHeightComponent]) => {
            expect(getAspectRatio(width, height)).toStrictEqual<Result>({
                factorFound: true,
                label: `${expectedWidthComponent}:${expectedHeightComponent}`,
                widthComponent: expectedWidthComponent,
                heightComponent: expectedHeightComponent,
            });
        },
    );
    it('prime:prime -> finds a close aspect ratio', () => {
        const primeA = 20 ** 2 - 1;
        const primeB = 30 ** 2 - 1;
        const result = getAspectRatio(primeA, primeB);
        expect(result.factorFound).toBe(true);
        expect(result.label).toBe('4:9');
        expect(
            (result.widthComponent / result.heightComponent).toFixed(2),
        ).toBe((primeA / primeB).toFixed(2));
    });
});

describe('getGridSuggestion', () => {
    it.for([
        [1080, 1080, 6, 6],
        [720, 900, 5, 4],
        [720, 720, 4, 4],
        [89, 89, 4, 4],
        [736, 1204, 13, 8],
        [736, 1204, 13, 8],
        [4000, 6000, 30, 20],
        [1725, 1725, 9, 9],
        // [627, 209, 2, 6], // TODO: known issue - 1:0.5 instead of 1:1 cell aspect ratio
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
                    img.naturalHeight,
                ),
                grid: {
                    rows: expectedRows as number,
                    columns: expectedColumns as number,
                },
            });
        },
    );
});
