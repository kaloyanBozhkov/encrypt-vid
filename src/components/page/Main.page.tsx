import React, { useCallback, useContext, useEffect, useMemo, useState } from 'react'

import Actions from 'components/molecules/Actions/Actions.organism'
import OperationStatus from 'components/molecules/OperationStatus/OperationStatus.molecule'

import Settings from 'components/organisms/Settings/Settings.organism'
import WebcamCanvas from 'components/organisms/WebcamCanvas/WebcamCanvas.organism'

import MainLayout from 'components/layouts/MainLayout/Main.layout'

import { previewSettingsContext } from 'context/previewSettings/previewSettings.contex'

import { useClipboard } from '@mantine/hooks'

import { downloadFile } from 'helpers/helpers'
import { processFilesWithConfig } from 'helpers/vidConverterWasm'

import type { Resolution } from 'types/common'

export type WebcamSizeState = Resolution | 'loading' | 'denied'

const MainPage = () => {
    const previewSettings = useContext(previewSettingsContext),
        [webcamSize, setWebcamSize] = useState<WebcamSizeState>('loading'),
        [processingMsg, setProcessingMsg] = useState<string | 'Done!'>(''),
        [isProcessing, setIsProcessing] = useState(false),
        [step, setStep] = useState(0),
        { copy: onCopyToClipboard, copied } = useClipboard({ timeout: 1500 }),
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
            () => <WebcamCanvas onCopyToClipboard={onCopyToClipboard} />,
            [onCopyToClipboard]
        ),
        saveFile = useCallback(() => {
            const imageUrl = previewSettings.ctx!.canvas.toDataURL('image/jpg')
            downloadFile({ fileName: 'frame', url: imageUrl })
        }, [])

    // once preview plays we have media stream and can determine webcam resolution
    useEffect(() => {
        previewSettings.setWebcamSize = setWebcamSize
    }, [])

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

    return (
        <MainLayout menu={SettingsMemoized} actions={<Actions onSave={saveFile} />}>
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
