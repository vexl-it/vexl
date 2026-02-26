---
name: implement-component
description: Implement a Tamagui component in @vexl-next/ui from a Figma design node and add a preview screen to the ui-book app. Use when given a component name and Figma URL or node ID to build a production-ready component with proper token usage, theme support, state management, exports, and an interactive demo screen.
---

# Implement Component

## Input

Component name, Figma node reference, and an optional behavior description. Accepts:

- `<Name> <Figma URL>` — e.g. `Button https://figma.com/design/P7IaNcwu4qoS9uTL7ECiWL/...?node-id=123-456`
- `<Name> <node-id>` — e.g. `Button 123:456` (uses default file key)
- `<Name> <Figma URL> — <description>` — e.g. `Switch https://... — native toggle, wraps RN Switch`

The description is optional free text after `—` (em dash) or `--`. Use it to specify:

- **Component category** (visual-only, native wrapper, stateful, composite — see below)
- **Behavioral notes** (e.g. "animates on toggle", "disabled state needed", "contains buttons inside")
- **Which RN component to wrap** for native wrappers (e.g. "wraps RN Switch", "wraps RN TextInput")

When no description is given, infer the category from the Figma design context (screenshot, structure, states).

## Component Categories

Before writing code, determine which category fits. This drives the implementation pattern.

### Visual-only — `styled()`

Use for components with no runtime logic: badges, dividers, cards, labels, layout containers.

```tsx
import {styled} from 'tamagui'
import {Stack, SizableText} from '../primitives'

export const Badge = styled(Stack, {
  name: 'Badge',
  backgroundColor: '$accentYellowPrimary',
  paddingHorizontal: '$3',
  paddingVertical: '$1',
  borderRadius: '$2.5',
  alignItems: 'center',
  justifyContent: 'center',

  variants: {
    variant: {
      primary: {backgroundColor: '$accentYellowPrimary'},
      secondary: {backgroundColor: '$backgroundSecondary'},
    },
  },

  defaultVariants: {
    variant: 'primary',
  },
})
```

### Native wrapper — wraps a React Native built-in

Use when the design maps to an existing RN component (Switch, TextInput, Slider, etc.). The native component provides platform-specific behavior, animations, and accessibility for free.

- Import the RN component and its props type.
- Create a props interface that **extends** the RN props, **omitting** any props the wrapper controls internally (value, colors, handlers that drive the atom).
- Add `valueAtom` for state binding.
- Use `useTheme()` from tamagui to resolve theme tokens to runtime color strings for the native component.
- Spread remaining RN props (`...rest`) so consumers can pass through native props like `disabled`, `testID`, etc.

```tsx
import type {SetStateAction, WritableAtom} from 'jotai'
import {useAtom} from 'jotai'
import React from 'react'
import type {SwitchProps as RNSwitchProps} from 'react-native'
import {Switch as RNSwitch} from 'react-native'
import {useTheme} from 'tamagui'

export interface SwitchProps
  extends Omit<
    RNSwitchProps,
    'value' | 'onValueChange' | 'trackColor' | 'thumbColor'
  > {
  readonly valueAtom: WritableAtom<boolean, [SetStateAction<boolean>], void>
}

export function Switch({valueAtom, ...rest}: SwitchProps): React.JSX.Element {
  const [isOn, setIsOn] = useAtom(valueAtom)
  const theme = useTheme()

  return (
    <RNSwitch
      value={isOn}
      onValueChange={(next) => {
        setIsOn(next)
      }}
      trackColor={{
        false: theme.backgroundTertiary.val,
        true: theme.accentHighlightSecondary.val,
      }}
      thumbColor={theme.white100.val}
      {...rest}
    />
  )
}
```

### Stateful — functional + jotai

Use when the component has runtime logic that doesn't map to a native RN component (custom toggles, expandable sections, selection groups, counters).

- Pass jotai atoms as props for state. Use `useAtom` (getter + setter), `useAtomValue` (getter only), or `useSetAtom` (setter only).
- Prefer Tamagui variants over runtime conditional styles where possible.
- Internal styled primitives stay private; only the functional wrapper is exported.

```tsx
import {useAtom} from 'jotai'
import type {SetStateAction, WritableAtom} from 'jotai'
import React from 'react'
import {styled} from 'tamagui'
import {Stack, SizableText} from '../primitives'

const AccordionFrame = styled(Stack, {
  name: 'AccordionFrame',
  backgroundColor: '$backgroundSecondary',
  borderRadius: '$4',
  padding: '$5',
  overflow: 'hidden',
})

interface AccordionProps {
  readonly expandedAtom: WritableAtom<boolean, [SetStateAction<boolean>], void>
  readonly title: string
  readonly children: React.ReactNode
}

export function Accordion({
  expandedAtom,
  title,
  children,
}: AccordionProps): React.JSX.Element {
  const [expanded, setExpanded] = useAtom(expandedAtom)

  return (
    <AccordionFrame>
      <Stack
        onPress={() => {
          setExpanded((prev) => !prev)
        }}
      >
        <SizableText fontFamily="$body" fontWeight="600">
          {title}
        </SizableText>
      </Stack>
      {expanded ? children : null}
    </AccordionFrame>
  )
}
```

