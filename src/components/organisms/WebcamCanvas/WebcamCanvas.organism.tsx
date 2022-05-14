import React, { useContext, useEffect, useRef } from 'react'

import { previewSettingsContext } from 'context/previewSettings/previewSettings.contex'
import { renderSettingsContext } from 'context/renderSettings/renderSettings.contex'

import { playPreview } from 'helpers/previewRenderer'

import styles from './webcamCanvas.module.scss'

const WebcamCanvas = () => {
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
            playPreview(ctx, vidRef.current!, vidCtx, previewSettings, renderSettings)
        }

        previewSettings.startLiveRendering()
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
                <canvas ref={canvasRef} onClick={previewSettings.copyCurrentFrameText} />
            </div>
        </div>
    )
}

export default WebcamCanvas
