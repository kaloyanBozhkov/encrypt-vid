import React, { SyntheticEvent, useCallback, useState } from 'react'

import { IconProp } from '@fortawesome/fontawesome-svg-core'
import { faFile, faFileCircleXmark, faFileUpload } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { Button, Group, Text } from '@mantine/core'
import { Dropzone as DropzoneMantine, DropzoneProps } from '@mantine/dropzone'

import styles from './dropzone.module.scss'

const FileDropped = ({
    currentIcon,
    fileName,
    clearFile,
}: {
    currentIcon: IconProp
    fileName: string
    clearFile: (name: string) => void
}) => (
    <Group position="center" spacing="xl" className={styles.group}>
        <FontAwesomeIcon icon={currentIcon} />
        <Text className={styles.text} size="sm" color="dimmed" inline>
            {fileName}
        </Text>
        <Button
            variant="subtle"
            color="dark"
            radius="xl"
            compact
            uppercase
            onClick={(event: SyntheticEvent) => {
                clearFile(fileName)
                event.stopPropagation()
            }}
        >
            Clear
        </Button>
    </Group>
)

const Dropzone = ({ onDrop, onReject, ...props }: Omit<DropzoneProps, 'children'>) => {
    const [status, setStatus] = useState<'rejected' | 'accepted' | 'pending'>('pending'),
        [files, setFiles] = useState<File[]>([]),
        clearFile = useCallback((fileName) => {
            setFiles((prev) => prev.filter((currContent) => currContent.name !== fileName))
        }, [])

    let currentIcon = faFileUpload

    if (status === 'accepted') currentIcon = faFile

    if (status === 'rejected') currentIcon = faFileCircleXmark

    return (
        <DropzoneMantine
            className={styles.dropzone}
            data-active={!!files.length}
            {...props}
            onDrop={(files) => {
                setStatus('accepted')
                setFiles(files)
                onDrop(files)
            }}
            onReject={(files) => {
                setStatus('rejected')
                onReject?.(files)
            }}
        >
            {() =>
                files.length ? (
                    files.map(({ name }) => (
                        <FileDropped
                            key={name}
                            currentIcon={currentIcon}
                            fileName={name}
                            clearFile={clearFile}
                        />
                    ))
                ) : (
                    <Group position="center" spacing="xl" className={styles.group}>
                        <FontAwesomeIcon icon={currentIcon} />
                        <Text className={styles.text} size="sm" color="dimmed" inline>
                            Drag an image or video file here or click to select | .mp4 .jpg .png
                        </Text>
                    </Group>
                )
            }
        </DropzoneMantine>
    )
}

export default Dropzone
