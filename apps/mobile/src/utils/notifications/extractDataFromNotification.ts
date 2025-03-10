import {Option, pipe, Schema} from 'effect'
import type * as Notifications from 'expo-notifications'
import {Platform} from 'react-native'

/*
IOS in background task notification example:
headless:
"body": {
 !! This is what we want as not stringificed json (can be read without parsing) !!
},
  "aps": {
    "content-available": 1
  },
}

with body and title: NOT RECEIVED

IOS in hook notification example:
with body and title:

{
  "request": {
    "trigger": {
      ...
    },
    "identifier": "...",
    "content": {
      "body": "You have a new chat message",
      "title": "en_dev New chat message",
      "data": {
        !!!This is what we want as not stringified json (can be read without parsing) !!!
      },
      ...
    }
  },
  "date": ...
}

headless: NOT RECEIVED



Android in background task notification example:
headless:
{
  "notification": {
    "notification": null, // THIS SIGNALS IT's HEADLESS
    "data": {
      "body": "!!! THIS IS WHAT WE WANT - IN STRINGIFIED JSON FORMAT !!!",
    },
  }
}

with body and title:
{
  "notification": {
    "notification": {...}, !!! THIS SIGNALS WE HAVE NOTIFICATION WITH BODY AND TITLE !!!
    "data": {
      "message": "You have a new chat message",
      "title": "en_dev New chat message",
      "body": "!!! THIS IS WHAT WE WANT - IN STRINGIFIED JSON FORMAT !!!",
    },
  }
}

Android in hook notification example:
with body and title:

{
  "request": {
    "trigger": {
      "remoteMessage": {
        "notification": {} // THIS signals we have notification with body and title
      },
    }
    "content": {
      "body": "You have a new chat message",
      "title": "en_dev New chat message",
      "data": {
      !!!This is what we want as not stringified json (can be read without parsing) !!!
      }
    },
  },
}


headless:
{
  "request": {
    "trigger": {
      "remoteMessage": {
        "notification": null, // !!! THIS SIGNALS WE DON'T HAVE NOTIFICATION WITH BODY AND TITLE !!!
      },
    },
    "content": {
      "title": null,
      "badge": null,
      "body": null,
      "data": {
        "body": "!!! THIS IS WHAT WE WANT - IN STRINGIFIED JSON FORMAT !!!",
      },
    },
  },
}
*/

const NotificationPayload = Schema.Record({
  key: Schema.String,
  value: Schema.Union(Schema.String, Schema.Number, Schema.Object),
})
export type NotificationPayload = typeof NotificationPayload.Type

const AndroidInHookNotification = Schema.Struct({
  request: Schema.Struct({
    trigger: Schema.Struct({
      remoteMessage: Schema.Struct({
        notification: Schema.NullishOr(Schema.Object),
        data: Schema.Struct({
          body: Schema.String,
        }),
      }),
    }),
  }),
})

const AndroidInBackgroundNotification = Schema.Struct({
  notification: Schema.Struct({
    notification: Schema.NullOr(Schema.Unknown),
    data: Schema.Struct({
      body: Schema.parseJson(NotificationPayload),
    }),
  }),
})

const IOSInHookNotification = Schema.Struct({
  request: Schema.Struct({
    content: Schema.Struct({
      body: Schema.NullishOr(Schema.String),
      data: NotificationPayload,
    }),
  }),
})

const IOSInBackgroundNotification = Schema.Struct({
  aps: Schema.Struct({
    'content-available': Schema.NullishOr(Schema.Number),
  }),
  body: NotificationPayload,
})

/**
 * Extracts data payload from notification. Further decoding is needed. This function simply returns the data payload as received from the callback.
 * Can be called with data from background task or hook.
 *
 * @param notification
 */
export function extractDataPayloadFromNotification(
  data:
    | {
        source: 'background'
        data: unknown
      }
    | {
        source: 'hook'
        data: Notifications.Notification
      }
): Option.Option<{payload: NotificationPayload; isHeadless: boolean}> {
  try {
    if (Platform.OS === 'android') {
      if (data.source === 'background') {
        return pipe(
          Schema.decodeUnknownOption(AndroidInBackgroundNotification)(
            data.data
          ),
          Option.map((one) => ({
            payload: one.notification.data.body,
            isHeadless: !one.notification.notification,
          }))
        )
      }

      if (data.source === 'hook') {
        return pipe(
          Schema.decodeUnknownOption(AndroidInHookNotification)(data.data),
          Option.map((one) => ({
            payload: one.request.trigger.remoteMessage.data.body,
            isHeadless: !one.request.trigger.remoteMessage.notification,
          })),
          Option.flatMap(({payload, isHeadless}) => {
            return pipe(
              Schema.decodeOption(Schema.parseJson(NotificationPayload))(
                payload
              ),
              Option.map((one) => ({
                payload: one,
                isHeadless,
              }))
            )
          })
        )
      }
    }

    if (Platform.OS === 'ios') {
      if (data.source === 'background') {
        return pipe(
          Schema.decodeUnknownOption(IOSInBackgroundNotification)(data.data),
          Option.map((one) => ({
            payload: one.body,
            isHeadless: one.aps['content-available'] === 1,
          }))
        )
      }

      if (data.source === 'hook') {
        return pipe(
          Schema.decodeUnknownOption(IOSInHookNotification)(data.data),
          Option.map((one) => ({
            payload: one.request.content.data,
            isHeadless: !one.request.content.body,
          }))
        )
      }
    }

    return Option.none() // WHAT DA FUCK?
  } catch (e) {
    return Option.none()
  }
}
