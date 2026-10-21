# App metrics: what we measure

This is our answer to the "App Metrics (Draft)" document. We did not want to block on a round of questions, so we made the open decisions ourselves and wrote them down below. Please react to them: comment on a decision you disagree with, or on a view that would not help you decide anything. Everything here can still change. The engineering spec behind it is `definitions.md`.

The draft lists about 130 metrics in 12 sections. Many of them are the same number seen from two sides (churn is retention turned around, for example). We grouped them by the question they answer, which gave us seven dashboard views. The last section maps every draft section to the view that answers it, or says why we left it out.

## How to read the numbers

Vexl has no user accounts we can track, by design. So the dashboard never counts people. It counts **installs**: copies of the app that have anonymous usage statistics turned on (it is off by default; users are asked on a consent screen during onboarding, or once after updating, and can change it in settings). One person with two phones is two installs. A person who reinstalls is a new install.

Some numbers come from our servers instead (active offers, requests sent). Those cover every user, including the ones who switched statistics off. Every card says which group it counts: **All users** (servers) or **Installs with analytics on** (apps). We show them side by side but never divide one by the other, because the two groups differ. A ratio inside one group is fine (the reactivation rate is server returns divided by the server's dormant pool).

Groups smaller than 20 show as "<20", or "n/a" for a percentage. Recent periods whose data is still coming in are drawn dashed or faded: app numbers become final 14 days after a period ends, followed flows (a new install, an offer, a request) when the last one in it has run its course.

## Decisions

1. **Installs, not people.** See above. Country comes from the phone number prefix. We do not collect city anywhere.
2. **Periods.** UTC calendar day, ISO week (Monday to Sunday) and calendar month. Any group smaller than 20 installs is hidden or merged into "other", so a small country may only show up in the total.
3. **Core action.** Creating an offer, sending a request on someone's offer, or approving a request someone sent you (that opens the chat). Opening the marketplace and viewing an offer are tracked, but they are not core actions.
4. **Main marketplace vs Clubs.** A request counts as a Club action when the offer reached you only through a Club, otherwise as main. An offer always goes to your contacts, so creating one is a main action; if you also share it to a Club it counts for both.
5. **Activation.** The first offer created or the first request sent in the main marketplace, within 30 days of registration. Club activation is the same rule inside Clubs and is reported as its own number. Registration means the phone number was verified and the account created. Logging back into an existing account is not a new registration, so every new-user number leaves re-logins out.
6. **Active install.** Two levels for each day, week and month: the app was opened, and a core action happened. Main and Club core actions are shown separately.
7. **Dormant.** 30 days without opening the app. **Reactivated** means a dormant install opens the app again. We call a reactivation successful when a core action follows within 7 days. The reactivation rate is for all users only: server returns divided by the server's dormant pool. On the server, dormant means the app has not contacted our servers for 30 days, which is close to, but not the same as, not opening the app.
8. **Retention.** A registered install did a core action (main or Club) in a given window after registration: day 1, days 7 to 13 (D7) and days 28 to 34 (D30), from the new-user journey, split by "activated on registration day" and by "joined a Club before importing contacts". Long term, the ISO weeks 1, 4 and 13 after the registration week (W1, W4, W13), main and Club core actions shown separately. Churn is the reverse of retention plus the drop-offs in the new-user funnel, so it is not a separate set of numbers.
9. **Acquisition source** is not tracked. Without a third-party deep-linking service the app cannot see which link led to the install, and a link opened after install is almost always a Club invite, which view 5 already covers. Per-event interest is visible as clicks on the event's short link in backoffice, which involves no app data at all.
10. **Downloads** are out of scope: they live in the stores, and the dashboard shows only our own data. New registrations from our servers are shown instead.
11. **Trade outcome** is not measured. The closest signal is the optional rating after a chat, shown as positive chat ratings (4 or 5 stars). It is a chat rating, not a report of a completed trade. Adding the new questions from the draft ("Did it go well?" and the others) is a product change we left for later.
12. **Sessions and time in app** are not tracked. Active days per week and the weekly-to-monthly active ratio answer "is it becoming a habit?" with far less data.
13. **Clubs** are always counted across all Clubs together. No per-Club numbers.
14. **Notifications.** "Delivered" cannot be measured reliably (iOS does not tell us), so we report sent (servers), and then opened and what the user did next (installs).

## Dashboard views

Filters, shared by every view:

- **Period**: day, week, month or quarter. A quarter is the sum of its days, so counters and cohorts have quarters; unique counts (daily, weekly, monthly active installs) cannot be summed and stay at most monthly. Some cards are always weekly or monthly and say so.
- **Range**: last 3, 6 or 12 months, or all 18 months we keep. By day, at most the last 90 days.
- **Country** (phone prefix): the largest countries one by one, small ones together as "Other".
- **Platform**: iOS or Android.

A card whose data has no country or no platform says so, and that filter does not change it.

Snapshots (one total, not a series) follow the range, not the period: they add up the flows that started in the range and have run their course, and show which weeks that is. Cards titled "week of …" show the latest complete week.

### 1. New-user funnel

Does a new install get from first open to real use, and where does it stop? Grouped by the week of first open.

"First open" means answering "Yes" on the consent screen during onboarding. Installs that never opt in are not counted, and the opt-in rate cannot be measured, because nothing is sent before consent.

- Activation rate: share of new registrations that activated in the main marketplace, with the Clubs-only share next to it. The base is the same with or without a country filter.
- Onboarding steps, as plain bars: first open → phone number entered (both include re-logins: the app learns about an existing account only at verification) → phone verified → registered → reached contact import → contacts imported → marketplace loaded → saw at least one main offer → opened a main offer → activated in the main marketplace (within 30 days), new accounts only from verification on. With a country filter the bars start at "registered", because the app learns the country only then.
- How the contact import ended: imported, skipped, access denied, failed, left unfinished, never reached.
- Activation rate per period of first open, main and Clubs only, each period shown once all its installs have had their full time.
- Time from first open to registration: same day, next day, 2 to 7 days, 8 days or more. From registration to activation: same day, next day, 2 to 7 days, 8 to 30 days.
- Activation by how many main offers loaded on the first marketplace visit (0, 1 to 5, 6 to 20, 21 to 50, over 50), for new registrations that imported contacts, with the size of each group.
- New registrations from our servers, as a trend per period. Counts all users and is never divided by the funnel.

The split by "offers seen on first load" is the chart we expect to matter most. If installs with an empty marketplace never activate, liquidity is the activation problem.

### 2. Marketplace liquidity

Can people find someone to trade with where they live?

- Active offers now, active offers per period by type (buy / sell), and offers created per period by type. From servers, active offers without a platform split.
- Median number of users an offer reaches, per period. From servers, no platform split. Medians cannot be combined, so all countries shows the three largest markets and "Other" shows nothing.
- Per week, the share of installs that opened the marketplace and saw no main offers; all countries shows the three largest markets next to the total. For the latest complete week, a table per country of how many main offers they saw: 0, 1 to 5, 6 to 20, 21 to 50, over 50.
- Requests sent. From servers. Their outcomes come from installs.
- From the offer side: time to first request within 30 days, for all offers, main only vs also shared to Clubs, and buy vs sell. Offers deleted before any request are left out.
- From the request side: outcome per period (approved, rejected, cancelled, no answer within 14 days) and how long the answer took, main vs Club.

### 3. Activity

Is anyone using it?

- Daily, weekly and monthly active installs for the latest complete day, week and month, at both levels (opened the app, core action).
- Active installs per period: opened the app, split into core action in main only, Clubs only, both, or none, so the parts add up.
- Weekly / monthly ratio per month, for both levels.
- Active days per week (1 to 7) among weekly active installs, latest complete week.
- Offers created, requests sent and requests approved per install with a core action, latest complete week.
- Offer details opened per weekly active install, per week.
- Context: active users from our servers (refreshed in the last 30 days), per week, no platform split.

### 4. Retention and reactivation

Do people come back?

- D1, D7 and D30 from the new-user journey, split by "activated on registration day" vs not and by "joined a Club before importing contacts" vs not (a join any time in the 37 days would favour the installs that stayed). Activation is itself a core action, so a plain "activated" split would be circular (activating on day 8 counts towards D7); for installs that activated on registration day, D1 to D30 all come after activation. Installs that registered 3 or more days after first open have no D30; their share is shown as "D30 unknown".
- Long-term table: registration week (or month, quarter) by W1, W4 and W13, main and Club, from the weekly activity rows.
- From servers: dormant users and the weekly reactivation rate (returns divided by the dormant pool), both without a country or platform split, and returns after 30 or more days inactive per period.
- Reactivations from installs: share with a core action within 7 days per period, how long they were away, what they did first, and per notification category they came back through (or none) the returns and the share with a core action.
- Reactivations of Club members vs others, and how many of each did a core action within 7 days.

### 5. Clubs and the main marketplace

Do Clubs bring people into the main marketplace, or keep them out of it?

- Club joins per period. From servers.
- Per week, among installs active that week: Club members with a main core action and with a Club core action, compared with non-members' main core action. Installs active in Clubs, main or both are in view 3.
- For new registrations, by when they joined a Club in their first 37 days (before importing contacts, after, not at all): share that imported contacts, saw a main offer, opened a main offer, activated in the main marketplace within 30 days, or activated in Clubs only.
- All Club cards follow the country filter.
- Weekly active installs by number of Clubs: 0, 1, 2, 3 or more, latest complete week.

### 6. Notifications and prompts

Do our nudges work?

- Push notifications sent per type over the range. From servers, no country split. Needs a server change first.
- Per notification category, for installs that opened one: what happened within the same day (offer opened, offer created, request sent, chat opened), nudges (new offers, marketplace ready, inactivity reminder, product news) first. Chat opened is left out for categories that open a chat themselves (chat message, request received, request answered, trade reminder). Server send types and app categories do not line up, so sent and opened are separate tables.
- Share of weekly active installs with notifications allowed.
- Per in-app prompt: shown, dismissed, tapped, and whether the action it asks for happened within 7 days.

### 7. Chats and trades

Do conversations turn into trades?

- For requests sent, main vs Club: approved → both sides wrote at least one message.
- Share of positive chat ratings (4 or 5 stars) over the range, and ratings submitted and positive per period. From servers, never divided by the request funnel. Needs a server change first.

## Where each draft section went

| Draft section              | Where it is now  | What changed and why                                                                                                                                                                                                                                                                                                           |
| -------------------------- | ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1. Acquisition             | Views 1 and 5    | Downloads are out of scope; registrations from our servers are shown instead. "Time from download" starts at first open, because the app cannot see the download. Source is not tracked; per-event numbers come from short-link clicks.                                                                                        |
| 2. Activation              | View 1           | Activation follows the comment thread: first offer or request in the main marketplace. "Offers reacted to", "requests sent" and "chats opened from an offer" in the draft are one action in Vexl (sending a request); the chat opens when the owner approves it. We count that once.                                           |
| 3. Active users            | View 3           | Opening the marketplace and viewing an offer are not core actions (decision 3), so we show two levels instead of one mixed list.                                                                                                                                                                                               |
| 4. Marketplace & liquidity | View 2           | The three request rows in the draft were copy-pasted as "active offers in each country". We read them as requests sent, answered and unanswered. "Users who see no offers" is in views 1 and 2.                                                                                                                                |
| 5. Chats & trade outcomes  | Views 2 and 7    | Completed trades are not measured; the post-chat rating is shown as positive chat ratings. Not measured: "users with more than one trade", "average time between trades", "post-trade return rate" and "chat churn rate". Each needs a long history per install, which we do not keep. "Time spent in app" is decision 12.     |
| 6. Clubs                   | Views 3, 4 and 5 | "Club activity: posting or reacting" is Club offers and requests, no separate signal. "Returning to a Club" is a weekly Club core action. Per-Club averages ("offers per Club member") become the share of installs active in Clubs, because we do not count per Club.                                                         |
| 7. Retention               | View 4           | D1, D7 and D30 after registration, W1, W4 and W13 after the registration week. Retention after activation and after a Club join are splits of the D1 / D7 / D30 table. "Retention after opening a chat" is not measured on its own. "Repeat offer creation" and "chats per user" are the per-active-install numbers in view 3. |
| 8. Churn                   | Views 1 and 4    | Items 1 to 3 are the funnel drop-offs. Items 4 to 8 are retention turned around. Items 9 to 13 ("actions before churn", "time from registration to churn") would need a running record per install that is overwritten until it goes quiet. That is a device profile, so we do not collect it.                                 |
| 9. Reactivation            | View 4           | Dormancy is 30 days. "Sessions before reactivation" and "time from reactivation to next dormancy" are not measured, both need history across months.                                                                                                                                                                           |
| 10. Notifications          | View 6           | "Delivered" is not measurable. Opt-outs are the share of active installs with notifications allowed. "Notification → user reactivated" is in view 4.                                                                                                                                                                           |
| 11. Pop-ups & prompts      | View 6           | Measured per prompt.                                                                                                                                                                                                                                                                                                           |
| 12. Sessions               | Not measured     | Replaced by active days per week and the weekly / monthly ratio (decision 12).                                                                                                                                                                                                                                                 |

## Not collected, on purpose

- City, in any form.
- Anything per Club or per event.
- Exact times. Installs report the day, and durations only as ranges.
- Any id that stays the same for an install over time. Long-term numbers (W13, reactivation) come from the phone itself telling us "this install registered 13 weeks ago" or "this install was away for 2 months", never from joining its rows on our side.
