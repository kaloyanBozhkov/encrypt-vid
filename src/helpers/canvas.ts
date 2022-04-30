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
    fileSize: { width: number; height: number }
    parentSize: { width: number; height: number }
    ctx: CanvasRenderingContext2D
    imageData: CanvasImageSource
    withoutClear?: boolean
}) => {
    ctx.canvas.width = parentSize.width
    ctx.canvas.height = parentSize.height

    if (!withoutClear)
        // clear prev frame
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height)

    // do nothing since preview smaller than screen size
    if (fileSize.height <= parentSize.height && fileSize.width <= parentSize.width) {
        // // show preview, with centered formatted image
        ctx.drawImage(
            imageData,
            0,
            0,
            fileSize.width,
            fileSize.height,
            ctx.canvas.width / 2 - fileSize.width / 2,
            ctx.canvas.height / 2 - fileSize.height / 2,
            fileSize.width,
            fileSize.height
        )
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

        ctx.drawImage(
            imageData,
            0,
            0,
            fileSize.width,
            fileSize.height,
            ctx.canvas.width / 2 - imgWidth / 2,
            ctx.canvas.height / 2 - imgHeight / 2,
            imgWidth,
            imgHeight
        )
    }
}
