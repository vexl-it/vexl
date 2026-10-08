import {Array, pipe} from 'effect'
import type {ReactNode} from 'react'

export interface PhoneScreen<Key extends string> {
  readonly key: Key
  readonly open: number
  readonly close?: number
  readonly transition?: 'push' | 'sheet'
}

// Matches the longest exit animation in demo.css.
const exitMs = 450

/** When closed screens finish leaving and unmount; add these to the demo's times. */
export const screenTimes = (
  screens: ReadonlyArray<PhoneScreen<string>>
): number[] =>
  pipe(
    screens,
    Array.flatMap(({close}) => (close === undefined ? [] : [close + exitMs]))
  )

/** The app screens open at `playhead`, stacked bottom to top. */
export function PhoneScreens<Key extends string>({
  playhead,
  screens,
  render,
}: {
  playhead: number
  screens: ReadonlyArray<PhoneScreen<Key>>
  render: (key: Key) => ReactNode
}): React.JSX.Element {
  return (
    <>
      {pipe(
        screens,
        Array.filter(
          ({open, close}) =>
            playhead >= open &&
            (close === undefined || playhead < close + exitMs)
        ),
        Array.map(({key, close, transition}) => {
          const closing = close !== undefined && playhead >= close
          return (
            <div
              key={key}
              className={
                transition
                  ? `demo-layer demo-${transition}-${closing ? 'out' : 'in'}`
                  : 'demo-layer'
              }
            >
              {render(key)}
            </div>
          )
        })
      )}
    </>
  )
}
