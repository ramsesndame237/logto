import { appInsights } from '@logto/app-insights/node';
import { condObject, isObject } from '@silverhand/essentials';
import i18next from 'i18next';
import type { Middleware } from 'koa';
import { errors } from 'oidc-provider';
import { z } from 'zod';

import { EnvSet } from '#src/env-set/index.js';
import { getConsoleLogFromContext } from '#src/utils/console.js';
import { buildAppInsightsTelemetry } from '#src/utils/request.js';

/**
 * Supplementary URIs for oidc-provider errors.
 */
const errorUris: Record<string, string> = Object.freeze({
  invalid_grant: 'https://openid.sh/debug/invalid_grant',
});

/**
 * Transform oidc-provider error to a format for the client. This is edited from oidc-provider's
 * own implementation.
 *
 * Note: A context-aware console log is required to be present in the context (i.e. `ctx.console`).
 *
 * @see {@link https://github.com/panva/node-oidc-provider/blob/37d0a6cfb3c618141a44cbb904ce45659438f821/lib/helpers/err_out.js | oidc-provider/lib/helpers/err_out.js}
 */
export const errorOut = ({
  expose,
  message,
  error_description: description,
  ...rest
}: errors.OIDCProviderError) => {
  if (expose) {
    return {
      error: message,
      ...condObject({
        error_description: description,
        scope: 'scope' in rest ? rest.scope : undefined,
      }),
    };
  }

  return {
    error: 'server_error',
    error_description: 'oops! something went wrong',
  };
};

/**
 * Check if the error is a session not found error according to oidc-provider's error description.
 * This is a little dumb but we can't do much about it until oidc-provider provides a custom error
 * handler for all request types.
 *
 * @see {@link https://github.com/search?q=repo%3Apanva%2Fnode-oidc-provider%20SessionNotFound&type=code | oidc-provider SessionNotFound}
 */
const isSessionNotFound = (description?: string) =>
  Boolean(
    ['session', 'not found'].every((word) => description?.includes(word)) ||
      description?.includes('authorization request has expired')
  );

/**
 * Build a unified handler for `oidc-provider` errors by checking if the status is >= 400 and
 * there's a string property error in the response. If an `oidc-provider` error is caught, the
 * handler will add several properties to the response body:
 *
 * - `code`: The error code in Logto's error system. Usually it just prepends `oidc.` to the error
 *   name. For example, `invalid_grant` will be `oidc.invalid_grant`.
 * - `message`: The error message in the current language. If the error code is not found in the
 *   current language, it will fallback to `oidc.provider_error_fallback`.
 * - `error_uri`: The error URI for the error, if available. (OAuth 2.0 spec)
 *
 * The original `error` and `error_description` properties will be kept for compliance with the
 * OAuth 2.0 spec.
 *
 * If the error is not an `oidc-provider` error, the handler will throw the error.
 *
 * @remarks
 * Currently, this is the only way we can check if the error is handled by the `oidc-provider`,
 * because it doesn't call renderError when the [request prefers JSON response](https://github.com/panva/node-oidc-provider/blob/37d0a6cfb3c618141a44cbb904ce45659438f821/lib/shared/error_handler.js#L48-L55).
 *
 * @see {@link errorUris} for the list of error URIs.
 */
export default function koaOidcErrorHandler<StateT, ContextT>(): Middleware<StateT, ContextT> {
  // eslint-disable-next-line complexity
  return async (ctx, next) => {
    try {
      await next();
    } catch (error: unknown) {
      if (!(error instanceof errors.OIDCProviderError)) {
        throw error;
      }

      // Mimic oidc-provider's error handling, thus we can use the unified logic below.
      // See https://github.com/panva/node-oidc-provider/blob/37d0a6cfb3c618141a44cbb904ce45659438f821/lib/shared/error_handler.js
      ctx.status = error.statusCode || 500;
      ctx.body = errorOut(error);

      // Track the original error in App Insights.
      void appInsights.trackException(error, buildAppInsightsTelemetry(ctx));
    }

    // Parse the `parse_error` from the query string.
    // If the `parse_error` is set to false, only returns the original oidc error body.
    // For some third-party connectors, like Google, `code` is considered as a reserved OIDC key,
    // we can't return the error body containing `code` in the error response.
    const queryParametersResult = z
      .object({
        parse_error: z.literal('false').optional(),
      })
      .safeParse(ctx.query);

    const returnRawError =
      queryParametersResult.success && queryParametersResult.data.parse_error === 'false';

    // This is the only way we can check if the error is handled by the oidc-provider, because
    // oidc-provider doesn't call `renderError` when the request prefers JSON response.
    if (ctx.status >= 400 && isObject(ctx.body) && !returnRawError) {
      const parsed = z
        .object({
          error: z.string(),
          error_description: z.string().optional(),
        })
        .safeParse(ctx.body);

      if (parsed.success) {
        const { data } = parsed;

        const code = isSessionNotFound(data.error_description)
          ? 'session.not_found'
          : `oidc.${data.error}`;

        const uri = errorUris[data.error];

        ctx.body = {
          code,
          message: i18next.t(['errors:' + code, 'errors:oidc.provider_error_fallback'], {
            code,
          }),
          error_uri: uri,
          ...ctx.body,
        };

        if (!EnvSet.values.isUnitTest && (!EnvSet.values.isProduction || ctx.status >= 500)) {
          getConsoleLogFromContext(ctx).error(ctx.body);
        }

        void appInsights.trackException(ctx.body, buildAppInsightsTelemetry(ctx));
      }
    }
  };
}
