import React, { SyntheticEvent, useState } from 'react'

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

const Dropzone = ({
    onDrop,
    onReject,
    onClear,
    files,
    ...props
}: Omit<DropzoneProps, 'children'> & { files: File[]; onClear: (fileName: string) => void }) => {
    const [status, setStatus] = useState<'rejected' | 'accepted' | 'pending'>('pending')

    let currentIcon = faFileUpload

    if (status === 'accepted') currentIcon = faFile

    if (status === 'rejected') currentIcon = faFileCircleXmark

    return (
        <DropzoneMantine
            className={styles.dropzone}
            data-active={!!files.length}
            {...props}
            onDrop={(newFiles) => {
                setStatus('accepted')
                onDrop(
                    newFiles.filter((newF) => !files.map(({ name }) => name).includes(newF.name))
                )
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
                            clearFile={onClear}
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
