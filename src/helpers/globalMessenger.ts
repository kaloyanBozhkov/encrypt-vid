import { Resolution } from 'types/common'

import {
    renderBlurryPixels,
    renderGroupPixelsAsLetters,
    renderGroupPixelsAsSquares,
} from './renderers'

// context between react components and the js logic ran on each RequestAnimationFrame
export const globalMessenger: {
    preview: {
        windowIsResizing: boolean
        webcamSize: Resolution | null
        currentFrameText: string
        readonly clearPreview: (this: typeof globalMessenger.preview) => void
        readonly copyCurrentFrameText: (this: typeof globalMessenger.preview) => Promise<void>
        stopLiveRendering: null | (() => void)
        startLiveRendering: null | (() => void)
        setPreviewCanvasSize: null | ((size: Resolution) => void)
        readonly setPreviewCanvasSizeSetter: (
            this: typeof globalMessenger['preview'],
            fn: NonNullable<typeof globalMessenger['preview']['setPreviewCanvasSize']>
        ) => void
    }
    renderSettings: {
        withCustomChars: boolean
        withStaticText: boolean
        withJustGreen: boolean
        withSpeechUpdatedText: boolean
        groupBy: number
        readonly charsObj: {
            darkChars: string
            customChars: string
            readonly defaultChars: string
            speech: string
            staticText: string
        }
        readonly algorithms: {
            letters: typeof renderGroupPixelsAsLetters
            tiles: typeof renderGroupPixelsAsSquares
            blurry: typeof renderBlurryPixels
        }
        activeAlgorithm:
            | typeof renderGroupPixelsAsLetters
            | typeof renderGroupPixelsAsSquares
            | typeof renderBlurryPixels
        readonly setActiveAlgorithm: (
            algoName: keyof typeof globalMessenger.renderSettings.algorithms
        ) => void
        luminanceWeights: {
            r: number
            g: number
            b: number
        }
        readonly setCustomLuminance: (
            weights: { r: number; g: number; b: number } | 'default'
        ) => void
    }
    ctx: CanvasRenderingContext2D | null
} = {
    renderSettings: {
        withCustomChars: false,
        withStaticText: false,
        withJustGreen: false,
        withSpeechUpdatedText: false,
        groupBy: 15,
        charsObj: {
            defaultChars: '4!?$P80OKBNMLHGFDASDQWETYU',
            customChars: '4!?$P80OKBNMLHGFDASDQWETYU',
            staticText: 'hello±world±this±is±static±text',
            darkChars: '.,_-~:',
            speech: 'word',
        },
        algorithms: {
            letters: renderGroupPixelsAsLetters,
            tiles: renderGroupPixelsAsSquares,
            blurry: renderBlurryPixels,
        },
        activeAlgorithm: renderGroupPixelsAsLetters,
        setActiveAlgorithm(algoName) {
            switch (algoName) {
                case 'tiles':
                    this.activeAlgorithm = this.algorithms['tiles']
                    break
                case 'letters':
                    this.activeAlgorithm = this.algorithms['letters']
                    break
                case 'blurry':
                    this.activeAlgorithm = this.algorithms['blurry']
                    break
                default:
                    this.activeAlgorithm = this.algorithms['letters']
            }
        },
        luminanceWeights: {
            r: 0.2126,
            g: 0.7152,
            b: 0.0722,
        },
        setCustomLuminance(weights) {
            if (weights === 'default') {
                this.luminanceWeights = {
                    r: 0.2126,
                    g: 0.7152,
                    b: 0.0722,
                }
            } else {
                const { r, g, b } = weights
                this.luminanceWeights = {
                    r,
                    g,
                    b,
                }
            }
        },
    },
    preview: {
        webcamSize: null,
        stopLiveRendering: null,
        startLiveRendering: null,
        currentFrameText: '',
        copyCurrentFrameText() {
            return navigator.clipboard.writeText(this.currentFrameText)
        },
        setPreviewCanvasSize: null,
        setPreviewCanvasSizeSetter(setPreviewCanvasSize) {
            // do not proceed if already set once
            if (this.setPreviewCanvasSize)
                return console.error(
                    'tried setting setPreviewCanvasSize twice. React strict mode caught something, or was it a mistake?'
                )

            let timeoutID: ReturnType<typeof setTimeout> | null = null,
                lastSize: Resolution = { width: 0, height: 0 }

            // make sure not to run unnecessarily and to stop while resizing
            this.setPreviewCanvasSize = (size) => {
                if (size.width === lastSize.width && size.height === lastSize.height) return

                lastSize = size

                if (timeoutID) clearTimeout(timeoutID)
                timeoutID = setTimeout(() => setPreviewCanvasSize(size), 500)
            }
        },
        clearPreview() {
            if (!globalMessenger.ctx || !this.webcamSize)
                return console.error('Tried clearing preview before having initialized it')

            globalMessenger.ctx.clearRect(
                0,
                0,
                globalMessenger.ctx.canvas.width,
                globalMessenger.ctx.canvas.height
            )

            globalMessenger.ctx!.canvas.width = this.webcamSize!.width
            globalMessenger.ctx!.canvas.height = this.webcamSize!.height
        },
        windowIsResizing: false,
    },
    ctx: null,
}

console.log(globalMessenger)
