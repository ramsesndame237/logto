import type router from '@logto/cloud/routes';
import { type RouterRoutes } from '@withtyped/client';
import { type z, type ZodType } from 'zod';

type GetRoutes = RouterRoutes<typeof router>['get'];
type PostRoutes = RouterRoutes<typeof router>['post'];

type RouteResponseType<T extends { search?: unknown; body?: unknown; response?: ZodType }> =
  z.infer<NonNullable<T['response']>>;
type RouteRequestBodyType<T extends { search?: unknown; body?: ZodType; response?: unknown }> =
  z.infer<NonNullable<T['body']>>;

export type Subscription = RouteResponseType<GetRoutes['/api/tenants/my/subscription']>;

type CompleteSubscriptionUsage = RouteResponseType<GetRoutes['/api/tenants/my/subscription-usage']>;

/**
 * @remarks
 * The `auditLogsRetentionDays` will be handled by cron job in Azure Functions, outdated audit logs will be removed automatically.
 */
export type SubscriptionQuota = Omit<
  CompleteSubscriptionUsage['quota'],
  // Since we are deprecation the `organizationsEnabled` key soon (use `organizationsLimit` instead), we exclude it from the usage keys for now to avoid confusion.
  'auditLogsRetentionDays' | 'organizationsEnabled'
>;

export type SubscriptionUsage = Omit<
  CompleteSubscriptionUsage['usage'],
  // Since we are deprecation the `organizationsEnabled` key soon (use `organizationsLimit` instead), we exclude it from the usage keys for now to avoid confusion.
  'organizationsEnabled'
>;

export type ReportSubscriptionUpdatesUsageKey = Exclude<
  RouteRequestBodyType<PostRoutes['/api/tenants/my/subscription/item-updates']>['usageKey'],
  // Since we are deprecation the `organizationsEnabled` key soon (use `organizationsLimit` instead), we exclude it from the usage keys for now to avoid confusion.
  'organizationsEnabled'
>;

// Have to manually define this variable since we can only get the literal union from the @logto/cloud/routes module.
export const allReportSubscriptionUpdatesUsageKeys = Object.freeze([
  'machineToMachineLimit',
  'resourcesLimit',
  'mfaEnabled',
  'organizationsLimit',
  'tenantMembersLimit',
  'enterpriseSsoLimit',
  'hooksLimit',
]) satisfies readonly ReportSubscriptionUpdatesUsageKey[];
