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
    getCenterPartOfGrid,
    scaleAndRotateImage,
    stackImageInGrid,
} from '@/util';

type Props = {
    image: HTMLImageElement;
    onSave: (image: HTMLImageElement) => void;
};

type Complex = { a: number; b: number };

type Modes = {
    logTransform: boolean;
    stackImage: {
        enabled: boolean;
        grid: number;
    };
    multiplyTransform: {
        enabled: boolean;
        z: Complex;
    };
    getCenterOfImage: {
        enabled: boolean;
        grid: number;
    };
    expTransform: boolean;
};

const DEFAULT_MODES: Modes = {
    logTransform: true,
    stackImage: {
        enabled: true,
        grid: 3,
    },
    multiplyTransform: {
        enabled: true,
        z: { a: 1.06, b: -0.02 },
    },
    getCenterOfImage: {
        enabled: true,
        grid: 3,
    },
    expTransform: true,
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
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            let result = imageData;
            if (modes.logTransform) {
                result = applyLogPolarTransform(result);
            }
            if (modes.stackImage.enabled) {
                result = stackImageInGrid(result, modes.stackImage.grid);
            }
            if (modes.multiplyTransform.enabled) {
                result = scaleAndRotateImage(
                    result,
                    modes.multiplyTransform.z.a,
                    modes.multiplyTransform.z.b,
                );
            }
            if (modes.getCenterOfImage.enabled) {
                result = getCenterPartOfGrid(
                    result,
                    modes.getCenterOfImage.grid,
                );
            }
            if (modes.expTransform) {
                result = applyComplexExpTransform(result);
            }

            canvas.width = result.width;
            canvas.height = result.height;
            canvas.style.height = `${height}px`;
            canvas.style.width = `${(result.width / result.height) * height}px`;

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
        modes.stackImage.enabled,
        modes.stackImage.grid,
        modes.getCenterOfImage.enabled,
        modes.getCenterOfImage.grid,
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
                            <Dialog.Title>
                                Complex Transformation Tool
                            </Dialog.Title>
                        </Dialog.Header>
                        <Dialog.Body
                            ref={bodyRef}
                            display="flex"
                            gap={4}
                            flexWrap="wrap"
                        >
                            <Box>
                                <Heading>Output Preview</Heading>
                                <canvas ref={canvasRef} />
                            </Box>
                            <Box width="600px">
                                <Heading>Operations</Heading>
                                <Stack>
                                    <Card.Root size="sm">
                                        <Card.Header>
                                            <Heading size="md">
                                                Complex logarithmic transform
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
                                                            !!e.checked,
                                                    }));
                                                }}
                                                data-test-name="log-transform-tool-log-transform-subtool"
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
                                                Duplicate image
                                            </Heading>
                                        </Card.Header>
                                        <Card.Body color="fg.muted">
                                            <Checkbox.Root
                                                width="max-content"
                                                checked={
                                                    modes.stackImage.enabled
                                                }
                                                onCheckedChange={(e) => {
                                                    setModes((old) => ({
                                                        ...old,
                                                        stackImage: {
                                                            ...old.stackImage,
                                                            enabled:
                                                                !!e.checked,
                                                        },
                                                    }));
                                                }}
                                                data-test-name="log-transform-tool-duplicate-image-subtool"
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
                                                        Duplicates
                                                    </Field.Label>
                                                    <NumberInput.Root
                                                        backgroundColor={
                                                            COLOR.BG
                                                        }
                                                        maxW="160px"
                                                        min={1}
                                                        step={2}
                                                        value={modes.stackImage.grid.toString()}
                                                        disabled={
                                                            !modes.stackImage
                                                                .enabled
                                                        }
                                                        onValueChange={(e: {
                                                            valueAsNumber: number;
                                                        }) =>
                                                            setModes((old) => ({
                                                                ...old,
                                                                stackImage: {
                                                                    ...old.stackImage,
                                                                    grid: e.valueAsNumber,
                                                                },
                                                            }))
                                                        }
                                                    >
                                                        <NumberInput.Control />
                                                        <NumberInput.Input data-test-name="log-transform-tool-duplicate-image-subtool-duplicates-input" />
                                                    </NumberInput.Root>
                                                </Field.Root>
                                            </HStack>
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
                                                            enabled:
                                                                !!e.checked,
                                                        },
                                                    }));
                                                }}
                                                data-test-name="log-transform-tool-scale-and-rotate-subtool"
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
                                                        Re
                                                    </Field.Label>
                                                    <NumberInput.Root
                                                        backgroundColor={
                                                            COLOR.BG
                                                        }
                                                        maxW="160px"
                                                        step={0.01}
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
                                                        <NumberInput.Input data-test-name="log-transform-tool-scale-and-rotate-subtool-re-input" />
                                                    </NumberInput.Root>
                                                </Field.Root>
                                                <Field.Root width="max-content">
                                                    <Field.Label>
                                                        Im
                                                    </Field.Label>
                                                    <NumberInput.Root
                                                        backgroundColor={
                                                            COLOR.BG
                                                        }
                                                        maxW="160px"
                                                        step={0.01}
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
                                                        <NumberInput.Input data-test-name="log-transform-tool-scale-and-rotate-subtool-im-input" />
                                                    </NumberInput.Root>
                                                </Field.Root>
                                            </HStack>
                                        </Card.Body>
                                    </Card.Root>
                                    <Card.Root size="sm">
                                        <Card.Header>
                                            <Heading size="md">
                                                Deduplicate image (crop center
                                                part)
                                            </Heading>
                                        </Card.Header>
                                        <Card.Body color="fg.muted">
                                            <Checkbox.Root
                                                width="max-content"
                                                checked={
                                                    modes.getCenterOfImage
                                                        .enabled
                                                }
                                                onCheckedChange={(e) => {
                                                    setModes((old) => ({
                                                        ...old,
                                                        getCenterOfImage: {
                                                            ...old.getCenterOfImage,
                                                            enabled:
                                                                !!e.checked,
                                                        },
                                                    }));
                                                }}
                                                data-test-name="log-transform-tool-deduplicate-image-subtool"
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
                                                        Duplicates
                                                    </Field.Label>
                                                    <NumberInput.Root
                                                        backgroundColor={
                                                            COLOR.BG
                                                        }
                                                        maxW="160px"
                                                        min={1}
                                                        step={2}
                                                        value={modes.getCenterOfImage.grid.toString()}
                                                        disabled={
                                                            !modes
                                                                .getCenterOfImage
                                                                .enabled
                                                        }
                                                        onValueChange={(e: {
                                                            valueAsNumber: number;
                                                        }) =>
                                                            setModes((old) => ({
                                                                ...old,
                                                                getCenterOfImage:
                                                                    {
                                                                        ...old.getCenterOfImage,
                                                                        grid: e.valueAsNumber,
                                                                    },
                                                            }))
                                                        }
                                                    >
                                                        <NumberInput.Control />
                                                        <NumberInput.Input data-test-name="log-transform-tool-deduplicate-image-subtool-duplicates-input" />
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
                                                            !!e.checked,
                                                    }));
                                                }}
                                                data-test-name="log-transform-tool-exponential-transform-subtool"
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
