import React, { useEffect, useRef } from 'react'

import { Resolution } from 'types/common'

import { globalMessenger } from 'helpers/globalMessenger'
import { playPreview } from 'helpers/previewRenderer'

import styles from './webcamCanvas.module.scss'

const WebcamCanvas = ({ size: { width, height } }: { size: Resolution }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null),
        vidRef = useRef<HTMLVideoElement>(null),
        // replace with offscreen canvas?
        videoCanvasRef = useRef<HTMLCanvasElement>(null),
        // control webcam rendering
        persistGateRef = useRef(true)

    useEffect(() => {
        const ctx = canvasRef.current!.getContext('2d') as CanvasRenderingContext2D,
            vidCtx = videoCanvasRef.current!.getContext('2d') as CanvasRenderingContext2D

        globalMessenger.ctx = ctx

        globalMessenger.preview.stopLiveRendering = () => {
            persistGateRef.current = false
        }

        globalMessenger.preview.startLiveRendering = () => {
            persistGateRef.current = true
            playPreview(ctx, vidRef.current!, vidCtx, persistGateRef)
        }

        globalMessenger.preview.startLiveRendering()
    }, [])

    return (
        <div className={styles.webcamCanvas}>
            <video ref={vidRef} />
            <div className={styles.videoCanvas}>
                <canvas ref={videoCanvasRef} width={`${width}px`} height={`${height}px`} />
            </div>
            <div className={styles.outputCanvas}>
                <canvas
                    ref={canvasRef}
                    width={`${width}px`}
                    height={`${height}px`}
                    onClick={() => {
                        globalMessenger.preview.copyCurrentFrameText()
                    }}
                />
            </div>
        </div>
    )
}

export default WebcamCanvas
