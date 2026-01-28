'use client';

import { CenterPanel } from './center-panel';
import styles from './dashboard.module.css';
import { LeftPanel } from './left-panel';
import { TopBar } from './top-bar';

export function DashboardContainer() {
  return (
    <div className={styles.dashboardRoot}>
      <div className={styles.topBar}>
        <TopBar />
      </div>

      <div className={styles.contentWrapper}>
        <div className={styles.leftPanel}>
          <LeftPanel />
        </div>

        <div className={styles.centerPanel}>
          <CenterPanel />
        </div>
      </div>
    </div>
  );
}
