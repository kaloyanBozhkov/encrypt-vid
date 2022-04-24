import { MutableRefObject } from 'react'

import type { WebPreviewConfig } from 'types/common'

import { speechToText } from './speechToText'
import { renderGroupPixelsAsSquares } from './unused'

/**
 * Runs the active algorithm passes it formattedAvg pixel matrix
 */
export const runAlgorithm = ({
    ctx,
    imageData,
    image,
    groupBy,
    greenMode,
    withTextInsteadOfChars = false,
}: {
    ctx: CanvasRenderingContext2D
    imageData?: ImageData
    image?: CanvasImageSource
    groupBy: number
    greenMode: boolean
    withTextInsteadOfChars?: boolean
}) => {
    const formattedAvg = getFormattedAvg({
        ctx,
        ...(image ? { image } : { imageData }),
        groupBy,
        greenMode,
    })

    GlobalMessenger.activeAlgorithm({
        formattedAvg,
        groupBy,
        withTextInsteadOfChars,
        centerShift_x: 0,
        centerShift_y: 0,
        ctx,
    })
}

export const getFormattedAvg = ({
    ctx,
    imageData,
    image,
    groupBy,
    greenMode,
}: {
    ctx: CanvasRenderingContext2D
    imageData?: ImageData
    image?: CanvasImageSource
    groupBy: number
    greenMode: boolean
}) => {
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height)

    if (imageData) ctx.putImageData(imageData, 0, 0)
    else if (image) ctx.drawImage(image, 0, 0, ctx.canvas.width, ctx.canvas.height)

    const formattedAvg = getAveragePixelInfoPerGroupedBlockOfPixels(
        ctx.getImageData(0, 0, ctx.canvas.width, ctx.canvas.height),
        groupBy,
        greenMode
    )

    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height)

    return formattedAvg
}

export const renderLetteredFrame = ({
    formattedAvg,
    groupBy,
    ctx,
    withBackgroundColor,
    withoutBG = true,
    centerShift_x = 0,
    centerShift_y = 0,
    withTextInsteadOfChars = false,
}: {
    formattedAvg: ReturnType<typeof getFormattedAvg>
    groupBy: number
    ctx: CanvasRenderingContext2D
    withBackgroundColor: string
    withoutBG?: boolean
    centerShift_x?: number
    centerShift_y?: number
    greenMode?: boolean
    withTextInsteadOfChars?: boolean
}) => {
    if (withBackgroundColor) {
        ctx.fillStyle = withBackgroundColor
        ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height)
    }

    if (!withoutBG)
        ctx.putImageData(
            formattedBlockOfPixelsToImage(formattedAvg, groupBy, ctx),
            centerShift_x,
            centerShift_y
        )

    renderGroupPixelsAsLetters({
        withTextInsteadOfChars,
        formattedAvg,
        groupBy,
        centerShift_x,
        centerShift_y,
        ctx,
    })
}

export const drawImageScaled = (img: HTMLImageElement, ctx: CanvasRenderingContext2D) => {
    const canvas = ctx.canvas,
        hRatio = canvas.width / img.width,
        vRatio = canvas.height / img.height,
        ratio = Math.min(hRatio, vRatio),
        centerShift_x = (canvas.width - img.width * ratio) / 2,
        centerShift_y = (canvas.height - img.height * ratio) / 2

    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.drawImage(
        img,
        0,
        0,
        img.width,
        img.height,
        centerShift_x,
        centerShift_y,
        img.width * ratio,
        img.height * ratio
    )
}

const imgPixelDataFormat = (pixelData: ImageData) => {
    const formatted: { r: number; b: number; g: number; a: number }[] = []

    for (let k = 0; k < pixelData.data.length; k += 4) {
        formatted.push({
            r: pixelData.data[k],
            g: pixelData.data[k + 1],
            b: pixelData.data[k + 2],
            a: pixelData.data[k + 3],
        })
    }

    return formatted
}

const avgPixels = (pixel: PixelInfo, groupBy: number) => ({
    a: Math.ceil(pixel.a / groupBy),
    r: Math.ceil(pixel.r / groupBy),
    g: Math.ceil(pixel.g / groupBy),
    b: Math.ceil(pixel.b / groupBy),
})

const sumPixels = (pixel1: PixelInfo, pixel2: PixelInfo, onlyG = false) => ({
    r: onlyG ? 0 : pixel2.r + pixel1.r,
    g: pixel2.g + pixel1.g,
    b: onlyG ? 0 : pixel2.b + pixel1.b,
    a: pixel2.a + pixel1.a,
})

