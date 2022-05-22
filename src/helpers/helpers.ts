import type { PreviewSettings } from 'context/previewSettings/previewSettings.contex'
import type { RenderSettings } from 'context/renderSettings/renderSettings.contex'

import type { PixelInfo } from 'types/common'

import { getFormattedAvg } from './canvas'

export const downloadFile = ({ fileName, url }: { fileName: string; url: string }) => {
    const a = document.createElement('a')
    a.setAttribute('download', fileName)
    a.setAttribute('href', url)
    a.click()
    a.remove()
}
export const calculateLuminance = (
    { r, g, b }: PixelInfo,
    luminanceWeights: RenderSettings['luminanceWeights']
) => luminanceWeights.r * r + luminanceWeights.g * g + luminanceWeights.b * b

/**
 * Runs the active algorithm passes it formattedAvg pixel matrix
 */
export const runAlgorithm = ({
    imageData,
    image,
    renderSettings,
    previewSettings,
}: {
    imageData?: ImageData
    image?: CanvasImageSource
    renderSettings: RenderSettings
    previewSettings: PreviewSettings
}) => {
    const { groupBy, withJustGreen: greenMode, canvasBgColor } = renderSettings,
        ctx = previewSettings.ctx!

    const formattedAvg = getFormattedAvg({
        ctx,
        ...(image ? { image } : { imageData }),
        groupBy,
        greenMode,
    })

    // set bg color
    ctx.fillStyle = canvasBgColor
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height)

    renderSettings.activeAlgorithm({
        formattedAvg,
        renderSettings,
        previewSettings,
        centerShift_x: 0,
        centerShift_y: 0,
    })
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

export const formattedBlockOfPixelsToImage = (
    formattedArr: PixelInfo[][],
    groupBy: number,
    ctx: CanvasRenderingContext2D
) => {
    // config is weird, probably groupBy is higher than total pixels and formattedArr is empty
    if (!formattedArr[0]) return ctx.createImageData(1, 1)

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
