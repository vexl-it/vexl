'use client'

import { KEYBOARD_SHORTCUTS } from '@/hooks/useKeyboardShortcuts'
import styles from './Footer.module.css'

export function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.content}>
        <div className={styles.branding}>
          <a
            href="https://vexl.it"
            target="_blank"
            rel="noopener noreferrer"
            className={styles.poweredBy}
          >
            Powered by <span className={styles.vexl}>Vexl</span>
          </a>
          <p className={styles.tagline}>
            Trade Bitcoin peer-to-peer, without KYC
          </p>
        </div>

        <div className={styles.shortcuts}>
          <span className={styles.shortcutsTitle}>Keyboard shortcuts</span>
          <div className={styles.shortcutList}>
            {KEYBOARD_SHORTCUTS.map((shortcut) => (
              <div key={shortcut.key} className={styles.shortcut}>
                <kbd className={styles.key}>{shortcut.key}</kbd>
                <span className={styles.shortcutDesc}>
                  {shortcut.description}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className={styles.links}>
          <a
            href="https://vexl.it"
            target="_blank"
            rel="noopener noreferrer"
            className={styles.link}
          >
            Website
          </a>
          <a
            href="https://vexl.it/privacy"
            target="_blank"
            rel="noopener noreferrer"
            className={styles.link}
          >
            Privacy
          </a>
          <a
            href="https://vexl.it/terms"
            target="_blank"
            rel="noopener noreferrer"
            className={styles.link}
          >
            Terms
          </a>
          <a
            href="https://github.com/vexl-it"
            target="_blank"
            rel="noopener noreferrer"
            className={styles.link}
          >
            GitHub
          </a>
        </div>

        <p className={styles.copyright}>
          © {new Date().getFullYear()} Vexl. All rights reserved.
        </p>
      </div>
    </footer>
  )
}
