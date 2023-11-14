import notifee, {AndroidImportance} from '@notifee/react-native'

export async function getChannelForMessages(): Promise<string> {
  return await notifee.createChannel({
    id: 'Chat',
    name: 'Chat notifications.',
    importance: AndroidImportance.HIGH,
  })
}

export async function getDefaultChannel(): Promise<string> {
  return await notifee.createChannel({
    id: 'General',
    name: 'General notifications.',
    importance: AndroidImportance.DEFAULT,
  })
}
