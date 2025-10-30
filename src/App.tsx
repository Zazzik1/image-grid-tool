import {
    Box,
    Button,
    Checkbox,
    ColorPicker,
    Field,
    FileUpload,
    Heading,
    HStack,
    IconButton,
    Link,
    NumberInput,
    parseColor,
    Stack,
    Stat,
    Text,
} from '@chakra-ui/react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { FaGithub } from 'react-icons/fa';
import { HiUpload } from 'react-icons/hi';
import {
    getAspectRatio,
    getGridColorSuggestion,
    getGridSuggestion,
    getLineThicknessSuggestion,
} from './util';
import CroppingTool from './components/CroppingTool';

function App() {
    const [rows, setRows] = useState(4);
    const [columns, setColumns] = useState(4);
    const [lineThickness, setLineThickness] = useState(1);
    const [color, setColor] = useState('#363026');
    const [diagonals, setDiagonals] = useState(false);
    const [image, setImage] = useState<HTMLImageElement | null>(null);
    const [aspectRatio, setAspectRatio] = useState<ReturnType<
        typeof getAspectRatio
    > | null>(null);
    const [filename, setFilename] = useState('');
    const canvasRef = useRef<HTMLCanvasElement>(null);

    const handleDownload = useCallback(() => {
        if (!canvasRef.current) return;
        const link = document.createElement('a');
        const sp = filename.split('.');
        sp.pop();
        link.download = `${sp.join('.')}-grid.png`;
        link.href = canvasRef.current.toDataURL('image/png', 1.0);
        link.click();
    }, [filename]);

    const suggestGrids = useCallback((img: HTMLImageElement) => {
        const {
            aspectRatio,
            grid: { columns, rows },
        } = getGridSuggestion(img);
        setAspectRatio(aspectRatio);
        setColor(getGridColorSuggestion(img));
        setLineThickness(
            getLineThicknessSuggestion(img.naturalWidth, img.naturalHeight),
        );
        setRows(rows);
        setColumns(columns);
    }, []);

    const handleCropSave = useCallback(
        (image: HTMLImageElement) => {
            setImage(image);
            setAspectRatio(getAspectRatio(image.width, image.height));
            suggestGrids(image);
        },
        [suggestGrids],
    );

    useEffect(() => {
        const canvas = canvasRef.current;
        if (canvas) {
            const ctx = canvas.getContext('2d');
            if (ctx) {
                let w = canvas.width;
                let h = canvas.height;
                ctx.clearRect(0, 0, w, h);
                if (image) {
                    canvas.width = w = image.naturalWidth;
                    canvas.height = h = image.naturalHeight;
                    ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
                }
                ctx.fillStyle = color;
                for (let y = 1; y < rows; y++) {
                    ctx.fillRect(
                        0,
                        (h / rows) * y - lineThickness / 2,
                        w,
                        lineThickness,
                    );
                }
                for (let x = 1; x < columns; x++) {
                    ctx.fillRect(
                        (w / columns) * x - lineThickness / 2,
                        0,
                        lineThickness,
                        h,
                    );
                }
                ctx.strokeStyle = color;
                ctx.lineWidth = lineThickness;
                if (diagonals) {
                    for (let y = 0; y < rows; y++) {
                        for (let x = 0; x < columns; x++) {
                            ctx.beginPath();
                            ctx.moveTo((w / columns) * x, (h / rows) * y);
                            ctx.lineTo(
                                (w / columns) * (x + 1),
                                (h / rows) * (y + 1),
                            );
                            ctx.stroke();
                            ctx.closePath();
                            ctx.beginPath();
                            ctx.moveTo((w / columns) * (x + 1), (h / rows) * y);
                            ctx.lineTo((w / columns) * x, (h / rows) * (y + 1));
                            ctx.stroke();
                            ctx.closePath();
                        }
                    }
                }
            }
        }
    }, [rows, columns, color, lineThickness, diagonals, image]);
    const pxPerColumn = useMemo(
        () => (image ? Math.round(image.naturalWidth / columns) : 1),
        [image, columns],
    );
    const pxPerRow = useMemo(
        () => (image ? Math.round(image.naturalHeight / rows) : 1),
        [image, rows],
    );
    const cellAspectRatio = useMemo(
        () => getAspectRatio(pxPerColumn, pxPerRow).label,
        [pxPerColumn, pxPerRow],
    );
    const isMobile = useCallback(() => {
        return window.innerWidth < 600;
    }, []);
    return (
        <Box
            display="flex"
            justifyContent={isMobile() ? 'normal' : 'center'}
            flexWrap="wrap"
        >
            <HStack
                padding={isMobile() ? '0 8px' : '0 64px'}
                backgroundColor="#080705"
                color="#f4f3ee"
                borderLeft="1px solid #221e18"
                borderRight="1px solid #221e18"
                gap="0 128px"
                justifyContent="space-between"
                alignItems="start"
                minHeight="100vh"
                height="100vh"
                boxSizing="border-box"
                flexWrap="wrap"
            >
                <Stack>
                    <Heading
                        size="5xl"
                        color="green.400"
                        fontFamily="Montserrat"
                        fontWeight="100"
                        letterSpacing="-4px"
                        marginTop="8px"
                    >
                        Image Grid Tool
                    </Heading>
                    <Text
                        maxWidth="400px"
                        color="green.200"
                        marginBottom="16px"
                    >
                        A simple way to add grids to images.
                    </Text>
                    <Heading
                        size="md"
                        color="green.100"
                        fontFamily="Montserrat"
                        fontWeight="100"
                    >
                        1. Load your image
                    </Heading>
                    <Text
                        maxWidth="400px"
                        color="green.200"
                        fontSize="0.8em"
                    >
                        Don't worry - your image stays on your device. All
                        processing happens right in your browser.
                    </Text>
                    <HStack>
                        <FileUpload.Root
                            width="max-content"
                            accept={[
                                'image/png',
                                'image/jpeg',
                                'image/webp',
                                'image/heic',
                            ]}
                            onFileChange={(e) => {
                                const file = e.acceptedFiles[0];
                                if (!file) return;

                                setFilename(file.name);

                                const reader = new FileReader();
                                reader.onload = (ev) => {
                                    const result = ev.target?.result;
                                    if (!result) return;

                                    const img = new Image();
                                    img.onload = () => {
                                        setImage(img);
                                        suggestGrids(img);
                                    };
                                    img.onerror = () =>
                                        console.error('Failed to load image');
                                    img.src = result as string;
                                };
                                reader.readAsDataURL(file);
                            }}
                        >
                            <FileUpload.HiddenInput />
                            <FileUpload.Trigger asChild>
                                <Button
                                    variant="outline"
                                    size="sm"
                                >
                                    <HiUpload /> Load image
                                </Button>
                            </FileUpload.Trigger>
                        </FileUpload.Root>
                        {image && (
                            <CroppingTool
                                image={image}
                                onSave={handleCropSave}
                            />
                        )}
                    </HStack>
                    {image && (
                        <HStack>
                            <Stat.Root>
                                <Stat.Label>Height</Stat.Label>
                                <Stat.ValueText>
                                    {image.naturalHeight}px
                                </Stat.ValueText>
                            </Stat.Root>
                            <Stat.Root>
                                <Stat.Label>Width</Stat.Label>
                                <Stat.ValueText>
                                    {image.naturalWidth}px
                                </Stat.ValueText>
                            </Stat.Root>
                            <Stat.Root>
                                <Stat.Label>Aspect ratio</Stat.Label>
                                <Stat.ValueText>
                                    {aspectRatio?.label}
                                </Stat.ValueText>
                            </Stat.Root>
                        </HStack>
                    )}
                    <Heading
                        size="md"
                        marginTop="16px"
                        color="green.100"
                        fontFamily="Montserrat"
                        fontWeight="100"
                    >
                        2. Adjust the grid for your needs
                    </Heading>
                    <HStack
                        gap={4}
                        flexWrap="wrap"
                    >
                        <Field.Root width="max-content">
                            <Field.Label>Number of rows</Field.Label>
                            <NumberInput.Root
                                maxW="200px"
                                value={rows.toString()}
                                min={1}
                                onValueChange={(e: {
                                    valueAsNumber: number;
                                }) => {
                                    const value = e.valueAsNumber;
                                    if (Number.isNaN(value) || value < 0)
                                        return setRows(1);
                                    setRows(value);
                                }}
                            >
                                <NumberInput.Control />
                                <NumberInput.Input />
                            </NumberInput.Root>
                            {image && (
                                <Field.HelperText>
                                    {pxPerRow}px per row (
                                    {(Math.round(1000 / rows) / 10).toFixed(1)}
                                    %)
                                </Field.HelperText>
                            )}
                        </Field.Root>
                        <Field.Root width="max-content">
                            <Field.Label>Number of columns</Field.Label>
                            <NumberInput.Root
                                maxW="200px"
                                value={columns.toString()}
                                min={1}
                                onValueChange={(e: {
                                    valueAsNumber: number;
                                }) => {
                                    const value = e.valueAsNumber;
                                    if (Number.isNaN(value) || value < 0)
                                        return setColumns(1);
                                    setColumns(value);
                                }}
                            >
                                <NumberInput.Control />
                                <NumberInput.Input />
                            </NumberInput.Root>
                            {image && (
                                <Field.HelperText>
                                    {pxPerColumn}px per column (
                                    {(Math.round(1000 / columns) / 10).toFixed(
                                        1,
                                    )}
                                    %)
                                </Field.HelperText>
                            )}
                        </Field.Root>
                        <Stat.Root>
                            <Stat.Label>Cell aspect ratio</Stat.Label>
                            <Stat.ValueText>{cellAspectRatio}</Stat.ValueText>
                        </Stat.Root>
                    </HStack>
                    <HStack
                        gap={4}
                        alignItems="end"
                    >
                        <Field.Root width="max-content">
                            <Field.Label>Line thickness</Field.Label>
                            <NumberInput.Root
                                maxW="200px"
                                value={lineThickness.toString()}
                                min={1}
                                onValueChange={(e: { valueAsNumber: number }) =>
                                    setLineThickness(e.valueAsNumber)
                                }
                            >
                                <NumberInput.Control />
                                <NumberInput.Input />
                            </NumberInput.Root>
                        </Field.Root>
                        <Checkbox.Root
                            width="max-content"
                            checked={diagonals}
                            onCheckedChange={(e) => setDiagonals(!!e.checked)}
                        >
                            <Checkbox.HiddenInput />
                            <Checkbox.Control />
                            <Checkbox.Label>Add diagonals?</Checkbox.Label>
                        </Checkbox.Root>
                    </HStack>
                    <Heading
                        size="md"
                        marginTop="16px"
                        color="green.100"
                        fontFamily="Montserrat"
                        fontWeight="100"
                    >
                        3. Choose the color
                    </Heading>
                    <ColorPicker.Root
                        open
                        value={parseColor(color)}
                        onValueChange={(e) =>
                            setColor(e.value.toString('hexa'))
                        }
                    >
                        <ColorPicker.HiddenInput />
                        <ColorPicker.Content
                            animation="none"
                            shadow="none"
                            padding="0"
                        >
                            <ColorPicker.Area />
                            <HStack>
                                <ColorPicker.EyeDropper
                                    size="xs"
                                    variant="outline"
                                />
                                <ColorPicker.Sliders />
                                <ColorPicker.ValueSwatch />
                            </HStack>
                        </ColorPicker.Content>
                    </ColorPicker.Root>
                    <Heading
                        size="md"
                        marginTop="16px"
                        color="green.100"
                        fontFamily="Montserrat"
                        fontWeight="100"
                    >
                        4. Download the final image
                    </Heading>
                    <Button
                        colorPalette="green"
                        onClick={handleDownload}
                        disabled={!image}
                    >
                        Download image with grid
                    </Button>
                </Stack>
                <Box
                    display="flex"
                    alignItems="center"
                    height="100%"
                >
                    <canvas
                        width="600"
                        height="600"
                        ref={canvasRef}
                        style={{
                            border: '1px solid #221e18',
                            maxWidth: `calc(100vw - 64px)`,
                            maxHeight: `calc(100vh - 64px)`,
                            margin: '12px',
                        }}
                    ></canvas>
                </Box>
                <HStack
                    position="fixed"
                    bottom="0"
                    right="0"
                >
                    <Text
                        fontSize="0.8em"
                        color="rgba(255, 255, 255, 0.5)"
                    >
                        {import.meta.env.MODE === 'development'
                            ? 'dev'
                            : __COMMIT_HASH__}
                    </Text>
                    <Link
                        href="https://github.com/Zazzik1/image-grid-tool"
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        <IconButton
                            aria-label="GitHub"
                            variant="ghost"
                            padding="0 8px"
                        >
                            <FaGithub />
                        </IconButton>
                    </Link>
                </HStack>
            </HStack>
        </Box>
    );
}

export default App;
