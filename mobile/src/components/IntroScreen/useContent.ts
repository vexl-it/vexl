import {useTranslation} from '../../utils/localization/I18nProvider'

export default function useContent(): Array<{lottie: string; title: string}> {
  const {t} = useTranslation()

  return [
    {
      lottie: require('./lottie/vexl_intro_01.json'),
      title: t('intro.title1'),
    },
    {
      lottie: require('./lottie/vexl_intro_02.json'),
      title: t('intro.title2'),
    },
    {
      lottie: require('./lottie/vexl_intro_03.json'),
      title: t('intro.title3'),
    },
  ]
}
