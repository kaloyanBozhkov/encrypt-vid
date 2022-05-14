import type { PreviewSettings } from 'context/previewSettings/previewSettings.contex'
import type { RenderSettings } from 'context/renderSettings/renderSettings.contex'

import { drawImageFittingWithinParentBounds } from './canvas'
import { runAlgorithm } from './helpers'
import { speechToText } from './speechToText'

export const playPreview = (
    ctx: CanvasRenderingContext2D,
    vid: HTMLVideoElement,
    vidCtx: CanvasRenderingContext2D,
    previewSettings: PreviewSettings,
    renderSettings: RenderSettings
) => {
    navigator.mediaDevices
        .getUserMedia({ video: { width: 9999 }, audio: false })
        .then((stream) => {
            vid.srcObject = stream

            let webcamSize = { width: 0, height: 0 }

            const animateWebcamIntoCanvas = () => {
                requestAnimationFrame(() => {
                    // paint from webcam to canvas through video
                    const imageSize = drawImageFittingWithinParentBounds({
                        fileSize: webcamSize,
                        imageData: vid,
                        parentSize: {
                            width: document.documentElement.clientWidth,
                            height: document.documentElement.clientHeight,
                        },
                        ctx: vidCtx,
                    })

                    // match vid to render preview
                    if (
                        ctx.canvas.width !== imageSize.width ||
                        ctx.canvas.height !== imageSize.height
                    ) {
                        ctx.canvas.width = imageSize.width
                        ctx.canvas.height = imageSize.height
                    }

                    runAlgorithm({
                        imageData: vidCtx.getImageData(
                            0,
                            0,
                            vidCtx.canvas.width,
                            vidCtx.canvas.height
                        ),
                        renderSettings,
                        previewSettings,
                    })

                    if (previewSettings.persistGate) animateWebcamIntoCanvas()
                    else ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height)
                })

                if (renderSettings.withSpeechUpdatedText) speechToText(renderSettings)
            }

            vid.play()
                .then(() => {
                    // based on webcam resolution set preview size
                    webcamSize = {
                        width: vid.videoWidth,
                        height: vid.videoHeight,
                    }

                    previewSettings.setWebcamSize!(webcamSize)

                    animateWebcamIntoCanvas()
                })
                .catch((err) => {
                    // @TODO show play UI?
                    alert(
                        'There seems to have been an issue playing the webcam preview :( \n The video processing should still work though :)'
                    )

                    console.error(err)

                    previewSettings.setWebcamSize!({
                        width: 0,
                        height: 0,
                    })
                })
        })
        .catch((err) => {
            console.error('issue', err)
            alert('There seems to have been an issue playing the webcam preview :(')
        })
}
