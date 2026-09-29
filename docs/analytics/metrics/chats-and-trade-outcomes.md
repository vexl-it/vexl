# Chats and trade outcomes

## Merged

| Duplicate                                         | Canonical                                                                   |
| ------------------------------------------------- | --------------------------------------------------------------------------- |
| "Chats opened from an offer"                      | "Offers reacted to" (`activation.md`)                                       |
| "Chats initiated"                                 | "Offers reacted to" (`activation.md`)                                       |
| "Chats that receive a response"                   | "Number of requests receiving a response" (`marketplace-and-liquidity.md`)  |
| "Chats with no response"                          | "Number of requests receiving no response" (`marketplace-and-liquidity.md`) |
| "Average time spent in app per day week or month" | "Session duration" (`sessions.md`, deferred)                                |

## Category summary

- Requests sent and composer opens are "Offers reacted to"; requester-side answers are "Number of requests receiving a response", "Number of requests receiving no response" and "Time from request to response". This file owns two small additions to `chatOutcomesWeekly`: time to feedback ("Time between opening a chat and submitting feedback") and the chat inactivity snapshot ("Chat churn rate and time from last activity to churn").
- Chat closed ("Chat closed") is backend `CHAT_CLOSED`.
- Feedback ratings ("Optional post-chat trade feedback", "Optional question How was your experience using Vexl", "Positive or negative trade feedback") are stored by feedback-service and are out of this system (README).
- Every completed-trade metric ("Optional question Did it go well", "Optional question Did you connect successfully", "Optional question Did this work out for you", "Number of completed trades", "Open chat to completed trade ratio", "Open chat to completed trade time", "Post-trade return rate", "Users who completed more than one trade", "Average time between trades") hinges on one optional structured question that does not exist; deferred behind Q10.
- "Average time spent in app per day week or month" and "Average time between app activities" are foreground time and are deferred with the sessions category (Q11) and by CSV decision respectively.
- Never send chat ids, inbox keys, `formId`, free text or message timestamps; per-chat state stays with the chat in MMKV and is purged with it.

### Chats opened from an offer

Merged into "Offers reacted to" (`activation.md`). Dashboard label: `composerOpened` against `requestsSentMain + requestsSentClub` as attempts vs initiated conversations.

### Chats initiated

Merged into "Offers reacted to" (`activation.md`). Dashboard label: new conversations = requests sent excluding `rerequests`; chat-screen opens are not this metric.

### Chats that receive a response

Merged into "Number of requests receiving a response" (`marketplace-and-liquidity.md`). Dashboard label: acceptance and first human reply shown separately, counted on the requester device only.

### Chats with no response

Merged into "Number of requests receiving no response" (`marketplace-and-liquidity.md`). Dashboard label: "no acceptance" and "no human reply" separated; cancellation, deletion and unknown are not silence.

### Chat closed

- **Status: planned**
- **Type**: backend `CHAT_CLOSED`.
- **Definition**: Explicit leave or close actions; the unit is closure actions, since both sides can close. Closure is not completion or churn. A split by chat state at closure is not built.
- **Where in the code**: `apps/chat-service/src/metrics.ts` on the leave-chat message; client `deleteChatActionAtom` (`apps/mobile/src/state/chat/atoms/deleteChatActionAtom.ts`) sends `DELETE_CHAT`. Blocking and the other side leaving are different messages.
- **Privacy notes**: none.

### Optional post-chat trade feedback

- **Status: deferred**. Feedback ratings are out of this system (README); no question open. Prompts shown vs answered would be a `feedbackPrompts` counter set on `chatOutcomesWeekly` if the feedback data ever gets a dashboard read path.
- **Where in the code**: `submitFeedbackActionAtom` (`apps/mobile/src/components/UserFeedback/atoms/index.ts`) to `feedback_submit` in feedback-service; prompt result in `resultFromFeedback.ts`.

### Optional question Did it go well

- **Status: deferred**. Open: Q10 (recommended outcome there: dropped as a duplicate of the star rating).

