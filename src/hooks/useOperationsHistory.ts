import { useCallback, useEffect, useState } from 'react';

export type Snapshot = {
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
        const index = Math.max(0, state.index - 1);

        setState((old) => ({
            ...old,
            index,
        }));

        return state.history[index];
    }, [state.index, state.history]);

    const redo = useCallback(() => {
        const index = Math.min(state.index + 1, state.history.length - 1);

        setState((old) => ({
            ...old,
            index,
        }));

        return state.history[index];
    }, [state.index, state.history]);

    const { history, index } = state;
    const snapshot: Snapshot | null = history[index];

    useEffect(() => {
        const onKeyDown = (e: KeyboardEvent) => {
            if (e.ctrlKey || e.metaKey) {
                if (e.key.toLowerCase() === 'z') {
                    const prevSnapshot = undo();
                    if (prevSnapshot) postKeydownAction(prevSnapshot);
                } else if (e.key.toLowerCase() === 'y') {
                    const nextSnapshot = redo();
                    if (nextSnapshot) postKeydownAction(nextSnapshot);
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
