import {useAtomValue} from 'jotai'
import {
  shouldDisplayForceUpdateScreenAtom,
  shouldDisplayMaintenanceScreenAtom,
} from './atoms'
import ForceUpdateScreen from './components/ForceUpdateScreen'
import MaintenanceScreen from './components/MaintenanceScreen'

function MaintenanceAndForceUpdateCheck({
  children,
}: {
  children: React.ReactNode
}): JSX.Element {
  const shouldDisplayMaintenanceScreen = useAtomValue(
    shouldDisplayMaintenanceScreenAtom
  )
  const shouldDisplayForceUpdateScreen = useAtomValue(
    shouldDisplayForceUpdateScreenAtom
  )

  if (shouldDisplayForceUpdateScreen) return <ForceUpdateScreen />
  if (shouldDisplayMaintenanceScreen) return <MaintenanceScreen />

  return <>{children}</>
}

export default MaintenanceAndForceUpdateCheck
