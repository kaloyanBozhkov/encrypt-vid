import { Resolution } from 'types/common'

import {
    renderBlurryPixels,
    renderGroupPixelsAsLetters,
    renderGroupPixelsAsSquares,
} from './renderers'

// context between react components and the js logic ran on each RequestAnimationFrame
export const globalMessenger: {
    preview: {
        webcamSize: Resolution | null
        readonly clearPreview: (this: typeof globalMessenger.preview) => void
        stopLiveRendering: null | (() => void)
        startLiveRendering: null | (() => void)
    }
    renderSettings: {
        withTextInsteadOfChars: boolean
        withJustGreen: boolean
        withSpeechUpdatedText: boolean
        groupBy: number
        readonly charsObj: {
            text: string
            readonly chars: string
            speech: string
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
        withTextInsteadOfChars: false,
        withJustGreen: false,
        withSpeechUpdatedText: false,
        groupBy: 15,
        charsObj: {
            chars: '4!?$P80OKBNMLHGFDASDQWETYU',
            text: '4!?$P80OKBNMLHGFDASDQWETYU',
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
    },
    ctx: null,
}
