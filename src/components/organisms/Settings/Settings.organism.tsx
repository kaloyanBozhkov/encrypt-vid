import React, { useCallback, useContext, useEffect, useMemo, useState } from 'react'

import { RenderSettings, renderSettingsContext } from 'context/renderSettings/renderSettings.contex'
import useResize from 'hooks/useResize/useResize'

import Dropzone from 'components/organisms/Dropzone/Dropzone.organism'

import type { WebcamSizeState } from 'components/page/Main.page'

import { faPaperPlane } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
    Button,
    InputWrapper,
    NativeSelect,
    NumberInput,
    Slider,
    Switch,
    Textarea,
} from '@mantine/core'
import { MIME_TYPES } from '@mantine/dropzone'
import { useInputState } from '@mantine/hooks'

import styles from './settings.module.scss'

const defaultSliderProps = {
    marks: [
        { value: 0, label: '0' },
        { value: 50, label: '0.5' },
        { value: 100, label: '1' },
    ],
    step: 0.001,
    precision: 5,
}

const renderSettings = ({
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
        [groupBy, setGroupBy] = useInputState(15),
        [matrixMode, setMatrixMode] = useState(false),
        [customCharsMode, setCustomCharsMode] = useState(false),
        [staticTextMode, setStaticTextMode] = useState(false),
        [speechMode, setSpeechMode] = useState(false),
        [isVisible, setVisible] = useState(window.innerWidth > 900),
        [withCustomLuminance, settWithCustomLuminance] = useState(false),
        [customLuminance, setCustomLuminance] = useState({
            r: 0,
            g: 0,
            b: 0,
        }),
        [files, setFiles] = useState<File[]>([]),
        onClear = useCallback((fileName) => {
            setFiles((prev) => prev.filter((currContent) => currContent.name !== fileName))
        }, []),
        dropZoneMemoized = useMemo(
            () => (
                <InputWrapper label="Files">
                    <Dropzone
                        onDrop={setFiles}
                        onClear={onClear}
                        files={files}
                        accept={[
                            MIME_TYPES.mp4,
                            'video/quicktime',
                            MIME_TYPES.jpeg,
                            MIME_TYPES.png,
                        ]}
                    />
                </InputWrapper>
            ),
            [files]
        ),
        [customChars, setCustomChars] = useState(renderSettings.charsObj.customChars),
        [staticText, setStaticText] = useState(renderSettings.charsObj.staticText),
        [darkChars, setDarkChars] = useState(renderSettings.charsObj.darkChars),
        [effect, setEffect] = useState<'letters' | 'tiles' | 'blurry'>('letters'),
        effectNames = useMemo(
            () =>
                Object.keys(renderSettings.algorithms).map(
                    (key) => key[0].toUpperCase() + key.substring(1)
                ),
            []
        ),
        darkCharsInput = useMemo(
            () => (
                <Textarea
                    className={styles.toggledContent}
                    placeholder="Type the chars to use for darkest colours"
                    label="Dark chars"
                    autosize
                    minRows={1}
                    value={darkChars}
                    onChange={({ currentTarget: { value } }) => setDarkChars(value.toUpperCase())}
                />
            ),
            [darkChars]
        )

    useResize({ fn: setVisible })

    useEffect(() => {
        renderSettings.groupBy = groupBy
    }, [groupBy])

    useEffect(() => {
        renderSettings.withJustGreen = matrixMode
    }, [matrixMode])

    useEffect(() => {
        renderSettings.withCustomChars = customCharsMode
    }, [customCharsMode])

    useEffect(() => {
        renderSettings.withSpeechUpdatedText = speechMode
    }, [speechMode])

    useEffect(() => {
        renderSettings.withStaticText = staticTextMode
    }, [staticTextMode])

    // update the chars used for encrypting - ReqAnimFrame will read the charsObj.customChars
    useEffect(() => {
        renderSettings.charsObj.customChars = customChars
    }, [customChars])

    useEffect(() => {
        renderSettings.charsObj.staticText = staticText
    }, [staticText])

    useEffect(() => {
        renderSettings.charsObj.darkChars = darkChars
    }, [darkChars])

    useEffect(() => {
        if (!withCustomLuminance) renderSettings.setCustomLuminance('default')

        setCustomLuminance({
            r: renderSettings.luminanceWeights.r * 100,
            g: renderSettings.luminanceWeights.g * 100,
            b: renderSettings.luminanceWeights.b * 100,
        })
    }, [withCustomLuminance])

    useEffect(() => {
        if (withCustomLuminance)
            renderSettings.setCustomLuminance({
                r: Number((customLuminance.r / 100).toPrecision(3)),
                g: Number((customLuminance.g / 100).toPrecision(3)),
                b: Number((customLuminance.b / 100).toPrecision(3)),
            })
    }, [customLuminance])

    useEffect(() => {
        renderSettings.setActiveAlgorithm(effect)
    }, [effect])

    return (
        <div className={styles.settings} data-is-visible={isVisible && !inactive}>
            <Button
                variant="subtle"
                color="dark"
                radius="xl"
                compact
                uppercase
                onClick={() => setVisible((p) => !p)}
            >
                {isVisible ? 'Hide' : 'Show renderSettings'}
            </Button>
            <div>
                <p>- Settings -</p>
                <div>
                    <InputWrapper
                        label={
                            webcamSize !== 'denied'
                                ? 'Webcam Preview Size'
                                : 'No webcam to preview config with :('
                        }
                        className={styles.contentSize}
                    >
                        {webcamSize !== 'denied' ? (
                            webcamSize === 'loading' ? (
                                <p>Loading..</p>
                            ) : (
                                <>
                                    <p>{`Width: ${webcamSize.width}`} px</p>
                                    <p>{`Height: ${webcamSize.height} px`}</p>
                                </>
                            )
                        ) : null}
                    </InputWrapper>
                    <InputWrapper label="Group By">
                        <NumberInput
                            min={1}
                            type="number"
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
                    </InputWrapper>
                    <InputWrapper label="Modes" className={styles.switches}>
                        <Switch
                            label="matrix"
                            size="md"
                            checked={matrixMode}
                            onChange={({ currentTarget: { checked } }) => setMatrixMode(checked)}
                        />
                        {effect === 'letters' && (
                            <Switch
                                label="custom chars"
                                size="md"
                                checked={customCharsMode}
                                onChange={({ currentTarget: { checked } }) => {
                                    setCustomCharsMode(checked)
                                    setStaticTextMode(false)
                                    setSpeechMode(false)
                                }}
                            />
                        )}
                        {customCharsMode && effect === 'letters' && (
                            <>
                                <Textarea
                                    className={styles.toggledContent}
                                    placeholder="Type what chars to use instead of default encoding charset"
                                    label="custom chars"
                                    autosize
                                    minRows={2}
                                    value={customChars}
                                    onChange={({ currentTarget: { value } }) =>
                                        setCustomChars(value.toUpperCase())
                                    }
                                />
                                {darkCharsInput}
                            </>
                        )}
                        {effect === 'letters' && (
                            <Switch
                                label="static text"
                                size="md"
                                checked={staticTextMode}
                                onChange={({ currentTarget: { checked } }) => {
                                    setStaticTextMode(checked)
                                    setCustomCharsMode(false)
                                    setSpeechMode(false)
                                }}
                            />
                        )}
                        {staticTextMode && effect === 'letters' && (
                            <>
                                <Textarea
                                    className={styles.toggledContent}
                                    placeholder="Type what static text to use instead of default encoding charset"
                                    label="Static Text"
                                    autosize
                                    minRows={2}
                                    value={staticText}
                                    onChange={({ currentTarget: { value } }) =>
                                        setStaticText(value.toUpperCase())
                                    }
                                />
                                {darkCharsInput}
                            </>
                        )}
                        {effect === 'letters' &&
                            Object.prototype.hasOwnProperty.call(
                                window,
                                'webkitSpeechRecognition'
                            ) && (
                                <Switch
                                    label="voice updates text"
                                    size="md"
                                    checked={speechMode}
                                    onChange={({ currentTarget: { checked } }) => {
                                        setSpeechMode(checked)
                                        setStaticTextMode(false)
                                        setCustomCharsMode(false)
                                    }}
                                />
                            )}
                        <Switch
                            label="custom luminance"
                            size="md"
                            checked={withCustomLuminance}
                            onChange={({ currentTarget: { checked } }) =>
                                settWithCustomLuminance(checked)
                            }
                        />
                    </InputWrapper>
                    {withCustomLuminance && (
                        <InputWrapper label="Luminance Weights">
                            <InputWrapper
                                className={styles.toggledContent}
                                label={`red: ${customLuminance.r}`}
                            >
                                <Slider
                                    {...defaultSliderProps}
                                    label="red"
                                    value={customLuminance.r}
                                    onChange={(r) =>
                                        setCustomLuminance((prev) => ({
                                            ...prev,
                                            r,
                                        }))
                                    }
                                />
                            </InputWrapper>
                            <InputWrapper
                                className={styles.toggledContent}
                                label={`green: ${customLuminance.g}`}
                            >
                                <Slider
                                    label="green"
                                    {...defaultSliderProps}
                                    value={customLuminance.g}
                                    onChange={(g) =>
                                        setCustomLuminance((prev) => ({
                                            ...prev,
                                            g,
                                        }))
                                    }
                                />
                            </InputWrapper>
                            <InputWrapper
                                className={styles.toggledContent}
                                label={`blue: ${customLuminance.b}`}
                            >
                                <Slider
                                    label="blue"
                                    {...defaultSliderProps}
                                    value={customLuminance.b}
                                    onChange={(b) =>
                                        setCustomLuminance((prev) => ({
                                            ...prev,
                                            b,
                                        }))
                                    }
                                />
                            </InputWrapper>
                        </InputWrapper>
                    )}
                    {dropZoneMemoized}
                    <Button
                        variant="subtle"
                        color="dark"
                        radius="xl"
                        compact
                        uppercase
                        className={styles.submitBtn}
                        onClick={() => onConfigReady(files, renderSettings, () => setFiles([]))}
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

export default renderSettings
