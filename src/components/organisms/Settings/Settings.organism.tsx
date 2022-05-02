import React, { useCallback, useEffect, useMemo, useState } from 'react'

import { Resolution, VidConfig } from 'types/common'

import Dropzone from 'components/organisms/Dropzone/Dropzone'

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

import { globalMessenger } from 'helpers/globalMessenger'

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

const Settings = ({
    onHeightChanged,
    onWidthChanged,
    onConfigReady,
    defaultSize,
}: {
    onWidthChanged: (n: number) => void
    onHeightChanged: (n: number) => void
    onConfigReady: (config: VidConfig) => void
    defaultSize: Resolution
}) => {
    const [width, setWidth] = useInputState(defaultSize.width),
        [height, setHeight] = useInputState(defaultSize.height),
        [groupBy, setGroupBy] = useInputState(15),
        [matrixMode, setMatrixMode] = useState(false),
        [textMode, setTextMode] = useState(false),
        [speechMode, setSpeechMode] = useState(false),
        [isVisible, setVisible] = useState(true),
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
        [customChars, setCustomChars] = useState(globalMessenger.renderSettings.charsObj.text),
        [effect, setEffect] = useState<'letters' | 'tiles' | 'blurry'>('letters'),
        effectNames = useMemo(
            () =>
                Object.keys(globalMessenger.renderSettings.algorithms).map(
                    (key) => key[0].toUpperCase() + key.substring(1)
                ),
            []
        )

    useEffect(() => {
        if (!withCustomLuminance) globalMessenger.renderSettings.setCustomLuminance('default')

        setCustomLuminance({
            r: globalMessenger.renderSettings.luminanceWeights.r * 100,
            g: globalMessenger.renderSettings.luminanceWeights.g * 100,
            b: globalMessenger.renderSettings.luminanceWeights.b * 100,
        })
    }, [withCustomLuminance])

    useEffect(() => {
        if (withCustomLuminance)
            globalMessenger.renderSettings.setCustomLuminance({
                r: Number((customLuminance.r / 100).toPrecision(3)),
                g: Number((customLuminance.g / 100).toPrecision(3)),
                b: Number((customLuminance.b / 100).toPrecision(3)),
            })
    }, [customLuminance])

    useEffect(() => {
        globalMessenger.renderSettings.setActiveAlgorithm(effect)
    }, [effect])

    // update the chars used for encrypting - ReqAnimFrame will read the charsObj.text
    useEffect(() => {
        globalMessenger.renderSettings.charsObj.text = customChars
    }, [customChars])

    // when preview is updated the resolution will change, show the change in settings as well
    useEffect(() => {
        setWidth(defaultSize.width)
        setHeight(defaultSize.height)
    }, [defaultSize.width, defaultSize.height])

    useEffect(() => {
        onWidthChanged(width)
    }, [width])

    useEffect(() => {
        onHeightChanged(height)
    }, [height])

    useEffect(() => {
        globalMessenger.renderSettings.groupBy = groupBy
    }, [groupBy])

    useEffect(() => {
        globalMessenger.renderSettings.withJustGreen = matrixMode
    }, [matrixMode])

    useEffect(() => {
        globalMessenger.renderSettings.withTextInsteadOfChars = textMode
        if (textMode && speechMode) setSpeechMode(false)
    }, [textMode])

    useEffect(() => {
        globalMessenger.renderSettings.withSpeechUpdatedText = speechMode
    }, [speechMode])

    return (
        <div className={styles.settings} data-is-visible={isVisible}>
            <Button
                variant="subtle"
                color="dark"
                radius="xl"
                compact
                uppercase
                onClick={() => setVisible((p) => !p)}
            >
                {isVisible ? 'Hide' : 'Show Settings'}
            </Button>
            <div>
                <p>- Settings -</p>
                <div>
                    <InputWrapper label="Width">
                        <NumberInput
                            min={1}
                            type="number"
                            placeholder="Width"
                            value={width}
                            onChange={setWidth}
                        />
                    </InputWrapper>
                    <InputWrapper label="Height">
                        <NumberInput
                            min={1}
                            type="number"
                            placeholder="eight"
                            value={height}
                            onChange={setHeight}
                        />
                    </InputWrapper>
                    <InputWrapper label="Group By">
                        <NumberInput
                            min={1}
                            type="number"
                            placeholder="Group Pixels By"
                            value={groupBy}
                            onChange={setGroupBy}
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
                                label="custom static text/chars"
                                size="md"
                                checked={textMode}
                                onChange={({ currentTarget: { checked } }) => setTextMode(checked)}
                            />
                        )}
                        {textMode && effect === 'letters' && (
                            <Textarea
                                placeholder="Type what text to use instead of default encoding charset"
                                label="Static text/chars"
                                autosize
                                minRows={2}
                                value={customChars}
                                onChange={({ currentTarget: { value } }) =>
                                    setCustomChars(value.toUpperCase())
                                }
                            />
                        )}
                        {!textMode && effect === 'letters' && (
                            <Switch
                                label="voice updates text"
                                size="md"
                                checked={speechMode}
                                onChange={({ currentTarget: { checked } }) =>
                                    setSpeechMode(checked)
                                }
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
                            <InputWrapper label={`red: ${customLuminance.r}`}>
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
                            <InputWrapper label={`green: ${customLuminance.g}`}>
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
                            <InputWrapper label={`blue: ${customLuminance.b}`}>
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
                    <Button
                        variant="subtle"
                        color="dark"
                        radius="xl"
                        compact
                        uppercase
                        className={styles.submitBtn}
                        onClick={() => {
                            const config = {
                                files,
                                width,
                                height,
                                groupBy,
                                textMode,
                                speechMode,
                                greenMode: matrixMode,
                            }

                            onConfigReady(config)

                            setFiles([])
                        }}
                        disabled={!files.length}
                    >
                        Submit <FontAwesomeIcon icon={faPaperPlane} />
                    </Button>
                </div>
                <div />
            </div>
        </div>
    )
}

export default Settings
