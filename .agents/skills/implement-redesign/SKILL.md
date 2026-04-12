---
name: implement-redesign
description: Redesign an existing screen to match a Figma design. Focuses on UX/UI changes with minimal state/logic modifications. Use when given a Figma URL to update visual implementation.
argument-hint: <figma-url> [— optional description]
disable-model-invocation: true
---

# Implement Redesign

## Input

A Figma URL pointing to the redesigned screen/component, plus optional context.

- `<Figma URL>` — e.g. `https://figma.com/design/P7IaNcwu4qoS9uTL7ECiWL/...?node-id=123-456`
- `<Figma URL> — <description>` — e.g. `https://... — FilterOffersScreen, keep all filter logic intact`

The `$ARGUMENTS` variable contains the full input.

**Default file key**: `P7IaNcwu4qoS9uTL7ECiWL` (Vexl redesign DEV)

## Core Principle

**This is a visual redesign, not a rewrite.** The goal is to update how a screen looks — not how it works. Preserve existing business logic, navigation, data fetching, and side effects. Only touch state management when the new design structurally requires it (e.g. a new toggle that didn't exist before).

## Workflow

### 1. Fetch Design Context

Call the Figma MCP `get_design_context` tool with the extracted file key and node ID. Also call `get_screenshot` if more visual clarity is needed.

Study the returned screenshot, code hints, and design tokens. Identify:

- Layout structure (stacking, alignment, spacing)
- Color usage (map to theme tokens from `packages/ui/src/config/themes.ts`)
- Typography (map to font tokens from `packages/ui/src/config/fonts.ts`)
- Which `@vexl-next/ui` components match design elements
- What is new visually vs. what already exists in the current implementation

### 2. Read Existing Code

Before making any changes, thoroughly read the current implementation:

- The target screen/component and all its direct children
- Atoms and state files used by the screen
- Any hooks or utilities specific to the screen

Map out what exists: which state drives which UI, what callbacks do, what the navigation flow is. This map is your "do not break" checklist.

### 3. Explore the Codebase for Patterns

Before implementing, search for how similar patterns are solved elsewhere in the repo:

- Look at other screens that have been recently redesigned for structural patterns
- Check how similar UI patterns (lists, filters, modals, forms) are composed
- Look at how atoms are structured and shared between components

Also use Context7 MCP tools (`resolve-library-id` then `query-docs`) to check library best practices for any library-specific patterns you encounter (jotai, tamagui, effect, react-native, etc.). If the library's recommended approach is better suited than the pattern currently in the code, prefer the library's approach — but only for new code you are writing, not for refactoring existing working code.

### 4. Implement the Redesign

#### Reuse before creating — check for existing implementations first

Before you write any component, helper, action atom, or utility that looks like "render a selectable club row", "toggle a value with a confirmation dialog", "deep equal two offer shapes", etc., **first search the codebase for something that already does it**. Concretely:

- **Components**: grep for a likely name in `apps/mobile/src/components/` and `packages/ui/src/components/` before defining a new styled primitive or sub-component (`ClubItem`, `OfferCard`, `FriendLevel`, etc.). The same row/cell/card is often already built in one of the step components or the UI package.
- **Action atoms / hooks**: grep the relevant molecule file (e.g. `offerFormStateAtoms.ts`) and nearby `atoms/` directories before adding a new `*ActionAtom`. A simple wrapper that calls a dialog then an existing atom probably already exists under a slightly different name.
- **Utilities**: check `apps/mobile/src/utils/` and package utilities (e.g. `fast-equals`, `effect/Array`) before inlining ad-hoc helpers like `JSON.stringify(a) !== JSON.stringify(b)` — the repo already uses `deepEqual` from `fast-equals`.

If you find a duplicate that was inlined in one place, **extract it to a shared module** and import from both sites instead of copy-pasting. Put shared step/row components next to the originals (e.g. alongside the existing `ClubsStep.tsx` in `CRUDOfferFlow/components/`) and export it for the new consumer.

**Caveat — don't over-abstract.** Only extract or reuse when the match is a natural fit. If bending an existing component to a new use case requires threading 3+ new props, branching on a mode flag, or leaking unrelated dependencies, it's cleaner to create a small new component and leave the original alone. The bar for extraction is "same shape, same responsibility" — not "vaguely similar".

#### UI Components — use `@vexl-next/ui` first

For every visual element, check whether `@vexl-next/ui` already exports a matching component. Read `packages/ui/src/components/index.ts` for the full list of higher-level components **and** `packages/ui/src/primitives/index.ts` for lower-level Tamagui primitives (`TextArea`, `Input`, `ScrollView`, `Image`, etc.). Always prefer UI package exports over:

- Custom styled components built inline
- Raw React Native primitives (`View`, `Text`, `TouchableOpacity`, `TextInput`)
- Third-party component libraries

For example, use `TextArea` from `@vexl-next/ui/src/primitives` (or `tamagui`) instead of `TextInput` from `react-native` for multiline text inputs. The Tamagui primitives accept style props with token support (`fontFamily="$body"`, `color="$foregroundPrimary"`, etc.) which keeps styling consistent with the design system.

If `@vexl-next/ui` has a component that is close but not exact, use it and adapt with props/variants. Only build custom styled primitives when no UI package component or primitive covers the need.

Use `Typography` for all text (not raw `SizableText` or `Text`). Use semantic variants from the Typography component.

Use theme tokens (`$foregroundPrimary`, `$backgroundSecondary`) over raw color tokens (`$black100`). Use spacing/sizing tokens (`$4`, `$5`) over hardcoded numbers. Use color tokens from `packages/ui/src/config/tokens.ts` via token aliases (`$4`, `$5`, etc.) the same way as spacing — never hardcode hex values. Check the `color` scale in the tokens config for available aliases.

#### Styling — use Tamagui primitives and props, not React Native APIs

- **Always use Tamagui primitives** (`ScrollView`, `Stack`, `XStack`, `YStack`, etc.) from `@vexl-next/ui/src/primitives` instead of their React Native counterparts (`View`, `ScrollView` from `react-native`).
- **Never use `StyleSheet.create`** — apply styles directly via Tamagui props on the component. Tamagui components accept style props like `padding`, `backgroundColor`, `gap` etc. as first-class props with token support.
- **Never use static numeric values** for Tamagui style props. Always use token aliases (`"$4"`, `"$5"`, `"$10"`) for spacing, sizing, border radius, etc. Check `packages/ui/src/config/tokens.ts` for the available scale. If a Figma value doesn't match a token exactly, use the nearest token.
- When a numeric value is unavoidable (e.g. `contentContainerStyle` on `ScrollView` which is a RN pass-through that does not resolve tokens), use `getTokens()` from `tamagui` to resolve the token to its numeric value instead of hardcoding a number. For example: `contentContainerStyle={{paddingBottom: getTokens().space.$4.val}}`.

#### State Management — minimal changes, prefer atoms

**Do not refactor working state management.** If the screen uses `useState`, leave it unless the redesign structurally requires a change (e.g. state now needs to be shared across new child components that didn't exist before).

When you DO need new state:

1. **Prefer jotai atoms** — especially when state is shared between components, derived from other atoms, or needs to be accessed outside the React tree. Use `useAtom` (get+set), `useAtomValue` (get only), or `useSetAtom` (set only) as appropriate.
2. **`useState` is acceptable** for truly local, ephemeral UI state that lives and dies with a single component (e.g. a tooltip visibility toggle, a text input's transient value before submission). If the state doesn't leave the component and has no derivatives, `useState` is fine.
3. **Never introduce `useReducer` or Context** for new state when atoms would work.

#### Types — reuse domain schemas, never redefine

Before defining any new type, interface, or variable type, search `packages/domain` and other shared packages for existing Schema definitions and branded types. The domain package (`@vexl-next/domain`) contains schemas for offers, contacts, currencies, locations, and other core entities. Use `Schema.Type` to extract TypeScript types from existing schemas rather than defining parallel types.

- Search `packages/domain/src/` for the entity you need (e.g. `OfferId`, `Currency`, `LocationData`)
- Check `packages/rest-api/src/` for request/response schemas
- If a type already exists as a `Schema.Class`, `Schema.Struct`, or branded type — import and use it directly
- Never create a local `type Foo = { ... }` or `interface Foo { ... }` that duplicates a domain schema

#### Typing — strict, no escape hatches

- **NEVER use `as SomeType`** type assertions. Use `Schema.decodeUnknown` from `effect/Schema` to validate external data. For internal data, structure the code so TypeScript can infer types naturally.
- **NEVER extract array values with `someArray[0] ?? ''`** or similar index access patterns. Use Effect `Array` helpers instead:
  - `Array.head(arr)` returns `Option<T>` — then use `Option.getOrElse`, `Option.map`, or `Option.match` to handle the empty case
  - `Array.match` for pattern matching on empty vs non-empty arrays
  - `pipe` with `Array.filter`, `Array.map`, `Array.findFirst` etc. for transformations
- Prefer Effect `Array` helpers with `pipe` over native array methods (`filter`, `map`, etc.)
- Use `ReadonlyArray` in type signatures when the array should not be mutated
- Define explicit interface/type for component props with `readonly` modifiers

#### Translations / Localization

When the redesign requires different text than existing translation keys, **always create new translation keys** rather than modifying existing ones. Existing keys may still be used by pre-redesign screens or other parts of the codebase. Add the new keys in `packages/localization/base.json` alongside the originals.

**Always `t(...)` with an inline string literal — never a variable holding a key.** A helper like `function getTitleKey(): 'a' | 'b' { ... }` followed by `t(titleKey)` is a trap: the return-type annotation is what declares the union, so a typo inside the function body (e.g. a returned `'editOffer.title.wantBttc'`) passes typecheck as long as the annotation matches the typo. The i18n types only verify keys at the `t('...')` call site with a string literal argument — not against union-typed variables.

If the key depends on runtime state (offer type, listing type, some flag), resolve to the translated **string** inside a derived jotai atom (or a small helper) that does the `t('...')` calls internally with literals:

```ts
// bad — returns a key union; typos in the body slip past typecheck
function getOfferTitleKey(...): 'editOffer.title.wantBtc' | ... {
  if (isOffering) return 'editOffer.title.offeringBitcoin'
  return 'editOffer.title.wantBtc' // typo here would compile fine
}
const title = t(getOfferTitleKey(...))

// good — t() is called with literals, each one typechecked
const offerTitleAtom = atom((get) => {
  const {t} = get(translationAtom)
  if (isOffering) return t('editOffer.title.offeringBitcoin')
  return t('editOffer.title.wantBtc')
})
const title = useAtomValue(offerTitleAtom)
```

This pattern has come up repeatedly. Return translated strings, not translation keys.

#### What NOT to change

- Business logic (validation, calculations, data transformations) — unless it's broken
- API calls and data fetching
- Navigation structure and route params
- Side effects (analytics, logging, error reporting)
- Test files — unless your UI changes break existing tests
- Atom definitions that drive business logic — only change atoms if the new design requires new UI state
- Existing translation keys — create new keys instead of overwriting

### 5. Verify

Run the standard AGENTS.md verification steps for affected workspaces:

1. `yarn turbo:typecheck` — fix all type errors
2. `yarn turbo:format` (if it fails, `yarn turbo:format:fix` first)
3. `yarn turbo:lint` — fix all lint errors

Do NOT consider work done until all three pass cleanly.

## Anti-Patterns to Avoid

- Refactoring state management "while you're in there" — don't
- Adding error handling or validation that wasn't there before — that's not a UI change
- Creating new utility files or hooks for one-off visual logic — inline it
- Wrapping theme values or `getTokens()` lookups in `useMemo` — they're already efficient
- Adding comments to code you didn't write
- Using `String()` or `Number()` constructors on values from font configs or `getTokens()`
- Adding media queries or `@tamagui/react-native-media-driver` — native only
- Using `as const satisfies` or other assertion patterns as workarounds for proper typing
- **Overusing `useCallback` and `useMemo`** — do not reflexively wrap every function in `useCallback` or every derived value in `useMemo`. Before adding either, ask: does this actually prevent a meaningful re-render or expensive recomputation? Specifically:
  - **Inline arrow functions** in `onPress`, `onTabPress`, etc. are fine when the handler is a simple one-liner (e.g. a navigation call or a state setter). Only use `useCallback` when the function is passed as a prop to a memoized child component that would re-render otherwise, or when it is a dependency of another hook.
  - **`useMemo`** is only warranted for genuinely expensive computations (iterating large arrays, complex object construction). Simple derivations like ternaries, string concatenation, or reading a theme value do not need memoization.
  - **Do not wrap atom setters in `useCallback`** just to pass them as props. If a jotai setter (from `useSetAtom` or `useAtom()[1]`) has the same signature as the callback prop, pass it directly — e.g. `onTabPress={updateLocationState}` instead of `onTabPress={useCallback((v) => updateLocationState(v), [updateLocationState])}`. The setter reference is already stable.
  - **Move derived write logic into action atoms** instead of defining `useCallback` handlers that call `set(atom, prev => ...)` inline in components. Define a write-only atom in the molecule (e.g. `const removeLocationActionAtom = atom(null, (get, set, placeId: string) => { set(locationAtom, prev => prev?.filter(...)) })`) and consume it in the component with `useSetAtom`. This keeps mutation logic colocated with state and out of the UI layer.
  - When in doubt, prefer the simpler version without memoization. Unnecessary `useCallback`/`useMemo` adds indirection and dependency arrays that can themselves become a source of bugs.
