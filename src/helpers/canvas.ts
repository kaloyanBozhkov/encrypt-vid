import { Resolution } from 'types/common'

import { globalMessenger } from './globalMessenger'
import { getAveragePixelInfoPerGroupedBlockOfPixels } from './helpers'

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

// drawImageFittingWithinParentBounds will rely on this to avoid unnecessary computations
const previousParentSize: Resolution = { width: 0, height: 0 },
    prevCalculations = { dx: 0, dy: 0, dw: 0, dh: 0 }

export const drawImageFittingWithinParentBounds = ({
    fileSize,
    ctx,
    parentSize,
    imageData,
    withClear = true,
}: {
    fileSize: Resolution
    parentSize: Resolution
    ctx: CanvasRenderingContext2D
    imageData: CanvasImageSource
    withClear?: boolean
}) => {
    if (withClear)
        // clear prev frame
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height)

    if (
        previousParentSize.width !== parentSize.width ||
        previousParentSize.height !== parentSize.height
    ) {
        // do nothing since preview smaller than screen size
        if (fileSize.height <= parentSize.height && fileSize.width <= parentSize.width) {
            // setup to show preview, with centered formatted image
            prevCalculations.dx = ctx.canvas.width / 2 - fileSize.width / 2
            prevCalculations.dy = ctx.canvas.height / 2 - fileSize.height / 2
            prevCalculations.dw = fileSize.width
            prevCalculations.dh = fileSize.height
        } else {
            let vidAspectRatio: 'square' | 'portrait' | 'landscape' = 'square'

            if (fileSize.width > fileSize.height) vidAspectRatio = 'landscape'
            else vidAspectRatio = 'portrait'

            let imgWidth = fileSize.width,
                imgHeight = fileSize.height

            // preserve og aspect ratio of frame width and height based on vidAspectRatio
            switch (vidAspectRatio) {
                case 'portrait':
                    imgHeight = parentSize.height
                    imgWidth = Math.floor(parentSize.height * (fileSize.width / fileSize.height))
                    break
                case 'landscape':
                    imgWidth = parentSize.width
                    imgHeight = Math.floor(parentSize.width * (fileSize.height / fileSize.width))
                    break
                default:
                    //eslint-disable-next-line
                    debugger

                    imgWidth =
                        parentSize.width > parentSize.height ? parentSize.height : parentSize.width

                    imgHeight = imgWidth
                    break
            }

            if (imgHeight > parentSize.height) {
                imgHeight = parentSize.height
                imgWidth = Math.floor(parentSize.height * (fileSize.width / fileSize.height))
            } else if (imgWidth > parentSize.width) {
                imgWidth = parentSize.width
                imgHeight = Math.floor(parentSize.width * (fileSize.height / fileSize.width))
            }

            // setup to show preview, with centered formatted image
            prevCalculations.dx = ctx.canvas.width / 2 - imgWidth / 2
            prevCalculations.dy = ctx.canvas.height / 2 - imgHeight / 2
            prevCalculations.dw = imgWidth
            prevCalculations.dh = imgHeight
        }

        if (ctx.canvas.width !== prevCalculations.dw && ctx.canvas.height !== prevCalculations.dh)
            globalMessenger.preview.setPreviewCanvasSize!({
                width: prevCalculations.dw,
                height: prevCalculations.dh,
            })
    }

    ctx.drawImage(
        imageData,
        0,
        0,
        fileSize.width,
        fileSize.height,
        prevCalculations.dx,
        prevCalculations.dy,
        prevCalculations.dw,
        prevCalculations.dh
    )
}
