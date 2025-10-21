import {HttpApiBuilder} from '@effect/platform/index'
import {UuidE} from '@vexl-next/domain/src/utility/Uuid.brand'
import {type NewsAndAnnouncementsResponse} from '@vexl-next/rest-api/src/services/content/contracts'
import {ContentApiSpecification} from '@vexl-next/rest-api/src/services/content/specification'
import {makeEndpointEffect} from '@vexl-next/server-utils/src/makeEndpointEffect'
import {Effect, Option, Schema} from 'effect'
import {forceUpdateForVersionAndLowerConfig} from '../configs'

// const data = {
//   vexlBotNews: [
//     {
//       id: '307ebbe8-e055-4ad2-928b-752752ab198a' as Uuid,
//       cancelForever: false,
//       content:
//         '‼️ First alert! This one can be cancelled but will appear again after killing the app.',
//       action: Option.some({
//         text: 'See more',
//         url: 'https://www.youtube.com/watch?v=MGJZfmYMltM' as HttpsUrlString,
//       }),
//       type: 'warning',
//       bubbleOrigin: Option.some({
//         title: 'Vexl tests',
//         subtitle: 'Testing in production since 2022',
//       }),
//       cancelable: true,
//     },
//     {
//       id: 'acea76eb-d77a-4263-ba64-4607b72fe02f' as Uuid,
//       cancelForever: false,
//       content: '‼️ Another alert, can not be cancelled',
//       action: Option.some({
//         text: 'See more',
//         url: 'https://www.youtube.com/watch?v=MGJZfmYMltM' as HttpsUrlString,
//       }),
//       type: 'warning',
//       bubbleOrigin: Option.some({
//         title: 'Vexl tests',
//         subtitle: 'Testing in production since 2022',
//       }),
//       cancelable: false,
//     },
//     {
//       id: '0823476b-278d-48a6-94d9-2b6410a874b8' as Uuid,
//       cancelForever: true,
//       content: '👋 This one can be cancelled and wont appear again!',
//       action: Option.some({
//         text: 'See this!',
//         url: 'https://www.youtube.com/watch?v=LDU_Txk06tM' as HttpsUrlString,
//       }),
//       type: 'info',
//       bubbleOrigin: Option.some({
//         title: 'Vexl tests',
//         subtitle: 'Testing in production since 2022',
//       }),
//       cancelable: true,
//     },
//   ],
//   fullScreenWarning: Option.some({
//     cancelForever: false,
//     action: Option.some({
//       text: 'Dare you?',
//       url: 'https://www.youtube.com/watch?v=xvFZjo5PgG0' as HttpsUrlString,
//     }),
//     id: '0739df88-4b3a-4b5a-a0c3-3f6e348980ac' as Uuid,
//     description:
//       'But when we do we do it in production baby! I hope you are ready for this. Would you rather have fingers instead of legs or legs instead of fingers? - This allert can be cancelled but will appear again next time you open the app after killing it.',
//     title: "We don't usually test stuff",
//     type: 'RED',
//     cancelable: true,
//   } satisfies FullScreenWarning),
// } satisfies NewsAndAnnouncementsResponse

export const newsAndAnonouncementsHandler = HttpApiBuilder.handler(
  ContentApiSpecification,
  'NewsAndAnnouncements',
  'getNewsAndAnnouncements',
  ({headers}) =>
    Effect.gen(function* (_) {
      // const vexlBotNewsForBlog1: VexlBotNews = {
      //   id: Schema.decodeSync(UuidE)('085f7bbe-f142-4e71-8b80-eb9b9107ddef'),
      //   type: 'info',
      //   content:
      //     'Borders are drawn with numbers now.\nThis week, we dive into how control is coded into your currency. ➡️',
      //   action: Option.some({
      //     text: 'Read now',
      //     url: Schema.decodeSync(HttpsUrlString)(
      //       'https://vexl.it/post/economic-sanctions-and-collateral-damage'
      //     ),
      //   }),
      //   cancelForever: true,
      //   bubbleOrigin: Option.none(),
      //   cancelable: true,
      // }

      // const vexlBotNewsForBlog1: VexlBotNews = {
      //   id: Schema.decodeSync(UuidE)('5785f0ed-6451-412a-b5e2-3f5b186e3d00'),
      //   type: 'info',
      //   content:
      //     'This week, we dive into how due process was quietly deleted from the financial system. ➡️',
      //   action: Option.some({
      //     text: 'Read now',
      //     url: Schema.decodeSync(HttpsUrlString)(
      //       'https://vexl.it/post/the-lack-of-due-process'
      //     ),
      //   }),
      //   cancelForever: true,
      //   bubbleOrigin: Option.none(),
      //   cancelable: true,
      // }

      // const vexlBotNewsForBlog2: VexlBotNews = {
      //   id: Schema.decodeSync(UuidE)('f4e4161b-04e1-4a0c-8d07-e42d11daa2cf'),
      //   type: 'info',
      //   content:
      //     'This week, we dive into how money became a tool to silence dissent.\nCensorship doesn’t need a courtroom—just a bank account. ➡️',
      //   action: Option.some({
      //     text: 'Read now',
      //     url: Schema.decodeSync(HttpsUrlString)(
      //       'https://vexl.it/post/money-as-a-tool-for-political-censorship'
      //     ),
      //   }),
      //   cancelForever: true,
      //   bubbleOrigin: Option.none(),
      //   cancelable: true,
      // }

      // const vexlBotNewsForBlog3: VexlBotNews = {
      //   id: Schema.decodeSync(UuidE)('e1f4dabd-f989-4aaa-8c84-1739c83b0ee7'),
      //   type: 'info',
      //   content:
      //     'From permissionless to permissioned. This week we dive into how fast “your money” becomes theirs. ➡️',
      //   action: Option.some({
      //     text: 'Read now',
      //     url: Schema.decodeSync(HttpsUrlString)(
      //       'https://vexl.it/post/digital-money-vs-digital-cash'
      //     ),
      //   }),
      //   cancelForever: true,
      //   bubbleOrigin: Option.none(),
      //   cancelable: true,
      // }

      const forceUpdateForVersionAndLower = yield* _(
        forceUpdateForVersionAndLowerConfig
      )
      if (
        !Option.isSome(headers.clientVersionOrNone) ||
        headers.clientVersionOrNone.value <= forceUpdateForVersionAndLower
      ) {
        return {
          fullScreenWarning: Option.some({
            action: Option.none(),
            cancelable: false,
            cancelForever: false,
            id: Schema.decodeSync(UuidE)(
              '61362ca8-6ee2-4044-996f-cff885f8ae19'
            ),
            type: 'RED',
            title: 'Update Required',
            description:
              'For your security and the best app experience, please update Vexl to the latest version (1.35.0 or higher). This update is required to continue using the app.',
          }),
          vexlBotNews: [],
        } satisfies NewsAndAnnouncementsResponse
      }
      return {
        fullScreenWarning: Option.none(),
        vexlBotNews: [],
      } satisfies NewsAndAnnouncementsResponse
    }).pipe(makeEndpointEffect)
)
