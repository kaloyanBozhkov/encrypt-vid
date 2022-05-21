import { createContext } from 'react'

import { Resolution } from 'types/common'

export type PreviewSettings = {
    ctx: CanvasRenderingContext2D | null
    currentFrameText: string
    stopLiveRendering: null | (() => void)
    startLiveRendering: null | (() => () => void)
    setWebcamSize: null | ((size: Resolution) => void)
    activeWebcamId: string | null
    changeActiveWebcam: ((this: PreviewSettings, deviceId: string) => void) | null
    persistGate: boolean
}

export const previewSettings: PreviewSettings = {
    ctx: null,
    stopLiveRendering: null,
    startLiveRendering: null,
    setWebcamSize: null,
    activeWebcamId: null,
    changeActiveWebcam: null,
    currentFrameText: '',
    // used to stop webcam rendering
    persistGate: true,
}

export const previewSettingsContext = createContext<typeof previewSettings>(previewSettings)

export const PreviewSettingsProvider = previewSettingsContext.Provider
