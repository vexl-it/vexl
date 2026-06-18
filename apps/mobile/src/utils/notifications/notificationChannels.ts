import {
  AndroidImportance,
  setNotificationChannelAsync,
} from 'expo-notifications'

export async function getChannelForMessages(): Promise<string> {
  await setNotificationChannelAsync('Chat', {
    name: 'Chat notifications.',
    importance: AndroidImportance.HIGH,
  })
  return 'Chat'
}

export async function getDefaultChannel(): Promise<string> {
  await setNotificationChannelAsync('General', {
    name: 'General notifications.',
    importance: AndroidImportance.DEFAULT,
  })
  return 'General'
}

export async function getChannelForTradeReminders(): Promise<string> {
  await setNotificationChannelAsync('TradeReminders', {
    name: 'Trade reminder notifications',
    importance: AndroidImportance.DEFAULT,
  })
  return 'TradeReminders'
}
