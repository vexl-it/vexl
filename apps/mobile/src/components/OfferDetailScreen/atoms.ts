import {type OneOfferInState} from '../../state/marketplace/domain'
import {translationAtom} from '../../utils/localization/I18nProvider'
import {pipe} from 'fp-ts/function'
import {askAreYouSureActionAtom} from '../AreYouSureDialog'
import * as TE from 'fp-ts/TaskEither'
import {atom} from 'jotai'

const showCommonFriendsExplanationUIActionAtom = atom(
  null,
  async (get, set, params: {offer: OneOfferInState}) => {
    const {t} = get(translationAtom)
    const {offer} = params

    const modalContent = (() => {
      if (offer.offerInfo.privatePart.friendLevel.includes('FIRST_DEGREE')) {
        if (offer.offerInfo.privatePart.commonFriends.length === 0) {
          return {
            title: t('offer.offerFromDirectFriend'),
            description: `${t('offer.youSeeThisOfferBecause')} ${t(
              'offer.beCautiousWeCannotVerify'
            )}`,
            positiveButtonText: t('common.gotIt'),
          }
        }
        return {
          title: t('offer.offerFromDirectFriend'),
          description: `${t('offer.youSeeThisOfferBecause')} ${t(
            'offer.dontForgetToVerifyTheIdentity'
          )}`,
          positiveButtonText: t('common.gotIt'),
        }
      }
      return {
        title: t('offer.offerFromFriendOfFriend'),
        description: t('offer.noDirectConnection'),
        positiveButtonText: t('common.gotIt'),
      }
    })()

    return await pipe(
      set(askAreYouSureActionAtom, {
        steps: [{...modalContent, type: 'StepWithText'}],
        variant: 'info',
      }),
      TE.match(
        () => {
          return false
        },
        () => {
          return true
        }
      )
    )()
  }
)

export default showCommonFriendsExplanationUIActionAtom
