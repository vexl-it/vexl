import styled from '@emotion/native'
import UserDataDisplay from './components/UserDataDisplay'
import {useTranslation} from '../../../../utils/localization/I18nProvider'
import AnonymizationCaption from '../../../AnonymizationCaption/AnonymizationCaption'
import {useMemo, useState} from 'react'
import randomNumber from '../../../../utils/randomNumber'
import randomName from '../../../../utils/randomName'
import {animated, useTransition} from '@react-spring/native'
import {getAvatarSvg} from '../../../AnonymousAvatar'
import Text from '../../../Text'
import {fromSvgString} from '@vexl-next/domain/dist/utility/SvgStringOrImageUri.brand'
import {UserNameAndAvatar} from '@vexl-next/domain/dist/general/UserNameAndAvatar.brand'
import {type LoginStackScreenProps} from '../../../../navigationTypes'
import {
  HeaderProxy,
  NextButtonProxy,
} from '../../../PageWithButtonAndProgressHeader'

const RootContainer = styled.View`
  background-color: ${({theme}) => theme.colors.backgroundBlack};
  flex: 1;
`

const ContentContainer = styled(animated.View)`
  flex: 1;
  align-items: center;
  justify-content: center;
`
const UserDataDisplayStyled = styled(UserDataDisplay)``

const CaptionContainer = styled(animated.View)`
  align-items: center;
  margin: 0 12px 40px 12px;
`
const AnonymizationCaptionStyled = styled(AnonymizationCaption)``

const ExplanationCaption = styled(Text)`
  font-size: 16px;
  text-align: center;
`

type Props = LoginStackScreenProps<'AnonymizationAnimation'>

function AnonymizationAnimationScreen({
  navigation,
  route: {
    params: {realUserData},
  },
}: Props): JSX.Element {
  const {t} = useTranslation()
  const [anonymized, setAnonymized] = useState(false)

  const anonymizedUserData = useMemo<UserNameAndAvatar>(
    () =>
      UserNameAndAvatar.parse({
        image: fromSvgString(getAvatarSvg(randomNumber(0, 3))),
        userName: randomName(),
      }),
    []
  )

  const contentTransitions = useTransition(anonymized, {
    from: {opacity: 0, scale: 0},
    enter: {opacity: 1, scale: 1},
    leave: {opacity: 0, scale: 0},
    config: {
      friction: 10,
    },
    exitBeforeEnter: true,
  })

  return (
    <>
      <HeaderProxy showBackButton={true} progressNumber={undefined} />
      <RootContainer>
        {contentTransitions((style, showAnonymized) => {
          if (showAnonymized)
            return (
              <ContentContainer
                style={{...style, transform: [{scale: style.scale}]}}
              >
                <UserDataDisplayStyled
                  userNameAndAvatar={anonymizedUserData}
                  topText={t('loginFlow.anonymization.beforeTitle')}
                ></UserDataDisplayStyled>
              </ContentContainer>
            )
          return (
            <ContentContainer
              style={{...style, transform: [{scale: style.scale}]}}
            >
              <UserDataDisplayStyled
                userNameAndAvatar={realUserData}
                topText={t('loginFlow.anonymization.beforeTitle')}
              ></UserDataDisplayStyled>
            </ContentContainer>
          )
        })}

        {contentTransitions((style, showAnonymized) => {
          if (showAnonymized)
            return (
              <CaptionContainer style={{opacity: style.opacity}}>
                <ExplanationCaption colorStyle="gray">
                  {t('loginFlow.anonymization.afterDescription')}
                </ExplanationCaption>
              </CaptionContainer>
            )
          return (
            <CaptionContainer style={{opacity: style.opacity}}>
              <AnonymizationCaptionStyled />
            </CaptionContainer>
          )
        })}
        {!anonymized ? (
          <NextButtonProxy
            onPress={() => {
              setAnonymized((v) => !v)
            }}
            disabled={false}
            text={t('loginFlow.anonymization.action')}
          />
        ) : (
          <NextButtonProxy
            onPress={() => {
              navigation.navigate('PhoneNumber', {
                anonymizedUserData,
                realUserData,
              })
            }}
            disabled={false}
            text={t('common.continue')}
          />
        )}
      </RootContainer>
    </>
  )
}

export default AnonymizationAnimationScreen
