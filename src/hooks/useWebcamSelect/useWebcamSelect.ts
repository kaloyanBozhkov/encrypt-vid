import { useEffect, useState } from 'react'

const useWebcamSelect = () => {
    const [webcamDevices, setWebcamDevices] = useState<MediaDeviceInfo[]>([]),
        [activeWebcam, setActiveWebcam] = useState<MediaDeviceInfo | null>(null)

    useEffect(() => {
        navigator.mediaDevices.enumerateDevices().then((devices) => {
            const webcams = devices.filter(
                ({ kind, deviceId }) => kind === 'videoinput' && deviceId
            )
            setWebcamDevices(webcams)
            setActiveWebcam(webcams[0] || null)
        })
    }, [])

    return {
        activeWebcam,
        webcamDevices: webcamDevices.map(({ deviceId, label }, idx) => ({
            deviceId,
            label: label || `Webcam ${idx}`,
        })),
        setActiveWebcam: ({ label, deviceId }: { label?: string; deviceId?: string }) => {
            setActiveWebcam(
                webcamDevices.find((d) => d.label === label || d.deviceId === deviceId) || null
            )
        },
    }
}

export default useWebcamSelect
