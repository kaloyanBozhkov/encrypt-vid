import { Resolution } from 'types/common'

import { downloadFile, getAveragePixelInfoPerGroupedBlockOfPixels } from './helpers'

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
    if (imageData) ctx.putImageData(imageData, 0, 0)
    else if (image) ctx.drawImage(image, 0, 0, ctx.canvas.width, ctx.canvas.height)

    const formattedAvg = getAveragePixelInfoPerGroupedBlockOfPixels(
        ctx.getImageData(0, 0, ctx.canvas.width, ctx.canvas.height),
        groupBy,
        greenMode
    )

    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height)

    // cler preview but keep formatted avg data
    return formattedAvg
}

// drawImageFittingWithinParentBounds will rely on this to avoid unnecessary computations
let prevImageSize = { width: 0, height: 0 },
    prevParentSize = { width: 0, height: 0 }

export const calcualteImageRatios = ({
    fileSize,
    parentSize,
    imageSize,
}: {
    fileSize: Resolution
    parentSize: Resolution
    imageSize: {
        width: number
        height: number
    }
}) => {
    const newImageSize = {
        ...imageSize,
    }

    // do nothing since preview smaller than screen size
    if (fileSize.height <= parentSize.height && fileSize.width <= parentSize.width) {
        newImageSize.width = fileSize.width
        newImageSize.height = fileSize.height
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
                imgWidth =
                    parentSize.width > parentSize.height ? parentSize.height : parentSize.width

                imgHeight = imgWidth
                break
        }

        while (imgHeight > parentSize.height || imgWidth > parentSize.width) {
            if (imgHeight > parentSize.height) {
                imgHeight = parentSize.height
                imgWidth = Math.floor(parentSize.height * (fileSize.width / fileSize.height))
            } else if (imgWidth > parentSize.width) {
                imgWidth = parentSize.width
                imgHeight = Math.floor(parentSize.width * (fileSize.height / fileSize.width))
            }
        }

        newImageSize.width = imgWidth
        newImageSize.height = imgHeight
    }

    return newImageSize
}

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

    // update only if container size has changed since last run
    if (
        prevParentSize.width !== parentSize.width ||
        prevParentSize.height !== parentSize.height ||
        fileSize.width !== prevImageSize.width ||
        fileSize.height !== prevImageSize.height
    ) {
        prevParentSize = parentSize

        prevImageSize = calcualteImageRatios({
            fileSize,
            parentSize,
            imageSize: prevImageSize,
        })

        if (
            ctx.canvas.width !== prevImageSize.width ||
            ctx.canvas.height !== prevImageSize.height
        ) {
            ctx.canvas.width = prevImageSize.width
            ctx.canvas.height = prevImageSize.height
        }
    }

    ctx.drawImage(
        imageData,
        0,
        0,
        fileSize.width,
        fileSize.height,
        0,
        0,
        prevImageSize.width,
        prevImageSize.height
    )

    return prevImageSize
}

export const downloadFrameFromCanvas = ({ ctx }: { ctx: CanvasRenderingContext2D }) => {
    const imageUrl = ctx.canvas.toDataURL('image/jpg')
    downloadFile({ fileName: 'frame', url: imageUrl })
}
