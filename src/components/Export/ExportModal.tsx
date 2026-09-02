import { COLOR } from '@/const';
import { Button, CloseButton, Dialog, Portal } from '@chakra-ui/react';
import { useCallback, useState } from 'react';
import { HiDownload } from 'react-icons/hi';

type Props = {
    filename: string;
    disabled: boolean;
    canvasRef: React.RefObject<HTMLCanvasElement | null>;
};

type Format = 'png' | 'jpeg' | 'webp';

const ExportModal = ({ filename, disabled, canvasRef }: Props) => {
    const [format, setFormat] = useState<Format>('png');
    const [quality, setQuality] = useState<number>(1.0);

    const handleDownload = useCallback(() => {
        if (!canvasRef.current) return;
        const link = document.createElement('a');
        link.download = `${filename}.${format}`;
        link.href = canvasRef.current.toDataURL(`image/${format}`, quality);
        link.click();
    }, [filename, format, quality, canvasRef]);

    const handleExport = useCallback(() => {
        handleDownload();
        // TODO: add support for share API
        // TODO: add support for copy of base64 / img tag with base64 to clipboard
        // TODO: add support for copy of image to clipboard
    }, [handleDownload]);

    return (
        <Dialog.Root placement={'center'} lazyMount>
            <Dialog.Trigger asChild>
                <Button
                    colorPalette="blue"
                    disabled={disabled}
                    width="max-content"
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
                            <select
                                value={format}
                                onChange={(e) =>
                                    setFormat(e.target.value as Format)
                                }
                            >
                                <option value="png">PNG</option>
                                <option value="jpeg">JPEG</option>
                                <option value="webp">WEBP</option>
                            </select>
                            <br />
                            <br />
                            <input
                                type="number"
                                min={0}
                                max={1}
                                value={quality}
                                step={0.05}
                                onChange={(e) =>
                                    setQuality(e.target.valueAsNumber)
                                }
                            />
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
                                <Button
                                    size="sm"
                                    colorPalette="blue"
                                    onClick={handleExport}
                                    data-test-name="export-modal-confirm"
                                >
                                    <HiDownload />
                                    Export
                                </Button>
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
