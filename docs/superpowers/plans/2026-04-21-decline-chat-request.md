# Decline Chat Request Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a dedicated decline-reason screen for incoming chat requests so `Decline` no longer submits immediately, while `Skip` declines with `''` and `Send` declines with the entered reason.

**Architecture:** Keep decline business logic inside the existing chat molecule. `AcceptDeclineButtons` becomes a navigation trigger for the decline path, and a new root-stack screen rebuilds the chat scope from `otherSideKey` and `inboxKey`, renders the new UI with shared primitives, then calls `approveChatRequestActionAtom` before popping back to `ChatDetail`.

**Tech Stack:** React Native, React Navigation native stack, Jotai, Bunshi scope provider, Effect, `@vexl-next/ui`, Jest source tests, Yarn workspace tooling

---

## File Structure

- Modify: `apps/mobile/src/navigationTypes.ts`
  - Add the `DeclineChatRequest` root-stack route with the same chat key params as `ChatDetail`.
- Modify: `apps/mobile/src/components/RootNavigation/index.tsx`
  - Register the new screen in the logged-in root stack.
- Modify: `apps/mobile/src/components/ChatDetailScreen/components/AcceptDeclineButtons.tsx`
  - Keep accept behavior unchanged, replace direct decline with navigation to the new screen.
- Modify: `apps/mobile/src/components/ChatDetailScreen/components/RequestScreenComponents.test.ts`
  - Lock in the new navigation-based decline behavior and route registration.
- Create: `apps/mobile/src/components/DeclineChatRequestScreen/index.tsx`
  - Implement the new reason-entry screen with shared UI primitives and the existing chat molecule action.
- Create: `apps/mobile/src/components/DeclineChatRequestScreen/index.test.ts`
  - Add a focused source test for screen composition and submit behavior.
- Modify: `packages/localization/base.json`
  - Add the new label copy for the rejection-reason field.

### Task 1: Route Typing And Decline Navigation

**Files:**
- Modify: `apps/mobile/src/navigationTypes.ts`
- Modify: `apps/mobile/src/components/RootNavigation/index.tsx`
- Modify: `apps/mobile/src/components/ChatDetailScreen/components/AcceptDeclineButtons.tsx`
- Modify: `apps/mobile/src/components/ChatDetailScreen/components/RequestScreenComponents.test.ts`
- Test: `apps/mobile/src/components/ChatDetailScreen/components/RequestScreenComponents.test.ts`

- [ ] **Step 1: Write the failing source test for the new route and button behavior**

```ts
const rootNavigationSource = readComponentSource('../../RootNavigation/index.tsx')
const navigationTypesSource = readComponentSource('../../../navigationTypes.ts')

test('navigates to the decline screen instead of declining immediately', () => {
  expect(navigationTypesSource).toContain('DeclineChatRequest:')
  expect(rootNavigationSource).toContain('name="DeclineChatRequest"')
  expect(acceptDeclineButtonsSource).toMatch(/useNavigation<RootStackScreenProps<'ChatDetail'>\['navigation'\]>\(\)/)
  expect(acceptDeclineButtonsSource).toMatch(/navigation\.navigate\('DeclineChatRequest', \{/)
  expect(acceptDeclineButtonsSource).not.toMatch(
    /approveChat\(\{approve: false, message: ''\}\)/
  )
  expect(acceptDeclineButtonsSource).toMatch(
    /approveChat\(\{approve: true, message: 'TODO'\}\)/
  )
})
```

- [ ] **Step 2: Run the focused test to verify it fails**

Run:

```bash
yarn workspace @vexl-next/mobile-app jest src/components/ChatDetailScreen/components/RequestScreenComponents.test.ts --runInBand
```

Expected: `FAIL` because the route and navigation call do not exist yet.

- [ ] **Step 3: Implement the route, registration, and navigation-only decline button**

```ts
// apps/mobile/src/navigationTypes.ts
DeclineChatRequest: {
  otherSideKey: PublicKeyPemBase64
  inboxKey: PublicKeyPemBase64
}

// apps/mobile/src/components/RootNavigation/index.tsx
import DeclineChatRequestScreen from '../DeclineChatRequestScreen'

<Stack.Screen
  name="DeclineChatRequest"
  component={DeclineChatRequestScreen}
/>

// apps/mobile/src/components/ChatDetailScreen/components/AcceptDeclineButtons.tsx
const navigation =
  useNavigation<RootStackScreenProps<'ChatDetail'>['navigation']>()
const {approveChatRequestActionAtom, chatAtom} = useMolecule(chatMolecule)
const chat = useAtomValue(chatAtom)

<Button
  onPress={() => {
    navigation.navigate('DeclineChatRequest', {
      otherSideKey: chat.otherSide.publicKey,
      inboxKey: chat.inbox.privateKey.publicKeyPemBase64,
    })
  }}
  flex={1}
  variant="secondary"
>
  {t('common.decline')}
</Button>
```

