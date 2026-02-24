---
name: implement-component
description: Implement a Tamagui component in @vexl-next/ui from a Figma design node and add a preview screen to the ui-preview app. Use when given a component name and Figma URL or node ID to build a production-ready component with proper token usage, theme support, jotai state management, exports, and an interactive demo screen.
---

# Implement Component

## Input

Component name and Figma node reference. Accepts:

- `<Name> <Figma URL>` — e.g. `Button https://figma.com/design/P7IaNcwu4qoS9uTL7ECiWL/...?node-id=123-456`
- `<Name> <node-id>` — e.g. `Button 123:456` (uses default file key)

## Workflow

### 1. Fetch Design Context

Call the Figma MCP `get_design_context` tool with the extracted file key and node ID.

**Default file key**: `P7IaNcwu4qoS9uTL7ECiWL` (Vexl redesign DEV)

Study the returned screenshot, code hints, and design tokens. Identify:

- Visual structure (layout, nesting, spacing)
- Color usage (map to theme tokens)
- Typography (map to font tokens)
- States and variants (hover, pressed, disabled, sizes)
- Whether the component needs runtime logic or is purely visual

### 2. Create Component

Create file(s) in `packages/ui/src/components/`.

**File structure — let complexity decide:**

- Single export, no sub-parts → flat file: `Button.tsx`
- Multiple related exports (e.g. Card + CardHeader + CardBody) → folder: `Card/Card.tsx` + `Card/index.ts`

**Visual-only components — use styled():**

```tsx
import {styled} from 'tamagui'
import {Stack, SizableText} from '../primitives'

export const Button = styled(Stack, {
  name: 'Button',
  backgroundColor: '$accentYellowPrimary',
  paddingHorizontal: '$5',
  paddingVertical: '$3',
  borderRadius: '$4',
  alignItems: 'center',
  justifyContent: 'center',

  variants: {
    size: {
      small: {paddingHorizontal: '$3', paddingVertical: '$2'},
      medium: {paddingHorizontal: '$5', paddingVertical: '$3'},
      large: {paddingHorizontal: '$7', paddingVertical: '$5'},
    },
    variant: {
      primary: {backgroundColor: '$accentYellowPrimary'},
      secondary: {backgroundColor: '$backgroundSecondary'},
    },
  },

  defaultVariants: {
    size: 'medium',
    variant: 'primary',
  },
})

export const ButtonText = styled(SizableText, {
  name: 'ButtonText',
  color: '$foregroundPrimary',
  fontFamily: '$body',
  fontWeight: '600',
})
```

**Stateful/interactive components — functional + jotai:**

When the component needs runtime logic, pass jotai atoms as props.

```tsx
import {useAtom} from 'jotai'
import type {SetStateAction, WritableAtom} from 'jotai'
import {styled} from 'tamagui'
import {Stack, SizableText} from '../primitives'

const ToggleTrack = styled(Stack, {
  name: 'ToggleTrack',
  width: '$10',
  height: '$8',
  borderRadius: '$5',
  padding: '$1',
  justifyContent: 'center',
})

interface ToggleProps {
  readonly valueAtom: WritableAtom<boolean, [SetStateAction<boolean>], void>
}

export function Toggle({valueAtom}: ToggleProps): React.JSX.Element {
  const [isOn, setIsOn] = useAtom(valueAtom)

  return (
    <ToggleTrack
      backgroundColor={isOn ? '$accentYellowPrimary' : '$backgroundTertiary'}
      onPress={() => {
        setIsOn((prev) => !prev)
      }}
    >
      <SizableText>{isOn ? 'On' : 'Off'}</SizableText>
    </ToggleTrack>
  )
}
```

**Key rules:**

- `name` property in every `styled()` call, matching the export name.
- Theme tokens (`$foregroundPrimary`) over raw color tokens (`$black100`). Theme tokens adapt to light/dark.
- **NEVER use hardcoded numeric values for styling.** Always use token references (`$5`, `$10`, etc.) for spacing, sizing, radius, font sizes, and letter spacing. Read `packages/ui/src/config/tokens.ts` for the available scale steps and `packages/ui/src/config/fonts.ts` for font size/letterSpacing keys. If a Figma value doesn't match a token exactly, use the nearest token — do not fall back to a raw number.
- Prefer Tamagui variants over runtime conditional styles.
- For state: jotai atoms passed as props. Use `useAtom` when you need both getter and setter, `useAtomValue` when you need only the getter, `useSetAtom` when you need only the setter.

Read `packages/ui/src/config/themes.ts` for available theme token names.

### 3. Wire Exports

Add the component export to `packages/ui/src/components/index.ts`:

```ts
export {Button, ButtonText} from './Button'
```

The barrel in `src/index.ts` (`export * from './components'`) propagates it automatically.

### 4. Add Preview Screen

Add a demo screen to `apps/ui-preview` for the new component.

**Create the screen file** at `apps/ui-preview/screens/<ComponentName>Screen.tsx`:

```tsx
import {Button, ButtonText, YStack, SizableText} from '@vexl-next/ui'

export function ButtonScreen(): React.JSX.Element {
  return (
    <YStack flex={1} padding="$5" gap="$4" backgroundColor="$backgroundPrimary">
      <SizableText fontWeight="600" fontSize="$6">
        Button
      </SizableText>

      {/* Show all variants and sizes */}
      <Button>
        <ButtonText>Primary Medium</ButtonText>
      </Button>
      <Button variant="secondary" size="small">
        <ButtonText>Secondary Small</ButtonText>
      </Button>
    </YStack>
  )
}
```

**Register the screen** in `apps/ui-preview/screens/index.ts`. Each entry maps a label to a screen component:

```ts
import type React from 'react'
import {ButtonScreen} from './ButtonScreen'

export interface ScreenEntry {
  readonly label: string
  readonly component: () => React.JSX.Element
}

export const screens: readonly ScreenEntry[] = [
  {label: 'Button', component: ButtonScreen},
]
```

**Home screen** reads from the registry and renders a button per screen. When pressed, it sets the active screen. A back button returns to the list:

```tsx
import {useState} from 'react'
import {screens} from './screens'

export function App(): React.JSX.Element {
  const [activeScreen, setActiveScreen] = useState<number | null>(null)

  if (activeScreen !== null) {
    const Screen = screens[activeScreen].component
    return (
      <YStack flex={1}>
        <Button onPress={() => setActiveScreen(null)}>
          <ButtonText>Back</ButtonText>
        </Button>
        <Screen />
      </YStack>
    )
  }

  return (
    <ScrollView>
      <YStack padding="$5" gap="$3">
        {screens.map((entry, i) => (
          <Button key={entry.label} onPress={() => setActiveScreen(i)}>
            <ButtonText>{entry.label}</ButtonText>
          </Button>
        ))}
      </YStack>
    </ScrollView>
  )
}
```

When adding a new component, only two changes are needed:

1. Create the screen file in `apps/ui-preview/screens/`
2. Add an entry to the `screens` array in `apps/ui-preview/screens/index.ts`

If the navigation infrastructure does not exist yet, create the `screens/` directory, the registry file, and update `App.tsx` to use the pattern above before adding the first screen.

### 5. Verify

Run the standard AGENTS.md verification steps (typecheck, format, lint) for both `@vexl-next/ui` and `@vexl-next/ui-preview` workspaces. Fix all errors before considering the task complete.