export const getAveragePixelInfoPerGroupedBlockOfPixels = (
    pixelData: ImageData,
    // n of pixels to sum into 1 big pixel
    groupBy: number,
    onlyG = false
) => {
    const bufferSize = pixelData.width * groupBy,
        totalPixelsGrouped = groupBy ** 2,
        // blockSlicesPerRowCount = Math.ceil(pixelData.width / groupBy),
        // matrix of avged group of block slices
        groupedPixelsMatrix: PixelInfo[][] = []

    // grouped block slices per row => matrix
    let rowGroupedPixels: PixelInfo[][] = [],
        // pixels currently being grouped per row
        blockSlice = { r: 0, g: 0, b: 0, a: 0 }

    for (let k = 0; k < pixelData.data.length; k += 4) {
        // count pixel order
        const pixelIdx = k / 4,
            currPixel = {
                r: pixelData.data[k],
                g: pixelData.data[k + 1],
                b: pixelData.data[k + 2],
                a: pixelData.data[k + 3],
            }

        // add pixel to block slice currently being grouped
        blockSlice = sumPixels(currPixel, blockSlice, onlyG)

        // group pixels by row (blockSlice)
        if (pixelIdx % pixelData.width === 0) rowGroupedPixels.push([])

        // block slice is rdy to be added to grouped block slices per row
        if ((pixelIdx + 1) % groupBy === 0) {
            rowGroupedPixels[rowGroupedPixels.length - 1].push(blockSlice)
            blockSlice = { r: 0, g: 0, b: 0, a: 0 }
        }

        // each x rows we have all we need to process n = groupBy grouped blocks
        if ((pixelIdx + 1) % bufferSize === 0) {
            const avgPixelsPerBuffer = rowGroupedPixels.reduce((acc, rowBlockSlices, idx) => {
                if (idx > 0) {
                    const tmp = acc.map((groupedBlockSlices, idx) => {
                        const currentBlockSlice = rowBlockSlices[idx]
                        return sumPixels(groupedBlockSlices, currentBlockSlice, onlyG)
                    })

                    // last one -> avg them
                    if (idx === rowGroupedPixels.length - 1) {
                        return tmp.map((groupedBlockSlice) =>
                            avgPixels(groupedBlockSlice, totalPixelsGrouped)
                        )
                    }

                    return tmp
                } else {
                    return rowBlockSlices
                }
            }, [] as PixelInfo[])

            groupedPixelsMatrix.push(avgPixelsPerBuffer)
            rowGroupedPixels = []
        }
    }
    return groupedPixelsMatrix
}

export type PixelInfo = { r: number; g: number; b: number; a: number }

export const formattedBlockOfPixelsToImage = (
    formattedArr: PixelInfo[][],
    groupBy: number,
    ctx: CanvasRenderingContext2D
) => {
    const w = formattedArr[0].length * groupBy,
        h = formattedArr.length * groupBy,
        blocksPerRow = w / groupBy,
        newImg = ctx.createImageData(w, h)

    let row = -1,
        formattedRow = 0,
        formattedCell = 0,
        isFreshFormattedRow = true

    for (let k = 0; k < newImg.data.length; k += 4) {
        const pixelC = k / 4

        // every 810 pixels is 1 row
        if (pixelC % w === 0) {
            row += 1
            isFreshFormattedRow = true
        }

        if (pixelC % groupBy === 0)
            formattedCell = blocksPerRow === formattedCell + 1 ? 0 : formattedCell + 1

        // every e.g. 15 is 1 formatted row
        if (isFreshFormattedRow && row !== 0 && row % groupBy === 0) {
            formattedRow += 1
            formattedCell = 0
            isFreshFormattedRow = false
        }

        newImg.data[k] = formattedArr[formattedRow][formattedCell].r // R value
        newImg.data[k + 1] = formattedArr[formattedRow][formattedCell].g // G value
        newImg.data[k + 2] = formattedArr[formattedRow][formattedCell].b // B value
        newImg.data[k + 3] = formattedArr[formattedRow][formattedCell].a // A value
    }

    return newImg
}

export const getPixelData = (img: HTMLImageElement, ctx: CanvasRenderingContext2D) => {
    const hRatio = ctx.canvas.width / img.width,
        vRatio = ctx.canvas.height / img.height,
        ratio = Math.min(hRatio, vRatio),
        centerShift_x = (ctx.canvas.width - img.width * ratio) / 2,
        centerShift_y = (ctx.canvas.height - img.height * ratio) / 2,
        w = img.width * ratio,
        h = img.height * ratio,
        pixelData = ctx.getImageData(centerShift_x, centerShift_y, w, h)

    return {
        pixelData,
        centerShift_x,
        centerShift_y,
    }
}

