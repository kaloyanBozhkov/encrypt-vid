import React, { useContext, useEffect, useRef } from 'react'

import { previewSettingsContext } from 'context/previewSettings/previewSettings.contex'
import { renderSettingsContext } from 'context/renderSettings/renderSettings.contex'

import { playPreview } from 'helpers/previewRenderer'

import styles from './webcamCanvas.module.scss'

const WebcamCanvas = ({
    onCopyToClipboard,
}: {
    onCopyToClipboard?: (valueToCopy: unknown) => void
}) => {
    const previewSettings = useContext(previewSettingsContext),
        renderSettings = useContext(renderSettingsContext),
        canvasRef = useRef<HTMLCanvasElement>(null),
        vidRef = useRef<HTMLVideoElement>(null),
        // replace with offscreen canvas?
        videoCanvasRef = useRef<HTMLCanvasElement>(null)

    useEffect(() => {
        const ctx = canvasRef.current!.getContext('2d') as CanvasRenderingContext2D,
            vidCtx = videoCanvasRef.current!.getContext('2d') as CanvasRenderingContext2D

        previewSettings.ctx = ctx

        previewSettings.stopLiveRendering = () => {
            previewSettings.persistGate = false
        }

        previewSettings.startLiveRendering = () => {
            previewSettings.persistGate = true

            // return cleanup fn
            return playPreview(ctx, vidRef.current!, vidCtx, previewSettings, renderSettings)
        }

        let cleanupFn = previewSettings.startLiveRendering()

        previewSettings.changeActiveWebcam = (deviceId) => {
            previewSettings.activeWebcamId = deviceId
            cleanupFn()
            cleanupFn = playPreview(ctx, vidRef.current!, vidCtx, previewSettings, renderSettings)
        }

        // return cleanup fn with closure
        return () => cleanupFn()
    }, [])

    return (
        <div className={styles.webcamCanvas}>
            <video ref={vidRef} />
            <div className={styles.videoCanvas}>
                {/*  size controlled by ctx in playPreview */}
                <canvas ref={videoCanvasRef} />
            </div>
            <div className={styles.outputCanvas}>
                {/*  size controlled by ctx in playPreview */}
                <canvas
                    ref={canvasRef}
                    onClick={
                        renderSettings.activeAlgorithm === renderSettings.algorithms.letters
                            ? () => onCopyToClipboard?.(previewSettings.currentFrameText)
                            : undefined
                    }
                />
            </div>
        </div>
    )
}

export default WebcamCanvas
