import { useEffect, useState } from 'react'

const useFilesPaste = ({ mimeTypes }: { mimeTypes: string[] }) => {
    const [pastedFiles, setPastedFiles] = useState<File[]>([])

    useEffect(() => {
        const listener = ({ clipboardData }: ClipboardEvent) => {
            const files = clipboardData?.files

            if (files) {
                const t = []
                for (const file of files) {
                    if (mimeTypes.includes(file.type)) t.push(file)
                }

                setPastedFiles(t)
            }
        }

        document.addEventListener('paste', listener)

        return () => document.removeEventListener('paste', listener)
    }, [])

    return {
        pastedFiles,
        clearPastedFile: (fileName: string) =>
            setPastedFiles((prev) => prev.filter((file) => file.name !== fileName)),
        clearPastedFiles: () => setPastedFiles([]),
    }
}

export default useFilesPaste
