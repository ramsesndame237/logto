import { appInsights } from '@logto/app-insights/node';
import type { RequestErrorBody } from '@logto/schemas';
import { isHttpError } from 'http-errors';
import type { Middleware } from 'koa';
import { HttpError } from 'koa';

import { EnvSet } from '#src/env-set/index.js';
import RequestError from '#src/errors/RequestError/index.js';
import { getConsoleLogFromContext } from '#src/utils/console.js';
import { buildAppInsightsTelemetry } from '#src/utils/request.js';

/**
 * The middleware to handle errors.
 *
 * Note: A context-aware console log is required to be present in the context (i.e. `ctx.console`).
 */
export default function koaErrorHandler<StateT, ContextT, BodyT>(): Middleware<
  StateT,
  ContextT,
  BodyT | RequestErrorBody | { message: string }
> {
  return async (ctx, next) => {
    const consoleLog = getConsoleLogFromContext(ctx);

    try {
      await next();
    } catch (error: unknown) {
      if (!EnvSet.values.isUnitTest && !EnvSet.values.isProduction) {
        consoleLog.error(error);
      }

      // Report all exceptions to ApplicationInsights
      void appInsights.trackException(error, buildAppInsightsTelemetry(ctx));

      if (error instanceof RequestError) {
        ctx.status = error.status;
        ctx.body = error.body;

        return;
      }

      // Koa will handle `HttpError` with a built-in manner.
      if (error instanceof HttpError || isHttpError(error)) {
        return;
      }

      // Expose JSON body parsing errors
      if (error instanceof SyntaxError) {
        ctx.status = 400;
        ctx.body = { message: error.message };
        return;
      }

      // Should log 500 errors in prod anyway
      if (EnvSet.values.isProduction) {
        consoleLog.error(error);
      }

      ctx.status = 500;
      ctx.body = { message: 'Internal server error.' };
    }
  };
}
