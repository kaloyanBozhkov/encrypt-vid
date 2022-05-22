import React, { useCallback, useContext, useEffect, useMemo, useState } from 'react'

import Dropzone from 'components/organisms/Dropzone/Dropzone.organism'

import type { WebcamSizeState } from 'components/page/Main.page'

import useFilesPaste from 'hooks/useFilesPaste/useFilesPaste'
import useResize from 'hooks/useResize/useResize'
import useWebcamSelect from 'hooks/useWebcamSelect/useWebcamSelect'

import { previewSettingsContext } from 'context/previewSettings/previewSettings.contex'
import { RenderSettings, renderSettingsContext } from 'context/renderSettings/renderSettings.contex'

import { faPaperPlane } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { Button, InputWrapper, NativeSelect, NumberInput } from '@mantine/core'
import { MIME_TYPES } from '@mantine/dropzone'
import { useInputState } from '@mantine/hooks'

import Modes from './Modes/Modes'
import styles from './settings.module.scss'

const ALLOWED_MIME_TYPES = [MIME_TYPES.mp4, 'video/quicktime', MIME_TYPES.jpeg, MIME_TYPES.png]

const DeniedWebcam = (
    <InputWrapper label="No webcam to preview config with :(" className={styles.contentSize}>
        {null}
    </InputWrapper>
)

const Settings = ({
    inactive,
    onConfigReady,
    webcamSize,
}: {
    inactive: boolean
    onConfigReady: (
        files: File[],
        renderSettings: RenderSettings,
        finishedProcessing: () => void
    ) => void
    webcamSize: WebcamSizeState
}) => {
    const renderSettings = useContext(renderSettingsContext),
        previewSettings = useContext(previewSettingsContext),
        [groupBy, setGroupBy] = useInputState(15),
        [effect, setEffect] = useState<keyof RenderSettings['algorithms']>('letters'),
        [isVisible, setVisible] = useState(window.innerWidth > 900),
        { pastedFiles, clearPastedFile, clearPastedFiles } = useFilesPaste({
            mimeTypes: ALLOWED_MIME_TYPES,
        }),
        [files, setFiles] = useState<File[]>([]),
        onClear = useCallback((fileName: string) => {
            setFiles((prev) => prev.filter((currContent) => currContent.name !== fileName))
            // might have to remove from pasted ones too
            clearPastedFile(fileName)
        }, []),
        dropZoneMemoized = useMemo(
            () => (
                <InputWrapper label="Files">
                    <Dropzone
                        onDrop={(files) => setFiles((prev) => [...prev, ...files])}
                        onClear={onClear}
                        files={files}
                        accept={ALLOWED_MIME_TYPES}
                    />
                </InputWrapper>
            ),
            [files]
        ),
        effectNames = useMemo(
            () =>
                Object.keys(renderSettings.algorithms).map(
                    (key) => key[0].toUpperCase() + key.substring(1)
                ),
            []
        ),
        { webcamDevices, setActiveWebcam, activeWebcam } = useWebcamSelect()

    useResize({ fn: setVisible })

    useEffect(() => {
        renderSettings.groupBy = groupBy
    }, [groupBy])

    useEffect(() => {
        renderSettings.setActiveAlgorithm(effect)
    }, [effect])

    useEffect(() => {
        // clear duplicates
        const newPasted = pastedFiles.filter(
            (pf) => files.filter(({ name }) => name === pf.name).length === 0
        )
        setFiles((prev) => [...prev, ...newPasted])
    }, [pastedFiles])

    useEffect(() => {
        if (activeWebcam) previewSettings.changeActiveWebcam!(activeWebcam.deviceId)
    }, [activeWebcam])

    return (
        <div className={styles.settings} data-is-visible={isVisible && !inactive}>
            <Button
                variant="subtle"
                color="dark"
                radius="xl"
                compact
                uppercase
                onClick={() => (inactive ? undefined : setVisible((p) => !p))}
            >
                {isVisible ? (inactive ? '...' : 'Hide') : 'Show settings'}
            </Button>
            <div>
                <p>- Settings -</p>
                <div>
                    {webcamDevices.length > 0 && webcamSize !== 'denied' ? (
                        <>
                            <InputWrapper>
                                <NativeSelect
                                    label="Preview Device"
                                    placeholder="Pick webcam to use for preview"
                                    value={activeWebcam?.label}
                                    data={webcamDevices.map(({ label }) => label)}
                                    onChange={({ currentTarget: { value: label } }) =>
                                        setActiveWebcam({ label })
                                    }
                                />
                            </InputWrapper>
                            <InputWrapper
                                label={'Webcam Preview Size'}
                                className={styles.contentSize}
                            >
                                {webcamSize === 'loading' ? (
                                    <p>Loading..</p>
                                ) : (
                                    <>
                                        <p>{`Width: ${webcamSize.width}`} px</p>
                                        <p>{`Height: ${webcamSize.height} px`}</p>
                                    </>
                                )}
                            </InputWrapper>
                        </>
                    ) : (
                        DeniedWebcam
                    )}
                    <InputWrapper label="Group By">
                        <NumberInput
                            min={1}
                            placeholder="Group Pixels By"
                            value={groupBy}
                            onChange={(val) => setGroupBy(val || 1)}
                        />
                    </InputWrapper>
                    <InputWrapper label="Video Effect">
                        <NativeSelect
                            required
                            data={effectNames}
                            placeholder="Pick effect to use"
                            value={effect[0].toUpperCase() + effect.substring(1)}
                            onChange={({ currentTarget: { value } }) =>
                                setEffect(value.toLowerCase() as 'tiles' | 'letters')
                            }
                        />
                        {effect === 'letters' && (
                            <p className={styles.note}>
                                * You can click on the screen to copy as text
                            </p>
                        )}
                    </InputWrapper>
                    <Modes effect={effect} />
                    {dropZoneMemoized}
                    <Button
                        variant="subtle"
                        color="dark"
                        radius="xl"
                        compact
                        uppercase
                        className={styles.submitBtn}
                        onClick={() =>
                            onConfigReady(files, renderSettings, () => {
                                setFiles([])
                                clearPastedFiles()
                            })
                        }
                        disabled={!files.length}
                    >
                        Submit <FontAwesomeIcon icon={faPaperPlane} />
                    </Button>
                </div>
                {inactive && (
                    <div className={styles.overlayInactive}>
                        <p>Processing..</p>
                    </div>
                )}
                <div />
            </div>
        </div>
    )
}

export default Settings
