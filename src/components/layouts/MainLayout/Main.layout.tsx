import React, { ReactElement, ReactNode } from 'react'

import styles from './styles.module.scss'

const MainLayout = ({
    menu,
    children,
    actions,
}: {
    menu: ReactElement
    children: ReactNode
    actions: ReactElement
}) => (
    <div className={styles.mainLayout}>
        <nav>{menu}</nav>
        <section>{actions}</section>
        <main>{children}</main>
    </div>
)

export default MainLayout
