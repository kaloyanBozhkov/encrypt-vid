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
                            width: document.documentElement.clientWidth,
                            height: document.documentElement.clientHeight,
                        },
                        ctx: vidCtx,
                    })

                    runAlgorithm({
                        ctx: ctx,
                        imageData: vidCtx.getImageData(
                            0,
                            0,
                            vidCtx.canvas.width,
                            vidCtx.canvas.height
                        ),
                        charsObj: globalMessenger.renderSettings.charsObj,
                        groupBy: globalMessenger.renderSettings.groupBy,
                        greenMode: globalMessenger.renderSettings.withJustGreen,
                        withCustomChars: globalMessenger.renderSettings.withCustomChars,
                        withStaticText: globalMessenger.renderSettings.withStaticText,
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
