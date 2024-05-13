import {type OfferInfo} from '@vexl-next/domain/src/general/offers'
import * as TE from 'fp-ts/TaskEither'
import {pipe} from 'fp-ts/function'
import {atom} from 'jotai'
import {translationAtom} from '../../utils/localization/I18nProvider'
import {askAreYouSureActionAtom} from '../AreYouSureDialog'

const showCommonFriendsExplanationUIActionAtom = atom(
  null,
  async (get, set, offerInfo: OfferInfo) => {
    const {t} = get(translationAtom)

    const modalContent = (() => {
      if (offerInfo.privatePart.friendLevel.includes('FIRST_DEGREE')) {
        if (offerInfo.privatePart.commonFriends.length === 0) {
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
