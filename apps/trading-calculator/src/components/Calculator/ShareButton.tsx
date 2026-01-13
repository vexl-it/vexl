'use client'

import { useState, useCallback } from 'react'
import type { CurrencyCode, BtcOrSat, PriceMode } from '@/types'
import { generateShareUrl, copyToClipboard } from '@/lib/urlState'
import styles from './Calculator.module.css'

interface ShareButtonProps {
  btcAmount: string
  fiatAmount: string
  currency: CurrencyCode
  btcOrSat: BtcOrSat
  priceMode: PriceMode
  frozenPrice: number | null
  customPrice: string
  premium: number
}

export function ShareButton({
  btcAmount,
  fiatAmount,
  currency,
  btcOrSat,
  priceMode,
  frozenPrice,
  customPrice,
  premium,
}: ShareButtonProps) {
  const [copied, setCopied] = useState(false)

  const handleShare = useCallback(async () => {
    const url = generateShareUrl({
      btcAmount: btcAmount || undefined,
      fiatAmount: fiatAmount || undefined,
      currency,
      btcOrSat,
      priceMode,
      frozenPrice: frozenPrice ?? undefined,
      customPrice: customPrice || undefined,
      premium,
    })

    const success = await copyToClipboard(url)

    if (success) {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }, [
    btcAmount,
    fiatAmount,
    currency,
    btcOrSat,
    priceMode,
    frozenPrice,
    customPrice,
    premium,
  ])

  return (
    <button
      type="button"
      className={styles.shareButton}
      onClick={handleShare}
      title="Copy shareable link"
    >
      {copied ? (
        <>
          <CheckIcon /> Copied!
        </>
      ) : (
        <>
          <ShareIcon /> Share
        </>
      )}
    </button>
  )
}

interface CopyResultButtonProps {
  btcAmount: string
  fiatAmount: string
  currency: CurrencyCode
  btcOrSat: BtcOrSat
}

export function CopyResultButton({
  btcAmount,
  fiatAmount,
  currency,
  btcOrSat,
}: CopyResultButtonProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = useCallback(async () => {
    const text = `${btcAmount} ${btcOrSat} = ${fiatAmount} ${currency}`

    const success = await copyToClipboard(text)

    if (success) {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }, [btcAmount, fiatAmount, currency, btcOrSat])

  const isDisabled = !btcAmount || !fiatAmount

  return (
    <button
      type="button"
      className={styles.copyButton}
      onClick={handleCopy}
      disabled={isDisabled}
      title="Copy result to clipboard"
    >
      {copied ? (
        <>
          <CheckIcon /> Copied!
        </>
      ) : (
        <>
          <CopyIcon /> Copy
        </>
      )}
    </button>
  )
}

function ShareIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="18" cy="5" r="3" />
      <circle cx="6" cy="12" r="3" />
      <circle cx="18" cy="19" r="3" />
      <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
      <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
    </svg>
  )
}

function CopyIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  )
}
