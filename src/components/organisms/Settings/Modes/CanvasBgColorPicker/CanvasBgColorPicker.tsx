import React, { useContext, useEffect, useState } from 'react'

import { COLORS, setTheme } from 'reactives/Styles.reactive'

import { renderSettingsContext } from 'context/renderSettings/renderSettings.contex'

import { ColorPicker, InputWrapper, Switch } from '@mantine/core'

let timeoutId: ReturnType<typeof setTimeout> | undefined = undefined

const CanvasBGColorPicker = () => {
    const renderSettings = useContext(renderSettingsContext),
        [color, setColor] = useState(COLORS.canvasBg),
        [withCustomBg, setWithCustomBg] = useState(false)

    useEffect(() => {
        if (!withCustomBg) setTheme({ canvasBg: COLORS.canvasBg })
    }, [withCustomBg])

    useEffect(() => {
        // @TODO wait for mantine V5 major update for color fix (issue due to react v18 while library migrateion is done)
        if (!color) return
        if (timeoutId) clearTimeout(timeoutId)

        timeoutId = setTimeout(() => {
            setTheme({ canvasBg: color })
            renderSettings.canvasBgColor = color
        }, 50)

        return () => timeoutId && clearTimeout(timeoutId)
    }, [color])

    return (
        <>
            <Switch
                label="custom bg"
                size="md"
                checked={withCustomBg}
                onChange={({ currentTarget: { checked } }) => setWithCustomBg(checked)}
            />
            {withCustomBg && (
                <InputWrapper label="Custom Background">
                    <ColorPicker
                        fullWidth
                        format="rgb"
                        value={color}
                        defaultValue={COLORS.canvasBg}
                        onChange={setColor}
                    />
                </InputWrapper>
            )}
        </>
    )
}

export default CanvasBGColorPicker
