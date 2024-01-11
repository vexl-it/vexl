import UserDataDisplay from './components/UserDataDisplay'
import {useTranslation} from '../../../../utils/localization/I18nProvider'
import AnonymizationCaption from '../../../AnonymizationCaption/AnonymizationCaption'
import {useMemo, useState} from 'react'
import randomNumber from '../../../../utils/randomNumber'
import randomName from '../../../../utils/randomName'
import {animated, useTransition} from '@react-spring/native'
import {getAvatarSvg} from '../../../AnonymousAvatar'
import {fromSvgString} from '@vexl-next/domain/src/utility/SvgStringOrImageUri.brand'
import {RealLifeInfo} from '@vexl-next/domain/src/general/UserNameAndAvatar.brand'
import {type LoginStackScreenProps} from '../../../../navigationTypes'
import {
  HeaderProxy,
  NextButtonProxy,
} from '../../../PageWithButtonAndProgressHeader'
import {Stack, styled, Text} from 'tamagui'

const ContentContainer = styled(animated.View, {
  f: 1,
  ai: 'center',
  jc: 'center',
})

const CaptionContainer = styled(animated.View, {
  ai: 'center',
  mx: '$3',
  mb: '$8',
})

type Props = LoginStackScreenProps<'AnonymizationAnimation'>

function AnonymizationAnimationScreen({
  route: {
    params: {realUserData},
  },
}: Props): JSX.Element {
  const {t} = useTranslation()
  const [anonymized, setAnonymized] = useState(false)

  const anonymizedUserData = useMemo<RealLifeInfo>(
    () =>
      RealLifeInfo.parse({
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
      <HeaderProxy showBackButton={true} progressNumber={1} />
      <Stack f={1} bg="$backgroundBlack">
        {contentTransitions((style, showAnonymized) => {
          if (showAnonymized)
            return (
              <ContentContainer
                style={{...style, transform: [{scale: style.scale}]}}
              >
                <UserDataDisplay
                  realLifeInfo={anonymizedUserData}
                  topText={t('loginFlow.anonymization.afterTitle')}
                />
              </ContentContainer>
            )
          return (
            <ContentContainer
              style={{...style, transform: [{scale: style.scale}]}}
            >
              <UserDataDisplay
                realLifeInfo={realUserData}
                topText={t('loginFlow.anonymization.beforeTitle')}
              />
            </ContentContainer>
          )
        })}

        {contentTransitions((style, showAnonymized) => {
          if (showAnonymized)
            return (
              <CaptionContainer style={{opacity: style.opacity}}>
                <Text ta="center" fos={16} col="$greyOnBlack">
                  {t('loginFlow.anonymization.afterDescription')}
                </Text>
              </CaptionContainer>
            )
          return (
            <CaptionContainer style={{opacity: style.opacity}}>
              <AnonymizationCaption />
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
              //   navigation.navigate('PhoneNumber', {
              //     anonymizedUserData,
              //     realUserData,
              //   })
            }}
            disabled={false}
            text={t('common.continue')}
          />
        )}
      </Stack>
    </>
  )
}

export default AnonymizationAnimationScreen