- [ ] **Step 4: Re-run the focused test to verify it passes**

Run:

```bash
yarn workspace @vexl-next/mobile-app jest src/components/ChatDetailScreen/components/RequestScreenComponents.test.ts --runInBand
```

Expected: `PASS` with the new route and navigation assertions green.

- [ ] **Step 5: Commit the navigation slice**

```bash
git add apps/mobile/src/navigationTypes.ts \
  apps/mobile/src/components/RootNavigation/index.tsx \
  apps/mobile/src/components/ChatDetailScreen/components/AcceptDeclineButtons.tsx \
  apps/mobile/src/components/ChatDetailScreen/components/RequestScreenComponents.test.ts
git commit --no-gpg-sign -m "Wire decline requests to reason screen"
```

### Task 2: Decline Reason Screen And Localization

**Files:**
- Create: `apps/mobile/src/components/DeclineChatRequestScreen/index.tsx`
- Create: `apps/mobile/src/components/DeclineChatRequestScreen/index.test.ts`
- Modify: `packages/localization/base.json`
- Test: `apps/mobile/src/components/DeclineChatRequestScreen/index.test.ts`

- [ ] **Step 1: Write the failing source test for the new screen**

```ts
import {readFileSync} from 'node:fs'
import path from 'node:path'

const componentSource = readFileSync(path.join(__dirname, 'index.tsx'), 'utf8')

describe('DeclineChatRequestScreen source', () => {
  test('uses shared UI primitives and OfferAuthorBanner for the decline flow', () => {
    expect(componentSource).toMatch(
      /import\s*\{[^}]*Button[^}]*ChevronLeft[^}]*KeyboardAvoidingView[^}]*NavigationBar[^}]*Screen[^}]*TextArea[^}]*Typography[^}]*YStack[^}]*\}\s*from '@vexl-next\/ui'/
    )
    expect(componentSource).toContain("import OfferAuthorBanner from '../OfferAuthorBanner'")
    expect(componentSource).toContain('ScopeProvider')
    expect(componentSource).toContain('ChatScope')
    expect(componentSource).toContain('focusChatWithMessagesByKeysAtom')
    expect(componentSource).toMatch(/style=\"back\"/)
    expect(componentSource).toMatch(/t\('common.sendAMessage'\)/)
    expect(componentSource).toMatch(/t\('messages.stateYourReasonForRejection'\)/)
  })

  test('submits empty and non-empty decline reasons with the expected button states', () => {
    expect(componentSource).toMatch(/approveChat\(\{approve: false, message: ''\}\)/)
    expect(componentSource).toMatch(/approveChat\(\{approve: false, message: textRef\.current\}\)/)
    expect(componentSource).toMatch(/disabled=\{!hasText \|\| isSubmitting\}/)
    expect(componentSource).toMatch(/navigation\.goBack\(\)/)
  })
})
```

- [ ] **Step 2: Run the focused test to verify it fails**

Run:

```bash
yarn workspace @vexl-next/mobile-app jest src/components/DeclineChatRequestScreen/index.test.ts --runInBand
```

Expected: `FAIL` because the screen file and localization key do not exist yet.

- [ ] **Step 3: Implement the new screen with chat scope, footer actions, and one new localization key**

