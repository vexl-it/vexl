'use client'

import React, {useEffect, useState} from 'react'

const IPHONE_UA = /iPhone|iPod/i

/** The store badge in the mobile download button: Apple's on iPhone, hidden elsewhere. */
export function AppStoreIcon(): React.JSX.Element {
  const [isIPhone, setIsIPhone] = useState(false)

  useEffect(() => {
    setIsIPhone(IPHONE_UA.test(navigator.userAgent))
  }, [])

  return (
    <img
      loading="lazy"
      src={
        isIPhone
          ? '/wf/63184f24e40369f5ec7677dc_apple-btn.webp'
          : '/wf/63184f26a15eef438e151085_store-btn.webp'
      }
      alt=""
      className="app-store-icon"
      style={{display: isIPhone ? 'inline-block' : 'none'}}
    />
  )
}
