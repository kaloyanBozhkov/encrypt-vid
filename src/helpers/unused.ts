import {
    PixelInfo,
    formattedBlockOfPixelsToImage,
    getAveragePixelInfoPerGroupedBlockOfPixels,
} from './helpers'

const groupImgPixelsOnlyXAxis = (
    pixelData: ImageData,
    // n of pixels to sum into 1 big pixel
    groupBy: number,
    ctx: CanvasRenderingContext2D
) => {
    const newImg = ctx.createImageData(pixelData.width, pixelData.height)

    let averageColor = { r: 0, g: 0, b: 0, a: 0 }

    for (let k = 0; k < newImg.data.length; k += 4) {
        averageColor.r += pixelData.data[k]
        averageColor.g += pixelData.data[k + 1]
        averageColor.b += pixelData.data[k + 2]
        averageColor.a += pixelData.data[k + 3]
        // every 10 pixels
        if (k % (groupBy * 4) === 0) {
            // avg them
            averageColor.r = averageColor.r / groupBy
            averageColor.g = averageColor.g / groupBy
            averageColor.b = averageColor.b / groupBy
            averageColor.a = averageColor.a / groupBy

            for (let j = k - groupBy * 4; j < k; j += 4) {
                newImg.data[j] = averageColor.r
                newImg.data[j + 1] = averageColor.g
                newImg.data[j + 2] = averageColor.b
                newImg.data[j + 3] = averageColor.a
            }

            // reset them
            averageColor = { r: 0, g: 0, b: 0, a: 0 }
        }
    }

    return newImg
}

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

const renderGroupPixelsAsSquares = ({
    formattedAvg,
    groupBy,
    centerShift_x,
    centerShift_y,
    ctx,
}: {
    formattedAvg: PixelInfo[][]
    groupBy: number
    centerShift_x: number
    centerShift_y: number
    ctx: CanvasRenderingContext2D
}) => {
    const calculateLuminance = ({ r, g, b }: PixelInfo) => 0.2126 * r + 0.7152 * g + 0.0722 * b

    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height)

    formattedAvg.forEach((row, rowIdx) =>
        row.forEach((cell, cellIdx) => {
            const pixelInfo = formattedAvg[rowIdx][cellIdx],
                size = (calculateLuminance(pixelInfo) * groupBy) / 100

            ctx.fillStyle = `rgba(${pixelInfo.r},${pixelInfo.g},${pixelInfo.b},${pixelInfo.a})`
            ctx.fillRect(
                centerShift_x + cellIdx * groupBy + groupBy / 2 + (groupBy - size) / 2,
                centerShift_y + rowIdx * groupBy + groupBy / 2 + (groupBy - size) / 2,
                size,
                size
            )
        })
    )
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

// animateLetters({
//   formattedAvg,
//   groupBy: 30,
//   centerShift_x,
//   centerShift_y,
//   ctx,
//   stopAt: 5,
// })
