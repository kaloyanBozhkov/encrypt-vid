import React, { useState } from 'react'

import type { Resolution } from 'types/common'

import Settings from 'components/organisms/Settings/Settings.organism'
import WebcamCanvas from 'components/organisms/WebcamCanvas/WebcamCanvas.organism'

import MainLayout from 'components/layouts/MainLayout/Main.layout'

import { processFilesWithConfig } from 'helpers/vidConverterWasm'

// used initially untill webcam usage approved & set size based on media device capability
export const defaultSize = {
    width: 1280,
    height: 720,
}

const MainPage = () => {
    const [size, setSize] = useState<Resolution>({
        width: defaultSize.width,
        height: defaultSize.height,
    })

    return (
        <MainLayout
            menu={
                <Settings
                    defaultSize={size}
                    onHeightChanged={(height) => setSize((prev) => ({ ...prev, height }))}
                    onWidthChanged={(width) => setSize((prev) => ({ ...prev, width }))}
                    onConfigReady={(config, finishedProcessing) => {
                        processFilesWithConfig(config, finishedProcessing)
                    }}
                />
            }
        >
            <WebcamCanvas size={size} />
        </MainLayout>
    )
}

export default MainPage
