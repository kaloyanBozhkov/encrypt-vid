import { makeVar } from '@apollo/client'

// default styles
export const COLORS = {
    canvasBg: 'rgb(0, 0, 0)',
}

export const themeVar = makeVar<typeof COLORS>({
    ...COLORS,
})

export const setTheme = (newColors: Record<keyof typeof COLORS, string>) =>
    themeVar({
        ...COLORS,
        ...newColors,
    })
