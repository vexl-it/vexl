# Decline Chat Request Reason Screen Design

## Summary

Replace the current immediate decline behavior in chat request approval with a dedicated reason-entry screen. Tapping `Decline` from the chat request footer will navigate to a new root stack screen where the user can optionally enter a rejection reason before submitting. `Skip` declines with an empty string. `Send` declines with the entered reason and is enabled only when the trimmed text is non-empty.

## Goals

- Match the requested UX shown in the provided mockup.
- Preserve the current accept flow.
- Keep decline behavior explicit and reversible until the user submits from the new screen.
- Reuse existing shared UI building blocks instead of introducing screen-specific primitives.

## Non-Goals

- Changing the underlying approval API shape.
- Changing how the declined state renders back in `ChatDetail`.
- Refactoring unrelated chat request UI.

## User Flow

1. The user opens `ChatDetail` for an incoming chat request.
2. The user taps `Decline`.
3. The app navigates to a new `DeclineChatRequest` screen.
4. The screen shows:
   - `NavigationBar` with `style="back"`, title `Send message`, and a left `ChevronLeft` action.
   - `OfferAuthorBanner` for the current chat offer.
   - A labeled rejection reason text area.
   - Footer buttons `Skip` and `Send`.
5. If the user taps the back chevron, the app returns to `ChatDetail` without declining.
6. If the user taps `Skip`, the app declines immediately with `message: ''`.
7. If the user enters non-whitespace text, `Send` becomes enabled and declines with that exact text.
8. After a successful decline from either action, the app pops back to `ChatDetail`, which shows the existing declined state.

## Navigation Design

### New Route

Add a new root stack route:

- Route name: `DeclineChatRequest`
- Params:
  - `otherSideKey`
  - `inboxKey`

These match the identifiers already used by `ChatDetail` so the new screen can resolve the same chat-scoped data.

### Registration

Register the new route in the root native stack as a normal card screen, not a modal. This keeps the transition and back behavior consistent with the approved design and existing `SendMessage` flow.

## Screen Composition

### Data Ownership

The new screen should recreate the same chat scope pattern used by `ChatDetailScreen`:

- Resolve the chat atom from `otherSideKey` and `inboxKey`.
- Provide the chat scope locally for the screen.
- Read the current offer from `offerForChatAtom`.
- Read the decline action from `approveChatRequestActionAtom`.

This keeps business logic in the existing chat molecule rather than duplicating decline behavior in the screen.

### UI Structure

Build the screen using existing shared primitives and patterns:

- `KeyboardAvoidingView`
- `Screen`
- `NavigationBar`
- `OfferAuthorBanner`
- `Typography`
- `TextArea`
- `Button`

The layout should closely follow `SendMessageScreen` for spacing and keyboard behavior, while using the new decline-specific footer actions.

### Button Behavior

- `Skip`
  - Always enabled.
  - Calls the decline action with `approve: false` and `message: ''`.
- `Send`
  - Disabled while the trimmed text is empty.
  - Calls the decline action with `approve: false` and the entered text once enabled.
- `Accept`
  - Remains unchanged on the original `AcceptDeclineButtons` component.

## Error Handling

If the new screen cannot resolve the chat or offer, it should render a minimal fallback state with:

- a back action
- a simple message explaining the content is unavailable

It must not attempt to decline without valid chat context.

## Testing Scope

Add or extend source-level tests to cover:

- the new decline screen using shared UI components (`NavigationBar`, `OfferAuthorBanner`, `TextArea`, shared buttons)
- `AcceptDeclineButtons` navigating on decline instead of immediately running the decline effect
- the accept action remaining intact

The goal is to lock in the new composition and prevent regression back to the old immediate-decline behavior.

## Risks And Constraints

- The worktree already contains unrelated chat UI changes, so implementation must avoid reverting or depending on unrelated in-progress edits.
- The new screen should reuse current decline action semantics and pass `''` for an empty reason, because `undefined` or `null` is not acceptable for this flow.
- TypeScript in this repository must avoid `as`, so route params and screen props should be typed directly through existing navigation types.

## Implementation Notes

- Prefer colocating the new screen under `apps/mobile/src/components` near the existing chat and message-entry screens.
- Keep `AcceptDeclineButtons` lightweight by turning only the decline button into a navigation trigger.
- Preserve current localization patterns by sourcing all user-facing copy through `useTranslation`.
