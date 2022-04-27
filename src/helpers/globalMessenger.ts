import {
    renderBlurryPixels,
    renderGroupPixelsAsLetters,
    renderGroupPixelsAsSquares,
} from './renderers'

// context between react components and the js logic ran on each RequestAnimationFrame
export const GlobalMessenger: {
    ctx: CanvasRenderingContext2D | null
    stopLiveRendering: null | (() => void)
    startLiveRendering: null | (() => void)
    charsObj: Record<'chars' | 'text', string>
    algorithms: {
        letters: typeof renderGroupPixelsAsLetters
        tiles: typeof renderGroupPixelsAsSquares
        blurry: typeof renderBlurryPixels
    }
    activeAlgorithm:
        | typeof renderGroupPixelsAsLetters
        | typeof renderGroupPixelsAsSquares
        | typeof renderBlurryPixels
    setActiveAlgorithm: (algoName: keyof typeof GlobalMessenger['algorithms']) => void
    luminanceWeights: {
        r: number
        g: number
        b: number
    }
    setCustomLuminance: (weights: { r: number; g: number; b: number } | 'default') => void
} = {
    ctx: null,
    stopLiveRendering: null,
    startLiveRendering: null,
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
            // if (r + b + g !== 1)
            //     return console.error('Tried setting luminance with sum of weights > 1!')

            this.luminanceWeights = {
                r,
                g,
                b,
            }
        }
    },
}
