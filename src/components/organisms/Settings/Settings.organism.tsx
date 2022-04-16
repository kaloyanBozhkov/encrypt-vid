import React, { useEffect, useState } from 'react'

import { VidConfig } from 'types/common'

import Dropzone from 'components/organisms/Dropzone/Dropzone'

import { faPaperPlane } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { Button, InputWrapper, NumberInput, Switch, Textarea } from '@mantine/core'
import { MIME_TYPES } from '@mantine/dropzone'
import { useInputState } from '@mantine/hooks'

import { GlobalMessenger } from 'helpers/helpers'

import styles from './settings.module.scss'

const Settings = ({
    onTextModeChanged,
    onSpeechModeChanged,
    onMatrixModeChanged,
    onGroupByChanged,
    onHeightChanged,
    onWidthChanged,
    onConfigReady,
    defaultSize,
}: {
    onWidthChanged: (n: number) => void
    onHeightChanged: (n: number) => void
    onGroupByChanged: (n: number) => void
    onMatrixModeChanged: (b: boolean) => void
    onTextModeChanged: (b: boolean) => void
    onSpeechModeChanged: (b: boolean) => void
    onConfigReady: (config: VidConfig) => void
    defaultSize: { width: number; height: number }
}) => {
    const [width, setWidth] = useInputState(defaultSize.width),
        [height, setHeight] = useInputState(defaultSize.height),
        [groupBy, setGroupBy] = useInputState(15),
        [matrixMode, setMatrixMode] = useState(false),
        [textMode, setTextMode] = useState(false),
        [speechMode, setSpeechMode] = useState(false),
        [isVisible, setVisible] = useState(true),
        [files, setFiles] = useState<File[]>([]),
        [customChars, setCustomChars] = useState(GlobalMessenger.charsObj.text)

    // update the chars used for encrypting - ReqAnimFrame will read the charsObj.text
    useEffect(() => {
        GlobalMessenger.charsObj.text = customChars
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
        onGroupByChanged(groupBy)
    }, [groupBy])

    useEffect(() => {
        onMatrixModeChanged(matrixMode)
    }, [matrixMode])

    useEffect(() => {
        onTextModeChanged(textMode)
    }, [textMode])

    useEffect(() => {
        onSpeechModeChanged(speechMode)
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
                    <InputWrapper label="Modes" className={styles.switches}>
                        <Switch
                            label="matrix"
                            size="md"
                            checked={matrixMode}
                            onChange={({ currentTarget: { checked } }) => setMatrixMode(checked)}
                        />
                        <Switch
                            label="custom static text/chars"
                            size="md"
                            checked={textMode}
                            onChange={({ currentTarget: { checked } }) => setTextMode(checked)}
                        />
                        {textMode && (
                            <Textarea
                                placeholder="Type what text to use instead of default encoding charset"
                                label="Static text/chars"
                                autosize
                                minRows={2}
                                value={customChars}
                                onChange={({ currentTarget: { value } }) => setCustomChars(value)}
                            />
                        )}
                        {textMode && (
                            <Switch
                                label="voice updates text"
                                size="md"
                                checked={speechMode}
                                onChange={({ currentTarget: { checked } }) =>
                                    setSpeechMode(checked)
                                }
                            />
                        )}
                    </InputWrapper>
                    <InputWrapper label="Files">
                        <Dropzone
                            onDrop={setFiles}
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
