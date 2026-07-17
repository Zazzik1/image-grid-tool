export type CropAreaProps = {
    x1: number;
    y1: number;
    x2: number;
    y2: number;
    image: { width: number; height: number };
    perceivedImageWidth: number;
    height: number;
};

const COLOR_PRIMARY = 'white';
const COLOR_SECONDARY = 'rgb(190,190,190)';

const LENGTH_A = 30;
const LENGTH_B = 4;

const Box = ({
    x,
    y,
    w,
    h,
    color = COLOR_PRIMARY,
}: {
    x: number;
    y: number;
    w: number;
    h: number;
    color?: string;
}) => (
    <div
        style={{
            left: `${x}px`,
            top: `${y}px`,
            width: w,
            height: h,
            position: 'absolute',
            backgroundColor: color,
        }}
    ></div>
);

export const TopLeftHandle = ({
    x1,
    y1,
    image,
    perceivedImageWidth,
    height,
}: CropAreaProps) => (
    <>
        <Box
            x={(x1 / image.width) * perceivedImageWidth - LENGTH_B + 1}
            y={(y1 / image.height) * height - LENGTH_B + 1}
            w={LENGTH_A}
            h={LENGTH_B}
        />
        <Box
            x={(x1 / image.width) * perceivedImageWidth - LENGTH_B + 1}
            y={(y1 / image.height) * height - LENGTH_B + 1}
            w={LENGTH_B}
            h={LENGTH_A}
        />
    </>
);

export const TopRightHandle = ({
    y1,
    x2,
    image,
    perceivedImageWidth,
    height,
}: CropAreaProps) => (
    <>
        <Box
            x={
                (x2 / image.width) * perceivedImageWidth -
                LENGTH_A +
                LENGTH_B -
                1
            }
            y={(y1 / image.height) * height - LENGTH_B + 1}
            w={LENGTH_A}
            h={LENGTH_B}
        />
        <Box
            x={(x2 / image.width) * perceivedImageWidth - 1}
            y={(y1 / image.height) * height - LENGTH_B + 1}
            w={LENGTH_B}
            h={LENGTH_A}
        />
    </>
);

export const BottomRightHandle = ({
    x2,
    y2,
    image,
    perceivedImageWidth,
    height,
}: CropAreaProps) => (
    <>
        <Box
            x={
                (x2 / image.width) * perceivedImageWidth -
                LENGTH_A +
                LENGTH_B -
                1
            }
            y={(y2 / image.height) * height - 1}
            w={LENGTH_A}
            h={LENGTH_B}
        />
        <Box
            x={(x2 / image.width) * perceivedImageWidth - 1}
            y={(y2 / image.height) * height - LENGTH_A + LENGTH_B - 1}
            w={LENGTH_B}
            h={LENGTH_A}
        />
    </>
);

export const BottomLeftHandle = ({
    x1,
    y2,
    image,
    perceivedImageWidth,
    height,
}: CropAreaProps) => (
    <>
        <Box
            x={(x1 / image.width) * perceivedImageWidth - LENGTH_B + 1}
            y={(y2 / image.height) * height - 1}
            w={LENGTH_A}
            h={LENGTH_B}
        />
        <Box
            x={(x1 / image.width) * perceivedImageWidth - LENGTH_B + 1}
            y={(y2 / image.height) * height - LENGTH_A + LENGTH_B - 1}
            w={LENGTH_B}
            h={LENGTH_A}
        />
    </>
);

export const CropAreaHandles = (props: CropAreaProps) => (
    <>
        <TopLeftHandle {...props} />
        <TopRightHandle {...props} />
        <BottomLeftHandle {...props} />
        <BottomRightHandle {...props} />
    </>
);

export const CropAreaGrid = ({
    x1,
    y1,
    x2,
    y2,
    image,
    perceivedImageWidth,
    height,
}: CropAreaProps) => (
    <>
        <Box
            x={
                ((x1 + ((x2 - x1) * 1) / 3 - 1) / image.width) *
                perceivedImageWidth
            }
            y={(y1 / image.height) * height}
            w={1}
            h={((y2 - y1) / image.height) * height}
            color={COLOR_SECONDARY}
        />
        <Box
            x={
                ((x1 + ((x2 - x1) * 2) / 3 - 1) / image.width) *
                perceivedImageWidth
            }
            y={(y1 / image.height) * height}
            w={1}
            h={((y2 - y1) / image.height) * height}
            color={COLOR_SECONDARY}
        />
        <Box
            x={(x1 / image.width) * perceivedImageWidth}
            y={((y1 + ((y2 - y1) * 1) / 3 - 1) / image.height) * height}
            w={((x2 - x1) / image.width) * perceivedImageWidth}
            h={1}
            color={COLOR_SECONDARY}
        />
        <Box
            x={(x1 / image.width) * perceivedImageWidth}
            y={((y1 + ((y2 - y1) * 2) / 3 - 1) / image.height) * height}
            w={((x2 - x1) / image.width) * perceivedImageWidth}
            h={1}
            color={COLOR_SECONDARY}
        />
    </>
);

export const CropAreaBoundary = ({
    x1,
    y1,
    x2,
    y2,
    image,
    perceivedImageWidth,
    height,
}: CropAreaProps) => (
    <>
        <Box
            x={(x1 / image.width) * perceivedImageWidth}
            y={(y1 / image.height) * height}
            w={((x2 - x1) / image.width) * perceivedImageWidth}
            h={1}
            color={COLOR_SECONDARY}
        />
        <Box
            x={(x1 / image.width) * perceivedImageWidth}
            y={(y2 / image.height) * height - 1}
            w={((x2 - x1) / image.width) * perceivedImageWidth}
            h={1}
            color={COLOR_SECONDARY}
        />
        <Box
            x={(x1 / image.width) * perceivedImageWidth}
            y={(y1 / image.height) * height}
            w={1}
            h={((y2 - y1) / image.height) * height}
            color={COLOR_SECONDARY}
        />
        <Box
            x={(x2 / image.width) * perceivedImageWidth - 1}
            y={(y1 / image.height) * height}
            w={1}
            h={((y2 - y1) / image.height) * height}
            color={COLOR_SECONDARY}
        />
    </>
);
