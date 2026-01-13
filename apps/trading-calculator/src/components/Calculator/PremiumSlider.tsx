'use client'

import { useCallback, useRef, useEffect, useState, useMemo } from 'react'
import { PREMIUM_PRESETS } from '@/types'
import { formatPercentage } from '@/lib/formatters'
import styles from './Calculator.module.css'

type TradeMode = 'buying' | 'selling'

interface PremiumSliderProps {
  value: number
  onChange: (value: number) => void
  disabled?: boolean
}

const SLIDER_THRESHOLD = 10 // threshold for message color changes

export function PremiumSlider({
  value,
  onChange,
  disabled = false,
}: PremiumSliderProps) {
  const sliderRef = useRef<HTMLDivElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [inputValue, setInputValue] = useState(value.toString())
  const [tradeMode, setTradeMode] = useState<TradeMode>('buying')

  // Sync input value with prop
  useEffect(() => {
    if (!isDragging) {
      setInputValue(value.toString())
    }
  }, [value, isDragging])

  // Get contextual message based on premium and trade mode
  const { message, messageColor } = useMemo(() => {
    const absFeeAmount = Math.abs(value)
    const halfThreshold = SLIDER_THRESHOLD / 2

    let color: 'white' | 'yellow' | 'red' = 'white'
    if (absFeeAmount > 0 && absFeeAmount <= halfThreshold) {
      color = 'yellow'
    } else if (absFeeAmount > halfThreshold) {
      color = 'red'
    }

    let msg = ''

    if (tradeMode === 'buying') {
      if (value === 0) {
        msg = 'You buy for the actual market price. Play with the slider to buy cheaply or faster.'
      } else if (value > 0) {
        if (value <= halfThreshold) {
          msg = 'The optimal position for most people. You buy slightly faster, but a bit overpriced.'
        } else {
          msg = 'You buy quickly, but so much above the market price.'
        }
      } else {
        if (absFeeAmount <= halfThreshold) {
          msg = 'You buy pretty cheap, but it can take slightly longer to find a seller.'
        } else {
          msg = 'You buy very cheaply, but it can take a while to find seller.'
        }
      }
    } else {
      // selling
      if (value === 0) {
        msg = 'You sell for the actual market price. Play with the slider to sell faster or earn more.'
      } else if (value > 0) {
        if (value <= halfThreshold) {
          msg = 'You earn a bit more, but it can take slightly longer.'
        } else {
          msg = 'You want to earn a fortune, but it can take years to find a buyer.'
        }
      } else {
        if (absFeeAmount <= halfThreshold) {
          msg = 'You sell slightly faster, but a bit below market price.'
        } else {
          msg = 'You sell much faster, but far below market price.'
        }
      }
    }

    return { message: msg, messageColor: color }
  }, [value, tradeMode])

  // Calculate slider position
  const getSliderPosition = useCallback((val: number): number => {
    // Map -20 to +30 range to 0-100%
    const min = -20
    const max = 30
    const clamped = Math.max(min, Math.min(max, val))
    return ((clamped - min) / (max - min)) * 100
  }, [])

  // Calculate value from position
  const getValueFromPosition = useCallback(
    (clientX: number): number => {
      if (!sliderRef.current) return 0

      const rect = sliderRef.current.getBoundingClientRect()
      const percentage = Math.max(
        0,
        Math.min(1, (clientX - rect.left) / rect.width)
      )

      const min = -20
      const max = 30
      const rawValue = min + percentage * (max - min)

      // Snap to nearest preset if close
      const snapThreshold = 2
      for (const preset of PREMIUM_PRESETS) {
        if (Math.abs(rawValue - preset) < snapThreshold) {
          return preset
        }
      }

      return Math.round(rawValue)
    },
    []
  )

  // Mouse/touch handlers
  const handleStart = useCallback(
    (clientX: number) => {
      if (disabled) return
      setIsDragging(true)
      onChange(getValueFromPosition(clientX))
    },
    [disabled, onChange, getValueFromPosition]
  )

  const handleMove = useCallback(
    (clientX: number) => {
      if (!isDragging || disabled) return
      onChange(getValueFromPosition(clientX))
    },
    [isDragging, disabled, onChange, getValueFromPosition]
  )

  const handleEnd = useCallback(() => {
    setIsDragging(false)
  }, [])

  // Event listeners
  useEffect(() => {
    if (!isDragging) return

    const handleMouseMove = (e: MouseEvent) => handleMove(e.clientX)
    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches[0]) handleMove(e.touches[0].clientX)
    }
    const handleUp = () => handleEnd()

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleUp)
    document.addEventListener('touchmove', handleTouchMove)
    document.addEventListener('touchend', handleUp)

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleUp)
      document.removeEventListener('touchmove', handleTouchMove)
      document.removeEventListener('touchend', handleUp)
    }
  }, [isDragging, handleMove, handleEnd])

  // Input change handler
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    setInputValue(newValue)

    const parsed = parseFloat(newValue)
    if (!isNaN(parsed)) {
      onChange(Math.max(-99, Math.min(1000, parsed)))
    }
  }

  const handleInputBlur = () => {
    const parsed = parseFloat(inputValue)
    if (isNaN(parsed)) {
      setInputValue(value.toString())
    } else {
      onChange(Math.max(-99, Math.min(1000, parsed)))
    }
  }

  const sliderPosition = getSliderPosition(value)

  return (
    <div className={styles.premiumContainer}>
      {/* Trade Mode Toggle */}
      <div className={styles.tradeModeToggle}>
        <button
          type="button"
          className={`${styles.tradeModeBtn} ${tradeMode === 'buying' ? styles.tradeModeActive : ''}`}
          onClick={() => setTradeMode('buying')}
          disabled={disabled}
        >
          I'm Buying
        </button>
        <button
          type="button"
          className={`${styles.tradeModeBtn} ${tradeMode === 'selling' ? styles.tradeModeActive : ''}`}
          onClick={() => setTradeMode('selling')}
          disabled={disabled}
        >
          I'm Selling
        </button>
      </div>

      {/* Contextual Message */}
      <div
        className={`${styles.premiumMessage} ${
          messageColor === 'yellow'
            ? styles.premiumMessageYellow
            : messageColor === 'red'
              ? styles.premiumMessageRed
              : ''
        }`}
      >
        {message}
      </div>

      <div className={styles.premiumHeader}>
        <div className={styles.premiumInputWrapper}>
          <input
            type="text"
            inputMode="decimal"
            className={styles.premiumInput}
            value={inputValue}
            onChange={handleInputChange}
            onBlur={handleInputBlur}
            disabled={disabled}
            aria-label="Premium percentage"
          />
          <span className={styles.premiumPercent}>%</span>
        </div>
      </div>

      <div
        ref={sliderRef}
        className={`${styles.slider} ${disabled ? styles.disabled : ''}`}
        onMouseDown={(e) => handleStart(e.clientX)}
        onTouchStart={(e) => {
          if (e.touches[0]) handleStart(e.touches[0].clientX)
        }}
        role="slider"
        aria-valuemin={-20}
        aria-valuemax={30}
        aria-valuenow={value}
        aria-label="Premium/discount slider"
        tabIndex={disabled ? -1 : 0}
      >
        <div className={styles.sliderTrack}>
          <div
            className={styles.sliderFill}
            style={{
              left: value >= 0 ? '40%' : `${sliderPosition}%`,
              width:
                value >= 0
                  ? `${sliderPosition - 40}%`
                  : `${40 - sliderPosition}%`,
            }}
          />
        </div>

        <div
          className={`${styles.sliderThumb} ${isDragging ? styles.active : ''}`}
          style={{ left: `${sliderPosition}%` }}
        >
          <span className={styles.sliderValue}>{formatPercentage(value)}</span>
        </div>

        {/* Preset markers */}
        <div className={styles.sliderMarkers}>
          {PREMIUM_PRESETS.map((preset) => (
            <button
              key={preset}
              type="button"
              className={`${styles.sliderMarker} ${value === preset ? styles.active : ''}`}
              style={{ left: `${getSliderPosition(preset)}%` }}
              onClick={(e) => {
                e.stopPropagation()
                onChange(preset)
              }}
              tabIndex={-1}
              aria-label={`Set to ${formatPercentage(preset)}`}
            />
          ))}
        </div>
      </div>

      {/* Slider Labels */}
      <div className={styles.sliderLabels}>
        <span className={styles.sliderLabelLeft}>
          {tradeMode === 'buying' ? 'Buy cheaply' : 'Sell faster'}
        </span>
        <span className={styles.sliderLabelRight}>
          {tradeMode === 'buying' ? 'Buy quickly' : 'Earn more'}
        </span>
      </div>

      {/* Preset buttons for mobile */}
      <div className={styles.presetButtons}>
        {PREMIUM_PRESETS.map((preset) => (
          <button
            key={preset}
            type="button"
            className={`${styles.presetButton} ${value === preset ? styles.active : ''}`}
            onClick={() => onChange(preset)}
            disabled={disabled}
          >
            {formatPercentage(preset, true)}
          </button>
        ))}
      </div>
    </div>
  )
}
