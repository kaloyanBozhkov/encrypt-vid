import React from 'react'

import styles from './operationStatus.module.scss'

const OperationStatus = ({
    label,
    step,
    type = 'load',
    location = 'top-center',
}: {
    label: string
    step?: number
    type?: 'load' | 'message'
    location: 'top-center' | 'bottom-right'
}) => (
    <div className={styles.operationStatus} data-type={type} data-location={location}>
        <p {...(type === 'load' ? { 'data-step': step } : {})}>{label}</p>
    </div>
)

export default OperationStatus
