import {
    Button,
    CloseButton,
    Dialog,
    Checkbox,
    Portal,
    NumberInput,
    HStack,
    Field,
} from '@chakra-ui/react';
import { useCallback, useEffect, useRef, useState } from 'react';

type Props = {
    image: HTMLImageElement;
    onSave: (image: HTMLImageElement) => void;
};

const CroppingTool = ({ image, onSave }: Props) => {
    const bodyRef = useRef<HTMLDivElement>(null);
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const canvasOverlayRef = useRef<HTMLCanvasElement | null>(null);
    const [open, setOpen] = useState(false);
    const [startPoint, setStartPoint] = useState<{
        x: number;
        y: number;
    } | null>(null);
    const [endPoint, setEndPoint] = useState<{
        x: number;
        y: number;
    } | null>(null);
    const [aspectRatio, setAspectRatio] = useState<{
        force: boolean;
        widthComponent: number;
        heightComponent: number;
    }>({
        force: true,
        widthComponent: 1,
        heightComponent: 1,
    });

    const handleSave = useCallback(() => {
        if (!startPoint || !endPoint) return image; // no need to crop
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        const imageData = ctx.getImageData(
            startPoint.x,
            startPoint.y,
            endPoint.x - startPoint.x,
            endPoint.y - startPoint.y,
        );
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = imageData.width;
        tempCanvas.height = imageData.height;
        const tempCtx = tempCanvas.getContext('2d');
        if (!tempCtx) return;
        const img = new Image();
        img.onload = () => {
            onSave(img);
            setStartPoint(null);
            setEndPoint(null);
            setOpen(false);
            setAspectRatio({
                force: true,
                heightComponent: 1,
                widthComponent: 1,
            });
        };
        tempCtx.putImageData(imageData, 0, 0);
        img.src = tempCanvas.toDataURL();
    }, [onSave, image, startPoint, endPoint]);

    useEffect(() => {
        const listeners: {
            element: HTMLCanvasElement;
            parameters: Parameters<HTMLCanvasElement['removeEventListener']>;
        }[] = [];
        const timeout = setTimeout(() => {
            const canvas = canvasRef.current;
            const canvasOverlay = canvasOverlayRef.current;
            const body = bodyRef.current;
            if (canvas && body && canvasOverlay) {
                canvas.width = image.naturalWidth;
                canvas.height = image.naturalHeight;
                const height = 600;
                canvas.style.height = `${height}px`;
                canvas.style.width = `${
                    (image.naturalWidth / image.naturalHeight) * height
                }px`;

                canvasOverlay.width = image.naturalWidth;
                canvasOverlay.height = image.naturalHeight;
                canvasOverlay.style.width = canvas.style.width;
                canvasOverlay.style.height = canvas.style.height;
                canvasOverlay.style.position = 'absolute';
                canvasOverlay.style.top = `${canvas.offsetTop}px`;
                canvasOverlay.style.left = `${canvas.offsetLeft}px`;
                canvasOverlay.style.outline = '1px solid #444444';

                const ctx = canvas.getContext('2d');
                if (ctx) {
                    ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
                }

                const overlayCtx = canvasOverlay.getContext('2d');
                if (overlayCtx) {
                    overlayCtx.clearRect(
                        0,
                        0,
                        canvasOverlay.width,
                        canvasOverlay.height,
                    );
                    if (startPoint && endPoint) {
                        overlayCtx.fillStyle = '#0000006e';
                        overlayCtx.fillRect(
                            startPoint.x,
                            startPoint.y,
                            endPoint.x - startPoint.x,
                            endPoint.y - startPoint.y,
                        );
                    }
                    const onMouseDown = (e: MouseEvent) => {
                        const x = Math.floor(
                            (e.offsetX * canvasOverlay.width) /
                                +canvasOverlay.style.width.split('px')[0],
                        );
                        const y = Math.floor(
                            (e.offsetY * canvasOverlay.height) /
                                +canvasOverlay.style.height.split('px')[0],
                        );
                        if (!startPoint && !endPoint) {
                            setStartPoint({ x, y });
                        }
                        if (startPoint && !endPoint) {
                            const y =
                                (aspectRatio.heightComponent /
                                    aspectRatio.widthComponent) *
                                    (x - startPoint.x) +
                                startPoint.y;
                            if (aspectRatio.force) {
                                setEndPoint({
                                    x,
                                    y:
                                        y <= canvasOverlay.height
                                            ? y
                                            : canvasOverlay.height,
                                });
                            } else {
                                setEndPoint({ x, y });
                            }
                        }
                    };
                    const onMouseMove = (e: MouseEvent) => {
                        const x =
                            (e.offsetX * canvasOverlay.width) /
                            +canvasOverlay.style.width.split('px')[0];
                        const y =
                            (e.offsetY * canvasOverlay.height) /
                            +canvasOverlay.style.height.split('px')[0];
                        overlayCtx.clearRect(
                            0,
                            0,
                            canvasOverlay.width,
                            canvasOverlay.height,
                        );
                        if (startPoint) {
                            overlayCtx.fillStyle = '#0000006e';
                            overlayCtx.fillRect(
                                startPoint.x,
                                startPoint.y,
                                (endPoint?.x ?? x) - startPoint.x,
                                (endPoint?.y ??
                                    (aspectRatio.force
                                        ? (aspectRatio.heightComponent /
                                              aspectRatio.widthComponent) *
                                              (x - startPoint.x) +
                                          startPoint.y
                                        : y)) - startPoint.y,
                            );
                        }
                        overlayCtx.strokeStyle = 'yellow';
                        const lineWidth = 3;
                        overlayCtx.lineWidth = lineWidth;
                        overlayCtx.beginPath();
                        overlayCtx.moveTo(0, y - lineWidth / 2);
                        overlayCtx.lineTo(
                            canvasOverlay.width,
                            y - lineWidth / 2,
                        );
                        overlayCtx.stroke();
                        overlayCtx.closePath();
                        overlayCtx.beginPath();
                        overlayCtx.moveTo(x - lineWidth / 2, 0);
                        overlayCtx.lineTo(
                            x - lineWidth / 2,
                            canvasOverlay.height,
                        );
                        overlayCtx.stroke();
                        overlayCtx.closePath();
                    };
                    canvasOverlay.addEventListener('mousedown', onMouseDown);
                    canvasOverlay.addEventListener('mousemove', onMouseMove);
                    listeners.push({
                        element: canvasOverlay,
                        parameters: ['mousemove', onMouseMove as EventListener],
                    });
                    listeners.push({
                        element: canvasOverlay,
                        parameters: ['mousedown', onMouseDown as EventListener],
                    });
                }
            }
        });
        return () => {
            clearTimeout(timeout);
            listeners.forEach((n) => {
                n.element.removeEventListener(...n.parameters);
            });
        };
    }, [
        image,
        open,
        endPoint,
        startPoint,
        aspectRatio.force,
        aspectRatio.widthComponent,
        aspectRatio.heightComponent,
    ]);
    return (
        <Dialog.Root
            size="lg"
            lazyMount
            open={open}
            onOpenChange={(e) => setOpen(e.open)}
        >
            <Dialog.Trigger asChild>
                <Button
                    size="sm"
                    variant="outline"
                >
                    Crop image
                </Button>
            </Dialog.Trigger>
            <Portal>
                <Dialog.Backdrop />
                <Dialog.Positioner>
                    <Dialog.Content>
                        <Dialog.Header>
                            <Dialog.Title>Crop the image </Dialog.Title>
                        </Dialog.Header>
                        <Dialog.Body ref={bodyRef}>
                            <canvas ref={canvasRef} />
                            <canvas ref={canvasOverlayRef} />
                            <HStack
                                marginTop={2}
                                alignItems="end"
                            >
                                <Field.Root width="max-content">
                                    <Field.Label>X</Field.Label>
                                    <NumberInput.Root
                                        size="sm"
                                        maxW="100px"
                                        disabled={!aspectRatio.force}
                                        value={aspectRatio.widthComponent.toString()}
                                        min={1}
                                        onValueChange={(e: {
                                            valueAsNumber: number;
                                        }) => {
                                            const value = e.valueAsNumber;
                                            if (
                                                Number.isNaN(value) ||
                                                value < 0
                                            )
                                                return setAspectRatio(
                                                    (old) => ({
                                                        ...old,
                                                        widthComponent: 1,
                                                    }),
                                                );
                                            return setAspectRatio((old) => ({
                                                ...old,
                                                widthComponent: value,
                                            }));
                                        }}
                                    >
                                        <NumberInput.Control />
                                        <NumberInput.Input />
                                    </NumberInput.Root>
                                </Field.Root>

                                <Field.Root width="max-content">
                                    <Field.Label>Y</Field.Label>
                                    <NumberInput.Root
                                        size="sm"
                                        maxW="100px"
                                        disabled={!aspectRatio.force}
                                        value={aspectRatio.heightComponent.toString()}
                                        min={1}
                                        onValueChange={(e: {
                                            valueAsNumber: number;
                                        }) => {
                                            const value = e.valueAsNumber;
                                            if (
                                                Number.isNaN(value) ||
                                                value < 0
                                            )
                                                return setAspectRatio(
                                                    (old) => ({
                                                        ...old,
                                                        heightComponent: 1,
                                                    }),
                                                );
                                            return setAspectRatio((old) => ({
                                                ...old,
                                                heightComponent: value,
                                            }));
                                        }}
                                    >
                                        <NumberInput.Control />
                                        <NumberInput.Input />
                                    </NumberInput.Root>
                                </Field.Root>
                                <Checkbox.Root
                                    size="sm"
                                    checked={aspectRatio.force}
                                    onCheckedChange={(e) =>
                                        setAspectRatio((old) => ({
                                            ...old,
                                            force: !!e.checked,
                                        }))
                                    }
                                >
                                    <Checkbox.HiddenInput />
                                    <Checkbox.Control />
                                    <Checkbox.Label>
                                        Force aspect ratio X:Y (
                                        {aspectRatio.widthComponent}:
                                        {aspectRatio.heightComponent})
                                    </Checkbox.Label>
                                </Checkbox.Root>
                            </HStack>
                            <Button
                                marginTop="3"
                                variant="surface"
                                size="xs"
                                disabled={!startPoint && !endPoint}
                                onClick={() => {
                                    setStartPoint(null);
                                    setEndPoint(null);
                                }}
                            >
                                Reset points
                            </Button>
                        </Dialog.Body>
                        <Dialog.Footer>
                            <Dialog.ActionTrigger asChild>
                                <Button variant="outline">Cancel</Button>
                            </Dialog.ActionTrigger>
                            <Button
                                colorPalette="green"
                                onClick={handleSave}
                            >
                                Save
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

export default CroppingTool;
