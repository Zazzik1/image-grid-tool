import {
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
import { useCallback, useEffect, useRef, useState } from 'react';
import { FaGithub } from 'react-icons/fa';
import { HiUpload } from 'react-icons/hi';

function App() {
    const [rows, setRows] = useState(4);
    const [columns, setColumns] = useState(4);
    const [lineThickness, setLineThickness] = useState(1);
    const [color, setColor] = useState('#00ff00');
    const [diagonals, setDiagonals] = useState(false);
    const [image, setImage] = useState<HTMLImageElement | null>(null);
    const [innerWidth, setInnerWidth] = useState(window.innerHeight);
    const [innerHeight, setInnerHeight] = useState(window.innerHeight);
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

    useEffect(() => {
        const handler = () => {
            setInnerHeight(window.innerHeight);
            setInnerWidth(window.innerWidth);
        };
        window.addEventListener('resize', handler);
        return () => {
            window.removeEventListener('resize', handler);
        };
    }, []);

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
    return (
        <HStack
            padding="0 8px"
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
                    color="green.500"
                >
                    Image Grid Tool
                </Heading>
                <Text
                    maxWidth="400px"
                    color="green.500"
                    marginBottom="16px"
                >
                    A simple way to add grids to images.
                </Text>
                <Heading size="md">1. Load your image</Heading>
                <Text
                    maxWidth="400px"
                    color="green.400"
                    fontSize="0.8em"
                >
                    Don't worry - your image stays on your device. All
                    processing happens right in your browser.
                </Text>
                <FileUpload.Root
                    accept={['image/png']}
                    onFileChange={(e) => {
                        const reader = new FileReader();
                        reader.onload = function (ev) {
                            const img = new Image();
                            img.src = ev.target?.result as string;
                            setImage(img);
                        };
                        reader.readAsDataURL(e.acceptedFiles[0]);
                        setFilename(e.acceptedFiles[0].name);
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
                    </HStack>
                )}
                <Heading
                    size="md"
                    marginTop="16px"
                >
                    2. Adjust the grid for your needs
                </Heading>
                <HStack>
                    <Field.Root width="max-content">
                        <Field.Label>Number of rows</Field.Label>
                        <NumberInput.Root
                            maxW="200px"
                            value={rows.toString()}
                            min={1}
                            onValueChange={(e: { valueAsNumber: number }) =>
                                setRows(e.valueAsNumber)
                            }
                        >
                            <NumberInput.Control />
                            <NumberInput.Input />
                        </NumberInput.Root>
                        {image && (
                            <Field.HelperText>
                                {Math.round(image.naturalHeight / rows)}px per
                                row ({(Math.round(1000 / rows) / 10).toFixed(1)}
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
                            onValueChange={(e: { valueAsNumber: number }) =>
                                setColumns(e.valueAsNumber)
                            }
                        >
                            <NumberInput.Control />
                            <NumberInput.Input />
                        </NumberInput.Root>
                        {image && (
                            <Field.HelperText>
                                {Math.round(image.naturalWidth / columns)}px per
                                column (
                                {(Math.round(1000 / columns) / 10).toFixed(1)}%)
                            </Field.HelperText>
                        )}
                    </Field.Root>
                </HStack>
                <HStack alignItems="end">
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
                >
                    3. Choose the color
                </Heading>
                <ColorPicker.Root
                    open
                    value={parseColor(color)}
                    onValueChange={(e) => setColor(e.value.toString('hexa'))}
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
            <canvas
                width="600"
                height="600"
                ref={canvasRef}
                style={{
                    border: '1px solid #00ff0032',
                    maxWidth: `calc(${innerWidth}px - 200px)`,
                    maxHeight: `calc(${innerHeight}px - 32px)`,
                    margin: '12px',
                }}
            ></canvas>
            <Link
                position="fixed"
                bottom="0"
                right="0"
                href="https://github.com/Zazzik1/Mandelbrot"
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
    );
}

export default App;
