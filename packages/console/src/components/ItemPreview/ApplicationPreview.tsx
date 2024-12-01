import { type Application, ApplicationType } from '@logto/schemas';
import { useTranslation } from 'react-i18next';

import ApplicationIcon from '@/components/ApplicationIcon';
import { applicationTypeI18nKey } from '@/types/applications';

import ItemPreview from '.';
import styles from './index.module.scss';

const applicationsPathname = '/applications';
const buildDetailsPathname = (id: string) => `${applicationsPathname}/${id}`;

type Props = {
  readonly data: Pick<Application, 'id' | 'name' | 'isThirdParty' | 'type'>;
};

function ApplicationPreview({ data: { id, name, isThirdParty, type } }: Props) {
  const { t } = useTranslation(undefined, { keyPrefix: 'admin_console' });

  return (
    <ItemPreview
      title={name}
      subtitle={
        // We have ensured that SAML applications are always third party in DB schema, we use `||` here to make TypeScript happy.
        // TODO: @darcy fix this when SAML app preview is ready
        isThirdParty || type === ApplicationType.SAML
          ? t(`${applicationTypeI18nKey.thirdParty}.title`)
          : t(`${applicationTypeI18nKey[type]}.title`)
      }
      icon={<ApplicationIcon className={styles.icon} type={type} isThirdParty={isThirdParty} />}
      to={buildDetailsPathname(id)}
    />
  );
}
export default ApplicationPreview;
