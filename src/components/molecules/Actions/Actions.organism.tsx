import React from 'react'

import { Button } from '@mantine/core'

import styles from './actions.module.scss'

const Actions = ({ onSave }: { onSave: () => void }) => {
    return (
        <div className={styles.actionsWrapper}>
            <Button variant="subtle" className={styles.button} onClick={onSave}>
                Save Frame
            </Button>
        </div>
    )
}

export default Actions
