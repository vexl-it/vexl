import {type NewsAndAnnouncementsResponse} from '@vexl-next/rest-api/src/services/content/contracts'
import {NewsAndAnonouncementsEndpoint} from '@vexl-next/rest-api/src/services/content/specification'
import makeEndpointEffect from '@vexl-next/server-utils/src/makeEndpointEffect'
import {Effect, Option, Schema} from 'effect'
import {Handler} from 'effect-http'

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

export const newsAndAnonouncementsEndpoint = Handler.make(
  NewsAndAnonouncementsEndpoint,
  ({headers}) =>
    makeEndpointEffect(
      Effect.gen(function* (_) {
        // if (headers.isDeveloper) return data
        return {
          fullScreenWarning: Option.none(),
          vexlBotNews: [],
        } satisfies NewsAndAnnouncementsResponse
      }),
      Schema.Void
    )
)
