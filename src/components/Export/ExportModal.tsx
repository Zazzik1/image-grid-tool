import { COLOR } from '@/const';
import {
    Button,
    CloseButton,
    createListCollection,
    Dialog,
    Field,
    HStack,
    Icon,
    Input,
    InputGroup,
    Portal,
    RadioCard,
    Select,
    Slider,
} from '@chakra-ui/react';
import { useCallback, useEffect, useState } from 'react';
import { HiClipboardCopy, HiDownload } from 'react-icons/hi';
import { HiCodeBracket } from 'react-icons/hi2';
import { toaster } from '../ui/toaster';

type Props = {
    filename: string;
    disabled: boolean;
    canvasRef: React.RefObject<HTMLCanvasElement | null>;
};

type Format = 'png' | 'jpeg' | 'webp';
type ExportMethod = 'download-image' | 'copy-image' | 'copy-code';

const exportOptions = [
    {
        icon: <HiDownload />,
        value: 'download-image',
        title: 'Download image',
        description: 'Save the image as a file to your device.',
    },
    {
        icon: <HiClipboardCopy />,
        value: 'copy-image',
        title: 'Copy image',
        description:
            'Copy the image to your clipboard for easy pasting into other apps.',
    },
    {
        icon: <HiCodeBracket />,
        value: 'copy-code',
        title: 'Copy HTML',
        description:
            'Copy an HTML <img> tag with the image embedded as Base64.',
    },
];

const fileFormats = createListCollection({
    items: [
        { label: 'PNG', value: 'png' },
        { label: 'JPEG', value: 'jpeg' },
        { label: 'WEBP', value: 'webp' },
    ],
});

const marks = [
    { value: 0, label: '0%' },
    { value: 25, label: '25%' },
    { value: 50, label: '50%' },
    { value: 75, label: '75%' },
    { value: 100, label: '100%' },
];

const DEFAULT_QUALITY: number = 1.0;
const DEFAULT_FORMAT: Format = 'png';
const DEFAULT_EXPORT_METHOD: ExportMethod = 'download-image';

