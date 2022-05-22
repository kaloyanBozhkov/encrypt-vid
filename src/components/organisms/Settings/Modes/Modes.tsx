import React, { useContext, useEffect, useMemo, useState } from 'react'

import { renderSettingsContext } from 'context/renderSettings/renderSettings.contex'
import type { RenderSettings } from 'context/renderSettings/renderSettings.contex'

import { InputWrapper, Slider, Switch, Textarea } from '@mantine/core'

import CanvasBGColorPicker from './CanvasBgColorPicker/CanvasBgColorPicker'
import styles from './modes.module.scss'

const defaultSliderProps = {
    marks: [
        { value: 0, label: '0' },
        { value: 50, label: '0.5' },
        { value: 100, label: '1' },
    ],
    step: 0.001,
    precision: 5,
}

const Modes = ({ effect }: { effect: keyof RenderSettings['algorithms'] }) => {
    const renderSettings = useContext(renderSettingsContext),
        [matrixMode, setMatrixMode] = useState(false),
        [customCharsMode, setCustomCharsMode] = useState(false),
        [staticTextMode, setStaticTextMode] = useState(false),
        [speechMode, setSpeechMode] = useState(false),
        [withCustomLuminance, settWithCustomLuminance] = useState(false),
        [customChars, setCustomChars] = useState(renderSettings.charsObj.customChars),
        [staticText, setStaticText] = useState(renderSettings.charsObj.staticText),
        [darkChars, setDarkChars] = useState(renderSettings.charsObj.darkChars),
        [customLuminance, setCustomLuminance] = useState({
            r: 0,
            g: 0,
            b: 0,
        }),
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

    return (
        <>
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
                    Object.prototype.hasOwnProperty.call(window, 'webkitSpeechRecognition') && (
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
                <CanvasBGColorPicker />
                <Switch
                    label="custom luminance"
                    size="md"
                    checked={withCustomLuminance}
                    onChange={({ currentTarget: { checked } }) => settWithCustomLuminance(checked)}
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
        </>
    )
}

export default Modes
