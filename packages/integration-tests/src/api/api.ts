import { formUrlEncodedHeaders } from '@logto/shared';
import { appendPath } from '@silverhand/essentials';
import ky from 'ky';

import { logtoConsoleUrl, logtoUrl, logtoCloudUrl } from '#src/constants.js';

const api = ky.extend({
  prefixUrl: appendPath(new URL(logtoUrl), 'api'),
});

export default api;

export const baseApi = ky.extend({
  prefixUrl: new URL(logtoUrl),
});

// TODO: @gao rename
export const authedAdminApi = api.extend({
  headers: {
    'development-user-id': 'integration-test-admin-user',
  },
});

export const adminTenantApi = ky.extend({
  prefixUrl: appendPath(new URL(logtoConsoleUrl), 'api'),
});

export const authedAdminTenantApi = adminTenantApi.extend({
  headers: {
    'development-user-id': 'integration-test-admin-user',
  },
});

export const cloudApi = ky.extend({
  prefixUrl: appendPath(new URL(logtoCloudUrl), 'api'),
});

export const oidcApi = ky.extend({
  headers: formUrlEncodedHeaders,
  prefixUrl: appendPath(new URL(logtoUrl), 'oidc'),
});
