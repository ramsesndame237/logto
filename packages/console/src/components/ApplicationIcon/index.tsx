import { ApplicationType, Theme } from '@logto/schemas';

import {
  darkModeApplicationIconMap,
  lightModeApplicationIconMap,
  thirdPartyApplicationIcon,
  thirdPartyApplicationIconDark,
} from '@/consts';
import useTheme from '@/hooks/use-theme';

type Props = {
  readonly type: ApplicationType;
  readonly className?: string;
  readonly isThirdParty?: boolean;
};

const getIcon = (type: ApplicationType, isLightMode: boolean, isThirdParty?: boolean) => {
  // We have ensured that SAML applications are always third party in DB schema, we use `??` here to make TypeScript happy.
  // TODO: @darcy fix this when SAML application <Icon /> is ready
  if (isThirdParty ?? type === ApplicationType.SAML) {
    return isLightMode ? thirdPartyApplicationIcon : thirdPartyApplicationIconDark;
  }

  return isLightMode ? lightModeApplicationIconMap[type] : darkModeApplicationIconMap[type];
};

function ApplicationIcon({ type, className, isThirdParty = false }: Props) {
  const theme = useTheme();
  const isLightMode = theme === Theme.Light;
  const Icon = getIcon(type, isLightMode, isThirdParty);

  return <Icon className={className} />;
}

export default ApplicationIcon;
