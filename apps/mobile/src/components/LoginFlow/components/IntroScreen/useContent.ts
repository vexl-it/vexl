import {type SvgString} from '@vexl-next/domain/src/utility/SvgString.brand'
import {type ImageSourcePropType} from 'react-native'
import {useTranslation} from '../../../../utils/localization/I18nProvider'
import vexlClubsSvg from '../../../images/vexlClubsSvg'
import {image1, image2} from './images/svgs'

export default function useContent(): Array<{
  svg?: SvgString
  image?: ImageSourcePropType
  title: string
}> {
  const {t} = useTranslation()

  return [
    {
      svg: image1,
      title: t('loginFlow.intro.title1'),
    },
    {
      svg: vexlClubsSvg,
      title: t('loginFlow.intro.vexlClubs'),
    },

    {
      svg: image2,
      title: t('loginFlow.intro.title2'),
    },
    {
      image: require('./images/image3.png'),
      title: t('loginFlow.intro.title3'),
    },
  ]
}
