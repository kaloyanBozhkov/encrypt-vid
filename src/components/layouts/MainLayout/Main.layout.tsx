import React, { ReactElement, ReactNode } from 'react'

import styles from './styles.module.scss'

const MainLayout = ({ menu, children }: { menu: ReactElement; children: ReactNode }) => (
    <div className={styles.mainLayout}>
        <nav>{menu}</nav>
        <main>{children}</main>
    </div>
)

export default MainLayout
