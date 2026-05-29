import { COLOR } from '@/const';
import { Button, CloseButton, Dialog, Portal } from '@chakra-ui/react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { IoIosColorPalette } from 'react-icons/io';
import { Slider } from '../ui/slider';

type Props = {
    image: HTMLImageElement;
    onSave: (image: HTMLImageElement) => void;
};

const DEFAULT_HUE = 0;
const DEFAULT_SATURATION = 1;
const DEFAULT_LIGHTNESS = 1;

const HSLTool = ({ image, onSave }: Props) => {
    const [isOpen, setIsOpen] = useState(false);
    const bodyRef = useRef<HTMLDivElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [hue, setHue] = useState(DEFAULT_HUE);
    const [saturation, setSaturation] = useState(DEFAULT_SATURATION);
    const [lightness, setLightness] = useState(DEFAULT_LIGHTNESS);

    const resetSettings = useCallback(() => {
        setHue(DEFAULT_HUE);
        setSaturation(DEFAULT_SATURATION);
        setLightness(DEFAULT_LIGHTNESS);
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

            ctx.filter = `
            hue-rotate(${hue}deg)
            saturate(${saturation})
            brightness(${lightness})
            `;
            ctx.drawImage(image, 0, 0);
        });
        return () => {
            clearTimeout(timeout);
        };
    }, [image, isOpen, hue, saturation, lightness]);

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
                    data-test-name="hsl-tool-open"
                >
                    <IoIosColorPalette />
                </Button>
            </Dialog.Trigger>
            <Portal>
                <Dialog.Backdrop />
                <Dialog.Positioner>
                    <Dialog.Content backgroundColor={COLOR.FG}>
                        <Dialog.Header>
                            <Dialog.Title>HSL tools</Dialog.Title>
                        </Dialog.Header>
                        <Dialog.Body
                            ref={bodyRef}
                            display="flex"
                            flexDirection="column"
                            gap="4"
                        >
                            <canvas ref={canvasRef} />
                            <Slider
                                label="Hue rotate"
                                value={[hue]}
                                onValueChange={(e) => {
                                    setHue(e.value[0]);
                                }}
                                min={0}
                                max={360}
                                minStepsBetweenThumbs={1}
                                maxW="600px"
                                marks={[
                                    { value: 0, label: '0°' },
                                    { value: 90, label: '90°' },
                                    { value: 180, label: '180°' },
                                    { value: 270, label: '270°' },
                                    { value: 360, label: '360°' },
                                ]}
                            />
                            {hue}%
                            <Slider
                                label="Saturation"
                                value={[saturation]}
                                onValueChange={(e) => {
                                    setSaturation(e.value[0]);
                                }}
                                min={0}
                                max={3}
                                step={0.01}
                                maxW="600px"
                                marks={[
                                    { value: 0, label: '0%' },
                                    { value: 1, label: '100%' },
                                    { value: 2, label: '200%' },
                                    { value: 3, label: '300%' },
                                ]}
                            />
                            {(saturation * 100).toFixed(0)}%
                            <Slider
                                label="Lightness"
                                value={[lightness]}
                                onValueChange={(e) => {
                                    setLightness(e.value[0]);
                                }}
                                min={0}
                                max={3}
                                step={0.01}
                                maxW="600px"
                                marks={[
                                    { value: 0, label: '0%' },
                                    { value: 1, label: '100%' },
                                    { value: 2, label: '200%' },
                                    { value: 3, label: '300%' },
                                ]}
                            />
                            {(lightness * 100).toFixed(0)}%
                        </Dialog.Body>
                        <Dialog.Footer>
                            <Dialog.ActionTrigger asChild>
                                <Button variant="outline">Cancel</Button>
                            </Dialog.ActionTrigger>
                            <Button
                                colorPalette="blue"
                                onClick={handleSave}
                                data-test-name="hsl-tool-save"
                            >
                                Save
                            </Button>
                        </Dialog.Footer>
                        <Dialog.CloseTrigger asChild>
                            <CloseButton
                                size="sm"
                                data-test-name="hsl-tool-close"
                            />
                        </Dialog.CloseTrigger>
                    </Dialog.Content>
                </Dialog.Positioner>
            </Portal>
        </Dialog.Root>
    );
};

export default HSLTool;
