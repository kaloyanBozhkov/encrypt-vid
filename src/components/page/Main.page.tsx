import React, { MutableRefObject, useCallback, useState } from 'react'

import type { Resolution, WebPreviewConfig } from 'types/common'

import Settings from 'components/organisms/Settings/Settings.organism'
import WebcamCanvas from 'components/organisms/WebcamCanvas/WebcamCanvas.organism'

import MainLayout from 'components/layouts/MainLayout/Main.layout'

import { processFilesWithConfig } from 'helpers/vidConverterWasm'

const defaultSize = {
    width: 1280,
    height: 720,
}

let timer: null | ReturnType<typeof setTimeout> = null

const MainPage = ({ configObj }: { configObj: MutableRefObject<WebPreviewConfig> }) => {
    const [size, setSize] = useState<Resolution>(defaultSize),
        updater = useCallback(
            (
                key: keyof WebPreviewConfig,
                value: WebPreviewConfig[keyof WebPreviewConfig],
                withDelay = true
            ) => {
                if (timer) clearTimeout(timer)

                timer = setTimeout(
                    () => {
                        configObj.current = {
                            ...configObj.current,
                            [key]: value,
                        }
                    },
                    withDelay ? 0 : 500
                )

                return () => (timer ? clearTimeout(timer) : undefined)
            },
            []
        )

    console.log('size', size)
    return (
        <MainLayout
            menu={
                <Settings
                    defaultSize={size}
                    onSpeechModeChanged={(speechMode) =>
                        updater('withSpeechUpdatedText', speechMode)
                    }
                    onTextModeChanged={(textMode) => updater('withTextInsteadOfChars', textMode)}
                    onGroupByChanged={(n) => updater('groupBy', n)}
                    onMatrixModeChanged={(matrixMode) => updater('withJustGreen', matrixMode)}
                    onHeightChanged={(height) => setSize((prev) => ({ ...prev, height }))}
                    onWidthChanged={(width) => setSize((prev) => ({ ...prev, width }))}
                    onConfigReady={(config) => {
                        processFilesWithConfig(config, (size: Resolution | 'default') =>
                            setSize(size === 'default' ? defaultSize : size)
                        )
                    }}
                />
            }
        >
            <WebcamCanvas {...size} configObj={configObj} />
        </MainLayout>
    )
}

export default MainPage
