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

export const drawImageFittingWithinParentBounds = ({
    fileSize,
    ctx,
    parentSize,
    imageData,
    withoutClear = true,
}: {
    fileSize: Resolution
    parentSize: Resolution
    ctx: CanvasRenderingContext2D
    imageData: CanvasImageSource
    withoutClear?: boolean
}) => {
    if (!withoutClear)
        // clear prev frame
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height)

    let dx = 0,
        dy = 0,
        dh = 0,
        dw = 0

    // do nothing since preview smaller than screen size
    if (fileSize.height <= parentSize.height && fileSize.width <= parentSize.width) {
        // setup to show preview, with centered formatted image
        dx = ctx.canvas.width / 2 - fileSize.width / 2
        dy = ctx.canvas.height / 2 - fileSize.height / 2
        dw = fileSize.width
        dh = fileSize.height
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
        }
        // setup to show preview, with centered formatted image
        dx = ctx.canvas.width / 2 - imgWidth / 2
        dy = ctx.canvas.height / 2 - imgHeight / 2
        dw = imgWidth
        dh = imgHeight
    }

    globalMessenger.preview.setPreviewCanvasSize!({ width: dw, height: dh })
    ctx.drawImage(imageData, 0, 0, fileSize.width, fileSize.height, dx, dy, dw, dh)
}
