import { MutableRefObject } from 'react'

import { drawImageFittingWithinParentBounds } from './canvas'
import { globalMessenger } from './globalMessenger'
import { runAlgorithm } from './helpers'
import { speechToText } from './speechToText'

export const playPreview = (
    ctx: CanvasRenderingContext2D,
    vid: HTMLVideoElement,
    vidCtx: CanvasRenderingContext2D,
    // used to stop webcam rendering
    persistGateRef: MutableRefObject<boolean>
) => {
    navigator.mediaDevices
        .getUserMedia({ video: { width: 9999 }, audio: false })
        .then((stream) => {
            vid.srcObject = stream

            const animateWebcamIntoCanvas = () => {
                requestAnimationFrame(() => {
                    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height)

                    // paint from webcam to canvas through video
                    drawImageFittingWithinParentBounds({
                        fileSize: globalMessenger.preview.webcamSize!,
                        imageData: vid,
                        parentSize: {
                            width: window.innerWidth,
                            height: window.innerHeight,
                        },
                        ctx: vidCtx,
                        withoutClear: false,
                    })

                    runAlgorithm({
                        ctx: ctx,
                        imageData: vidCtx.getImageData(
                            0,
                            0,
                            vidCtx.canvas.width,
                            vidCtx.canvas.height
                        ),
                        groupBy: globalMessenger.renderSettings.groupBy,
                        greenMode: globalMessenger.renderSettings.withJustGreen,
                        withTextInsteadOfChars:
                            globalMessenger.renderSettings.withTextInsteadOfChars,
                        withSpeechInsteadofChars:
                            globalMessenger.renderSettings.withSpeechUpdatedText,
                    })

                    if (persistGateRef.current) animateWebcamIntoCanvas()
                    else ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height)
                })

                if (globalMessenger.renderSettings.withSpeechUpdatedText) speechToText()
            }

            vid.play()
                .then(() => {
                    // based on webcam resolution set preview size
                    globalMessenger.preview.webcamSize = {
                        width: vid.videoWidth,
                        height: vid.videoHeight,
                    }

                    const setPreviewCanvasSize = () => {
                        globalMessenger.preview.setPreviewCanvasSize!({
                            width: vid.videoWidth,
                            height: vid.videoHeight,
                        })
                    }

                    window.addEventListener('resize', setPreviewCanvasSize)

                    // setPreviewCanvasSize()
                    animateWebcamIntoCanvas()
                })
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
}
