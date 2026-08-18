import { useCallback, useEffect, useState } from 'react';

type Snapshot = {
    toolName: string;
    image: HTMLImageElement;
    date: Date;
};

type State = {
    index: number;
    history: Snapshot[];
};

type Props = {
    postKeydownAction: (snapshot: Snapshot) => void;
};

const useOperationsHistory = ({ postKeydownAction }: Props) => {
    const [state, setState] = useState<State>({
        index: 0,
        history: [],
    });

    const setIndex = useCallback((index: number) => {
        setState((old) => ({ ...old, index }));
    }, []);

    const add = useCallback((toolName: string, image: HTMLImageElement) => {
        setState((old) => {
            // everything after index gets removed
            const index = old.history.length === 0 ? 0 : old.index + 1;
            const history = old.history.slice(0, index);
            history.push({
                toolName,
                image,
                date: new Date(),
            });
            return {
                ...old,
                index,
                history,
            };
        });
    }, []);

    const clear = useCallback(() => {
        setState(() => ({
            history: [],
            index: 0,
        }));
    }, []);

    const undo = useCallback(() => {
        let index: number = 0;
        setState((old) => {
            index = Math.max(0, old.index - 1);
            return {
                ...old,
                index,
            };
        });
        return state.history[index];
    }, [state.history]);

    const redo = useCallback(() => {
        let index: number = 0;
        setState((old) => {
            index = Math.min(old.index + 1, old.history.length - 1);
            return {
                ...old,
                index,
            };
        });
        return state.history[index];
    }, [state.history]);

    const { history, index } = state;
    const snapshot: Snapshot | null = history[index];

    useEffect(() => {
        const onKeyDown = (e: KeyboardEvent) => {
            if (e.ctrlKey || e.metaKey) {
                if (e.key.toLowerCase() === 'z') {
                    const prevSnapshot = undo();
                    postKeydownAction(prevSnapshot);
                } else if (e.key.toLowerCase() === 'y') {
                    const nextSnapshot = redo();
                    postKeydownAction(nextSnapshot);
                }
            }
        };
        document.addEventListener('keydown', onKeyDown);
        return () => {
            document.removeEventListener('keydown', onKeyDown);
        };
    }, [undo, redo, postKeydownAction]);

    return {
        clear,
        add,
        undo,
        redo,
        index,
        setIndex,
        history,
        snapshot,
    };
};

export default useOperationsHistory;
