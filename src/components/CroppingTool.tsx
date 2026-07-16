import { COLOR } from '@/const';
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
import { FaCropSimple } from 'react-icons/fa6';

type Props = {
    image: HTMLImageElement;
    onSave: (image: HTMLImageElement) => void;
};

// function getSign(x1: number, y1: number, x2: number, y2: number) {
//     return (((y2 - y1) / Math.abs(y2 - y1)) * (x2 - x1)) / Math.abs(x2 - x1);
// }

// todo - rename
const height = 600;

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

    const handleResetPoints = useCallback(() => {
        setStartPoint({
            x: image.width * 0.1,
            y: image.height * 0.1,
        });
        setEndPoint({
            x: image.width * 0.9,
            y: image.height * 0.9,
        });
        area.current = {
            x1: image.width * 0.1,
            y1: image.height * 0.1,
            x2: image.width * 0.9,
            y2: image.height * 0.9,
        };
        renderBackdrop();
        setOpen(false);
        setAspectRatio({
            force: true,
            heightComponent: 1,
            widthComponent: 1,
        });
    }, [image]);

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
            handleResetPoints();
        };
        tempCtx.putImageData(imageData, 0, 0);
        img.src = tempCanvas.toDataURL();
    }, [onSave, image, startPoint, endPoint, handleResetPoints]);

    // const renderCropArea = useCallback((x1: number, x2: number, y1: number, y2: number) => {
    //     const canvasOverlay = canvasOverlayRef.current;
    //     if (!canvasOverlay) return;
    //     const overlayCtx = canvasOverlay.getContext('2d');
    //     if (!overlayCtx) return;

    // }, [])

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
        overlayCtx.fillRect(0, 0, w, y1);
        overlayCtx.fillRect(0, y2, w, h);
        overlayCtx.fillRect(0, y1, x1, y2 - y1);
        overlayCtx.fillRect(x2, y1, w, y2 - y1);
    }, []);

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
                        // if (!startPoint && !endPoint) {
                        //     setStartPoint({ x, y });
                        // }
                        // if (startPoint && !endPoint) {
                        //     if (aspectRatio.force) {
                        //         const newY: number =
                        //             (aspectRatio.heightComponent /
                        //                 aspectRatio.widthComponent) *
                        //                 getSign(
                        //                     startPoint.x,
                        //                     startPoint.y,
                        //                     x,
                        //                     y,
                        //                 ) *
                        //                 (x - startPoint.x) +
                        //             startPoint.y;
                        //         setEndPoint({
                        //             x,
                        //             y:
                        //                 y <= canvasOverlay.height
                        //                     ? newY
                        //                     : canvasOverlay.height,
                        //         });
                        //     } else {
                        //         setEndPoint({ x, y });
                        //     }
                        // }

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
                        // const x =
                        //     (e.offsetX * canvasOverlay.width) /
                        //     +canvasOverlay.style.width.split('px')[0];
                        // const y =
                        //     (e.offsetY * canvasOverlay.height) /
                        //     +canvasOverlay.style.height.split('px')[0];
                        // overlayCtx.clearRect(
                        //     0,
                        //     0,
                        //     canvasOverlay.width,
                        //     canvasOverlay.height,
                        // );
                        // if (startPoint) {
                        //     overlayCtx.fillStyle = '#0000006e';
                        //     overlayCtx.fillRect(
                        //         startPoint.x,
                        //         startPoint.y,
                        //         (endPoint?.x ?? x) - startPoint.x,
                        //         (endPoint?.y ??
                        //             (aspectRatio.force
                        //                 ? (aspectRatio.heightComponent /
                        //                       aspectRatio.widthComponent) *
                        //                       getSign(
                        //                           startPoint.x,
                        //                           startPoint.y,
                        //                           x,
                        //                           y,
                        //                       ) *
                        //                       (x - startPoint.x) +
                        //                   startPoint.y
                        //                 : y)) - startPoint.y,
                        //     );
                        // }
                        // overlayCtx.strokeStyle = 'yellow';
                        // const lineWidth = 3;
                        // overlayCtx.lineWidth = lineWidth;
                        // overlayCtx.beginPath();
                        // overlayCtx.moveTo(0, y - lineWidth / 2);
                        // overlayCtx.lineTo(
                        //     canvasOverlay.width,
                        //     y - lineWidth / 2,
                        // );
                        // overlayCtx.stroke();
                        // overlayCtx.closePath();
                        // overlayCtx.beginPath();
                        // overlayCtx.moveTo(x - lineWidth / 2, 0);
                        // overlayCtx.lineTo(
                        //     x - lineWidth / 2,
                        //     canvasOverlay.height,
                        // );
                        // overlayCtx.stroke();
                        // overlayCtx.closePath();

                        const dx = e.movementX * 2;
                        const dy = e.movementY * 2;
                        const old = {
                            ...area.current,
                        };
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
                            // todo - move rendering of grid from css to canvas:
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

                            if (x1 + 60 > old.x2) x1 = old.x1;
                            if (y1 + 60 > old.y2) y1 = old.y1;

                            // todo - add support for forced aspect ratio

                            area.current = {
                                ...old,
                                x1,
                                y1,
                            };

                            renderBackdrop();
                            // todo - move rendering of grid from css to canvas:
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

                            if (x2 - 60 < old.x1) x2 = old.x2;
                            if (y1 + 60 > old.y2) y1 = old.y1;

                            // todo - add support for forced aspect ratio

                            area.current = {
                                ...old,
                                x2,
                                y1,
                            };

                            renderBackdrop();
                            // todo - move rendering of grid from css to canvas:
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

                            if (x1 + 60 > old.x2) x1 = old.x1;
                            if (y2 - 60 < old.y1) y2 = old.y2;

                            // todo - add support for forced aspect ratio

                            area.current = {
                                ...old,
                                x1,
                                y2,
                            };

                            renderBackdrop();
                            // todo - move rendering of grid from css to canvas:
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

                            if (x2 - 60 < old.x1) x2 = old.x2;
                            if (y2 - 60 < old.y1) y2 = old.y2;

                            // todo - add support for forced aspect ratio

                            area.current = {
                                ...old,
                                x2,
                                y2,
                            };

                            renderBackdrop();
                            // todo - move rendering of grid from css to canvas:
                            setEndPoint({
                                x: x2,
                                y: y2,
                            });

                            setCursor('se-resize');
                        }
                    };
                    const onMouseUp = () => {
                        movedCorner = null;
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
        (image.naturalWidth / image.naturalHeight) * height;
    return (
        <Dialog.Root
            size="full"
            lazyMount
            open={open}
            onOpenChange={(e) => setOpen(e.open)}
            onExitComplete={handleResetPoints}
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
                                {startPoint != null && endPoint != null && (
                                    <>
                                        {/* boundaries */}
                                        <div
                                            style={{
                                                position: 'absolute',
                                                left: `${(startPoint.x / image.width) * perceivedImageWidth}px`,
                                                top: `${(startPoint.y / image.height) * height}px`,
                                                width: `${((endPoint.x - startPoint.x) / image.width) * perceivedImageWidth}px`,
                                                height: '1px',
                                                backgroundColor:
                                                    'rgb(190,190,190)',
                                            }}
                                        ></div>
                                        <div
                                            style={{
                                                position: 'absolute',
                                                left: `${(startPoint.x / image.width) * perceivedImageWidth}px`,
                                                top: `${(endPoint.y / image.height) * height}px`,
                                                width: `${((endPoint.x - startPoint.x) / image.width) * perceivedImageWidth}px`,
                                                height: '1px',
                                                backgroundColor:
                                                    'rgb(190,190,190)',
                                            }}
                                        ></div>
                                        <div
                                            style={{
                                                position: 'absolute',
                                                left: `${(startPoint.x / image.width) * perceivedImageWidth}px`,
                                                top: `${(startPoint.y / image.height) * height}px`,
                                                width: '1px',
                                                height: `${((endPoint.y - startPoint.y) / image.height) * height}px`,
                                                backgroundColor:
                                                    'rgb(190,190,190)',
                                            }}
                                        ></div>
                                        <div
                                            style={{
                                                position: 'absolute',
                                                left: `${(endPoint.x / image.width) * perceivedImageWidth}px`,
                                                top: `${(startPoint.y / image.height) * height}px`,
                                                width: '1px',
                                                height: `${((endPoint.y - startPoint.y) / image.height) * height}px`,
                                                backgroundColor:
                                                    'rgb(190,190,190)',
                                            }}
                                        ></div>

                                        {/* grids */}
                                        <div
                                            style={{
                                                position: 'absolute',
                                                left: `${((startPoint.x + ((endPoint.x - startPoint.x) * 1) / 3) / image.width) * perceivedImageWidth}px`,
                                                top: `${(startPoint.y / image.height) * height}px`,
                                                width: '1px',
                                                height: `${((endPoint.y - startPoint.y) / image.height) * height}px`,
                                                backgroundColor:
                                                    'rgb(190,190,190)',
                                            }}
                                        ></div>
                                        <div
                                            style={{
                                                position: 'absolute',
                                                left: `${((startPoint.x + ((endPoint.x - startPoint.x) * 2) / 3) / image.width) * perceivedImageWidth}px`,
                                                top: `${(startPoint.y / image.height) * height}px`,
                                                width: '1px',
                                                height: `${((endPoint.y - startPoint.y) / image.height) * height}px`,
                                                backgroundColor:
                                                    'rgb(190,190,190)',
                                            }}
                                        ></div>
                                        <div
                                            style={{
                                                position: 'absolute',
                                                left: `${(startPoint.x / image.width) * perceivedImageWidth}px`,
                                                top: `${((startPoint.y + ((endPoint.y - startPoint.y) * 1) / 3) / image.height) * height}px`,
                                                width: `${((endPoint.x - startPoint.x) / image.width) * perceivedImageWidth}px`,
                                                height: '1px',
                                                backgroundColor:
                                                    'rgb(190,190,190)',
                                            }}
                                        ></div>
                                        <div
                                            style={{
                                                position: 'absolute',
                                                left: `${(startPoint.x / image.width) * perceivedImageWidth}px`,
                                                top: `${((startPoint.y + ((endPoint.y - startPoint.y) * 2) / 3) / image.height) * height}px`,
                                                width: `${((endPoint.x - startPoint.x) / image.width) * perceivedImageWidth}px`,
                                                height: '1px',
                                                backgroundColor:
                                                    'rgb(190,190,190)',
                                            }}
                                        ></div>

                                        {/* handles */}
                                        <div
                                            style={{
                                                position: 'absolute',
                                                left: `${(startPoint.x / image.width) * perceivedImageWidth}px`,
                                                top: `${(startPoint.y / image.height) * height}px`,
                                                width: '30px',
                                                height: '4px',
                                                backgroundColor: 'white',
                                            }}
                                        ></div>
                                        <div
                                            style={{
                                                position: 'absolute',
                                                left: `${(startPoint.x / image.width) * perceivedImageWidth}px`,
                                                top: `${(startPoint.y / image.height) * height}px`,
                                                width: '4px',
                                                height: '30px',
                                                backgroundColor: 'white',
                                            }}
                                        ></div>

                                        <div
                                            style={{
                                                position: 'absolute',
                                                left: `${(endPoint.x / image.width) * perceivedImageWidth - 30}px`,
                                                top: `${(startPoint.y / image.height) * height}px`,
                                                width: '30px',
                                                height: '4px',
                                                backgroundColor: 'white',
                                            }}
                                        ></div>
                                        <div
                                            style={{
                                                position: 'absolute',
                                                left: `${(endPoint.x / image.width) * perceivedImageWidth - 4}px`,
                                                top: `${(startPoint.y / image.height) * height}px`,
                                                width: '4px',
                                                height: '30px',
                                                backgroundColor: 'white',
                                            }}
                                        ></div>

                                        <div
                                            style={{
                                                position: 'absolute',
                                                left: `${(endPoint.x / image.width) * perceivedImageWidth - 30}px`,
                                                top: `${(endPoint.y / image.height) * height - 4}px`,
                                                width: '30px',
                                                height: '4px',
                                                backgroundColor: 'white',
                                            }}
                                        ></div>
                                        <div
                                            style={{
                                                position: 'absolute',
                                                left: `${(endPoint.x / image.width) * perceivedImageWidth - 4}px`,
                                                top: `${(endPoint.y / image.height) * height - 30}px`,
                                                width: '4px',
                                                height: '30px',
                                                backgroundColor: 'white',
                                            }}
                                        ></div>

                                        <div
                                            style={{
                                                position: 'absolute',
                                                left: `${(startPoint.x / image.width) * perceivedImageWidth}px`,
                                                top: `${(endPoint.y / image.height) * height - 4}px`,
                                                width: '30px',
                                                height: '4px',
                                                backgroundColor: 'white',
                                            }}
                                        ></div>
                                        <div
                                            style={{
                                                position: 'absolute',
                                                left: `${(startPoint.x / image.width) * perceivedImageWidth}px`,
                                                top: `${(endPoint.y / image.height) * height - 30}px`,
                                                width: '4px',
                                                height: '30px',
                                                backgroundColor: 'white',
                                            }}
                                        ></div>
                                    </>
                                )}
                                <canvas
                                    ref={canvasOverlayRef}
                                    style={{ cursor }}
                                />
                            </div>
                            <HStack marginTop={2} alignItems="end">
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
                                                    })
                                                );
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
                                                    })
                                                );
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
                                    setStartPoint({
                                        x: image.width * 0.1,
                                        y: image.height * 0.1,
                                    });
                                    setEndPoint({
                                        x: image.width * 0.9,
                                        y: image.height * 0.9,
                                    });
                                    area.current = {
                                        x1: image.width * 0.1,
                                        y1: image.height * 0.1,
                                        x2: image.width * 0.9,
                                        y2: image.height * 0.9,
                                    };
                                    renderBackdrop();
                                    // todo - shouldn't it be replaced with handleResetPoints?
                                }}
                            >
                                Reset points
                            </Button>
                        </Dialog.Body>
                        <Dialog.Footer>
                            <Dialog.ActionTrigger asChild>
                                <Button variant="outline">Cancel</Button>
                            </Dialog.ActionTrigger>
                            <Button colorPalette="blue" onClick={handleSave}>
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
