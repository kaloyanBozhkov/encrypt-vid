import { createContext } from 'react'

import { Resolution } from 'types/common'

export type PreviewSettings = {
    ctx: CanvasRenderingContext2D | null
    windowIsResizing: boolean
    currentFrameText: string
    readonly copyCurrentFrameText: (this: PreviewSettings) => Promise<void>
    stopLiveRendering: null | (() => void)
    startLiveRendering: null | (() => void)
    setWebcamSize: null | ((size: Resolution) => void)
    persistGate: boolean
}

export const previewSettings: PreviewSettings = {
    ctx: null,
    stopLiveRendering: null,
    startLiveRendering: null,
    setWebcamSize: null,
    currentFrameText: '',
    windowIsResizing: false,
    // used to stop webcam rendering
    persistGate: true,
    copyCurrentFrameText() {
        return navigator.clipboard.writeText(this.currentFrameText)
    },
}

export const previewSettingsContext = createContext<typeof previewSettings>(previewSettings)

export const PreviewSettingsProvider = previewSettingsContext.Provider
