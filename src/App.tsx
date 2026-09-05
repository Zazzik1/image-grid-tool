import {
    Box,
    Button,
    Center,
    Checkbox,
    ColorPicker,
    Field,
    FileUpload,
    FileUploadFileChangeDetails,
    Heading,
    HStack,
    Icon,
    IconButton,
    Link,
    NumberInput,
    parseColor,
    RadioCard,
    Separator,
    Spinner,
    Stack,
    Stat,
    Text,
} from '@chakra-ui/react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { FaGithub } from 'react-icons/fa';
import { FaMinus, FaPlus } from 'react-icons/fa6';
import { HiUpload } from 'react-icons/hi';
import {
    AspectRatio,
    getAspectRatio,
    getCellId,
    getGridColorSuggestion,
    getGridStep,
    getGridSuggestion,
    getLineThicknessSuggestion,
    mirrorImageHorizontally,
    mirrorImageVertically,
    rotateImage,
} from './util';
import CroppingTool from './components/CroppingTool';
import { FaArrowRotateLeft, FaArrowRotateRight } from 'react-icons/fa6';
import { TbMultiplier05X, TbMultiplier2X } from 'react-icons/tb';
import { Tooltip } from './components/ui/tooltip';
import { COLOR } from './const';
import { LuUpload } from 'react-icons/lu';
import { BiReflectHorizontal, BiReflectVertical } from 'react-icons/bi';
import { GoTrash } from 'react-icons/go';
import TresholdingTool from './components/TresholdingTool';
import LogTransformTool from './components/LogTransformTool';
import HSLTool from './components/HSLTool';
import useHistory from './hooks/useOperationsHistory';
import ConfirmationModal from './components/ConfirmationModal';
import ExportModal from './components/Export/ExportModal';

const HEADER_HEIGHT = 86;

