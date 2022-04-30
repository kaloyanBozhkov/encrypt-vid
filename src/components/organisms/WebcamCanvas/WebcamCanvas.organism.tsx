import React, { useEffect, useRef } from 'react'

import { GlobalMessenger } from 'helpers/globalMessenger'
import { playPreview } from 'helpers/previewRenderer'

import styles from './webcamCanvas.module.scss'

const WebcamCanvas = ({ width, height }: { width: number; height: number }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null),
        vidRef = useRef<HTMLVideoElement>(null),
        // replace with offscreen canvas?
        videoCanvasRef = useRef<HTMLCanvasElement>(null),
        // control webcam rendering
        persistGateRef = useRef(true)

    useEffect(() => {
        const ctx = canvasRef.current!.getContext('2d') as CanvasRenderingContext2D,
            vidCtx = videoCanvasRef.current!.getContext('2d') as CanvasRenderingContext2D

        GlobalMessenger.ctx = ctx

        GlobalMessenger.preview.stopLiveRendering = () => {
            persistGateRef.current = false
        }

        GlobalMessenger.preview.startLiveRendering = () => {
            persistGateRef.current = true
            playPreview(ctx, vidRef.current!, vidCtx, persistGateRef)
        }

        GlobalMessenger.preview.startLiveRendering()
    }, [])

    return (
        <div className={styles.webcamCanvas}>
            <video ref={vidRef} />
            <canvas
                className={styles.videoCanvas}
                ref={videoCanvasRef}
                width={`${width}px`}
                height={`${height}px`}
            />
            <canvas ref={canvasRef} width={`${width}px`} height={`${height}px`} />
        </div>
    )
}

export default WebcamCanvas