### Composite — contains other interactive sub-components

Use for larger components that compose multiple interactive parts (e.g. a settings row with a label + switch, a card with action buttons).

- The composite component itself may or may not hold state.
- Import and use existing `@vexl-next/ui` components internally.
- Props should accept atoms or callbacks for each interactive sub-component.

```tsx
import type {SetStateAction, WritableAtom} from 'jotai'
import React from 'react'
import {styled} from 'tamagui'
import {SizableText, Stack, XStack} from '../primitives'
import {Switch} from './Switch'

const SettingsRowFrame = styled(XStack, {
  name: 'SettingsRow',
  alignItems: 'center',
  justifyContent: 'space-between',
  paddingVertical: '$4',
  paddingHorizontal: '$5',
  backgroundColor: '$backgroundSecondary',
  borderRadius: '$4',
})

interface SettingsRowProps {
  readonly label: string
  readonly valueAtom: WritableAtom<boolean, [SetStateAction<boolean>], void>
}

export function SettingsRow({
  label,
  valueAtom,
}: SettingsRowProps): React.JSX.Element {
  return (
    <SettingsRowFrame>
      <SizableText fontFamily="$body" fontWeight="600" color="$foregroundPrimary">
        {label}
      </SizableText>
      <Switch valueAtom={valueAtom} />
    </SettingsRowFrame>
  )
}
```

## Workflow

### 1. Fetch Design Context

Call the Figma MCP `get_design_context` tool with the extracted file key and node ID.

**Default file key**: `P7IaNcwu4qoS9uTL7ECiWL` (Vexl redesign DEV)

Study the returned screenshot, code hints, and design tokens. Identify:

- Visual structure (layout, nesting, spacing)
- Color usage (map to theme tokens)
- Typography (map to font tokens)
- States and variants (hover, pressed, disabled, sizes)
- Component category (visual-only, native wrapper, stateful, or composite)

Combine the Figma analysis with the optional description from the input to choose the right implementation pattern.

### 2. Create Component

Create file(s) in `packages/ui/src/components/`.

**File structure — let complexity decide:**

- Single export, no sub-parts → flat file: `Button.tsx`
- Multiple related exports (e.g. Card + CardHeader + CardBody) → folder: `Card/Card.tsx` + `Card/index.ts`

**Key rules:**

- `name` property in every `styled()` call, matching the export name.
- Theme tokens (`$foregroundPrimary`) over raw color tokens (`$black100`). Theme tokens adapt to light/dark.
- **NEVER use hardcoded numeric values for styling.** Always use token references (`$5`, `$10`, etc.) for spacing, sizing, radius, font sizes, and letter spacing. Read `packages/ui/src/config/tokens.ts` for the available scale steps and `packages/ui/src/config/fonts.ts` for font size/letterSpacing keys. If a Figma value doesn't match a token exactly, use the nearest token — do not fall back to a raw number.
- Prefer Tamagui variants over runtime conditional styles.
- For state: jotai atoms passed as props. Use `useAtom` when you need both getter and setter, `useAtomValue` when you need only the getter, `useSetAtom` when you need only the setter.
- When the design maps to an existing RN component (Switch, TextInput, Slider), **always wrap the native component** instead of building a custom one. This ensures platform-specific behavior and accessibility.
- For native wrappers, use `useTheme()` to resolve theme tokens to color strings. Extend the RN props type, omitting internally-managed props.

Read `packages/ui/src/config/themes.ts` for available theme token names.

### 3. Wire Exports

Add the component export to `packages/ui/src/components/index.ts`:

```ts
export {Button, ButtonText} from './Button'
```

The barrel in `src/index.ts` (`export * from './components'`) propagates it automatically.

### 4. Add Preview Screen

Add a demo screen to `apps/ui-book` for the new component.

**Create the screen file** at `apps/ui-book/screens/<ComponentName>Screen.tsx`:

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

**Register the screen** in `apps/ui-book/screens/index.ts`. Each entry maps a label to a screen component:

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

1. Create the screen file in `apps/ui-book/screens/`
2. Add an entry to the `screens` array in `apps/ui-book/screens/index.ts`

If the navigation infrastructure does not exist yet, create the `screens/` directory, the registry file, and update `App.tsx` to use the pattern above before adding the first screen.

### 5. Update AGENTS.md

After creating the component, update `packages/ui/AGENTS.md` to document the new component in the `src/components/` list. Add a one-line entry following the existing format: component name, brief description of its purpose, variants/states, and any notable implementation details (e.g. special patterns like `cloneElement`, `useTheme`, jotai atoms, animation approach).

### 6. Verify

Run the standard AGENTS.md verification steps (typecheck, format, lint) for both `@vexl-next/ui` and `@vexl-next/ui-book` workspaces. Fix all errors before considering the task complete.
