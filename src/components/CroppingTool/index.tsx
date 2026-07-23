import { COLOR } from '@/const';
import {
    Button,
    CloseButton,
    Dialog,
    Checkbox,
    Portal,
    NumberInput,
    HStack,
    Heading,
    Text,
    Box,
} from '@chakra-ui/react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { FaCropSimple } from 'react-icons/fa6';
import {
    CropAreaBoundary,
    CropAreaGrid,
    CropAreaHandles,
    CropAreaProps,
} from './CropArea';
import { CANVAS_HEIGHT } from './const';

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
    }>({
        x: image.width * 0.1,
        y: image.height * 0.1,
    });
    const [endPoint, setEndPoint] = useState<{
        x: number;
        y: number;
    }>({
        x: image.width * 0.9,
        y: image.height * 0.9,
    });
    const [cursor, setCursor] = useState('default');
    const area = useRef<{
        x1: number;
        y1: number;
        x2: number;
        y2: number;
    }>({
        x1: image.width * 0.1,
        y1: image.height * 0.1,
        x2: image.width * 0.9,
        y2: image.height * 0.9,
    });
    const [aspectRatio, setAspectRatio] = useState<{
        force: boolean;
        widthComponent: number;
        heightComponent: number;
    }>({
        force: true,
        widthComponent: 1,
        heightComponent: 1,
    });

    const setupInitialCropArea = useCallback(() => {
        let width = image.width;
        let height = image.height;
        if (aspectRatio.force) {
            const f = aspectRatio.widthComponent / aspectRatio.heightComponent;
            if (image.width > image.height) {
                height = image.height;
                width = height * f;
                if (width > image.width * 0.9) {
                    width = width / f;
                    height = height / f;
                }
            } else {
                width = image.width;
                height = width / f;
                if (height > image.height * 0.9) {
                    height = height * f;
                    width = width * f;
                }
            }
        }
        const x1 = width * 0.1;
        const y1 = height * 0.1;
        let x2 = width * 0.9;
        let y2 = height * 0.9;

        setStartPoint({
            x: x1,
            y: y1,
        });
        setEndPoint({
            x: x2,
            y: y2,
        });
        area.current = { x1, y1, x2, y2 };
    }, [
        image.width,
        image.height,
        aspectRatio.force,
        aspectRatio.widthComponent,
        aspectRatio.heightComponent,
    ]);

    const handleResetPoints = useCallback(() => {
        setupInitialCropArea();
        renderBackdrop();
        setAspectRatio({
            force: true,
            heightComponent: 1,
            widthComponent: 1,
        });
    }, [image]);

    const handleClose = useCallback(() => {
        handleResetPoints();
        setOpen(false);
    }, [handleResetPoints]);

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
            endPoint.y - startPoint.y
        );
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = imageData.width;
        tempCanvas.height = imageData.height;
        const tempCtx = tempCanvas.getContext('2d');
        if (!tempCtx) return;
        const img = new Image();
        img.onload = () => {
            onSave(img);
            handleClose();
        };
        tempCtx.putImageData(imageData, 0, 0);
        img.src = tempCanvas.toDataURL();
    }, [onSave, image, startPoint, endPoint, handleClose]);

    const renderBackdrop = useCallback(() => {
        const canvasOverlay = canvasOverlayRef.current;
        if (!canvasOverlay) return;
        const overlayCtx = canvasOverlay.getContext('2d');
        if (!overlayCtx) return;

        const w = canvasOverlay.width;
        const h = canvasOverlay.height;
        const { x1, x2, y1, y2 } = area.current;

        overlayCtx.clearRect(0, 0, w, h);
        overlayCtx.fillStyle = '#0000006e';
        overlayCtx.fillRect(0, 0, w, h);
        overlayCtx.clearRect(x1, y1, x2 - x1, y2 - y1);
    }, []);

    useEffect(() => {
        setupInitialCropArea();
    }, [setupInitialCropArea]);

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
                canvas.style.height = `${CANVAS_HEIGHT}px`;
                canvas.style.width = `${
                    (image.naturalWidth / image.naturalHeight) * CANVAS_HEIGHT
                }px`;

                canvasOverlay.width = image.naturalWidth;
                canvasOverlay.height = image.naturalHeight;
                canvasOverlay.style.width = canvas.style.width;
                canvasOverlay.style.height = canvas.style.height;
                canvasOverlay.style.position = 'absolute';
                canvasOverlay.style.top = `${canvas.offsetTop}px`;
                canvasOverlay.style.left = `${canvas.offsetLeft}px`;
                canvasOverlay.style.outline = '1px solid #444444';

                renderBackdrop();

                const ctx = canvas.getContext('2d');
                if (ctx) {
                    ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
                }

                const overlayCtx = canvasOverlay.getContext('2d');
                if (overlayCtx) {
                    let movedCorner:
                        | 'top-left'
                        | 'top-right'
                        | 'bottom-left'
                        | 'bottom-right'
                        | 'inside-area'
                        | null = null;
                    const onMouseDown = (e: MouseEvent) => {
                        const x = Math.floor(
                            (e.offsetX * canvasOverlay.width) /
                                +canvasOverlay.style.width.split('px')[0]
                        );
                        const y = Math.floor(
                            (e.offsetY * canvasOverlay.height) /
                                +canvasOverlay.style.height.split('px')[0]
                        );

                        const { x1, x2, y1, y2 } = area.current;
                        if (x >= x1 && x <= x2 && y >= y1 && y <= y2) {
                            movedCorner = 'inside-area';
                        } else {
                            const distances = {
                                topLeft: Math.sqrt(
                                    Math.pow(x1 - x, 2) + Math.pow(y1 - y, 2)
                                ),
                                topRight: Math.sqrt(
                                    Math.pow(x2 - x, 2) + Math.pow(y1 - y, 2)
                                ),
                                bottomLeft: Math.sqrt(
                                    Math.pow(x1 - x, 2) + Math.pow(y2 - y, 2)
                                ),
                                bottomRight: Math.sqrt(
                                    Math.pow(x2 - x, 2) + Math.pow(y2 - y, 2)
                                ),
                            };
                            const smallestDistance = Math.min(
                                ...Object.values(distances)
                            );
                            if (smallestDistance === distances.topLeft) {
                                movedCorner = 'top-left';
                            } else if (
                                smallestDistance === distances.topRight
                            ) {
                                movedCorner = 'top-right';
                            } else if (
                                smallestDistance === distances.bottomLeft
                            ) {
                                movedCorner = 'bottom-left';
                            } else if (
                                smallestDistance === distances.bottomRight
                            ) {
                                movedCorner = 'bottom-right';
                            }
                        }
                    };
                    const onMouseMove = (e: MouseEvent) => {
                        const rect = canvasOverlay.getBoundingClientRect();

                        const scaleX = canvasOverlay.width / rect.width;
                        const scaleY = canvasOverlay.height / rect.height;

                        const dx = e.movementX * scaleX;
                        const dy = e.movementY * scaleY;

                        const old = {
                            ...area.current,
                        };
                        const ratio =
                            aspectRatio.heightComponent /
                            aspectRatio.widthComponent;

                        if (movedCorner === 'inside-area') {
                            let x1 = old.x1 + dx;
                            let x2 = old.x2 + dx;
                            let y1 = old.y1 + dy;
                            let y2 = old.y2 + dy;

                            if (x1 < 0) {
                                x1 = 0;
                                x2 = old.x2 - old.x1;
                            }
                            if (x2 > canvasOverlay.width) {
                                x2 = canvasOverlay.width;
                                x1 = canvasOverlay.width - (old.x2 - old.x1);
                            }
                            if (y1 < 0) {
                                y1 = 0;
                                y2 = old.y2 - old.y1;
                            }
                            if (y2 > canvasOverlay.height) {
                                y2 = canvasOverlay.height;
                                y1 = canvasOverlay.height - (old.y2 - old.y1);
                            }

                            if (x1 + 60 > old.x2) x1 = old.x1;
                            if (y1 + 60 > old.y2) y1 = old.y1;

                            area.current = {
                                x1,
                                x2,
                                y1,
                                y2,
                            };

                            renderBackdrop();
                            setStartPoint({
                                x: x1,
                                y: y1,
                            });
                            setEndPoint({
                                x: x2,
                                y: y2,
                            });
                            setCursor('move');
                        } else if (movedCorner === 'top-left') {
                            let x1 = old.x1 + dx;
                            let y1 = old.y1 + dy;

                            if (x1 < 0) x1 = 0;
                            if (y1 < 0) y1 = 0;

                            if (aspectRatio.force) {
                                const widthFromX = old.x2 - x1;
                                const heightFromY = old.y2 - y1;

                                if (Math.abs(dx) > Math.abs(dy / ratio)) {
                                    const newHeight = widthFromX * ratio;
                                    y1 = old.y2 - newHeight;
                                    if (y1 < 0) {
                                        y1 = old.y1;
                                        x1 = old.x1;
                                    }
                                } else {
                                    const newHeight = heightFromY;
                                    const newWidth = newHeight / ratio;
                                    x1 = old.x2 - newWidth;
                                    if (x1 < 0) {
                                        y1 = old.y1;
                                        x1 = old.x1;
                                    }
                                }
                            }

                            if (x1 + 60 > old.x2) x1 = old.x1;
                            if (y1 + 60 > old.y2) y1 = old.y1;

                            area.current = {
                                ...old,
                                x1,
                                y1,
                            };

                            renderBackdrop();
                            setStartPoint({
                                x: x1,
                                y: y1,
                            });
                            setCursor('nw-resize');
                        } else if (movedCorner === 'top-right') {
                            let x2 = old.x2 + dx;
                            let y1 = old.y1 + dy;

                            if (x2 > canvasOverlay.width)
                                x2 = canvasOverlay.width;
                            if (y1 < 0) y1 = 0;

                            if (aspectRatio.force) {
                                const widthFromX = x2 - old.x1;
                                const heightFromY = old.y2 - y1;

                                if (Math.abs(dx) > Math.abs(dy / ratio)) {
                                    const newHeight = widthFromX * ratio;
                                    y1 = old.y2 - newHeight;
                                    if (y1 < 0) {
                                        y1 = old.y1;
                                        x2 = old.x2;
                                    }
                                } else {
                                    const newHeight = heightFromY;
                                    const newWidth = newHeight / ratio;
                                    x2 = old.x1 + newWidth;
                                    if (x2 > canvasOverlay.width) {
                                        y1 = old.y1;
                                        x2 = old.x2;
                                    }
                                }
                            }

                            if (x2 - 60 < old.x1) x2 = old.x2;
                            if (y1 + 60 > old.y2) y1 = old.y1;

                            area.current = {
                                ...old,
                                x2,
                                y1,
                            };

                            renderBackdrop();
                            setEndPoint({
                                x: x2,
                                y: old.y2,
                            });
                            setStartPoint({
                                x: old.x1,
                                y: y1,
                            });
                            setCursor('ne-resize');
                        } else if (movedCorner === 'bottom-left') {
                            let x1 = old.x1 + dx;
                            let y2 = old.y2 + dy;

                            if (x1 < 0) x1 = 0;
                            if (y2 > canvasOverlay.height)
                                y2 = canvasOverlay.height;

                            if (aspectRatio.force) {
                                const widthFromX = old.x2 - x1;
                                const heightFromY = y2 - old.y1;

                                if (Math.abs(dx) > Math.abs(dy / ratio)) {
                                    const newHeight = widthFromX * ratio;
                                    y2 = old.y1 + newHeight;
                                    if (y2 > canvasOverlay.height) {
                                        y2 = old.y2;
                                        x1 = old.x1;
                                    }
                                } else {
                                    const newHeight = heightFromY;
                                    const newWidth = newHeight / ratio;
                                    x1 = old.x2 - newWidth;
                                    if (x1 < 0) {
                                        y2 = old.y2;
                                        x1 = old.x1;
                                    }
                                }
                            }

                            if (x1 + 60 > old.x2) x1 = old.x1;
                            if (y2 - 60 < old.y1) y2 = old.y2;

                            area.current = {
                                ...old,
                                x1,
                                y2,
                            };

                            renderBackdrop();
                            setEndPoint({
                                x: old.x2,
                                y: y2,
                            });
                            setStartPoint({
                                x: x1,
                                y: old.y1,
                            });
                            setCursor('sw-resize');
                        } else if (movedCorner === 'bottom-right') {
                            let x2 = old.x2 + dx;
                            let y2 = old.y2 + dy;

                            if (x2 > canvasOverlay.width)
                                x2 = canvasOverlay.width;
                            if (y2 > canvasOverlay.height)
                                y2 = canvasOverlay.height;

                            if (aspectRatio.force) {
                                const widthFromX = x2 - old.x1;
                                const heightFromY = y2 - old.y1;

                                if (Math.abs(dx) > Math.abs(dy / ratio)) {
                                    const newHeight = widthFromX * ratio;
                                    y2 = old.y1 + newHeight;
                                    if (y2 > canvasOverlay.height) {
                                        y2 = old.y2;
                                        x2 = old.x2;
                                    }
                                } else {
                                    const newHeight = heightFromY;
                                    const newWidth = newHeight / ratio;
                                    x2 = old.x1 + newWidth;
                                    if (x2 > canvasOverlay.width) {
                                        y2 = old.y2;
                                        x2 = old.x2;
                                    }
                                }
                            }

                            if (x2 - 60 < old.x1) x2 = old.x2;
                            if (y2 - 60 < old.y1) y2 = old.y2;

                            area.current = {
                                ...old,
                                x2,
                                y2,
                            };

                            renderBackdrop();
                            setEndPoint({
                                x: x2,
                                y: y2,
                            });

                            setCursor('se-resize');
                        }
                    };
                    const onMouseUp = () => {
                        movedCorner = null;
                        setCursor('default');
                    };
                    const onMouseLeave = () => {
                        movedCorner = null;
                        setCursor('default');
                    };
                    canvasOverlay.addEventListener('mousedown', onMouseDown);
                    canvasOverlay.addEventListener('mousemove', onMouseMove);
                    canvasOverlay.addEventListener('mouseup', onMouseUp);
                    canvasOverlay.addEventListener('mouseleave', onMouseLeave);
                    listeners.push({
                        element: canvasOverlay,
                        parameters: ['mousemove', onMouseMove as EventListener],
                    });
                    listeners.push({
                        element: canvasOverlay,
                        parameters: ['mousedown', onMouseDown as EventListener],
                    });
                    listeners.push({
                        element: canvasOverlay,
                        parameters: [
                            'mouseleave',
                            onMouseLeave as EventListener,
                        ],
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
        aspectRatio.force,
        aspectRatio.widthComponent,
        aspectRatio.heightComponent,
    ]);
    const perceivedImageWidth =
        (image.naturalWidth / image.naturalHeight) * CANVAS_HEIGHT;
    const cropAreaProps: CropAreaProps = {
        x1: startPoint.x,
        y1: startPoint.y,
        x2: endPoint.x,
        y2: endPoint.y,
        image,
        perceivedImageWidth,
    };
    return (
        <Dialog.Root
            size="full"
            lazyMount
            open={open}
            onOpenChange={(e) => setOpen(e.open)}
            onExitComplete={handleClose}
        >
            <Dialog.Trigger asChild>
                <Button size="sm" variant="surface">
                    <FaCropSimple />
                    Crop
                </Button>
            </Dialog.Trigger>
            <Portal>
                <Dialog.Backdrop />
                <Dialog.Positioner>
                    <Dialog.Content backgroundColor={COLOR.FG}>
                        <Dialog.Header>
                            <Dialog.Title>Crop the image </Dialog.Title>
                        </Dialog.Header>
                        <Dialog.Body ref={bodyRef}>
                            <div
                                style={{
                                    position: 'relative',
                                }}
                            >
                                <canvas ref={canvasRef} />
                                <CropAreaBoundary {...cropAreaProps} />
                                <CropAreaGrid {...cropAreaProps} />
                                <canvas
                                    ref={canvasOverlayRef}
                                    style={{ cursor }}
                                />
                                <CropAreaHandles {...cropAreaProps} />
                            </div>
                            <br />
                            <Heading size="lg">Aspect ratio</Heading>
                            <HStack marginTop={2} gap={3}>
                                <NumberInput.Root
                                    size="sm"
                                    maxW="60px"
                                    disabled={!aspectRatio.force}
                                    value={aspectRatio.widthComponent.toString()}
                                    min={1}
                                    onValueChange={(e: {
                                        valueAsNumber: number;
                                    }) => {
                                        const value = e.valueAsNumber;
                                        if (Number.isNaN(value) || value < 0)
                                            return setAspectRatio((old) => ({
                                                ...old,
                                                widthComponent: 1,
                                            }));
                                        return setAspectRatio((old) => ({
                                            ...old,
                                            widthComponent: value,
                                        }));
                                    }}
                                >
                                    <NumberInput.Control />
                                    <NumberInput.Input
                                        backgroundColor={COLOR.BG}
                                    />
                                </NumberInput.Root>
                                <Text fontSize="lg">:</Text>
                                <NumberInput.Root
                                    size="sm"
                                    maxW="60px"
                                    disabled={!aspectRatio.force}
                                    value={aspectRatio.heightComponent.toString()}
                                    min={1}
                                    onValueChange={(e: {
                                        valueAsNumber: number;
                                    }) => {
                                        const value = e.valueAsNumber;
                                        if (Number.isNaN(value) || value < 0)
                                            return setAspectRatio((old) => ({
                                                ...old,
                                                heightComponent: 1,
                                            }));
                                        return setAspectRatio((old) => ({
                                            ...old,
                                            heightComponent: value,
                                        }));
                                    }}
                                >
                                    <NumberInput.Control />
                                    <NumberInput.Input
                                        backgroundColor={COLOR.BG}
                                    />
                                </NumberInput.Root>
                            </HStack>
                            <br />
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
                                    Lock while resizing
                                </Checkbox.Label>
                            </Checkbox.Root>
                            <br />
                        </Dialog.Body>
                        <Dialog.Footer>
                            <HStack justifyContent="space-between" width="100%">
                                <Box>
                                    <Button
                                        variant="surface"
                                        colorPalette="red"
                                        size="md"
                                        disabled={!startPoint && !endPoint}
                                        onClick={handleResetPoints}
                                    >
                                        Reset
                                    </Button>
                                </Box>
                                <Box>
                                    <Dialog.ActionTrigger asChild>
                                        <Button variant="outline">
                                            Cancel
                                        </Button>
                                    </Dialog.ActionTrigger>
                                    <Button
                                        colorPalette="blue"
                                        onClick={handleSave}
                                    >
                                        Save
                                    </Button>
                                </Box>
                            </HStack>
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
