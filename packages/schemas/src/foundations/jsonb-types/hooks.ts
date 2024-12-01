import { z } from 'zod';

/**
 * We categorize the hook events into two types:
 *
 * InteractionHookEvent: The hook events that are triggered by user interactions.
 * DataHookEvent: The hook events that are triggered by Logto data mutations.
 */

// InteractionHookEvent
export enum InteractionHookEvent {
  PostRegister = 'PostRegister',
  PostSignIn = 'PostSignIn',
  PostResetPassword = 'PostResetPassword',
}

// DataHookEvent
export enum DataHookSchema {
  User = 'User',
  Role = 'Role',
  Scope = 'Scope',
  Organization = 'Organization',
  OrganizationRole = 'OrganizationRole',
  OrganizationScope = 'OrganizationScope',
}

enum DataHookBasicMutationType {
  Created = 'Created',
  Deleted = 'Deleted',
}

enum DataHookDetailMutationType {
  Updated = 'Updated',
}

type BasicDataHookEvent = `${DataHookSchema}.${DataHookBasicMutationType}`;

// Custom DataHook mutable schemas
type CustomDataHookMutableSchema =
  | `${DataHookSchema}.Data`
  | `${DataHookSchema.User}.SuspensionStatus`
  | `${DataHookSchema.Role}.Scopes`
  | `${DataHookSchema.Organization}.Membership`
  | `${DataHookSchema.OrganizationRole}.Scopes`;

type DataHookPropertyUpdateEvent =
  `${CustomDataHookMutableSchema}.${DataHookDetailMutationType.Updated}`;

export type DataHookEvent = BasicDataHookEvent | DataHookPropertyUpdateEvent;

/** The hook event values that can be registered. */
export const hookEvents = Object.freeze([
  InteractionHookEvent.PostRegister,
  InteractionHookEvent.PostSignIn,
  InteractionHookEvent.PostResetPassword,
  'User.Created',
  'User.Deleted',
  'User.Data.Updated',
  'User.SuspensionStatus.Updated',
  'Role.Created',
  'Role.Deleted',
  'Role.Data.Updated',
  'Role.Scopes.Updated',
  'Scope.Created',
  'Scope.Deleted',
  'Scope.Data.Updated',
  'Organization.Created',
  'Organization.Deleted',
  'Organization.Data.Updated',
  'Organization.Membership.Updated',
  'OrganizationRole.Created',
  'OrganizationRole.Deleted',
  'OrganizationRole.Data.Updated',
  'OrganizationRole.Scopes.Updated',
  'OrganizationScope.Created',
  'OrganizationScope.Deleted',
  'OrganizationScope.Data.Updated',
] as const satisfies Array<InteractionHookEvent | DataHookEvent>);

/** The type of hook event values that can be registered. */
export type HookEvent = (typeof hookEvents)[number];

export const hookEventGuard = z.enum(hookEvents);

export const hookEventsGuard = hookEventGuard.array();

export type HookEvents = z.infer<typeof hookEventsGuard>;

export const interactionHookEventGuard = z.nativeEnum(InteractionHookEvent);

/**
 * Hook configuration for web hook.
 */
export const hookConfigGuard = z.object({
  /** We don't need `type` since v1 only has web hook */
  // type: 'web';
  /** Method fixed to `POST` */
  url: z.string(),
  /** Additional headers that attach to the request */
  headers: z.record(z.string()).optional(),
  /**
   * @deprecated
   * Retry times when hook response status >= 500.
   * Now the retry times is fixed to 3.
   * Keep for backward compatibility.
   */
  retries: z.number().gte(0).lte(3).optional(),
});

export type HookConfig = z.infer<typeof hookConfigGuard>;

type ApiMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

/**
 * Management API hooks registration.
 * Define the hook event that should be triggered when the management API is called.
 */
export const managementApiHooksRegistration = Object.freeze({
  'POST /users': 'User.Created',
  // `User.Deleted` event is triggered manually in the `DELETE /users/:userId` route for better payload control
  'PATCH /users/:userId': 'User.Data.Updated',
  'PATCH /users/:userId/custom-data': 'User.Data.Updated',
  'PATCH /users/:userId/profile': 'User.Data.Updated',
  'PATCH /users/:userId/password': 'User.Data.Updated',
  'PATCH /users/:userId/is-suspended': 'User.SuspensionStatus.Updated',
  'POST /roles': 'Role.Created',
  'DELETE /roles/:id': 'Role.Deleted',
  'PATCH /roles/:id': 'Role.Data.Updated',
  'POST /roles/:id/scopes': 'Role.Scopes.Updated',
  'DELETE /roles/:id/scopes/:scopeId': 'Role.Scopes.Updated',
  'POST /resources/:resourceId/scopes': 'Scope.Created',
  'DELETE /resources/:resourceId/scopes/:scopeId': 'Scope.Deleted',
  'PATCH /resources/:resourceId/scopes/:scopeId': 'Scope.Data.Updated',
  'POST /organizations': 'Organization.Created',
  'DELETE /organizations/:id': 'Organization.Deleted',
  'PATCH /organizations/:id': 'Organization.Data.Updated',
  'POST /organization-roles': 'OrganizationRole.Created',
  'DELETE /organization-roles/:id': 'OrganizationRole.Deleted',
  'PATCH /organization-roles/:id': 'OrganizationRole.Data.Updated',
  'POST /organization-scopes': 'OrganizationScope.Created',
  'DELETE /organization-scopes/:id': 'OrganizationScope.Deleted',
  'PATCH /organization-scopes/:id': 'OrganizationScope.Data.Updated',
  'PUT /organization-roles/:id/scopes': 'OrganizationRole.Scopes.Updated',
  'POST /organization-roles/:id/scopes': 'OrganizationRole.Scopes.Updated',
  'DELETE /organization-roles/:id/scopes/:organizationScopeId': 'OrganizationRole.Scopes.Updated',
} satisfies Record<`${ApiMethod} ${string}`, DataHookEvent>);
