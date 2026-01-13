'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import styles from './Header.module.css'

const BANNER_DISMISSED_KEY = 'vexl-banner-dismissed'

export function Header() {
  const [isBannerDismissed, setIsBannerDismissed] = useState(true) // Start hidden to avoid flash

  useEffect(() => {
    // Check localStorage on mount
    const dismissed = localStorage.getItem(BANNER_DISMISSED_KEY)
    setIsBannerDismissed(dismissed === 'true')
  }, [])

  const handleDismiss = () => {
    setIsBannerDismissed(true)
    localStorage.setItem(BANNER_DISMISSED_KEY, 'true')
  }

  return (
    <header className={styles.header}>
      {!isBannerDismissed && (
        <div className={styles.banner}>
          <div className={styles.bannerContent}>
            <span className={styles.bannerText}>
              <span className={styles.bannerEmoji}>📱</span>
              Get the full Vexl experience - trade Bitcoin P2P without KYC
            </span>
            <div className={styles.bannerActions}>
              <a
                href="https://vexl.it/download"
                target="_blank"
                rel="noopener noreferrer"
                className={styles.downloadLink}
              >
                Download App
              </a>
              <button
                type="button"
                className={styles.dismissButton}
                onClick={handleDismiss}
                aria-label="Dismiss banner"
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 16 16"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M12 4L4 12M4 4L12 12"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

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
