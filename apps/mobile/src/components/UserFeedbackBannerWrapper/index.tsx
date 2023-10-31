import {type PrimitiveAtom, useAtomValue} from 'jotai'
import {type Chat} from '@vexl-next/domain/dist/general/messaging'
import ChatFeedbackBanner from './components/ChatFeedbackBanner'
import OfferCreationFeedbackBanner from './components/OfferCreationFeedbackBanner'
import {Stack} from 'tamagui'

interface Props {
  chatAtom?: PrimitiveAtom<Chat>
  feedbackDoneAtom: PrimitiveAtom<boolean>
}

function UserFeedbackBannerWrapper({
  chatAtom,
  feedbackDoneAtom,
}: Props): JSX.Element | null {
  const feedbackDone = useAtomValue(feedbackDoneAtom)

  if (feedbackDone) return null

  return chatAtom ? (
    <ChatFeedbackBanner
      chatAtom={chatAtom}
      feedbackDoneAtom={feedbackDoneAtom}
    />
  ) : (
    <Stack mt={'$4'}>
      <OfferCreationFeedbackBanner feedbackDoneAtom={feedbackDoneAtom} />
    </Stack>
  )
}

export default UserFeedbackBannerWrapper
