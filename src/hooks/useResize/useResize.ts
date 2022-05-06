import { useEffect } from 'react'

const useResize = ({
    fn,
    widthGate = 900,
    freqMsGate = 500,
}: {
    fn: (state: boolean) => void
    widthGate?: number
    freqMsGate?: number
}) => {
    useEffect(() => {
        let timeoutID: ReturnType<typeof setTimeout> | null = null

        const setter = () => {
            if (timeoutID) clearTimeout(timeoutID)
            timeoutID = setTimeout(() => fn(window.innerWidth > widthGate), freqMsGate)
        }

        window.addEventListener('resize', setter)

        return () => {
            if (timeoutID) clearTimeout(timeoutID)
            window.removeEventListener('resize', setter)
        }
    }, [])
}

export default useResize
