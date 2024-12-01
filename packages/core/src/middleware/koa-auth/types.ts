import { type IRouterParamContext } from 'koa-router';

type Auth = {
  type: 'user' | 'app';
  id: string;
  scopes: Set<string>;
  /** If the request is verified by a verification record, this will be set to `true`. */
  identityVerified?: boolean;
};

export type WithAuthContext<ContextT extends IRouterParamContext = IRouterParamContext> =
  ContextT & {
    auth: Auth;
  };

export type TokenInfo = {
  sub: string;
  clientId: unknown;
  scopes: string[];
};
