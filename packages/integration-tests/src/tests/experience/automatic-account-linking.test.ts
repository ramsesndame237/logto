import { ConnectorType } from '@logto/connector-kit';
import { AgreeToTermsPolicy, SignInIdentifier, SignInMode } from '@logto/schemas';

import { createUser, deleteUser } from '#src/api/admin-user.js';
import { updateSignInExperience } from '#src/api/sign-in-experience.js';
import { demoAppUrl } from '#src/constants.js';
import { clearConnectorsByTypes, setSocialConnector } from '#src/helpers/connector.js';
import ExpectExperience from '#src/ui-helpers/expect-experience.js';
import { generateEmail, randomString } from '#src/utils.js';

describe('automatic account linking', () => {
  beforeAll(async () => {
    await clearConnectorsByTypes([ConnectorType.Social, ConnectorType.Email, ConnectorType.Sms]);
    await setSocialConnector();
    await updateSignInExperience({
      termsOfUseUrl: null,
      privacyPolicyUrl: null,
      signUp: { identifiers: [], password: true, verify: false },
      signIn: {
        methods: [
          {
            identifier: SignInIdentifier.Username,
            password: true,
            verificationCode: false,
            isPasswordPrimary: true,
          },
        ],
      },
      singleSignOnEnabled: true,
      socialSignInConnectorTargets: ['mock-social'],
    });
  });

  it('should automatically link account', async () => {
    await updateSignInExperience({
      termsOfUseUrl: null,
      privacyPolicyUrl: null,
      socialSignIn: { automaticAccountLinking: true },
    });
    const socialUserId = 'foo_' + randomString();
    const user = await createUser({ primaryEmail: generateEmail() });
    const experience = new ExpectExperience(await browser.newPage());

    await experience.navigateTo(demoAppUrl.href);
    await experience.toProcessSocialSignIn({
      socialUserId,
      socialEmail: user.primaryEmail!,
    });

    experience.toMatchUrl(demoAppUrl);
    await experience.toMatchElement('div', { text: `User ID: ${user.id}` });
    await experience.toClick('div[role=button]', /sign out/i);
    await experience.page.close();

    await deleteUser(user.id);
  });

  it('should automatically link account even if the registration is disabled', async () => {
    await updateSignInExperience({
      termsOfUseUrl: null,
      privacyPolicyUrl: null,
      socialSignIn: { automaticAccountLinking: true },
      signInMode: SignInMode.SignIn,
    });

    const socialUserId = 'foo_' + randomString();
    const user = await createUser({ primaryEmail: generateEmail() });
    const experience = new ExpectExperience(await browser.newPage());

    await experience.navigateTo(demoAppUrl.href);
    await experience.toProcessSocialSignIn({
      socialUserId,
      socialEmail: user.primaryEmail!,
    });

    experience.toMatchUrl(demoAppUrl);
    await experience.toMatchElement('div', { text: `User ID: ${user.id}` });
    await experience.toClick('div[role=button]', /sign out/i);
    await experience.page.close();

    await deleteUser(user.id);

    // Reset the sign-in experience
    await updateSignInExperience({
      signInMode: SignInMode.SignInAndRegister,
    });
  });

  it('should automatically link account without verify terms of use', async () => {
    await updateSignInExperience({
      termsOfUseUrl: 'https://example.com/terms',
      privacyPolicyUrl: 'https://example.com/privacy',
      agreeToTermsPolicy: AgreeToTermsPolicy.ManualRegistrationOnly,
      socialSignIn: { automaticAccountLinking: true },
    });
    const socialUserId = 'foo_' + randomString();
    const user = await createUser({ primaryEmail: generateEmail() });
    const experience = new ExpectExperience(await browser.newPage());

    await experience.navigateTo(demoAppUrl.href);
    await experience.toProcessSocialSignIn({
      socialUserId,
      socialEmail: user.primaryEmail!,
    });

    experience.toMatchUrl(demoAppUrl);
    await experience.toMatchElement('div', { text: `User ID: ${user.id}` });
    await experience.toClick('div[role=button]', /sign out/i);
    await experience.page.close();

    await deleteUser(user.id);
  });

  it('should not automatically link account', async () => {
    await updateSignInExperience({
      termsOfUseUrl: null,
      privacyPolicyUrl: null,
      socialSignIn: { automaticAccountLinking: false },
    });
    const socialUserId = 'foo_' + randomString();
    const user = await createUser({ primaryEmail: generateEmail() });
    const experience = new ExpectExperience(await browser.newPage());

    await experience.navigateTo(demoAppUrl.href);
    await experience.toProcessSocialSignIn({
      socialUserId,
      socialEmail: user.primaryEmail!,
    });

    await experience.toClick('a', 'Create new one instead');
    experience.toMatchUrl(demoAppUrl);
    try {
      await experience.toMatchElement('div', { text: `User ID: ${user.id}`, timeout: 100 });
      throw new Error('User ID should not be displayed');
    } catch {}

    await experience.toClick('div[role=button]', /sign out/i);
    await experience.page.close();

    await deleteUser(user.id);
  });
});
