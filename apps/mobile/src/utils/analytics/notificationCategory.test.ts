import {notificationCategoryFromData} from './notificationCategory'

const chat = {inbox: 'INBOX_KEY', sender: 'SENDER_KEY'}

describe('notificationCategoryFromData', () => {
  it.each([
    [
      {_tag: 'SystemChatNotificationData', ...chat, type: 'MESSAGE'},
      'chatMessage',
    ],
    [
      {_tag: 'SystemChatNotificationData', ...chat, type: 'REQUEST_MESSAGING'},
      'requestReceived',
    ],
    [{...chat, type: 'APPROVE_MESSAGING'}, 'requestAnswered'],
    [{...chat, type: 'DISAPPROVE_MESSAGING'}, 'requestAnswered'],
    [{...chat, type: 'DELETE_CHAT'}, 'chatMessage'],
    [chat, 'chatMessage'],
    [{_tag: 'TradeReminderNotificationData', ...chat}, 'tradeReminder'],
    [{_tag: 'NewOffersInternalNotificationData'}, 'newOffers'],
    [{_tag: 'NewChatMessageNoticeNotificationData'}, 'chatMessage'],
    [{_tag: 'VexlProductNotificationData'}, 'productNews'],
    [{_tag: 'ClubDeactivatedNotificationData'}, 'clubDeactivated'],
    [{_tag: 'UserInactivityNotificationData'}, 'inactivityReminder'],
    [{type: 'NEW_OFFERS_IN_MARKETPLACE'}, 'newOffers'],
    [{type: 'MARKETPLACE_READY'}, 'marketplaceReady'],
    [{type: 'INACTIVITY_REMINDER'}, 'inactivityReminder'],
    [{type: 'CLUB_DEACTIVATED'}, 'clubDeactivated'],
    [
      {_tag: 'ClubAdmissionInternalNotificationData', clubUuid: 'x'},
      'clubAdmission',
    ],
    [{type: 'NEW_CONTACTS_TO_SYNC'}, 'other'],
    [{_tag: 'OpenBrowserLinkNotificationData', url: 'https://x'}, 'other'],
    [{}, 'other'],
    [undefined, 'other'],
    ['garbage', 'other'],
  ])('maps %o to %s', (data, category) => {
    expect(notificationCategoryFromData(data)).toBe(category)
  })
})
