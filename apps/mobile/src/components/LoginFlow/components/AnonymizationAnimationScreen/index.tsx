import {animated, useTransition} from '@react-spring/native'
import {RealLifeInfo} from '@vexl-next/domain/src/general/UserNameAndAvatar.brand'
import {fromSvgString} from '@vexl-next/domain/src/utility/SvgStringOrImageUri.brand'
import {useMemo, useState} from 'react'
import {Stack, Text, styled} from 'tamagui'
import {type LoginStackScreenProps} from '../../../../navigationTypes'
import {useTranslation} from '../../../../utils/localization/I18nProvider'
import randomName from '../../../../utils/randomName'
import randomNumber from '../../../../utils/randomNumber'
import AnonymizationCaption from '../../../AnonymizationCaption/AnonymizationCaption'
import {getAvatarSvg} from '../../../AnonymousAvatar'
import {
  HeaderProxy,
  NextButtonProxy,
} from '../../../PageWithButtonAndProgressHeader'
import UserDataDisplay from './components/UserDataDisplay'

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
