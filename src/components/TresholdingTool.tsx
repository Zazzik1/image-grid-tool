import { COLOR } from '@/const';
import { Button, CloseButton, Dialog, Portal } from '@chakra-ui/react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { PiBinary } from 'react-icons/pi';
import { Slider } from './ui/slider';
import { thresholdImage } from '@/util';

type Props = {
    image: HTMLImageElement;
    onSave: (image: HTMLImageElement) => void;
};

const DEFAULT_MINIMUM = 20;
const DEFAULT_MAXIMUM = 100;

const TresholdingTool = ({ image, onSave }: Props) => {
    const [isOpen, setIsOpen] = useState(false);
    const bodyRef = useRef<HTMLDivElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [minimum, setMinimum] = useState(DEFAULT_MINIMUM);
    const [maximum, setMaximum] = useState(DEFAULT_MAXIMUM);

    const resetSettings = useCallback(() => {
        setMinimum(DEFAULT_MINIMUM);
        setMaximum(DEFAULT_MAXIMUM);
    }, []);

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
            const result = thresholdImage(imageData, minimum, maximum);
            ctx.putImageData(result, 0, 0);
        });
        return () => {
            clearTimeout(timeout);
        };
    }, [image, isOpen, minimum, maximum]);

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
                    data-test-name="tresholding-tool-open"
                >
                    <PiBinary />
                </Button>
            </Dialog.Trigger>
            <Portal>
                <Dialog.Backdrop />
                <Dialog.Positioner>
                    <Dialog.Content backgroundColor={COLOR.FG}>
                        <Dialog.Header>
                            <Dialog.Title>Tresholding</Dialog.Title>
                        </Dialog.Header>
                        <Dialog.Body
                            ref={bodyRef}
                            display="flex"
                            flexDirection="column"
                            gap="4"
                        >
                            <canvas ref={canvasRef} />
                            <Slider
                                value={[minimum, maximum]}
                                onValueChange={(e) => {
                                    setMinimum(e.value[0]);
                                    setMaximum(e.value[1]);
                                }}
                                minStepsBetweenThumbs={1}
                                maxW="600px"
                                marks={[
                                    { value: 0, label: '0%' },
                                    { value: 50, label: '50%' },
                                    { value: 100, label: '100%' },
                                ]}
                            />
                            {minimum}-{maximum}
                        </Dialog.Body>
                        <Dialog.Footer>
                            <Dialog.ActionTrigger asChild>
                                <Button variant="outline">Cancel</Button>
                            </Dialog.ActionTrigger>
                            <Button
                                colorPalette="blue"
                                onClick={handleSave}
                                data-test-name="tresholding-tool-save"
                            >
                                Save
                            </Button>
                        </Dialog.Footer>
                        <Dialog.CloseTrigger asChild>
                            <CloseButton
                                size="sm"
                                data-test-name="tresholding-tool-close"
                            />
                        </Dialog.CloseTrigger>
                    </Dialog.Content>
                </Dialog.Positioner>
            </Portal>
        </Dialog.Root>
    );
};

export default TresholdingTool;
