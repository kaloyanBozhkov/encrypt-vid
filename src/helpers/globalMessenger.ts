import { Resolution } from 'types/common'

import {
    renderBlurryPixels,
    renderGroupPixelsAsLetters,
    renderGroupPixelsAsSquares,
} from './renderers'

// context between react components and the js logic ran on each RequestAnimationFrame
export const GlobalMessenger: {
    preview: {
        webcamSize: Resolution | null
        readonly clearPreview: (this: typeof GlobalMessenger.preview) => void
        stopLiveRendering: null | (() => void)
        startLiveRendering: null | (() => void)
    }
    renderSettings: {
        withTextInsteadOfChars: boolean
        withJustGreen: boolean
        withSpeechUpdatedText: boolean
        groupBy: number
        charsObj: Record<'chars' | 'text', string>
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
            algoName: keyof typeof GlobalMessenger.renderSettings.algorithms
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
        withTextInsteadOfChars: false,
        withJustGreen: false,
        withSpeechUpdatedText: false,
        groupBy: 15,
        charsObj: {
            chars: '4!?$P80OKBNMLHGFDASDQWETYU',
            text: '4!?$P80OKBNMLHGFDASDQWETYU',
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
        clearPreview() {
            if (!GlobalMessenger.ctx || !this.webcamSize)
                return console.error('Tried clearing preview before having initialized it')

            GlobalMessenger.ctx.clearRect(
                0,
                0,
                GlobalMessenger.ctx.canvas.width,
                GlobalMessenger.ctx.canvas.height
            )

            GlobalMessenger.ctx!.canvas.width = this.webcamSize!.width
            GlobalMessenger.ctx!.canvas.height = this.webcamSize!.height
        },
    },
    ctx: null,
}
