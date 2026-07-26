import { useCallback, useEffect, useState } from 'react';

type Snapshot = {
    toolName: string;
    image: HTMLImageElement;
    date: Date;
};

// TODO - fix lint in IDE to show missing vars in dependency arrays

// TODO - cover with tests!
const useOperationsHistory = () => {
    const [history, setHistory] = useState<Snapshot[]>([]);
    const [index, setIndex] = useState<number>(0);

    const append = useCallback((toolName: string, image: HTMLImageElement) => {
        setHistory((history) => {
            setIndex((index) => {
                if (!history.length) return 0;
                return index + 1; // TODO - it will not be true if index is not the last item!!!
            });
            return [
                ...history,
                {
                    toolName,
                    image,
                    date: new Date(),
                },
            ];
        });
    }, []);

    const clear = useCallback(() => {
        setHistory(() => []);
        setIndex(() => 0);
    }, []);

    const undo = useCallback(() => {
        setIndex((old) => Math.max(0, old - 1));
    }, []);

    const redo = useCallback(() => {
        setIndex((old) => Math.min(old + 1, history.length - 1));
    }, [history.length]);

    const snapshot: Snapshot | null = history[index];

    useEffect(() => {
        const onKeyDown = (e: KeyboardEvent) => {
            if (e.ctrlKey || e.metaKey) {
                if (e.key.toLowerCase() === 'z') {
                    undo();
                } else if (e.key.toLowerCase() === 'y') {
                    redo();
                }
            }
        };
        document.addEventListener('keydown', onKeyDown);
        return () => {
            document.removeEventListener('keydown', onKeyDown);
        };
    }, [undo, redo]);

    return {
        clear,
        append,
        undo,
        redo,
        index,
        setIndex,
        history,
        snapshot,
    };
};

export default useOperationsHistory;
