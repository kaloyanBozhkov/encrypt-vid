import React from 'react'

import styles from './operationStatus.module.scss'

const OperationStatus = ({ label, step }: { label: string; step: number }) => {
    return (
        <div className={styles.operationStatus}>
            <p data-step={step}>{label}</p>
        </div>
    )
}

export default OperationStatus
