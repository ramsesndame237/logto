import { SignInIdentifier } from '@logto/schemas';

import { deleteUser } from '#src/api/admin-user.js';
import { initExperienceClient } from '#src/helpers/client.js';
import { generateNewUser } from '#src/helpers/user.js';

const identifiersTypeToUserProfile = Object.freeze({
  username: 'username',
  email: 'primaryEmail',
  phone: 'primaryPhone',
  userId: '',
});

describe('password verifications', () => {
  it.each([SignInIdentifier.Username, SignInIdentifier.Email, SignInIdentifier.Phone])(
    'should verify with password successfully using %p',
    async (identifier) => {
      const { userProfile, user } = await generateNewUser({
        [identifiersTypeToUserProfile[identifier]]: true,
        password: true,
      });

      const client = await initExperienceClient();

      const { verificationId } = await client.verifyPassword({
        identifier: {
          type: identifier,
          value: userProfile[identifiersTypeToUserProfile[identifier]]!,
        },
        password: userProfile.password,
      });

      expect(verificationId).toBeTruthy();

      await deleteUser(user.id);
    }
  );
});
