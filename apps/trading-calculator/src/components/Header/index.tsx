'use client'

import Image from 'next/image'
import styles from './Header.module.css'

export function Header() {
  return (
    <header className={styles.header}>
      <div className={styles.banner}>
        <div className={styles.bannerContent}>
          <span className={styles.bannerText}>
            <span className={styles.bannerEmoji}>📱</span>
            Get the full Vexl experience - trade Bitcoin P2P without KYC
          </span>
          <a
            href="https://vexl.it/download"
            target="_blank"
            rel="noopener noreferrer"
            className={styles.downloadLink}
          >
            Download App
          </a>
        </div>
      </div>

      <div className={styles.nav}>
        <a
          href="https://vexl.it"
          target="_blank"
          rel="noopener noreferrer"
          className={styles.logo}
        >
          <Image
            src="/vexl-logo.png"
            alt="Vexl"
            width={40}
            height={40}
            className={styles.logoImage}
            priority
          />
          <span className={styles.logoText}>vexl</span>
        </a>

        <h1 className={styles.title}>Trading Calculator</h1>
      </div>
    </header>
  )
}