export const renderGroupPixelsAsLetters = ({
    formattedAvg,
    groupBy,
    centerShift_x,
    centerShift_y,
    ctx,
    withTextInsteadOfChars = false,
}: {
    formattedAvg: PixelInfo[][]
    groupBy: number
    centerShift_x: number
    centerShift_y: number
    ctx: CanvasRenderingContext2D
    withTextInsteadOfChars?: boolean
}) => {
    const darkCharsetStatic = '.,_-~:',
        calculateLuminance = ({ r, g, b }: PixelInfo) => 0.2126 * r + 0.7152 * g + 0.0722 * b,
        chars = `${darkCharsetStatic}${GlobalMessenger.charsObj.chars}`,
        getKey = (luminance: number, chars: string) => (luminance * chars.length) / 255

    ctx.font = `${groupBy}px Matrix`
    ctx.textBaseline = 'middle'
    ctx.textAlign = 'center'

    if (!withTextInsteadOfChars) {
        const curry = (cell: PixelInfo) =>
                chars[Math.floor(getKey(calculateLuminance(cell), chars))],
            letterImageInfo = formattedAvg.map((row) => row.map(curry))

        letterImageInfo.forEach((row, rowIdx) => {
            row.forEach((cell, cellIdx) => {
                const { r, g, b, a } = formattedAvg[rowIdx][cellIdx],
                    aToScale0To1 = (a * 100) / 255 / 100
                ctx.fillStyle = `rgba(${r},${g},${b},${aToScale0To1})`

                ctx.fillText(
                    cell,
                    centerShift_x + cellIdx * groupBy + groupBy / 2,
                    centerShift_y + rowIdx * groupBy + groupBy / 2,
                    groupBy
                )
            })
        })
    } else {
        let charCounter = 0

        formattedAvg.forEach((row, rowIdx) => {
            row.forEach(({ r, g, b, a }, cellIdx) => {
                const aToScale0To1 = (a * 100) / 255 / 100,
                    key = Math.round(
                        getKey(calculateLuminance({ r, g, b } as PixelInfo), 'asd123asdsadas')
                    )

                ctx.fillStyle = `rgba(${r},${g},${b},${aToScale0To1})`

                ctx.fillText(
                    key < darkCharsetStatic.length
                        ? darkCharsetStatic[key]
                        : GlobalMessenger.charsObj.text[charCounter],
                    centerShift_x + cellIdx * groupBy + groupBy / 2,
                    centerShift_y + rowIdx * groupBy + groupBy / 2,
                    groupBy
                )

                if (key >= darkCharsetStatic.length)
                    charCounter =
                        charCounter + 1 === GlobalMessenger.charsObj.text.length
                            ? 0
                            : charCounter + 1
            })
        })
    }
}

export const animateLetters = ({
    formattedAvg,
    groupBy,
    stopAt,
    centerShift_x,
    centerShift_y,
    ctx,
}: {
    formattedAvg: PixelInfo[][]
    // n of pixels summed nto 1 big pixel
    groupBy: number
    // stop at what groupBy?
    stopAt: number
    centerShift_x: number
    centerShift_y: number
    ctx: CanvasRenderingContext2D
}) => {
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height)

    renderGroupPixelsAsLetters({
        formattedAvg,
        groupBy,
        centerShift_x,
        centerShift_y,
        ctx,
    })

    if (groupBy > stopAt)
        setTimeout(() => {
            animateLetters({
                formattedAvg,
                groupBy: groupBy - 1,
                stopAt,
                centerShift_x,
                centerShift_y,
                ctx,
            })
        }, 25)
}

export const initFrame = (
    ctx: CanvasRenderingContext2D,
    vid: HTMLVideoElement,
    vidCtx: CanvasRenderingContext2D,
    configRef: MutableRefObject<WebPreviewConfig>,
    // used to stop webcam rendering
    persistGateRef: MutableRefObject<boolean>
) => {
    // load webcam with letters
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height)

    navigator.mediaDevices
        .getUserMedia({ video: true, audio: false })
        .then((stream) => {
            vid.srcObject = stream

            const animateWebcamIntoCanvas = () => {
                requestAnimationFrame(() => {
                    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height)
                    vidCtx.clearRect(0, 0, vidCtx.canvas.width, vidCtx.canvas.height)
                    vidCtx.drawImage(vid, 0, 0, vidCtx.canvas.width, vidCtx.canvas.height)
                    const config = configRef.current

                    runAlgorithm({
                        ctx,
                        imageData: vidCtx.getImageData(
                            0,
                            0,
                            vidCtx.canvas.width,
                            vidCtx.canvas.height
                        ),
                        groupBy: config.groupBy,
                        greenMode: config.withJustGreen,
                        withTextInsteadOfChars: config.withTextInsteadOfChars,
                    })

                    if (persistGateRef.current) animateWebcamIntoCanvas()
                    else ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height)
                })
            }

            vid.play()
                .then(animateWebcamIntoCanvas)
                // @TODO show play UI?
                .catch((err) => console.error(err))
        })
        .catch((err) => {
            console.error('issue', err)
        })

    if (configRef.current.withTextInsteadOfChars && configRef.current.withSpeechUpdatedText)
        speechToText()
}

export const GlobalMessenger: {
    ctx: CanvasRenderingContext2D | null
    stopLiveRendering: null | (() => void)
    startLiveRendering: null | (() => void)
    charsObj: Record<'chars' | 'text', string>
    algorithms: {
        letters: typeof renderGroupPixelsAsLetters
        tiles: typeof renderGroupPixelsAsSquares
    }
    activeAlgorithm: typeof renderGroupPixelsAsLetters | typeof renderGroupPixelsAsSquares
} = {
    ctx: null,
    stopLiveRendering: null,
    startLiveRendering: null,
    charsObj: {
        chars: '4!?$P80OKBNMLHGFDASDQWETYU',
        text: '4!?$P80OKBNMLHGFDASDQWETYU',
    },
    algorithms: { letters: renderGroupPixelsAsLetters, tiles: renderGroupPixelsAsSquares },
    activeAlgorithm: renderGroupPixelsAsLetters,
}
