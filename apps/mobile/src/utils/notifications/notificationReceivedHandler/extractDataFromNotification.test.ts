import {Effect} from 'effect/index'
import type {
  Notification,
  NotificationResponse,
  NotificationTaskPayload,
} from 'expo-notifications'
import {type AcceptedNotificationTypes} from './domain'
import {extractDataFromNotification} from './extractDataFromNotification'

const encodedDebugDummyNotificationData = {
  _tag: 'DebugDummyNotificationData',
  acknowleadgeOnReceive: 'false',
}

const decodedDebugDummyNotificationData = {
  _tag: 'DebugDummyNotificationData',
  acknowleadgeOnReceive: false,
}

const encodedDebugDummyNotificationDataString = JSON.stringify(
  encodedDebugDummyNotificationData
)

function runExtractDataFromNotification(
  input: Parameters<typeof extractDataFromNotification>[0]
): AcceptedNotificationTypes {
  return Effect.runSync(extractDataFromNotification(input))
}

function listenerNotification(data: Record<string, unknown>): Notification {
  return {
    request: {
      identifier: '52BE379C-3160-4D5C-8E82-A212447C4FC0',
      trigger: {
        type: 'push',
        payload: {
          scopeKey: '@vexlit/vexl',
          experienceId: '@vexlit/vexl',
          projectId: 'dbcc5b47-6c4a-4faf-a345-e9cd8a680c32',
        },
      },
      content: {
        launchImageName: null,
        categoryIdentifier: null,
        badge: null,
        sound: null,
        attachments: [],
        interruptionLevel: 'active',
        title: 'V2 system test',
        body: 'hello from send-test-notif.sh',
        subtitle: null,
        data,
        threadIdentifier: null,
      },
    },
    date: 1782219467.1293507,
  }
}

function iosLaunchOptionsPayload(): NotificationTaskPayload {
  return {
    notification: null,
    data: {
      UIApplicationLaunchOptionsRemoteNotificationKey: {
        body: {
          ...encodedDebugDummyNotificationData,
          dataString: encodedDebugDummyNotificationDataString,
        },
        experienceId: '@vexlit/vexl',
        scopeKey: '@vexlit/vexl',
        projectId: 'dbcc5b47-6c4a-4faf-a345-e9cd8a680c32',
        aps: {'content-available': 1},
      },
    },
  }
}

describe('extractDataFromNotification', () => {
  it('extracts data from listener notifications', () => {
    expect(
      runExtractDataFromNotification({
        source: 'listener',
        data: listenerNotification(encodedDebugDummyNotificationData),
      })
    ).toMatchObject(decodedDebugDummyNotificationData)
  })

  it('extracts data from background notification responses', () => {
    const response = {
      actionIdentifier: 'expo.modules.notifications.actions.DEFAULT',
      notification: listenerNotification(encodedDebugDummyNotificationData),
    } satisfies NotificationResponse

    expect(
      runExtractDataFromNotification({
        source: 'backgroundTask',
        data: response,
      })
    ).toMatchObject(decodedDebugDummyNotificationData)
  })

  it('extracts parsed dataString from iOS background task payloads', () => {
    const payload = {
      notification: null,
      aps: {'content-available': 1},
      data: {
        scopeKey: '@vexlit/vexl',
        projectId: 'dbcc5b47-6c4a-4faf-a345-e9cd8a680c32',
        dataString: encodedDebugDummyNotificationDataString,
        experienceId: '@vexlit/vexl',
        body: encodedDebugDummyNotificationData,
      },
    } satisfies NotificationTaskPayload

    expect(
      runExtractDataFromNotification({
        source: 'backgroundTask',
        data: payload,
      })
    ).toMatchObject(decodedDebugDummyNotificationData)
  })

  it('extracts parsed dataString from iOS launch options background task payloads', () => {
    expect(
      runExtractDataFromNotification({
        source: 'backgroundTask',
        data: iosLaunchOptionsPayload(),
      })
    ).toMatchObject(decodedDebugDummyNotificationData)
  })

  it('extracts parsed dataString from Android background data messages', () => {
    const payload = {
      originalPriority: 1,
      sentTime: 1782220002546,
      notification: null,
      data: {
        dataString: encodedDebugDummyNotificationDataString,
        body: encodedDebugDummyNotificationDataString,
        scopeKey: '@vexlit/vexl',
        experienceId: '@vexlit/vexl',
        projectId: 'dbcc5b47-6c4a-4faf-a345-e9cd8a680c32',
      },
      to: null,
      ttl: 2419200,
      collapseKey: null,
      messageType: null,
      priority: 1,
      from: '183980003892',
      messageId: '0:1782220002550945%b5b980c0f9fd7ecd',
    }

    expect(
      runExtractDataFromNotification({
        source: 'backgroundTask',
        data: payload,
      })
    ).toMatchObject(decodedDebugDummyNotificationData)
  })

  it('extracts parsed dataString from Android background notification messages', () => {
    const payload = {
      originalPriority: 1,
      sentTime: 1782220022501,
      notification: {
        usesDefaultVibrateSettings: false,
        color: null,
        channelId: null,
        visibility: null,
        sound: null,
        tag: null,
        bodyLocalizationArgs: null,
        imageUrl: null,
        title: 'V2 system test',
        ticker: null,
        eventTime: null,
        body: 'hello from send-test-notif.sh (1782220022)',
        titleLocalizationKey: null,
        notificationPriority: null,
        icon: null,
        usesDefaultLightSettings: false,
        sticky: false,
        link: null,
        titleLocalizationArgs: null,
        bodyLocalizationKey: null,
        usesDefaultSound: false,
        clickAction: null,
        localOnly: false,
        lightSettings: null,
        notificationCount: null,
      },
      data: {
        dataString: encodedDebugDummyNotificationDataString,
        message: 'hello from send-test-notif.sh (1782220022)',
        title: 'V2 system test',
        body: encodedDebugDummyNotificationDataString,
        scopeKey: '@vexlit/vexl',
        experienceId: '@vexlit/vexl',
        projectId: 'dbcc5b47-6c4a-4faf-a345-e9cd8a680c32',
      },
      to: null,
      ttl: 2419200,
      collapseKey: 'it.vexl.nextstaging',
      messageType: null,
      priority: 1,
      from: '183980003892',
      messageId: '0:1782220022508546%b5b980c0b5b980c0',
    }

    expect(
      runExtractDataFromNotification({
        source: 'backgroundTask',
        data: payload,
      })
    ).toMatchObject(decodedDebugDummyNotificationData)
  })

  it('falls back to notification data when dataString cannot be parsed', () => {
    const payload = {
      notification: null,
      data: {
        dataString: 'not-json',
        ...encodedDebugDummyNotificationData,
      },
    } satisfies NotificationTaskPayload

    expect(
      runExtractDataFromNotification({
        source: 'backgroundTask',
        data: payload,
      })
    ).toMatchObject(decodedDebugDummyNotificationData)
  })
})
