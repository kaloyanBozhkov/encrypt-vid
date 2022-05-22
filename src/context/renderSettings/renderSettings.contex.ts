import { createContext } from 'react'

import { COLORS } from 'reactives/Styles.reactive'

import {
    renderBlurryPixels,
    renderGroupPixelsAsLetters,
    renderGroupPixelsAsSquares,
} from 'helpers/renderers'

export type RenderSettings = {
    withCustomChars: boolean
    withStaticText: boolean
    withJustGreen: boolean
    withSpeechUpdatedText: boolean
    groupBy: number
    canvasBgColor: string
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
    readonly setActiveAlgorithm: (algoName: keyof RenderSettings['algorithms']) => void
    luminanceWeights: {
        r: number
        g: number
        b: number
    }
    readonly setCustomLuminance: (weights: { r: number; g: number; b: number } | 'default') => void
}

export const renderSettings: RenderSettings = {
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
    canvasBgColor: COLORS.canvasBg,
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
}

export const renderSettingsContext = createContext<typeof renderSettings>(renderSettings)

export const RenderSettingsProvider = renderSettingsContext.Provider
