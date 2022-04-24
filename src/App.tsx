import React, { useRef } from 'react'

import type { WebPreviewConfig } from 'types/common'

import MainPage from 'components/page/Main.page'

import 'scss/global.scss'

function App() {
    const configObj = useRef<WebPreviewConfig>({
        withTextInsteadOfChars: false,
        withJustGreen: false,
        groupBy: 10,
    })

    return <MainPage configObj={configObj} />
}

export default App
