import {Array} from 'effect'
import React from 'react'
import Svg, {Circle, Line} from 'react-native-svg'
import {getTokens, useTheme} from 'tamagui'

interface Dot {
  readonly x: number
  readonly y: number
  readonly radius: number
  readonly on: boolean
}
const center = {x: 38, y: 42}
const contacts: readonly Dot[] = [
  {x: 26, y: 29, radius: 4.4, on: true},
  {x: 55, y: 18, radius: 3.8, on: true},
  {x: 63, y: 48, radius: 4.2, on: false},
  {x: 41, y: 59, radius: 3.6, on: false},
  {x: 15, y: 55, radius: 4, on: true},
]
const friends: ReadonlyArray<{
  x: number
  y: number
  radius: number
  contacts: readonly number[]
}> = [
  {x: 8, y: 22, radius: 3.2, contacts: [0]},
  {x: 16, y: 8, radius: 2.4, contacts: [0]},
  {x: 35, y: 10, radius: 2.8, contacts: [0, 1]},
  {x: 68, y: 5, radius: 2.4, contacts: [1]},
  {x: 75, y: 22, radius: 3.2, contacts: [1]},
  {x: 61, y: 31, radius: 2.2, contacts: [1, 2]},
  {x: 76, y: 55, radius: 2.8, contacts: [2]},
  {x: 67, y: 71, radius: 2.4, contacts: [2, 3]},
  {x: 49, y: 76, radius: 3.2, contacts: [3]},
  {x: 28, y: 73, radius: 2.6, contacts: [3, 4]},
  {x: 5, y: 70, radius: 2.4, contacts: [4]},
  {x: 5, y: 42, radius: 3, contacts: [0, 4]},
]

export function ReachNetworkGraphic(): React.JSX.Element {
  const theme = useTheme()
  const size = getTokens().size.$12.val + getTokens().size.$3.val
  const drawDot = (dot: Dot, key: string): React.JSX.Element => (
    <Circle
      key={key}
      cx={dot.x}
      cy={dot.y}
      r={dot.on ? dot.radius : dot.radius - 0.75}
      fill={
        dot.on ? theme.foregroundPrimary.get() : theme.backgroundSecondary.get()
      }
      stroke={dot.on ? undefined : theme.foregroundTertiary.get()}
      strokeWidth={1.5}
    />
  )
  return (
    <Svg width={size} height={size} viewBox="0 0 80 80" accessible={false}>
      {Array.flatMap(friends, (friend, index) =>
        Array.map(friend.contacts, (contactIndex) => {
          const contact = contacts[contactIndex]
          if (contact === undefined) return null
          return (
            <Line
              key={`${index}-${contactIndex}`}
              x1={contact.x}
              y1={contact.y}
              x2={friend.x}
              y2={friend.y}
              stroke={
                contact.on
                  ? theme.foregroundPrimary.get()
                  : theme.foregroundTertiary.get()
              }
              opacity={contact.on ? 0.35 : 1}
              strokeDasharray={contact.on ? undefined : '2 2.5'}
            />
          )
        })
      )}
      {Array.map(contacts, (contact, index) => (
        <Line
          key={`center-${index}`}
          x1={center.x}
          y1={center.y}
          x2={contact.x}
          y2={contact.y}
          stroke={
            contact.on
              ? theme.foregroundPrimary.get()
              : theme.foregroundTertiary.get()
          }
          opacity={contact.on ? 0.35 : 1}
          strokeDasharray={contact.on ? undefined : '2 2.5'}
        />
      ))}
      {Array.map(friends, (friend, index) =>
        drawDot(
          {
            ...friend,
            on: Array.some(friend.contacts, (i) => contacts[i]?.on === true),
          },
          `friend-${index}`
        )
      )}
      {Array.map(contacts, (contact, index) =>
        drawDot(contact, `contact-${index}`)
      )}
      <Circle
        cx={center.x}
        cy={center.y}
        r={7}
        fill={theme.accentYellowPrimary.get()}
      />
    </Svg>
  )
}