const ExportModal = ({ filename, disabled, canvasRef }: Props) => {
    const [customFilename, setCustomFilename] = useState<string>(filename);
    const [format, setFormat] = useState<Format>(DEFAULT_FORMAT);
    const [quality, setQuality] = useState<number>(DEFAULT_QUALITY);
    const [exportMethod, setExportMethod] = useState<ExportMethod>(
        DEFAULT_EXPORT_METHOD
    );

    const handleDownload = useCallback(() => {
        if (!canvasRef.current) return;
        const link = document.createElement('a');
        link.download = `${customFilename}.${format}`;
        link.href = canvasRef.current.toDataURL(`image/${format}`, quality);
        link.click();
        toaster.success({
            title: 'Image saved',
            duration: 2000,
            description: 'Your image has been saved to your device.',
        });
    }, [customFilename, format, quality, canvasRef]);

    const handleCopyImageToClipboard = useCallback(async () => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const blob = await new Promise<Blob | null>((resolve) =>
            canvas.toBlob(resolve, 'image/png')
        );

        if (!blob) return;

        try {
            await navigator.clipboard.write([
                new ClipboardItem({
                    'image/png': blob,
                }),
            ]);
        } catch {
            toaster.error({
                title: 'Copy failed',
                duration: 2000,
                description:
                    'We couldn’t copy the image to your clipboard. Please try again.',
            });
        }
        toaster.success({
            title: 'Image copied',
            duration: 2000,
            description: 'Your image is ready to paste.',
        });
    }, [canvasRef]);

    const handleCopyCodeToClipboard = useCallback(async () => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const src = canvas.toDataURL('image/png', quality);
        const text = `<img alt="Exported image" width="${canvas.width}" height="${canvas.height}" src="${src}" />`;
        try {
            await navigator.clipboard.writeText(text);
        } catch {
            toaster.error({
                title: 'Copy failed',
                duration: 2000,
                description:
                    'We couldn’t copy the image to your clipboard. Please try again.',
            });
        }
        toaster.success({
            title: 'Image copied successfully!',
            duration: 2000,
            description: 'Your image has been saved to clipboard.',
        });
    }, [quality, canvasRef]);

    // TODO: add support for share API

    const handleFilenameChange = useCallback<
        React.ChangeEventHandler<HTMLInputElement>
    >((e) => {
        setCustomFilename(e.target.value);
    }, []);

    const handleReset = useCallback(() => {
        setQuality(DEFAULT_QUALITY);
        setFormat(DEFAULT_FORMAT);
        setExportMethod(DEFAULT_EXPORT_METHOD);
        setCustomFilename(filename);
    }, [filename]);

    useEffect(() => {
        setCustomFilename(filename);
    }, [filename]);

    return (
        <Dialog.Root
            placement={'center'}
            size={'lg'}
            lazyMount
            onExitComplete={handleReset}
        >
            <Dialog.Trigger asChild>
                <Button
                    colorPalette="blue"
                    disabled={disabled}
                    width="max-content"
                    data-test-name="export-modal-open"
                >
                    <HiDownload />
                    Export
                </Button>
            </Dialog.Trigger>
            <Portal>
                <Dialog.Backdrop />
                <Dialog.Positioner>
                    <Dialog.Content backgroundColor={COLOR.FG}>
                        <Dialog.Header>
                            <Dialog.Title>Export image</Dialog.Title>
                        </Dialog.Header>
                        <Dialog.Body>
                            <RadioCard.Root
                                value={exportMethod}
                                onValueChange={(e) =>
                                    setExportMethod(e.value as ExportMethod)
                                }
                            >
                                <RadioCard.Label>Export method</RadioCard.Label>
                                <HStack align="stretch">
                                    {exportOptions.map((item) => (
                                        <RadioCard.Item
                                            key={item.value}
                                            value={item.value}
                                        >
                                            <RadioCard.ItemHiddenInput />
                                            <RadioCard.ItemControl>
                                                <RadioCard.ItemContent>
                                                    <Icon
                                                        size="xl"
                                                        color="fg.muted"
                                                        mb="2"
                                                    >
                                                        {item.icon}
                                                    </Icon>
                                                    <RadioCard.ItemText>
                                                        {item.title}
                                                    </RadioCard.ItemText>
                                                    <RadioCard.ItemDescription>
                                                        {item.description}
                                                    </RadioCard.ItemDescription>
                                                </RadioCard.ItemContent>
                                                <RadioCard.ItemIndicator />
                                            </RadioCard.ItemControl>
                                        </RadioCard.Item>
                                    ))}
                                </HStack>
                            </RadioCard.Root>
                            {exportMethod === 'download-image' && (
                                <>
                                    <br />
                                    <Select.Root
                                        collection={fileFormats}
                                        width="320px"
                                        value={[format]}
                                        onValueChange={(e) =>
                                            setFormat(e.value[0] as Format)
                                        }
                                    >
                                        <Select.HiddenSelect />
                                        <Select.Label>Format</Select.Label>
                                        <Select.Control>
                                            <Select.Trigger>
                                                <Select.ValueText placeholder="Select format" />
                                            </Select.Trigger>
                                            <Select.IndicatorGroup>
                                                <Select.Indicator />
                                            </Select.IndicatorGroup>
                                        </Select.Control>
                                        <Select.Positioner>
                                            <Select.Content>
                                                {fileFormats.items.map(
                                                    (format) => (
                                                        <Select.Item
                                                            item={format}
                                                            key={format.value}
                                                        >
                                                            {format.label}
                                                            <Select.ItemIndicator />
                                                        </Select.Item>
                                                    )
                                                )}
                                            </Select.Content>
                                        </Select.Positioner>
                                    </Select.Root>
                                    <br />
                                    <Field.Root>
                                        <Field.Label>File name</Field.Label>
                                        <InputGroup
                                            width="320px"
                                            endAddon={`.${format.toUpperCase()}`}
                                            marginBottom="4px"
                                        >
                                            <Input
                                                width="100%"
                                                placeholder="File name"
                                                value={customFilename}
                                                onChange={handleFilenameChange}
                                            />
                                        </InputGroup>
                                    </Field.Root>
                                </>
                            )}
                            {(exportMethod === 'download-image' ||
                                exportMethod === 'copy-code') && (
                                <>
                                    <br />
                                    <Slider.Root
                                        width="320px"
                                        colorPalette="blue"
                                        value={[quality * 100]}
                                        onValueChange={(e) =>
                                            setQuality(e.value[0] / 100)
                                        }
                                    >
                                        <Slider.Label>Quality</Slider.Label>
                                        <Slider.Control>
                                            <Slider.Track>
                                                <Slider.Range />
                                            </Slider.Track>
                                            <Slider.Thumbs />
                                            <Slider.Marks marks={marks} />
                                        </Slider.Control>
                                    </Slider.Root>
                                    <br />
                                </>
                            )}
                        </Dialog.Body>
                        <Dialog.Footer>
                            <Dialog.ActionTrigger asChild>
                                <Button
                                    variant="outline"
                                    data-test-name="export-modal-cancel"
                                >
                                    Close
                                </Button>
                            </Dialog.ActionTrigger>
                            <Dialog.ActionTrigger>
                                {exportMethod === 'download-image' && (
                                    <Button
                                        size="sm"
                                        colorPalette="blue"
                                        onClick={handleDownload}
                                        data-test-name="export-modal-confirm"
                                    >
                                        <HiDownload />
                                        Download image
                                    </Button>
                                )}
                                {exportMethod === 'copy-image' && (
                                    <Button
                                        size="sm"
                                        colorPalette="blue"
                                        onClick={handleCopyImageToClipboard}
                                        data-test-name="export-modal-confirm"
                                    >
                                        <HiClipboardCopy />
                                        Copy image
                                    </Button>
                                )}
                                {exportMethod === 'copy-code' && (
                                    <Button
                                        size="sm"
                                        colorPalette="blue"
                                        onClick={handleCopyCodeToClipboard}
                                        data-test-name="export-modal-confirm"
                                    >
                                        <HiClipboardCopy />
                                        Copy HTML
                                    </Button>
                                )}
                            </Dialog.ActionTrigger>
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

export default ExportModal;