### Optional question How was your experience using Vexl

- **Status: deferred**. Feedback ratings are out of this system (README); no question open. Only `CHAT_RATING` is wired; the offer-creation rating (`OFFER_RATING`) is dead code.

### Optional question Did you connect successfully

- **Status: deferred**. Open: Q10 (this is the one question worth adding, reworded toward trade completion).
- **Where in the code**: not present. Would be a new `FeedbackPage` in the `feedbackMolecule` flow with the answer counted on `chatOutcomesWeekly`, never stored in `feedback_submit` next to free text.

### Optional question Did this work out for you

- **Status: deferred**. Open: Q10 (recommended outcome there: dropped).

### Positive or negative trade feedback

- **Status: deferred**. Feedback ratings are out of this system (README); no question open. `POSITIVE_STAR_RATING_THRESHOLD` in `packages/domain/src/general/feedback.ts` is the fixed threshold if feedback-service data is ever charted.

### Time between opening a chat and submitting feedback

- **Status: planned**
- **Type**: aggregation `chatOutcomesWeekly` (week). Counters (cap 20): `feedbackAfterD0`, `feedbackAfterD1`, `feedbackAfterD2To7`, `feedbackAfterD8To30`, `feedbackAfterGt30`.
- **Definition**: Successful initiation to feedback submission, `DaysBucket` on device, among respondents. Reopening does not reset. This is time to feedback, not time to a trade.
- **Where in the code**: baseline = `receivedByServerAt` of the chat's first `REQUEST_MESSAGING` (`chat.messages[0]`), captured into the local chat record at initiation because `deleteChatActionAtom` trims messages before the feedback dialog opens (`deleteChatWithUiFeedbackAtom` in `apps/mobile/src/components/ChatDetailScreen/atoms/index.tsx`). Submission = `submitFeedbackActionAtom` succeeding with `finished`.
- **Privacy notes**: bucket counters only.

### Number of completed trades

- **Status: deferred**. Open: Q10.
- **Where in the code**: no completion signal. The trade checklist (`apps/mobile/src/state/tradeChecklist/domain.ts`) is a "meeting planned" milestone, not completion.

### Open chat to completed trade ratio

- **Status: deferred**. Open: Q10. Would be reports among respondents over the `requestsEnrolled` cohort, labelled "observed completion-report rate".

### Open chat to completed trade time

- **Status: deferred**. Open: Q10. Not measurable even with the question; a cheap proxy exists (initiation to agreed checklist date) but is not built unless asked.

### Chat churn rate and time from last activity to churn

- **Status: planned**
- **Type**: aggregation `chatOutcomesWeekly` (week). Fields `openChats`, `inactiveChats30d` (`CountBucket`), written at the first app start in the week.
- **Definition**: Inactivity = no human message for 30 days in a visible chat. A snapshot ratio per reporting instance; users who stopped opening the app are invisible by construction. The latency to a fixed threshold is 30 days by definition and is not reported.
- **Where in the code**: `checkInactiveChatsInAppLoadingTask.ts` already walks chats on resume (`insertInactivityReminderActionAtom` uses 7 days); visible chats = `chatShouldBeVisible` (`apps/mobile/src/state/chat/utils/isChatActive.ts`); exclude `INACTIVITY_REMINDER`, `VERSION_UPDATE`, `FCM_CYPHER_UPDATE`, `MESSAGE_READ` when finding the last message.
- **Privacy notes**: buckets only.

### Post-trade return rate

- **Status: deferred**. Open: Q10.

### Users who completed more than one trade

- **Status: deferred**. Open: Q10.

### Average time between trades

- **Status: deferred**. Open: Q10 (recommended outcome there: stays unmeasurable).

### Average time spent in app per day week or month

Merged into "Session duration" (`sessions.md`, deferred, Q11). Dashboard label: foreground time histogram per completed week among reporting instances.

### Average time between app activities

- **Status: deferred**. CSV decision: defer. If revived, one predefined pair only (first marketplace load to first request), as a bucket on `registrationCohort`; never a generic timeline.
