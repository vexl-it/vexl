import styled from '@emotion/native'
import Text from '../../../../Text'
import Image from '../../../../Image'
import {useTranslation} from '../../../../../utils/localization/I18nProvider'
import {type SvgString} from '@vexl-next/domain/dist/utility/SvgString.brand'
import profileIconSvg from '../../../images/profileIconSvg'
import {Alert, Linking, Platform} from 'react-native'
import imageIconSvg from '../images/imageIconSvg'
import {Fragment} from 'react'
import editIconSvg from '../images/editIconSvg'
import trashIconSvg from '../images/trashIconSvg'
import webIconSvg from '../images/webIconSvg'
import mediumIconSvg from '../images/mediumIconSvg'
import twitterIconSvg from '../images/twitterIconSvg'
import dataIconSvg from '../images/dataIconSvg'
import cpuIconSvg from '../images/cpuIconSvg'
import customerSupportIconSvg from '../images/customerSupportIconSvg'
import questionIconSvg from '../images/questionIconSvg'
import termsIconSvg from '../images/termsIconSvg'
import coinsIconSvg from '../images/coinsIconSvg'
import faceIdIconSvg from '../images/faceIdIconSvg'
import contactIconSvg from '../images/contactIconSvg'
import {useNavigation} from '@react-navigation/native'
import {useLogout} from '../../../../../state/session'

const RootContainer = styled.View`
  flex: 1;
  margin: 32px 8px 0 8px;
`

const ButtonsGroupContainer = styled.View`
  background-color: #131313;
  border-radius: 10px;
`

const ItemTouchable = styled.TouchableWithoutFeedback``
const ItemInnerContainer = styled.View`
  flex-direction: row;
  height: 66px;
  margin-left: 33px;
  margin-right: 33px;
  align-items: center;
`
const ItemIcon = styled(Image)`
  width: 24px;
  height: 24px;
  stroke: ${({theme}) => theme.colors.grayOnBlack};
  margin-right: 18px;
`
const ItemText = styled(Text)`
  font-size: 18px;
`
const GroupDivider = styled.View`
  height: 16px;
`
const ItemDivider = styled.View`
  height: 2px;
  background-color: ${({theme}) => theme.colors.grey};
  align-self: stretch;
  margin-left: 32px;
`

function Item({
  text,
  icon,
  onPress,
}: {
  text: string | JSX.Element
  icon: SvgString
  onPress: () => void
}): JSX.Element {
  return (
    <ItemTouchable onPress={onPress}>
      <ItemInnerContainer>
        <ItemIcon source={icon} />
        {typeof text === 'string' ? (
          <ItemText fontWeight={500} colorStyle={'white'}>
            {text}
          </ItemText>
        ) : (
          text
        )}
      </ItemInnerContainer>
    </ItemTouchable>
  )
}

function ButtonsSection(): JSX.Element {
  const {t} = useTranslation()
  const navigation = useNavigation()
  const logout = useLogout()

  function todo(): void {
    Alert.alert('To be implemented')
  }

  function openUrl(url: string): () => void {
    return () => {
      void Linking.openURL(url)
    }
  }

  const data: Array<
    Array<{icon: SvgString; text: string | JSX.Element; onPress: () => void}>
  > = [
    [{text: t('settings.items.myOffers'), icon: profileIconSvg, onPress: todo}],
    [
      {
        text: t('settings.items.changeProfilePicture'),
        icon: imageIconSvg,
        onPress: todo,
      },
      {text: t('settings.items.editName'), icon: editIconSvg, onPress: todo},
    ],
    [
      {
        text: t('settings.items.contactsImported'),
        icon: contactIconSvg,
        onPress: () => {
          navigation.navigate('PostLoginFlow', {
            screen: 'ImportContacts',
          })
        },
      },
    ],
    [
      {
        text: `${t('settings.items.setPin')} ${
          Platform.OS === 'ios' ? ` / ${t('settings.items.faceId')}` : ''
        }`,
        icon: faceIdIconSvg,
        onPress: todo,
      },
      {text: t('settings.items.czechCrown'), icon: coinsIconSvg, onPress: todo},
      {
        text: t('settings.items.allowScreenshots'),
        icon: imageIconSvg,
        onPress: todo,
      },
    ],
    [
      {
        text: t('settings.items.termsAndPrivacy'),
        icon: termsIconSvg,
        onPress: () => {
          navigation.navigate('TermsAndConditions')
        },
      },
      {
        text: t('settings.items.faqs'),
        icon: questionIconSvg,
        onPress: () => {
          navigation.navigate('Faqs')
        },
      },
      {
        text: t('settings.items.reportIssue'),
        icon: customerSupportIconSvg,
        onPress: todo,
      },
      {text: t('settings.items.inAppLogs'), icon: cpuIconSvg, onPress: todo},
    ],
    [
      {
        text: t('settings.items.requestKnownData'),
        icon: dataIconSvg,
        onPress: todo,
      },
    ],
    [
      {
        text: (
          <ItemText fontWeight={500} colorStyle={'grayOnBlack'}>
            {t('settings.items.followUsOn')}{' '}
            <ItemText fontWeight={500} colorStyle={'white'}>
              {t('settings.items.twitter')}
            </ItemText>
          </ItemText>
        ),
        icon: twitterIconSvg,
        onPress: openUrl(t('settings.items.twitterUrl')),
      },
      {
        text: (
          <ItemText fontWeight={500} colorStyle={'grayOnBlack'}>
            {t('settings.items.readMoreOn')}{' '}
            <ItemText fontWeight={500} colorStyle={'white'}>
              {t('settings.items.medium')}
            </ItemText>
          </ItemText>
        ),
        icon: mediumIconSvg,
        onPress: openUrl(t('settings.items.mediumUrl')),
      },
      {
        text: (
          <ItemText fontWeight={500} colorStyle={'grayOnBlack'}>
            {t('settings.items.learnMoreOn')}{' '}
            <ItemText fontWeight={500} colorStyle={'white'}>
              {t('settings.items.website')}
            </ItemText>
          </ItemText>
        ),
        icon: webIconSvg,
        onPress: openUrl(`${t('settings.items.websiteUrl')}`),
      },
    ],
    [
      {
        text: (
          <ItemText fontWeight={500} colorStyle={'red'}>
            {t('settings.items.deleteAccount')}
          </ItemText>
        ),
        icon: trashIconSvg,
        onPress: logout,
      },
    ],
  ]

  return (
    <>
      <RootContainer>
        {data.map((group, groupIndex) => (
          <Fragment key={groupIndex}>
            <ButtonsGroupContainer>
              {group.map((item, itemIndex) => (
                <Fragment key={itemIndex}>
                  <Item {...item} />
                  {itemIndex !== group.length - 1 && <ItemDivider />}
                </Fragment>
              ))}
            </ButtonsGroupContainer>
            {groupIndex !== data.length - 1 && <GroupDivider />}
          </Fragment>
        ))}
      </RootContainer>
    </>
  )
}

export default ButtonsSection
