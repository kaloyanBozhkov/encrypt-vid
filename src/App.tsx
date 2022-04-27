import React, { useRef } from 'react'

import type { WebPreviewConfig } from 'types/common'

import MainPage from 'components/page/Main.page'

import 'scss/global.scss'

export const defaults = {
    width: 1280,
    height: 720,
    withTextInsteadOfChars: false,
    withJustGreen: false,
    withSpeechUpdatedText: false,
    groupBy: 15,
}

function App() {
    const configObj = useRef<WebPreviewConfig>(defaults)

    return <MainPage configObj={configObj} />
}

export default App
