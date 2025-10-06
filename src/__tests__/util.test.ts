import { getAspectRatio } from '@/util';
import { describe, expect, it } from 'vitest';

type Result = ReturnType<typeof getAspectRatio>;

describe('getAspectRatio', () => {
    it('1280:720 -> 16:9', () => {
        expect(getAspectRatio(1280, 720)).toStrictEqual<Result>({
            factorFound: true,
            label: '16:9',
            widthComponent: 16,
            heightComponent: 9,
        });
    });
    it('720:1280 -> 9:16', () => {
        expect(getAspectRatio(720, 1280)).toStrictEqual<Result>({
            factorFound: true,
            label: '9:16',
            widthComponent: 9,
            heightComponent: 16,
        });
    });
    it('1080:1080 -> 1:1', () => {
        expect(getAspectRatio(1080, 1080)).toStrictEqual<Result>({
            factorFound: true,
            label: '1:1',
            widthComponent: 1,
            heightComponent: 1,
        });
    });
    it('2222:3333 -> 2:3', () => {
        expect(getAspectRatio(2222, 3333)).toStrictEqual<Result>({
            factorFound: true,
            label: '2:3',
            widthComponent: 2,
            heightComponent: 3,
        });
    });
    it('3333:2222 -> 3:2', () => {
        expect(getAspectRatio(3333, 2222)).toStrictEqual<Result>({
            factorFound: true,
            label: '3:2',
            widthComponent: 3,
            heightComponent: 2,
        });
    });
    it('400:500 -> 4:5', () => {
        expect(getAspectRatio(400, 500)).toStrictEqual<Result>({
            factorFound: true,
            label: '4:5',
            widthComponent: 4,
            heightComponent: 5,
        });
    });
    it('500:400 -> 5:4', () => {
        expect(getAspectRatio(500, 400)).toStrictEqual<Result>({
            factorFound: true,
            label: '5:4',
            widthComponent: 5,
            heightComponent: 4,
        });
    });
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
