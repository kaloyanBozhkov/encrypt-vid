import {
    formattedBlockOfPixelsToImage,
    getAveragePixelInfoPerGroupedBlockOfPixels,
} from './helpers'

export const animateBlurry = ({
    pixelData,
    groupBy,
    centerShift_x,
    centerShift_y,
    ctx,
    timeoutBy = 25,
}: {
    pixelData: ImageData
    // n of pixels summed nto 1 big pixel
    groupBy: number
    centerShift_x: number
    centerShift_y: number
    ctx: CanvasRenderingContext2D
    timeoutBy?: number
}) => {
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height)

    ctx.putImageData(
        formattedBlockOfPixelsToImage(
            getAveragePixelInfoPerGroupedBlockOfPixels(pixelData, groupBy, false),
            groupBy,
            ctx
        ),
        centerShift_x,
        centerShift_y
    )

    if (groupBy > 1)
        setTimeout(() => {
            animateBlurry({
                groupBy: groupBy - 1,
                pixelData,
                centerShift_x,
                centerShift_y,
                ctx,
                timeoutBy: timeoutBy / 1.5,
            })
        }, timeoutBy)
}

// animate squares
// renderGroupPixelsAsSquares({
//     formattedAvg,
//     groupBy: config.groupBy,
//     centerShift_x: 0,
//     centerShift_y: 0,
//     ctx,
// })

// load just an image
// loadImage('assets/img.jpg').then((image) => {
//     const img = image as unknown as HTMLImageElement
//     // draw the loaded frame
//     drawImageScaled(img, ctx)

//     const { pixelData, centerShift_x, centerShift_y } = getPixelData(img, ctx)

//     animateBlurry({
//         pixelData,
//         centerShift_x,
//         centerShift_y,
//         ctx,
//         groupBy: 100,
//     })
// })

// const formattedAvg = getAveragePixelInfoPerGroupedBlockOfPixels(
//     pixelData,
//     configRef.current.groupBy
// )

// ctx.putImageData(
//     formattedBlockOfPixelsToImage(
//         getAveragePixelInfoPerGroupedBlockOfPixels(pixelData, configRef.current.groupBy),
//         configRef.current.groupBy,
//         ctx
//     ),
//     centerShift_x,
//     centerShift_y
// )
