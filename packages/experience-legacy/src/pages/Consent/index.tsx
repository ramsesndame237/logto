import { ReservedResource } from '@logto/core-kit';
import { type ConsentInfoResponse } from '@logto/schemas';
import { useCallback, useEffect, useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';

import LandingPageLayout from '@/Layout/LandingPageLayout';
import { consent, getConsentInfo } from '@/apis/consent';
import Button from '@/components/Button';
import TermsLinks from '@/components/TermsLinks';
import TextLink from '@/components/TextLink';
import useApi from '@/hooks/use-api';
import useErrorHandler from '@/hooks/use-error-handler';
import useGlobalRedirectTo from '@/hooks/use-global-redirect-to';

import OrganizationSelector, { type Organization } from './OrganizationSelector';
import ScopesListCard from './ScopesListCard';
import UserProfile from './UserProfile';
import styles from './index.module.scss';
import { getRedirectUriOrigin } from './util';

const Consent = () => {
  const handleError = useErrorHandler();
  const asyncConsent = useApi(consent);
  const { t } = useTranslation();
  const redirectTo = useGlobalRedirectTo();

  const [consentData, setConsentData] = useState<ConsentInfoResponse>();
  const [selectedOrganization, setSelectedOrganization] = useState<Organization>();

  const [isConsentLoading, setIsConsentLoading] = useState(false);

  const asyncGetConsentInfo = useApi(getConsentInfo);

  const consentHandler = useCallback(async () => {
    setIsConsentLoading(true);
    const [error, result] = await asyncConsent(selectedOrganization?.id);
    setIsConsentLoading(false);

    if (error) {
      await handleError(error);

      return;
    }

    if (result?.redirectTo) {
      await redirectTo(result.redirectTo);
    }
  }, [asyncConsent, handleError, redirectTo, selectedOrganization?.id]);

  useEffect(() => {
    const getConsentInfoHandler = async () => {
      const [error, result] = await asyncGetConsentInfo();

      if (error) {
        await handleError(error);

        return;
      }

      setConsentData(result);

      // Init the default organization selection
      if (!result?.organizations?.length) {
        return;
      }

      setSelectedOrganization(result.organizations[0]);
    };

    void getConsentInfoHandler();
  }, [asyncGetConsentInfo, handleError]);

  if (!consentData) {
    return null;
  }

  const {
    application: { displayName, name, termsOfUseUrl, privacyPolicyUrl },
  } = consentData;

  const applicationName = displayName ?? name;
  const showTerms = Boolean(termsOfUseUrl ?? privacyPolicyUrl);

  return (
    <LandingPageLayout
      title="description.authorize_title"
      titleInterpolation={{
        name: applicationName,
      }}
      thirdPartyBranding={consentData.application.branding}
    >
      <UserProfile user={consentData.user} />
      <ScopesListCard
        userScopes={consentData.missingOIDCScope}
        /**
         * The org resources is included in the user scopes for compatibility.
         */
        resourceScopes={consentData.missingResourceScopes?.filter(
          ({ resource }) => resource.id !== ReservedResource.Organization
        )}
        appName={applicationName}
        className={styles.scopesCard}
      />
      {consentData.organizations && (
        <OrganizationSelector
          className={styles.organizationSelector}
          organizations={consentData.organizations}
          selectedOrganization={selectedOrganization}
          onSelect={setSelectedOrganization}
        />
      )}
      <div className={styles.footerButton}>
        <Button
          title="action.cancel"
          type="secondary"
          onClick={() => {
            window.location.replace(consentData.redirectUri);
          }}
        />
        <Button title="action.authorize" isLoading={isConsentLoading} onClick={consentHandler} />
      </div>
      {!showTerms && (
        <div className={styles.redirectUri}>
          {t('description.redirect_to', { name: getRedirectUriOrigin(consentData.redirectUri) })}
        </div>
      )}
      {showTerms && (
        <div className={styles.terms}>
          <Trans
            components={{
              link: (
                <TermsLinks
                  inline
                  termsOfUseUrl={termsOfUseUrl ?? ''}
                  privacyPolicyUrl={privacyPolicyUrl ?? ''}
                />
              ),
            }}
          >
            {t('description.authorize_agreement_with_redirect', {
              name,
              uri: getRedirectUriOrigin(consentData.redirectUri),
            })}
          </Trans>
        </div>
      )}
      <div className={styles.footerLink}>
        {t('description.not_you')}{' '}
        <TextLink replace to="/sign-in" text="action.use_another_account" />
      </div>
    </LandingPageLayout>
  );
};

export default Consent;
