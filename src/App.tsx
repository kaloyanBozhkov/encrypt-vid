import React from 'react'

import MainPage from 'components/page/Main.page'

import { useGlobalStyles } from 'hooks/useStyleVariables/useStyleVariables'

import {
    PreviewSettingsProvider,
    previewSettings,
} from 'context/previewSettings/previewSettings.contex'
import {
    RenderSettingsProvider,
    renderSettings,
} from 'context/renderSettings/renderSettings.contex'

import 'scss/global.scss'

function App() {
    useGlobalStyles()

    return (
        <RenderSettingsProvider value={renderSettings}>
            <PreviewSettingsProvider value={previewSettings}>
                <MainPage />
            </PreviewSettingsProvider>
        </RenderSettingsProvider>
    )
}

export default App
