import React, { useContext, useEffect, useMemo, useState } from 'react'

import OperationStatus from 'components/molecules/OperationStatus/OperationStatus.molecule'

import Settings from 'components/organisms/Settings/Settings.organism'
import WebcamCanvas from 'components/organisms/WebcamCanvas/WebcamCanvas.organism'

import MainLayout from 'components/layouts/MainLayout/Main.layout'

import { previewSettingsContext } from 'context/previewSettings/previewSettings.contex'

import { processFilesWithConfig } from 'helpers/vidConverterWasm'

import type { Resolution } from 'types/common'

export type WebcamSizeState = Resolution | 'loading' | 'denied'

const MainPage = () => {
    const previewSettings = useContext(previewSettingsContext),
        [webcamSize, setWebcamSize] = useState<WebcamSizeState>('loading'),
        [processingMsg, setProcessingMsg] = useState<string | 'Done!'>(''),
        [isProcessing, setIsProcessing] = useState(false),
        [step, setStep] = useState(0),
        [copied, setCopied] = useState(false),
        SettingsMemoized = useMemo(
            () => (
                <Settings
                    inactive={isProcessing}
                    webcamSize={webcamSize}
                    onConfigReady={async (files, renderSettings, finishedProcessing) => {
                        setIsProcessing(true)

                        // stop webcam preview
                        previewSettings.stopLiveRendering!()

                        await processFilesWithConfig({
                            files,
                            setProcessingMsg,
                            renderSettings,
                            previewSettings,
                        })

                        // resume webcam preview
                        previewSettings.startLiveRendering!()

                        setProcessingMsg('Done!')
                        setIsProcessing(false)

                        // reset dropzone
                        finishedProcessing()
                    }}
                />
            ),
            [webcamSize, isProcessing]
        ),
        WebacmCanvasMemoized = useMemo(
            () => <WebcamCanvas setCopied={() => setCopied(true)} />,
            [setCopied]
        )

    // once preview plays we have media stream and can determine webcam resolution
    useEffect(() => {
        previewSettings.setWebcamSize = setWebcamSize
    })

    useEffect(() => {
        let intervalId: ReturnType<typeof setInterval> | undefined = undefined

        if (processingMsg && !['Done!', 'Preview time!'].includes(processingMsg))
            intervalId = setInterval(() => setStep((prev) => (prev + 1 > 3 ? 0 : prev + 1)), 500)

        return () => intervalId && clearInterval(intervalId)
    }, [processingMsg])

    useEffect(() => {
        let timeoutId: ReturnType<typeof setTimeout> | undefined = undefined
        if (processingMsg === 'Done!') {
            setStep(0)
            timeoutId = setTimeout(() => setProcessingMsg(''), 500)
        } else if (processingMsg === 'Preview time!') {
            setStep(0)
        }

        return () => timeoutId && clearTimeout(timeoutId)
    }, [processingMsg])

    useEffect(() => {
        let timeoutId: ReturnType<typeof setTimeout> | undefined = undefined
        if (copied) timeoutId = setTimeout(() => setCopied(false), 2000)
        return () => timeoutId && clearTimeout(timeoutId)
    }, [copied])

    return (
        <MainLayout menu={SettingsMemoized}>
            {processingMsg && (
                <OperationStatus label={processingMsg} step={step} location="top-center" />
            )}
            {copied && (
                <OperationStatus label="Text Copied!" type="message" location="bottom-right" />
            )}
            {WebacmCanvasMemoized}
        </MainLayout>
    )
}

export default MainPage