```tsx
// apps/mobile/src/components/DeclineChatRequestScreen/index.tsx
type Props = RootStackScreenProps<'DeclineChatRequest'>

function DeclineChatRequestContent({
  chatExists,
}: {
  readonly chatExists: boolean
}): React.ReactElement {
  const navigation = useNavigation<Props['navigation']>()
  const safeGoBack = useSafeGoBack()
  const {t} = useTranslation()
  const {offerForChatAtom, approveChatRequestActionAtom} = useMolecule(chatMolecule)
  const offer = useAtomValue(offerForChatAtom)
  const approveChat = useSetAtom(approveChatRequestActionAtom)
  const textRef = useRef('')
  const [hasText, setHasText] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const submitDecline = useCallback(
    (message: string) => {
      if (isSubmitting) return

      setIsSubmitting(true)

      void Effect.runPromise(
        approveChat({approve: false, message}).pipe(
          Effect.tap((success) =>
            Effect.sync(() => {
              setIsSubmitting(false)
              if (success) navigation.goBack()
            })
          ),
          Effect.catchAll(() =>
            Effect.sync(() => {
              setIsSubmitting(false)
            })
          )
        )
      )
    },
    [approveChat, isSubmitting, navigation]
  )

  return (
    <KeyboardAvoidingView>
      <Screen
        navigationBar={
          <NavigationBar
            style="back"
            title={t('common.sendAMessage')}
            leftAction={{icon: ChevronLeft, onPress: safeGoBack}}
            rightActions={[]}
          />
        }
        footer={
          <YStack gap="$4">
            <Button
              variant="secondary"
              onPress={() => submitDecline('')}
              disabled={isSubmitting}
            >
              {t('common.skip')}
            </Button>
            <Button
              variant={hasText && !isSubmitting ? 'primary' : 'disabled'}
              disabled={!hasText || isSubmitting}
              onPress={() => submitDecline(textRef.current)}
            >
              {t('common.send')}
            </Button>
          </YStack>
        }
      >
        {!chatExists || !offer ? (
          <Typography variant="titlesSmall" color="$foregroundPrimary">
            {t('common.chatNotFoundError')}
          </Typography>
        ) : (
          <YStack gap="$5">
            <OfferAuthorBanner offer={offer} />
            <YStack gap="$2">
              <Typography variant="descriptionBold" color="$foregroundPrimary">
                {t('messages.stateYourReasonForRejection')}
              </Typography>
              <TextArea
                defaultValue=""
                onChangeText={(value) => {
                  textRef.current = value
                  setHasText(value.trim().length > 0)
                }}
              />
            </YStack>
          </YStack>
        )}
      </Screen>
    </KeyboardAvoidingView>
  )
}

export default function DeclineChatRequestScreen({
  route: {
    params: {otherSideKey, inboxKey},
  },
}: Props): React.ReactElement {
  const {nonNullChatWithMessagesAtom, chatExistsAtom} = useMemo(() => {
    const chatWithMessagesAtom = focusChatWithMessagesByKeysAtom({
      otherSideKey,
      inboxKey,
    })

    return {
      nonNullChatWithMessagesAtom: valueOrDefaultAtom({
        nullableAtom: chatWithMessagesAtom,
        dummyValue: dummyChatWithMessages,
      }),
      chatExistsAtom: hasNonNullableValueAtom(chatWithMessagesAtom),
    }
  }, [inboxKey, otherSideKey])

  const chatExists = useAtomValue(chatExistsAtom)

  return (
    <ScopeProvider scope={ChatScope} value={nonNullChatWithMessagesAtom}>
      <DeclineChatRequestContent chatExists={chatExists} />
    </ScopeProvider>
  )
}

```

```ts
// packages/localization/base.json
"messages.stateYourReasonForRejection": "State your reason for rejection",
```

- [ ] **Step 4: Re-run the focused test to verify it passes**

Run:

```bash
yarn workspace @vexl-next/mobile-app jest src/components/DeclineChatRequestScreen/index.test.ts --runInBand
```

Expected: `PASS` with the screen composition and submit semantics covered.

- [ ] **Step 5: Commit the new screen**

```bash
git add apps/mobile/src/components/DeclineChatRequestScreen/index.tsx \
  apps/mobile/src/components/DeclineChatRequestScreen/index.test.ts \
  packages/localization/base.json
git commit --no-gpg-sign -m "Add decline reason screen for chat requests"
```

### Task 3: Workspace Validation And Final Cleanup

**Files:**
- Verify only:
  - `apps/mobile/src/navigationTypes.ts`
  - `apps/mobile/src/components/RootNavigation/index.tsx`
  - `apps/mobile/src/components/ChatDetailScreen/components/AcceptDeclineButtons.tsx`
  - `apps/mobile/src/components/ChatDetailScreen/components/RequestScreenComponents.test.ts`
  - `apps/mobile/src/components/DeclineChatRequestScreen/index.tsx`
  - `apps/mobile/src/components/DeclineChatRequestScreen/index.test.ts`
  - `packages/localization/base.json`

- [ ] **Step 1: Re-run the focused Jest tests together**

Run:

```bash
yarn workspace @vexl-next/mobile-app jest \
  src/components/ChatDetailScreen/components/RequestScreenComponents.test.ts \
  src/components/DeclineChatRequestScreen/index.test.ts \
  --runInBand
```

Expected: `PASS` for both source-test files.

- [ ] **Step 2: Run the affected workspace typecheck**

Run:

```bash
yarn workspace @vexl-next/mobile-app typecheck
```

Expected: `tsc --noemit` exits `0`.

- [ ] **Step 3: Run repository formatting checks and fix if needed**

Run:

```bash
yarn turbo:format
```

If it fails, run:

```bash
yarn turbo:format:fix
yarn turbo:format
```

Expected: formatting check exits `0`.

- [ ] **Step 4: Run repository lint**

Run:

```bash
yarn turbo:lint
```

Expected: lint exits `0`.

- [ ] **Step 5: Inspect the final diff before handoff**

Run:

```bash
git diff -- apps/mobile/src/navigationTypes.ts \
  apps/mobile/src/components/RootNavigation/index.tsx \
  apps/mobile/src/components/ChatDetailScreen/components/AcceptDeclineButtons.tsx \
  apps/mobile/src/components/ChatDetailScreen/components/RequestScreenComponents.test.ts \
  apps/mobile/src/components/DeclineChatRequestScreen/index.tsx \
  apps/mobile/src/components/DeclineChatRequestScreen/index.test.ts \
  packages/localization/base.json
```

Expected: the diff contains only the new decline-route wiring, the new screen, the source tests, and the single base localization key.
