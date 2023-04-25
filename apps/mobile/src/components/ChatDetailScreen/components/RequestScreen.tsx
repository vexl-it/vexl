import {Stack, YStack} from 'tamagui'
import ChatRequestPreview from './ChatRequestPreview'
import InfoRectangle from './InfoRectangle'
import AccepDeclineButtons from './AccepDeclineButtons'
import {ScrollView} from 'react-native'
import ChatHeader from './ChatHeader'
import {useMolecule} from 'jotai-molecules'
import {chatMolecule} from '../atoms'
import {useAtomValue} from 'jotai'
import {useTranslation} from '../../../utils/localization/I18nProvider'
import randomName from '../../../utils/randomName'

function RequestScreen(): JSX.Element {
  const {offerForChatAtom, requestMessageAtom, wasDeniedAtom, chatAtom} =
    useMolecule(chatMolecule)
  const offer = useAtomValue(offerForChatAtom)
  const chat = useAtomValue(chatAtom)
  const {t} = useTranslation()

  const requestMessage = useAtomValue(requestMessageAtom)
  const wasDenied = useAtomValue(wasDeniedAtom)

  const requestedByMe = requestMessage?.state === 'sent'

  return (
    <>
      <ChatHeader
        mode={'photoTop'}
        leftButton={'back'}
        rightButton={wasDenied ? 'deleteChat' : requestedByMe ? null : 'block'}
      />
      <ScrollView bounces={false}>
        <YStack space="$6" f={1} mx={'$4'} my={'$6'}>
          {offer && <ChatRequestPreview />}
        </YStack>
      </ScrollView>
      <Stack mx="$4" mb={'$4'}>
        {!wasDenied &&
          (requestedByMe ? (
            <InfoRectangle>
              {t('messages.wellLetYouKnowOnceUserAccepts')}
            </InfoRectangle>
          ) : (
            <AccepDeclineButtons />
          ))}
        {wasDenied &&
          (requestedByMe ? (
            <InfoRectangle negative>
              {t('messages.deniedByMe', {name: randomName(chat.id)})}
            </InfoRectangle>
          ) : (
            <InfoRectangle negative>
              {t('messages.deniedByThem', {name: randomName(chat.id)})}
            </InfoRectangle>
          ))}
      </Stack>
    </>
  )
}

export default RequestScreen
