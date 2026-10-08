import {
  EyeOpen,
  Lock,
  PeopleUsers,
  Typography,
  useTheme,
  YStack,
  type IconProps,
} from '@vexl-next/ui'
import {Array, pipe} from 'effect'

const safetyPoints: ReadonlyArray<{
  icon: React.ComponentType<IconProps>
  title: string
  text: string
}> = [
  {
    icon: PeopleUsers,
    title: 'Only people you’re connected to',
    text: 'Offers reach your phone contacts and their contacts, unless you choose to share one with people nearby. Common friends show how you’re connected.',
  },
  {
    icon: Lock,
    title: 'Encrypted on your phone',
    text: 'Offers, chats and the trade checklist are end-to-end encrypted. Vexl’s servers pass along data they can’t read.',
  },
  {
    icon: EyeOpen,
    title: 'Anonymous until you both agree',
    text: 'You show up as a friend of a friend with a generated avatar. Your nickname, photo or number appear only after you both agree to reveal, and the other person may keep them.',
  },
]

function SafetyPoint({
  icon: Icon,
  title,
  text,
}: (typeof safetyPoints)[number]): React.JSX.Element {
  const theme = useTheme()
  return (
    <YStack
      gap="$4"
      flex={1}
      padding="$7"
      borderRadius="$7"
      backgroundColor="$backgroundSecondary"
    >
      <Icon color={theme.accentYellowPrimary.get()} size={28} />
      <Typography variant="titlesSmall" color="$foregroundPrimary">
        {title}
      </Typography>
      <Typography variant="paragraphSmall" color="$foregroundSecondary">
        {text}
      </Typography>
    </YStack>
  )
}

export function SafetySection(): React.JSX.Element {
  return (
    <section className="page-safety page-width">
      <h2 className="page-title">
        <Typography variant="heading2" color="$foregroundPrimary">
          Why it’s safe
        </Typography>
      </h2>
      <div className="page-safety-points">
        {pipe(
          safetyPoints,
          Array.map((point) => <SafetyPoint key={point.title} {...point} />)
        )}
      </div>
    </section>
  )
}
