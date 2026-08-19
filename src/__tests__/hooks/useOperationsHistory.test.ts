import { vi, describe, expect, test } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import useOperationsHistory, { Snapshot } from '@/hooks/useOperationsHistory';

describe('useOperationsHistory', () => {
    test('history is empty by default', () => {
        const { result } = renderHook(() =>
            useOperationsHistory({ postKeydownAction: () => {} })
        );
        expect(result.current.history.length).toBe(0);
    });
    test('undo works as expected', () => {
        const { result } = renderHook(() =>
            useOperationsHistory({ postKeydownAction: () => {} })
        );
        const img = new Image();

        act(() => {
            result.current.add('load image', img);
            result.current.add('do nothing', img);
        });
        expect(result.current.snapshot.toolName).toBe('do nothing');

        act(() => {
            result.current.undo();
        });
        expect(result.current.snapshot.toolName).toBe('load image');

        act(() => {
            result.current.undo();
        });
        expect(result.current.snapshot.toolName).toBe('load image');
    });
    test('redo works as expected', () => {
        const { result } = renderHook(() =>
            useOperationsHistory({ postKeydownAction: () => {} })
        );
        const img = new Image();

        act(() => {
            result.current.add('load image', img);
            result.current.add('do nothing', img);
        });
        act(() => {
            result.current.setIndex(0);
        });
        expect(result.current.snapshot.toolName).toBe('load image');

        act(() => {
            result.current.redo();
        });
        expect(result.current.snapshot.toolName).toBe('do nothing');

        act(() => {
            result.current.redo();
        });
        expect(result.current.snapshot.toolName).toBe('do nothing');
    });
    test('undo returns a previous snapshot', () => {
        const { result } = renderHook(() =>
            useOperationsHistory({ postKeydownAction: () => {} })
        );

        const imgA = new Image();
        const imgB = new Image();

        act(() => {
            result.current.add('load image', imgA);
            result.current.add('do nothing', imgB);
        });

        let snapshot: Snapshot | undefined;

        act(() => {
            snapshot = result.current.undo();
        });

        expect(snapshot?.image).toEqual(imgA);
        expect(snapshot?.toolName).toBe('load image');
    });

    test('redo returns the next snapshot', () => {
        const { result } = renderHook(() =>
            useOperationsHistory({ postKeydownAction: () => {} })
        );

        const imgA = new Image();
        const imgB = new Image();

        act(() => {
            result.current.add('load image', imgA);
            result.current.add('do nothing', imgB);
            result.current.setIndex(0);
        });

        let snapshot: Snapshot | undefined;

        act(() => {
            snapshot = result.current.redo();
        });

        expect(snapshot?.image).toEqual(imgB);
        expect(snapshot?.toolName).toBe('do nothing');
    });

    test('ctrl+z calls undo and postKeydownAction', () => {
        const postKeydownAction = vi.fn();

        const { result } = renderHook(() =>
            useOperationsHistory({ postKeydownAction })
        );

        const img = new Image();

        act(() => {
            result.current.add('load image', img);
            result.current.add('do nothing', img);
        });

        act(() => {
            document.dispatchEvent(
                new KeyboardEvent('keydown', {
                    key: 'z',
                    ctrlKey: true,
                })
            );
        });

        expect(postKeydownAction).toHaveBeenCalledTimes(1);
        expect(postKeydownAction).toHaveBeenCalledWith(
            expect.objectContaining({
                toolName: 'load image',
                image: img,
            })
        );
    });

    test('ctrl+y calls redo and postKeydownAction', () => {
        const postKeydownAction = vi.fn();

        const { result } = renderHook(() =>
            useOperationsHistory({ postKeydownAction })
        );

        const img = new Image();

        act(() => {
            result.current.add('load image', img);
            result.current.add('do nothing', img);
            result.current.setIndex(0);
        });

        act(() => {
            document.dispatchEvent(
                new KeyboardEvent('keydown', {
                    key: 'y',
                    ctrlKey: true,
                })
            );
        });

        expect(postKeydownAction).toHaveBeenCalledTimes(1);
        expect(postKeydownAction).toHaveBeenCalledWith(
            expect.objectContaining({
                toolName: 'do nothing',
                image: img,
            })
        );
    });

    test('clear works as expected', () => {
        const { result } = renderHook(() =>
            useOperationsHistory({ postKeydownAction: () => {} })
        );
        const img = new Image();
        act(() => {
            result.current.add('load image', img);
            result.current.add('do nothing', img);
        });
        expect(result.current.history.length).toBe(2);
        expect(result.current.snapshot.toolName).toBe('do nothing');
        act(() => {
            result.current.clear();
        });
        expect(result.current.history.length).toBe(0);
        expect(result.current.snapshot).toBe(undefined);
    });
    test('add adds new entry', () => {
        const { result } = renderHook(() =>
            useOperationsHistory({ postKeydownAction: () => {} })
        );
        expect(result.current.index).toBe(0);
        const catA = new Image();
        const catB = new Image();
        const catC = new Image();
        act(() => {
            result.current.add('meow', catA);
        });
        expect(result.current.snapshot.toolName).toBe('meow');
        expect(result.current.snapshot.image).toBe(catA);
        expect(result.current.index).toBe(0);

        act(() => {
            result.current.add('meoww', catB);
        });
        expect(result.current.snapshot.toolName).toBe('meoww');
        expect(result.current.snapshot.image).toBe(catB);
        expect(result.current.index).toBe(1);

        act(() => {
            result.current.add('meowww', catC);
        });
        expect(result.current.snapshot.toolName).toBe('meowww');
        expect(result.current.snapshot.image).toBe(catC);
        expect(result.current.index).toBe(2);
    });
    test('add adds new entry when index is not the last available index', () => {
        const { result } = renderHook(() =>
            useOperationsHistory({ postKeydownAction: () => {} })
        );
        const catA = new Image();
        const catB = new Image();
        const catC = new Image();

        act(() => {
            result.current.add('meow', catA);
            result.current.add('meoww', catB);
        });
        act(() => {
            result.current.setIndex(0);
        });
        expect(result.current.snapshot.toolName).toBe('meow');
        expect(result.current.snapshot.image).toBe(catA);

        act(() => {
            result.current.add('meowww', catC);
        });
        // cat B is expected to be removed:
        expect(result.current.snapshot.toolName).toBe('meowww');
        expect(result.current.snapshot.image).toBe(catC);
        expect(result.current.history.length).toBe(2);
        expect(result.current.history[0].toolName).toBe('meow');
        expect(result.current.history[1].toolName).toBe('meowww');
    });
});
