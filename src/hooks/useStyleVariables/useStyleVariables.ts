import { useEffect, useMemo } from 'react'

import { themeVar } from 'reactives/Styles.reactive'

import { useReactiveVar } from '@apollo/client'

const TAG_ID = 'globalStyles',
    head = document.querySelector('head')

// Gets the theme vars and appends them to the document head so all scss modules have access to the css vars
export const useGlobalStyles = () => {
    const theme = useReactiveVar(themeVar),
        rootVars = useMemo(
            () =>
                Object.keys(theme).reduce(
                    (acc, key) => `${acc}\n--${key}: ${theme[key as keyof typeof theme]};`,
                    ''
                ),
            [theme]
        )

    // create style tag and append with defaults
    useEffect(() => {
        if (!head || head.querySelector(`#${TAG_ID}`)) return

        const newStyleTag = document.createElement('style')
        newStyleTag.setAttribute('id', TAG_ID)

        newStyleTag.innerHTML = `:root {\n\n${rootVars}\n\n}`

        // place new
        head?.append(newStyleTag)

        // cleanup for strict mode
        return () => head && head.querySelectorAll(TAG_ID).forEach((el) => el.remove())
    }, [])

    useEffect(() => {
        if (!head) return

        // remove xisting, if any
        const existingStyleTag = head.querySelector(`#${TAG_ID}`)

        if (existingStyleTag) existingStyleTag.innerHTML = `:root {${rootVars}\n}`
    }, [rootVars])
}
