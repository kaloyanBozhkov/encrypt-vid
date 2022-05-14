import type { PreviewSettings } from 'context/previewSettings/previewSettings.contex'
import type { RenderSettings } from 'context/renderSettings/renderSettings.contex'

import { PixelInfo, calculateLuminance, formattedBlockOfPixelsToImage } from './helpers'

export const renderGroupPixelsAsLetters = ({
    formattedAvg,
    centerShift_x,
    centerShift_y,
    previewSettings,
    renderSettings,
}: {
    formattedAvg: PixelInfo[][]
    centerShift_x: number
    centerShift_y: number
    previewSettings: PreviewSettings
    renderSettings: RenderSettings
}) => {
    // reset curr frame text for copy-pasting it
    previewSettings.currentFrameText = ''

    const ctx = previewSettings.ctx!,
        {
            luminanceWeights,
            groupBy,
            charsObj,
            withCustomChars = false,
            withStaticText = false,
            withSpeechUpdatedText = false,
        } = renderSettings,
        { darkChars: darkCharsetStatic, defaultChars } = charsObj

    let chars = `${darkCharsetStatic}${defaultChars}`

    const getKey = (luminance: number, chars: string) => (luminance * chars.length) / 255

    ctx.font = `${groupBy}px Matrix`
    ctx.textBaseline = 'middle'
    ctx.textAlign = 'center'

    if (withSpeechUpdatedText) {
        let charCounter = 0

        formattedAvg.forEach((row, rowIdx) => {
            row.forEach(({ r, g, b, a }, cellIdx) => {
                const aToScale0To1 = (a * 100) / 255 / 100,
                    key = Math.floor(
                        getKey(
                            calculateLuminance({ r, g, b } as PixelInfo, luminanceWeights),
                            chars
                        )
                    )

                ctx.fillStyle = `rgba(${r},${g},${b},${aToScale0To1})`

                ctx.fillText(
                    charsObj.speech[charCounter],
                    centerShift_x + cellIdx * groupBy + groupBy / 2,
                    centerShift_y + rowIdx * groupBy + groupBy / 2,
                    groupBy
                )

                if (key >= darkCharsetStatic.length)
                    charCounter = charCounter + 1 === charsObj.speech.length ? 0 : charCounter + 1
            })
        })

        return
    }

    if (withCustomChars) {
        chars = `${darkCharsetStatic}${charsObj.customChars}`

        formattedAvg.forEach((row, rowIdx) => {
            row.forEach(({ r, g, b, a }, cellIdx) => {
                const aToScale0To1 = (a * 100) / 255 / 100,
                    key = Math.floor(
                        getKey(
                            calculateLuminance({ r, g, b } as PixelInfo, luminanceWeights),
                            chars
                        )
                    )

                ctx.fillStyle = `rgba(${r},${g},${b},${aToScale0To1})`

                ctx.fillText(
                    chars[key] || chars[chars.length - 1],
                    centerShift_x + cellIdx * groupBy + groupBy / 2,
                    centerShift_y + rowIdx * groupBy + groupBy / 2,
                    groupBy
                )
            })
        })

        return
    }

    if (withStaticText) {
        let charCounter = 0

        chars = `${darkCharsetStatic}${charsObj.staticText}`

        formattedAvg.forEach((row, rowIdx) => {
            row.forEach(({ r, g, b, a }, cellIdx) => {
                const aToScale0To1 = (a * 100) / 255 / 100,
                    key = Math.floor(
                        getKey(
                            calculateLuminance({ r, g, b } as PixelInfo, luminanceWeights),
                            chars
                        )
                    )

                ctx.fillStyle = `rgba(${r},${g},${b},${aToScale0To1})`

                ctx.fillText(
                    chars[key] || chars[chars.length - 1],
                    centerShift_x + cellIdx * groupBy + groupBy / 2,
                    centerShift_y + rowIdx * groupBy + groupBy / 2,
                    groupBy
                )

                if (key >= darkCharsetStatic.length)
                    charCounter =
                        charCounter + 1 === charsObj.staticText.length ? 0 : charCounter + 1
            })
        })

        return
    }

    // default
    const curry = (cell: PixelInfo) =>
            chars[Math.floor(getKey(calculateLuminance(cell, luminanceWeights), chars))] ||
            chars[chars.length - 1],
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

            previewSettings.currentFrameText += cell
        })

        previewSettings.currentFrameText += '\n'
    })
}

export const renderGroupPixelsAsSquares = ({
    formattedAvg,
    centerShift_x,
    centerShift_y,
    previewSettings: { ctx: ctxN },
    renderSettings: { groupBy, luminanceWeights },
}: {
    formattedAvg: PixelInfo[][]
    renderSettings: RenderSettings
    previewSettings: PreviewSettings
    centerShift_x: number
    centerShift_y: number
}) => {
    const ctx = ctxN!

    formattedAvg.forEach((row, rowIdx) =>
        row.forEach((_cell, cellIdx) => {
            const pixelInfo = formattedAvg[rowIdx][cellIdx],
                size = (calculateLuminance(pixelInfo, luminanceWeights) * groupBy) / 100

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

export const renderBlurryPixels = ({
    formattedAvg,
    renderSettings: { groupBy },
    previewSettings: { ctx: ctxN },
    centerShift_x,
    centerShift_y,
}: {
    formattedAvg: PixelInfo[][]
    centerShift_x: number
    centerShift_y: number
    previewSettings: PreviewSettings
    renderSettings: RenderSettings
}) => {
    const ctx = ctxN!

    ctx.putImageData(
        formattedBlockOfPixelsToImage(formattedAvg, groupBy, ctx),
        centerShift_x,
        centerShift_y
    )
}