function App() {
    const [rows, setRows] = useState(6);
    const [columns, setColumns] = useState(6);
    const [lineThickness, setLineThickness] = useState(1);
    const [color, setColor] = useState(COLOR.FG2);
    const [diagonals, setDiagonals] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [shouldShowCellIds, setShouldShowCellIds] = useState<boolean>(false);
    const [aspectRatio, setAspectRatio] = useState<ReturnType<
        typeof getAspectRatio
    > | null>(null);
    const [filename, setFilename] = useState('');
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    const suggestGrids = useCallback((img: HTMLImageElement) => {
        const {
            aspectRatio,
            grid: { columns, rows },
        } = getGridSuggestion(img);
        setAspectRatio(aspectRatio);
        setColor(getGridColorSuggestion(img));
        setLineThickness(
            getLineThicknessSuggestion(img.naturalWidth, img.naturalHeight)
        );
        setRows(rows);
        setColumns(columns);
    }, []);

    const history = useHistory({
        postKeydownAction: (snapshot) => suggestGrids(snapshot.image),
    });
    const image = history.snapshot?.image;

    const handleTurnLeft = useCallback(() => {
        if (!image) return;
        setIsLoading(true);
        rotateImage(image, -90).then((img) => {
            history.add('Rotate counterclockwise', img);
            suggestGrids(img);
        });
    }, [image, suggestGrids, history]);

    const handleTurnRight = useCallback(() => {
        if (!image) return;
        setIsLoading(true);
        rotateImage(image, 90).then((img) => {
            history.add('Rotate clockwise', img);
            suggestGrids(img);
        });
    }, [image, suggestGrids, history]);

    const handleToolSave = useCallback(
        (image: HTMLImageElement, toolName: string) => {
            history.add(toolName, image);
            setAspectRatio(getAspectRatio(image.width, image.height));
            suggestGrids(image);
            setIsLoading(true);
        },
        [suggestGrids, history]
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
                const cellWidth = w / columns;
                const cellHeight = h / rows;
                ctx.fillStyle = color;
                for (let y = 1; y < rows; y++) {
                    ctx.fillRect(
                        0,
                        cellHeight * y - lineThickness / 2,
                        w,
                        lineThickness
                    );
                }
                for (let x = 1; x < columns; x++) {
                    ctx.fillRect(
                        cellWidth * x - lineThickness / 2,
                        0,
                        lineThickness,
                        h
                    );
                }
                ctx.strokeStyle = color;
                ctx.lineWidth = lineThickness;
                if (diagonals) {
                    for (let y = 0; y < rows; y++) {
                        for (let x = 0; x < columns; x++) {
                            ctx.beginPath();
                            ctx.moveTo(cellWidth * x, cellHeight * y);
                            ctx.lineTo(
                                cellWidth * (x + 1),
                                cellHeight * (y + 1)
                            );
                            ctx.stroke();
                            ctx.closePath();
                            ctx.beginPath();
                            ctx.moveTo(cellWidth * (x + 1), cellHeight * y);
                            ctx.lineTo(cellWidth * x, cellHeight * (y + 1));
                            ctx.stroke();
                            ctx.closePath();
                        }
                    }
                }
                if (shouldShowCellIds) {
                    ctx.fillStyle = color;
                    ctx.lineWidth = 2;
                    const fontSize = Math.min(cellWidth, cellHeight) / 3;
                    ctx.font = `${fontSize}px monospace`;
                    for (let y = 0; y < rows; y++) {
                        for (let x = 0; x < columns; x++) {
                            const cellId = getCellId(x, y);
                            ctx.fillText(
                                cellId,
                                cellWidth * x +
                                    cellWidth / 2 -
                                    cellId.length * (fontSize / 4),
                                cellHeight * y + cellHeight / 2 + fontSize / 3
                            );
                        }
                    }
                }
                setIsLoading(false);
            }
        }
    }, [
        rows,
        columns,
        color,
        lineThickness,
        diagonals,
        image,
        shouldShowCellIds,
    ]);
    const pxPerColumn = useMemo(
        () => (image ? Math.round(image.naturalWidth / columns) : 1),
        [image, columns]
    );
    const pxPerRow = useMemo(
        () => (image ? Math.round(image.naturalHeight / rows) : 1),
        [image, rows]
    );
    const cellAspectRatio: AspectRatio = useMemo(() => {
        if (!image) return getAspectRatio(100, 100);
        return getAspectRatio(
            image.naturalWidth / columns,
            image.naturalHeight / rows
        );
    }, [image, columns, rows]);
    const isMobile = useMemo(() => {
        return window.innerWidth < 600;
    }, []);
    const gridStep = useMemo(() => {
        return getGridStep(
            aspectRatio?.widthComponent ?? 1,
            aspectRatio?.heightComponent ?? 1,
            cellAspectRatio.widthComponent,
            cellAspectRatio.heightComponent
        );
    }, [aspectRatio, cellAspectRatio]);
    const { canHalve, canSubstract, canAdd } = useMemo(() => {
        const c2 = columns / 2;
        const r2 = rows / 2;
        const canHalve = c2 === Math.floor(c2) && r2 === Math.floor(r2);
        const newSubRatio: AspectRatio = image
            ? getAspectRatio(
                  image.naturalWidth / (columns - gridStep.deltaC),
                  image.naturalHeight / (rows - gridStep.deltaR)
              )
            : getAspectRatio(100, 100);
        const canSubstract =
            columns - gridStep.deltaC > 0 &&
            rows - gridStep.deltaR > 0 &&
            newSubRatio.widthComponent === cellAspectRatio.widthComponent &&
            newSubRatio.heightComponent === cellAspectRatio.heightComponent;
        const newAddRatio: AspectRatio = image
            ? getAspectRatio(
                  image.naturalWidth / (columns + gridStep.deltaC),
                  image.naturalHeight / (rows + gridStep.deltaR)
              )
            : getAspectRatio(100, 100);
        const canAdd =
            pxPerColumn > 1 &&
            pxPerRow > 1 &&
            newAddRatio.widthComponent === cellAspectRatio.widthComponent &&
            newAddRatio.heightComponent === cellAspectRatio.heightComponent;
        return { canHalve, canSubstract, canAdd };
    }, [
        columns,
        rows,
        gridStep.deltaC,
        gridStep.deltaR,
        pxPerColumn,
        pxPerRow,
        cellAspectRatio.widthComponent,
        cellAspectRatio.heightComponent,
        image,
    ]);
    const handleOnFileChange = useCallback(
        (e: FileUploadFileChangeDetails) => {
            const file = e.acceptedFiles[0];
            if (!file) return;

            setIsLoading(true);
            const sp = file.name.split('.');
            sp.pop();
            setFilename(`${sp.join('.')}-GRID`);
            setError(null);

            const reader = new FileReader();
            reader.onload = (ev) => {
                const result = ev.target?.result;
                if (!result) return;

                const img = new Image();
                img.onload = () => {
                    history.clear();
                    history.add('Load image', img);
                    suggestGrids(img);
                    setIsLoading(false);
                };
                img.onerror = () => {
                    setError('Failed to load image');
                    setIsLoading(false);
                };
                img.src = result as string;
            };
            reader.readAsDataURL(file);
        },
        [suggestGrids, history]
    );

    const handleReflectVertically = useCallback<() => void>(() => {
        if (!image) return;
        setIsLoading(true);
        mirrorImageVertically(image).then((image) =>
            handleToolSave(image, 'Reflect vertically')
        );
    }, [image, handleToolSave]);

    const handleReflectHorizontally = useCallback<() => void>(() => {
        if (!image) return;
        setIsLoading(true);
        mirrorImageHorizontally(image).then((image) =>
            handleToolSave(image, 'Reflect horizontally')
        );
    }, [image, handleToolSave]);

    return (
        <Box
            display="flex"
            flexDirection={isMobile ? 'block' : 'column'}
            justifyContent={isMobile ? 'normal' : 'center'}
            flexWrap="wrap"
            height="100vh"
            minHeight="100vh"
        >
            <HStack
                justifyContent="space-between"
                backgroundColor={COLOR.FG}
                color={COLOR.TEXT2}
                width="100%"
                height={`${HEADER_HEIGHT}px`}
                padding={isMobile ? '0 8px' : '0 24px'}
                borderBottom={`1px solid ${COLOR.FG2}`}
            >
                <Box>
                    <Heading
                        size="3xl"
                        fontFamily="Montserrat"
                        fontWeight="100"
                        letterSpacing="-2px"
                    >
                        Image Grid Tool
                    </Heading>
                    <Text color={COLOR.TEXT}>
                        A simple way to add grids to images.
                    </Text>
                </Box>
                <ExportModal
                    canvasRef={canvasRef}
                    disabled={!image}
                    filename={filename}
                />
            </HStack>
            <Box
                display="flex"
                flexDirection={isMobile ? 'column-reverse' : 'row'}
                color={COLOR.TEXT2}
                justifyContent="space-between"
                alignItems="start"
                boxSizing="border-box"
                width="100%"
                flexGrow="1"
            >
                <Box
                    flexGrow="1"
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                    height="100%"
                    width="100%"
                    position="relative"
                >
                    {image ? (
                        <>
                            <canvas
                                width="600"
                                height="600"
                                ref={canvasRef}
                                style={{
                                    border: `1px solid ${COLOR.FG2}`,
                                    maxWidth: `calc(100% - 64px)`,
                                    maxHeight: `calc(100% - 64px)`,
                                    position: isMobile
                                        ? 'relative'
                                        : 'absolute',
                                    overflow: 'hidden',
                                }}
                                data-test-name="app-canvas"
                            ></canvas>
                            {isLoading && (
                                <Box pos="absolute" inset="0">
                                    <Center h="full">
                                        <Spinner
                                            size="lg"
                                            color={COLOR.TEXT}
                                            data-test-name="canvas-spinner"
                                        />
                                    </Center>
                                </Box>
                            )}
                        </>
                    ) : (
                        <FileUpload.Root
                            maxW="2xl"
                            alignItems="stretch"
                            maxFiles={1}
                            accept={[
                                'image/png',
                                'image/jpeg',
                                'image/webp',
                                'image/heic',
                            ]}
                            onFileChange={handleOnFileChange}
                        >
                            <FileUpload.HiddenInput />
                            <FileUpload.Dropzone
                                backgroundColor={COLOR.FG}
                                _hover={{ backgroundColor: COLOR.FG2 }}
                            >
                                <Icon size="md" color="fg.muted">
                                    <LuUpload />
                                </Icon>
                                <FileUpload.DropzoneContent>
                                    <Box>Drag and drop file here</Box>
                                    <Box color="fg.muted">
                                        .png, .jpg, .jpeg, .webp, .heic
                                    </Box>
                                </FileUpload.DropzoneContent>
                            </FileUpload.Dropzone>
                        </FileUpload.Root>
                    )}
                </Box>
                <Stack
                    backgroundColor={COLOR.FG}
                    borderLeft={`1px solid ${COLOR.FG2}`}
                    padding={isMobile ? '8px 8px' : '8px 24px'}
                    height={
                        isMobile ? 'unset' : `calc(100vh - ${HEADER_HEIGHT}px)`
                    }
                    width={isMobile ? '100%' : '400px'}
                    minWidth={isMobile ? '100%' : '400px'}
                    overflowY={isMobile ? 'unset' : 'scroll'}
                    zIndex="1"
                >
                    <Heading size="md" paddingTop="8px">
                        Image
                    </Heading>
                    {image == null && (
                        <>
                            <Text
                                maxWidth="300px"
                                color={COLOR.TEXT}
                                fontSize="0.8em"
                            >
                                Don't worry - your image stays on your device.
                                All processing happens right in your browser.
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
                                    onFileChange={handleOnFileChange}
                                >
                                    <FileUpload.HiddenInput data-test-name="upload-file-input" />
                                    <FileUpload.Trigger asChild>
                                        <Button variant="surface" size="sm">
                                            <HiUpload /> Load image
                                        </Button>
                                    </FileUpload.Trigger>
                                </FileUpload.Root>
                                {error ? <Text color="red">{error}</Text> : ''}
                            </HStack>
                        </>
                    )}
                    {image && (
                        <>
                            <HStack>
                                <CroppingTool
                                    image={image}
                                    onSave={(image) =>
                                        handleToolSave(image, 'Crop')
                                    }
                                />
                                <Tooltip content="Rotate counterclockwise">
                                    <IconButton
                                        variant="surface"
                                        size="sm"
                                        onClick={handleTurnLeft}
                                        data-test-name="rotate-left"
                                    >
                                        <FaArrowRotateLeft />
                                    </IconButton>
                                </Tooltip>
                                <Tooltip content="Rotate clockwise">
                                    <IconButton
                                        variant="surface"
                                        size="sm"
                                        onClick={handleTurnRight}
                                        data-test-name="rotate-right"
                                    >
                                        <FaArrowRotateRight />
                                    </IconButton>
                                </Tooltip>
                                <Tooltip content="Reflect vertically">
                                    <IconButton
                                        variant="surface"
                                        size="sm"
                                        onClick={handleReflectVertically}
                                        data-test-name="reflect-vertically"
                                    >
                                        <BiReflectHorizontal />
                                    </IconButton>
                                </Tooltip>
                                <Tooltip content="Reflect horizontally">
                                    <IconButton
                                        variant="surface"
                                        size="sm"
                                        onClick={handleReflectHorizontally}
                                        data-test-name="reflect-horizontally"
                                    >
                                        <BiReflectVertical />
                                    </IconButton>
                                </Tooltip>
                                <Tooltip content="Delete the image">
                                    <IconButton
                                        variant="surface"
                                        size="sm"
                                        onClick={() =>
                                            setIsConfirmModalOpen(true)
                                        }
                                        data-test-name="delete-image"
                                    >
                                        <GoTrash />
                                    </IconButton>
                                </Tooltip>
                            </HStack>
                            <HStack>
                                <TresholdingTool
                                    image={image}
                                    onSave={(image) =>
                                        handleToolSave(image, 'Tresholding')
                                    }
                                />
                                <LogTransformTool
                                    image={image}
                                    onSave={(image) =>
                                        handleToolSave(
                                            image,
                                            'Complex transform'
                                        )
                                    }
                                />
                                <HSLTool
                                    image={image}
                                    onSave={(image) =>
                                        handleToolSave(image, 'HSL tool')
                                    }
                                />
                            </HStack>

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
                            <HStack>
                                <Stat.Root>
                                    <Stat.Label>Aspect ratio</Stat.Label>
                                    <Stat.ValueText>
                                        {aspectRatio?.label}
                                    </Stat.ValueText>
                                </Stat.Root>
                                <Stat.Root paddingLeft={2}>
                                    <Stat.Label>Cell aspect ratio</Stat.Label>
                                    <Stat.ValueText data-test-name="cell-aspect-ratio">
                                        {cellAspectRatio.label}
                                    </Stat.ValueText>
                                </Stat.Root>
                            </HStack>
                        </>
                    )}
                    <Separator margin="8px 0" />
                    <Heading size="md" color={COLOR.TEXT2}>
                        Grid
                    </Heading>
                    <HStack flexWrap="wrap" alignItems="start">
                        <Field.Root width="max-content">
                            <Field.Label>Number of rows</Field.Label>
                            <NumberInput.Root
                                backgroundColor={COLOR.BG}
                                maxW="160px"
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
                                backgroundColor={COLOR.BG}
                                maxW="160px"
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
                                        1
                                    )}
                                    %)
                                </Field.HelperText>
                            )}
                        </Field.Root>
                    </HStack>
                    {image != null && (
                        <HStack paddingTop="8px">
                            <Tooltip content="Double the number of rows and columns">
                                <IconButton
                                    variant="surface"
                                    size="md"
                                    disabled={pxPerColumn <= 1 || pxPerRow <= 1}
                                    onClick={() => {
                                        setColumns(columns * 2);
                                        setRows(rows * 2);
                                    }}
                                    data-test-name="double-grid"
                                >
                                    <TbMultiplier2X />
                                </IconButton>
                            </Tooltip>
                            <Tooltip content="Reduce rows and columns by half">
                                <IconButton
                                    variant="surface"
                                    size="md"
                                    disabled={!canHalve}
                                    onClick={() => {
                                        if (canHalve) {
                                            setColumns(columns / 2);
                                            setRows(rows / 2);
                                        }
                                    }}
                                    data-test-name="halve-grid"
                                >
                                    <TbMultiplier05X />
                                </IconButton>
                            </Tooltip>
                            <Tooltip content="Increase grid using current aspect ratio">
                                <IconButton
                                    variant="surface"
                                    size="md"
                                    disabled={!canAdd}
                                    onClick={() => {
                                        if (canAdd) {
                                            setColumns(
                                                columns + gridStep.deltaC
                                            );
                                            setRows(rows + gridStep.deltaR);
                                        }
                                    }}
                                    data-test-name="increase-grid"
                                >
                                    <FaPlus />
                                </IconButton>
                            </Tooltip>
                            <Tooltip content="Decrease grid using current aspect ratio">
                                <IconButton
                                    variant="surface"
                                    size="md"
                                    disabled={!canSubstract}
                                    onClick={() => {
                                        if (canSubstract) {
                                            setColumns(
                                                columns - gridStep.deltaC
                                            );
                                            setRows(rows - gridStep.deltaR);
                                        }
                                    }}
                                    data-test-name="decrease-grid"
                                >
                                    <FaMinus />
                                </IconButton>
                            </Tooltip>
                        </HStack>
                    )}
                    <HStack gap={2} alignItems="end">
                        <Field.Root width="max-content">
                            <Field.Label>Line thickness</Field.Label>
                            <NumberInput.Root
                                backgroundColor={COLOR.BG}
                                maxW="160px"
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
                        <Stack>
                            <Checkbox.Root
                                width="max-content"
                                checked={diagonals}
                                onCheckedChange={(e) => {
                                    setDiagonals(!!e.checked);
                                }}
                            >
                                <Checkbox.HiddenInput />
                                <Checkbox.Control borderColor={COLOR.FG2} />
                                <Checkbox.Label>Diagonals</Checkbox.Label>
                            </Checkbox.Root>
                            <Checkbox.Root
                                width="max-content"
                                checked={shouldShowCellIds}
                                onCheckedChange={(e) => {
                                    setShouldShowCellIds(!!e.checked);
                                }}
                            >
                                <Checkbox.HiddenInput />
                                <Checkbox.Control borderColor={COLOR.FG2} />
                                <Checkbox.Label>Cell IDs</Checkbox.Label>
                            </Checkbox.Root>
                        </Stack>
                    </HStack>
                    <Separator margin="8px 0" />
                    <Heading size="md" color={COLOR.TEXT2}>
                        Color
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
                            backgroundColor={COLOR.FG}
                        >
                            <ColorPicker.Area />
                            <HStack>
                                <ColorPicker.EyeDropper
                                    size="xs"
                                    variant="surface"
                                />
                                <ColorPicker.Sliders />
                                <ColorPicker.ValueSwatch />
                            </HStack>
                        </ColorPicker.Content>
                    </ColorPicker.Root>
                    {!!history.history.length && (
                        <>
                            <Separator margin="8px 0" />
                            <Heading size="md" color={COLOR.TEXT2}>
                                History
                            </Heading>
                            <RadioCard.Root
                                size="sm"
                                value={history.index + ''}
                                onValueChange={(e) => {
                                    const value = e.value;
                                    if (!value) return;
                                    history.setIndex(+value);
                                    const snapshot = history.history[+value];
                                    if (snapshot) suggestGrids(snapshot.image);
                                }}
                            >
                                <Stack align="stretch">
                                    {history.history.map((item, index) => (
                                        <RadioCard.Item
                                            key={index}
                                            value={index + ''}
                                        >
                                            <RadioCard.ItemHiddenInput />
                                            <RadioCard.ItemControl>
                                                <RadioCard.ItemText>
                                                    {item.toolName}
                                                </RadioCard.ItemText>
                                                <RadioCard.ItemDescription>
                                                    {item.date.toLocaleTimeString(
                                                        'en-GB'
                                                    )}
                                                </RadioCard.ItemDescription>
                                                <RadioCard.ItemIndicator />
                                            </RadioCard.ItemControl>
                                        </RadioCard.Item>
                                    ))}
                                </Stack>
                            </RadioCard.Root>
                        </>
                    )}
                </Stack>
                <HStack position="fixed" bottom="0" right="14px" zIndex={2}>
                    <Text fontSize="0.8em" color="rgba(255, 255, 255, 0.5)">
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
            </Box>
            <ConfirmationModal
                open={isConfirmModalOpen}
                setOpen={setIsConfirmModalOpen}
                confirmButtonText="Delete image"
                title="Delete this image?"
                description="This will permanently delete the current image and its operation history. This action cannot be undone."
                onConfirm={history.clear}
            />
        </Box>
    );
}

export default App;
