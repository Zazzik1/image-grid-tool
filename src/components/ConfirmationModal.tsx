import { COLOR } from '@/const';
import { Button, CloseButton, Dialog, Portal } from '@chakra-ui/react';
import { useCallback } from 'react';

type Props = {
    open: boolean;
    setOpen: (isOpen: boolean) => void;
    title: string;
    description: string;
    onConfirm: () => void;
    confirmButtonText: string;
};

const ConfirmationModal = ({
    open,
    setOpen,
    title,
    description,
    onConfirm,
    confirmButtonText = 'Confirm',
}: Props) => {
    const handleConfirm = useCallback(() => {
        setOpen(false);
        onConfirm();
    }, [setOpen, onConfirm]);

    const handleClose = useCallback(() => {
        setOpen(false);
    }, [setOpen]);

    return (
        <Dialog.Root
            placement={'center'}
            lazyMount
            open={open}
            onOpenChange={(e) => setOpen(e.open)}
            onExitComplete={handleClose}
        >
            <Portal>
                <Dialog.Backdrop />
                <Dialog.Positioner>
                    <Dialog.Content backgroundColor={COLOR.FG}>
                        <Dialog.Header>
                            <Dialog.Title>{title}</Dialog.Title>
                        </Dialog.Header>
                        <Dialog.Body>{description}</Dialog.Body>
                        <Dialog.Footer>
                            <Dialog.ActionTrigger asChild>
                                <Button
                                    variant="outline"
                                    data-test-name="confirm-modal-cancel"
                                >
                                    Cancel
                                </Button>
                            </Dialog.ActionTrigger>
                            <Button
                                colorPalette="red"
                                onClick={handleConfirm}
                                data-test-name="confirm-modal-confirm"
                            >
                                {confirmButtonText}
                            </Button>
                        </Dialog.Footer>
                        <Dialog.CloseTrigger asChild>
                            <CloseButton size="sm" />
                        </Dialog.CloseTrigger>
                    </Dialog.Content>
                </Dialog.Positioner>
            </Portal>
        </Dialog.Root>
    );
};

export default ConfirmationModal;
