import { SignInIdentifier, SignInMode } from '@logto/schemas';
import classNames from 'classnames';
import type { TFuncKey } from 'i18next';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import Button from '@/components/Button';
import DynamicT from '@/components/DynamicT';
import TextLink from '@/components/TextLink';
import { useSieMethods } from '@/hooks/use-sie';
import useSocialRegister from '@/hooks/use-social-register';
import type { SocialRelatedUserInfo } from '@/types/guard';
import { maskEmail, maskPhone } from '@/utils/format';

import styles from './index.module.scss';
import useBindSocialRelatedUser from './use-social-link-related-user';

type Props = {
  readonly className?: string;
  readonly connectorId: string;
  readonly verificationId: string;
  readonly relatedUser: SocialRelatedUserInfo;
};

const getCreateAccountActionText = (signUpMethods: string[]): TFuncKey => {
  if (
    signUpMethods.includes(SignInIdentifier.Email) &&
    signUpMethods.includes(SignInIdentifier.Phone)
  ) {
    return 'action.link_another_email_or_phone';
  }

  if (signUpMethods.includes(SignInIdentifier.Email)) {
    return 'action.link_another_email';
  }

  if (signUpMethods.includes(SignInIdentifier.Phone)) {
    return 'action.link_another_phone';
  }

  return 'action.create_account_without_linking';
};

const SocialLinkAccount = ({ connectorId, verificationId, className, relatedUser }: Props) => {
  const { t } = useTranslation();
  const { signUpMethods, signInMode } = useSieMethods();

  const bindSocialRelatedUser = useBindSocialRelatedUser();
  const [isBindingUser, setIsBindingUser] = useState(false);

  const registerWithSocial = useSocialRegister(connectorId);

  const actionText = getCreateAccountActionText(signUpMethods);

  const { type, value } = relatedUser;

  return (
    <div className={classNames(styles.container, className)}>
      <div className={styles.desc}>{t('description.social_bind_with_existing')}</div>

      <Button
        title="action.bind"
        i18nProps={{ address: type === 'email' ? maskEmail(value) : maskPhone(value) }}
        isLoading={isBindingUser}
        onClick={async () => {
          setIsBindingUser(true);
          await bindSocialRelatedUser(verificationId);
          setIsBindingUser(false);
        }}
      />

      {signInMode !== SignInMode.SignIn && (
        <div className={styles.hint}>
          <div>
            <DynamicT forKey="description.skip_social_linking" />
          </div>
          <TextLink
            text={actionText}
            onClick={() => {
              void registerWithSocial(verificationId);
            }}
          />
        </div>
      )}
    </div>
  );
};

export default SocialLinkAccount;
