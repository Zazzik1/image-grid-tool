import { COLOR } from '@/const';
import { Button, CloseButton, Dialog, Portal } from '@chakra-ui/react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { PiSpiral } from 'react-icons/pi';
import { applyLogPolarTransform } from '@/util';

type Props = {
    image: HTMLImageElement;
    onSave: (image: HTMLImageElement) => void;
};

const LogTransformTool = ({ image, onSave }: Props) => {
    const [isOpen, setIsOpen] = useState(false);
    const bodyRef = useRef<HTMLDivElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    const resetSettings = useCallback(() => {}, []);

    const handleSave = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        const imageData = ctx.getImageData(
            0,
            0,
            image.naturalWidth,
            image.naturalHeight,
        );
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = imageData.width;
        tempCanvas.height = imageData.height;
        const tempCtx = tempCanvas.getContext('2d');
        if (!tempCtx) return;
        const img = new Image();
        img.onload = () => {
            onSave(img);
            setIsOpen(false);
            resetSettings();
        };
        tempCtx.putImageData(imageData, 0, 0);
        img.src = tempCanvas.toDataURL();
    }, [onSave, image, resetSettings]);

    useEffect(() => {
        if (!isOpen) return;
        const timeout = setTimeout(() => {
            const canvas = canvasRef.current;
            if (!canvas) return;
            const ctx = canvas.getContext('2d');
            if (!ctx) return;

            canvas.width = image.naturalWidth;
            canvas.height = image.naturalHeight;
            const height = 600;
            canvas.style.height = `${height}px`;
            canvas.style.width = `${
                (image.naturalWidth / image.naturalHeight) * height
            }px`;
            ctx.drawImage(image, 0, 0);

            const imageData = ctx.getImageData(
                0,
                0,
                canvas.width,
                canvas.height,
            );
            const result = applyLogPolarTransform(imageData);
            ctx.putImageData(result, 0, 0);
        });
        return () => {
            clearTimeout(timeout);
        };
    }, [image, isOpen]);

    return (
        <Dialog.Root
            size="full"
            open={isOpen}
            onOpenChange={(e) => setIsOpen(e.open)}
            onExitComplete={resetSettings}
        >
            <Dialog.Trigger asChild>
                <Button
                    size="sm"
                    variant="surface"
                    data-test-name="log-transform-tool-open"
                >
                    <PiSpiral />
                </Button>
            </Dialog.Trigger>
            <Portal>
                <Dialog.Backdrop />
                <Dialog.Positioner>
                    <Dialog.Content backgroundColor={COLOR.FG}>
                        <Dialog.Header>
                            <Dialog.Title>{'Log transform'}</Dialog.Title>
                        </Dialog.Header>
                        <Dialog.Body
                            ref={bodyRef}
                            display="flex"
                            flexDirection="column"
                            gap="4"
                        >
                            <canvas ref={canvasRef} />
                        </Dialog.Body>
                        <Dialog.Footer>
                            <Dialog.ActionTrigger asChild>
                                <Button variant="outline">Cancel</Button>
                            </Dialog.ActionTrigger>
                            <Button
                                colorPalette="blue"
                                onClick={handleSave}
                                data-test-name="log-transform-tool-save"
                            >
                                Save
                            </Button>
                        </Dialog.Footer>
                        <Dialog.CloseTrigger asChild>
                            <CloseButton
                                size="sm"
                                data-test-name="log-transform-tool-close"
                            />
                        </Dialog.CloseTrigger>
                    </Dialog.Content>
                </Dialog.Positioner>
            </Portal>
        </Dialog.Root>
    );
};

export default LogTransformTool;
