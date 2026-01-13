'use client'

import styles from './Calculator.module.css'

interface ToggleProps {
  checked: boolean
  onChange: (checked: boolean) => void
  disabled?: boolean
  label?: string
  'aria-label'?: string
}

export function Toggle({
  checked,
  onChange,
  disabled = false,
  label,
  'aria-label': ariaLabel,
}: ToggleProps) {
  return (
    <label className={styles.toggleWrapper}>
      {label && <span className={styles.toggleLabel}>{label}</span>}
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={ariaLabel || label}
        className={`${styles.toggle} ${checked ? styles.toggleChecked : ''} ${disabled ? styles.toggleDisabled : ''}`}
        onClick={() => !disabled && onChange(!checked)}
        disabled={disabled}
      >
        <span className={styles.toggleThumb} />
      </button>
    </label>
  )
}
