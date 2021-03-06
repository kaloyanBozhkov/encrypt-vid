import React, { ReactElement, ReactNode } from 'react'

import styles from './styles.module.scss'

const MainLayout = ({
    menu,
    children,
    actions,
}: {
    menu: ReactElement
    children: ReactNode
    actions: ReactElement | false
}) => (
    <div className={styles.mainLayout}>
        <nav>{menu}</nav>
        {actions && <section>{actions}</section>}
        <main>{children}</main>
    </div>
)

export default MainLayout
