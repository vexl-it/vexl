import {Array} from 'effect'
import {type ReactNode} from 'react'
import {cx} from './cx'

export interface SegmentedOption<Value> {
  readonly value: Value
  readonly label: ReactNode
}

/** A small set of exclusive choices, such as a filter or a chart range. */
export function SegmentedControl<Value extends string | number>({
  value,
  onChange,
  options,
  label,
}: {
  readonly value: Value
  readonly onChange: (value: Value) => void
  readonly options: ReadonlyArray<SegmentedOption<Value>>
  readonly label: string
}) {
  return (
    <div
      role="group"
      aria-label={label}
      className="inline-flex rounded-control bg-canvas p-0.5 ring-1 ring-inset ring-line"
    >
      {Array.map(options, (option) => (
        <button
          key={option.value}
          type="button"
          aria-pressed={option.value === value}
          onClick={() => {
            onChange(option.value)
          }}
          className={cx(
            'h-7 cursor-pointer whitespace-nowrap rounded-lg px-2.5 text-xs font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-focus',
            option.value === value
              ? 'bg-accent-soft text-ink'
              : 'text-ink-muted hover:text-ink'
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}
