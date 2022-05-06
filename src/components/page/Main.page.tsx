import React, { useEffect, useMemo, useState } from 'react'

import type { Resolution } from 'types/common'

import OperationStatus from 'components/molecules/OperationStatus/OperationStatus.molecule'

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
        }),
        [processing, setProcessing] = useState(false),
        [loadingFFMPEGWorker, setLoadingFFMPEGWorker] = useState(false),
        [copyingFiles, setCopyingFiles] = useState(false),
        [step, setStep] = useState(0),
        SettingsMemoized = useMemo(
            () => (
                <Settings
                    defaultSize={size}
                    onHeightChanged={(height) => setSize((prev) => ({ ...prev, height }))}
                    onWidthChanged={(width) => setSize((prev) => ({ ...prev, width }))}
                    onConfigReady={(config, finishedProcessing) => {
                        processFilesWithConfig(config, {
                            onLoadingWorker: () => setLoadingFFMPEGWorker(true),
                            onCopyingFiles: () => {
                                setLoadingFFMPEGWorker(false)
                                setCopyingFiles(true)
                            },
                            onStartedProcessing: () => {
                                setCopyingFiles(false)
                                setProcessing(true)
                            },
                            onFinishedProcessing: () => {
                                finishedProcessing()
                                setProcessing(false)
                            },
                        })
                    }}
                />
            ),
            []
        ),
        WebacmCanvasMemoized = useMemo(() => <WebcamCanvas size={size} />, [size])

    let operationStatusLabel = ''

    if (processing) operationStatusLabel = 'Processing'
    if (loadingFFMPEGWorker) operationStatusLabel = 'Loading worker'
    if (copyingFiles) operationStatusLabel = 'Copying files'

    useEffect(() => {
        let intervalId: ReturnType<typeof setInterval> | undefined = undefined

        if (processing || loadingFFMPEGWorker)
            intervalId = setInterval(() => {
                setStep((prev) => (prev + 1 > 3 ? 0 : prev + 1))
            }, 500)

        return () => intervalId && clearInterval(intervalId)
    }, [processing || loadingFFMPEGWorker])

    return (
        <MainLayout menu={SettingsMemoized}>
            {operationStatusLabel && <OperationStatus label={operationStatusLabel} step={step} />}
            {WebacmCanvasMemoized}
        </MainLayout>
    )
}

export default MainPage
