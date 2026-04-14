import { COLOR } from '@/const';
import {
    Box,
    Button,
    Card,
    Checkbox,
    CloseButton,
    Dialog,
    Field,
    Heading,
    HStack,
    NumberInput,
    Portal,
    Separator,
    Stack,
} from '@chakra-ui/react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { PiSpiral } from 'react-icons/pi';
import {
    applyComplexExpTransform,
    applyLogPolarTransform,
    scaleAndRotateImage,
} from '@/util';

type Props = {
    image: HTMLImageElement;
    onSave: (image: HTMLImageElement) => void;
};

type Complex = { a: number; b: number };

type Modes = {
    logTransform: boolean;
    multiplyTransform: {
        enabled: boolean;
        z: Complex;
    };
    expTransform: boolean;
};

const DEFAULT_MODES: Modes = {
    logTransform: true,
    multiplyTransform: {
        enabled: true,
        z: { a: 1, b: 0 },
    },
    expTransform: false,
};

const LogTransformTool = ({ image, onSave }: Props) => {
    const [isOpen, setIsOpen] = useState(false);
    const [modes, setModes] = useState<Modes>(DEFAULT_MODES);
    const bodyRef = useRef<HTMLDivElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    const resetSettings = useCallback(() => {
        setModes(DEFAULT_MODES);
    }, []);

    const handleSave = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        const img = new Image();
        img.onload = () => {
            onSave(img);
            setIsOpen(false);
            resetSettings();
        };
        img.src = canvas.toDataURL();
    }, [onSave, resetSettings]);

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
            let result = imageData;
            if (modes.logTransform) {
                result = applyLogPolarTransform(result);
            }
            if (modes.multiplyTransform.enabled) {
                result = scaleAndRotateImage(
                    result,
                    modes.multiplyTransform.z.a,
                    modes.multiplyTransform.z.b,
                );
            }
            if (modes.expTransform) {
                result = applyComplexExpTransform(result);
            }
            ctx.putImageData(result, 0, 0);
        });
        return () => {
            clearTimeout(timeout);
        };
    }, [
        image,
        isOpen,
        modes.expTransform,
        modes.logTransform,
        modes.multiplyTransform.enabled,
        modes.multiplyTransform.z.a,
        modes.multiplyTransform.z.b,
    ]);

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
                            <Dialog.Title>Transforms</Dialog.Title>
                        </Dialog.Header>
                        <Dialog.Body
                            ref={bodyRef}
                            display="flex"
                            gap={4}
                            flexWrap="wrap"
                        >
                            <Box>
                                <Heading>Preview</Heading>
                                <canvas ref={canvasRef} />
                            </Box>
                            <Box width="600px">
                                <Heading>Operations</Heading>
                                <Stack>
                                    <Card.Root size="sm">
                                        <Card.Header>
                                            <Heading size="md">
                                                Complex logarythmic transform
                                            </Heading>
                                        </Card.Header>
                                        <Card.Body color="fg.muted">
                                            <Checkbox.Root
                                                width="max-content"
                                                checked={modes.logTransform}
                                                onCheckedChange={(e) => {
                                                    setModes((old) => ({
                                                        ...old,
                                                        logTransform:
                                                            !e.checked,
                                                    }));
                                                }}
                                            >
                                                <Checkbox.HiddenInput />
                                                <Checkbox.Control
                                                    borderColor={COLOR.FG2}
                                                />
                                                <Checkbox.Label>
                                                    Enabled
                                                </Checkbox.Label>
                                            </Checkbox.Root>
                                        </Card.Body>
                                    </Card.Root>
                                    <Card.Root size="sm">
                                        <Card.Header>
                                            <Heading size="md">
                                                Scaling and rotating
                                            </Heading>
                                        </Card.Header>
                                        <Card.Body color="fg.muted">
                                            <Checkbox.Root
                                                width="max-content"
                                                checked={
                                                    modes.multiplyTransform
                                                        .enabled
                                                }
                                                onCheckedChange={(e) => {
                                                    setModes((old) => ({
                                                        ...old,
                                                        multiplyTransform: {
                                                            ...old.multiplyTransform,
                                                            enabled: !e.checked,
                                                        },
                                                    }));
                                                }}
                                            >
                                                <Checkbox.HiddenInput />
                                                <Checkbox.Control
                                                    borderColor={COLOR.FG2}
                                                />
                                                <Checkbox.Label>
                                                    Enabled
                                                </Checkbox.Label>
                                            </Checkbox.Root>
                                            <Separator
                                                marginTop="16px"
                                                marginBottom="16px"
                                            />
                                            <HStack>
                                                <Field.Root width="max-content">
                                                    <Field.Label>
                                                        real component
                                                    </Field.Label>
                                                    <NumberInput.Root
                                                        backgroundColor={
                                                            COLOR.BG
                                                        }
                                                        maxW="160px"
                                                        value={modes.multiplyTransform.z.a.toString()}
                                                        disabled={
                                                            !modes
                                                                .multiplyTransform
                                                                .enabled
                                                        }
                                                        onValueChange={(e: {
                                                            valueAsNumber: number;
                                                        }) =>
                                                            setModes((old) => ({
                                                                ...old,
                                                                multiplyTransform:
                                                                    {
                                                                        ...old.multiplyTransform,
                                                                        z: {
                                                                            ...old
                                                                                .multiplyTransform
                                                                                .z,
                                                                            a: e.valueAsNumber,
                                                                        },
                                                                    },
                                                            }))
                                                        }
                                                    >
                                                        <NumberInput.Control />
                                                        <NumberInput.Input />
                                                    </NumberInput.Root>
                                                </Field.Root>
                                                <Field.Root width="max-content">
                                                    <Field.Label>
                                                        imaginary component
                                                    </Field.Label>
                                                    <NumberInput.Root
                                                        backgroundColor={
                                                            COLOR.BG
                                                        }
                                                        maxW="160px"
                                                        value={modes.multiplyTransform.z.b.toString()}
                                                        disabled={
                                                            !modes
                                                                .multiplyTransform
                                                                .enabled
                                                        }
                                                        onValueChange={(e: {
                                                            valueAsNumber: number;
                                                        }) =>
                                                            setModes((old) => ({
                                                                ...old,
                                                                multiplyTransform:
                                                                    {
                                                                        ...old.multiplyTransform,
                                                                        z: {
                                                                            ...old
                                                                                .multiplyTransform
                                                                                .z,
                                                                            b: e.valueAsNumber,
                                                                        },
                                                                    },
                                                            }))
                                                        }
                                                    >
                                                        <NumberInput.Control />
                                                        <NumberInput.Input />
                                                    </NumberInput.Root>
                                                </Field.Root>
                                            </HStack>
                                        </Card.Body>
                                    </Card.Root>
                                    <Card.Root size="sm">
                                        <Card.Header>
                                            <Heading size="md">
                                                Complex exponential transform
                                            </Heading>
                                        </Card.Header>
                                        <Card.Body color="fg.muted">
                                            <Checkbox.Root
                                                width="max-content"
                                                checked={modes.expTransform}
                                                onCheckedChange={(e) => {
                                                    setModes((old) => ({
                                                        ...old,
                                                        expTransform:
                                                            !e.checked,
                                                    }));
                                                }}
                                            >
                                                <Checkbox.HiddenInput />
                                                <Checkbox.Control
                                                    borderColor={COLOR.FG2}
                                                />
                                                <Checkbox.Label>
                                                    Enabled
                                                </Checkbox.Label>
                                            </Checkbox.Root>
                                        </Card.Body>
                                    </Card.Root>
                                </Stack>
                            </Box>
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
