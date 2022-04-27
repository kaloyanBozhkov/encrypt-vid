import { MutableRefObject } from 'react'

import { WebPreviewConfig } from 'types/common'

import { runAlgorithm } from './helpers'
import { speechToText } from './speechToText'

export const playPreview = (
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

                    if (persistGateRef.current) {
                        animateWebcamIntoCanvas()
                    } else ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height)
                })
            }

            vid.play()
                .then(animateWebcamIntoCanvas)
                .catch((err) => {
                    // @TODO show play UI?
                    alert(
                        'There seems to have been an issue playing the webcam preview :( \n The video processing should still work though :)'
                    )
                    console.error(err)
                })
        })
        .catch((err) => {
            console.error('issue', err)
        })

    if (configRef.current.withTextInsteadOfChars && configRef.current.withSpeechUpdatedText)
        speechToText()
}
