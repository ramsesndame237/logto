import { ApplicationType, type ApplicationResponse } from '@logto/schemas';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import ArrowLeft from '@/assets/icons/arrow-left.svg?react';
import Close from '@/assets/icons/close.svg?react';
import { type SelectedGuide } from '@/components/Guide/GuideCard';
import GuideCardGroup from '@/components/Guide/GuideCardGroup';
import { useAppGuideMetadata } from '@/components/Guide/hooks';
import IconButton from '@/ds-components/IconButton';
import Spacer from '@/ds-components/Spacer';

import AppGuide from '../../components/AppGuide';
import { type ApplicationSecretRow } from '../EndpointsAndCredentials';

import styles from './index.module.scss';

type Props = {
  readonly app: ApplicationResponse;
  readonly secrets: ApplicationSecretRow[];
  readonly onClose: () => void;
};

function GuideDrawer({ app, secrets, onClose }: Props) {
  const { t } = useTranslation(undefined, { keyPrefix: 'admin_console.guide' });
  const { getStructuredAppGuideMetadata } = useAppGuideMetadata();
  const [selectedGuide, setSelectedGuide] = useState<SelectedGuide>();

  const appType = useMemo(
    // TODO: @darcy Revisit this section during the implementation of the SAML app guide, note that SAML is currently treated as a Traditional app to prevent TypeScript errors (this is actually feasible since the API for creating SAML apps has not yet been enabled). However, SAML apps cannot modify OIDC config, so the final guide may differ.
    () => (app.type === ApplicationType.SAML ? ApplicationType.Traditional : app.type),
    [app.type]
  );

  const structuredMetadata = useMemo(
    () => getStructuredAppGuideMetadata({ categories: [appType] }),
    [getStructuredAppGuideMetadata, appType]
  );

  const hasSingleGuide = useMemo(() => {
    return structuredMetadata[appType].length === 1;
  }, [appType, structuredMetadata]);

  useEffect(() => {
    if (hasSingleGuide) {
      const guide = structuredMetadata[appType][0];
      if (guide) {
        const { id, metadata } = guide;
        setSelectedGuide({ id, metadata });
      }
    }
  }, [hasSingleGuide, appType, structuredMetadata]);

  return (
    <div className={styles.drawerContainer}>
      <div className={styles.header}>
        {selectedGuide && (
          <>
            {!hasSingleGuide && (
              <>
                <IconButton
                  size="large"
                  onClick={() => {
                    setSelectedGuide(undefined);
                  }}
                >
                  <ArrowLeft />
                </IconButton>
                <div className={styles.separator} />
              </>
            )}
            <span>{t('checkout_tutorial', { name: selectedGuide.metadata.name })}</span>
          </>
        )}
        {!selectedGuide && t('app.select_a_framework')}
        <Spacer />
        <IconButton size="large" onClick={onClose}>
          <Close />
        </IconButton>
      </div>
      {!selectedGuide && (
        <GuideCardGroup
          className={styles.cardGroup}
          categoryName={t(`categories.${appType}`)}
          guides={structuredMetadata[appType]}
          onClickGuide={(guide) => {
            setSelectedGuide(guide);
          }}
        />
      )}
      {selectedGuide && (
        <AppGuide
          isCompact
          className={styles.guide}
          guideId={selectedGuide.id}
          app={app}
          secrets={secrets}
          onClose={() => {
            setSelectedGuide(undefined);
          }}
        />
      )}
    </div>
  );
}

export default GuideDrawer;
