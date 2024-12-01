import type { Role } from '@logto/schemas';
import { RoleType } from '@logto/schemas';
import classNames from 'classnames';
import { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import { Trans, useTranslation } from 'react-i18next';
import { Outlet, useLocation, useParams } from 'react-router-dom';
import useSWR, { useSWRConfig } from 'swr';

import Delete from '@/assets/icons/delete.svg?react';
import DetailsPage from '@/components/DetailsPage';
import DetailsPageHeader from '@/components/DetailsPage/DetailsPageHeader';
import RoleIcon from '@/components/RoleIcon';
import { RoleDetailsTabs } from '@/consts/page-tabs';
import ConfirmModal from '@/ds-components/ConfirmModal';
import InlineNotification from '@/ds-components/InlineNotification';
import TabNav, { TabNavItem } from '@/ds-components/TabNav';
import TextLink from '@/ds-components/TextLink';
import type { RequestError } from '@/hooks/use-api';
import useApi from '@/hooks/use-api';
import useTenantPathname from '@/hooks/use-tenant-pathname';
import useTheme from '@/hooks/use-theme';
import useUserPreferences from '@/hooks/use-user-preferences';

import styles from './index.module.scss';
import { type RoleDetailsOutletContext } from './types';

function RoleDetails() {
  const { pathname } = useLocation();
  const { id } = useParams();
  const { t } = useTranslation(undefined, { keyPrefix: 'admin_console' });
  const { navigate } = useTenantPathname();
  const theme = useTheme();

  const isPageHasTable =
    pathname.endsWith(RoleDetailsTabs.Permissions) ||
    pathname.endsWith(RoleDetailsTabs.Users) ||
    pathname.endsWith(RoleDetailsTabs.M2mApps);

  const { data, error, mutate } = useSWR<Role, RequestError>(id && `api/roles/${id}`);
  const { mutate: mutateGlobal } = useSWRConfig();
  const isLoading = !data && !error;

  const {
    data: { m2mRoleNotificationAcknowledged },
    update: updateUserPreferences,
    isLoaded: isUserPreferencesLoaded,
  } = useUserPreferences();
  // Default to true to avoid page flickering
  const isM2mRoleNotificationAcknowledged = isUserPreferencesLoaded
    ? Boolean(m2mRoleNotificationAcknowledged)
    : true;

  const isM2mRole = data?.type === RoleType.MachineToMachine;

  const [isDeletionAlertOpen, setIsDeletionAlertOpen] = useState(false);

  useEffect(() => {
    setIsDeletionAlertOpen(false);
  }, [pathname]);

  const [isDeleting, setIsDeleting] = useState(false);

  const api = useApi();

  const handleDelete = async () => {
    if (!data) {
      return;
    }

    setIsDeleting(true);

    try {
      await api.delete(`api/roles/${data.id}`);
      toast.success(t('role_details.role_deleted', { name: data.name }));
      await mutateGlobal('api/roles');
      navigate('/roles', { replace: true });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <DetailsPage
      backLink="/roles"
      backLinkTitle="role_details.back_to_roles"
      isLoading={isLoading}
      error={error}
      className={classNames(isPageHasTable && styles.withTable)}
      onRetry={mutate}
    >
      {isM2mRole && !isM2mRoleNotificationAcknowledged && (
        <InlineNotification
          action="general.got_it"
          onClick={() => {
            void updateUserPreferences({
              m2mRoleNotificationAcknowledged: true,
            });
          }}
        >
          <Trans
            components={{
              a: <TextLink to="/applications" />,
            }}
          >
            {t('role_details.m2m_role_notification')}
          </Trans>
        </InlineNotification>
      )}
      {data && (
        <>
          <DetailsPageHeader
            icon={<RoleIcon />}
            title={data.name}
            primaryTag={t(
              isM2mRole ? 'role_details.type_m2m_role_tag' : 'role_details.type_user_role_tag'
            )}
            identifier={{ name: 'ID', value: data.id }}
            actionMenuItems={[
              {
                title: 'general.delete',
                icon: <Delete />,
                type: 'danger',
                onClick: () => {
                  setIsDeletionAlertOpen(true);
                },
              },
            ]}
          />
          <ConfirmModal
            isOpen={isDeletionAlertOpen}
            isLoading={isDeleting}
            confirmButtonText="general.delete"
            onCancel={() => {
              setIsDeletionAlertOpen(false);
            }}
            onConfirm={handleDelete}
          >
            {t('role_details.delete_description')}
          </ConfirmModal>
          <TabNav>
            <TabNavItem href={`/roles/${data.id}/${RoleDetailsTabs.Permissions}`}>
              {t('role_details.permissions_tab')}
            </TabNavItem>
            <TabNavItem
              href={`/roles/${data.id}/${
                isM2mRole ? RoleDetailsTabs.M2mApps : RoleDetailsTabs.Users
              }`}
            >
              {t(isM2mRole ? 'role_details.m2m_apps_tab' : 'role_details.users_tab')}
            </TabNavItem>
            <TabNavItem href={`/roles/${data.id}/${RoleDetailsTabs.General}`}>
              {t('role_details.general_tab')}
            </TabNavItem>
          </TabNav>
          <Outlet
            context={
              {
                role: data,
                isDeleting,
                onRoleUpdated: (role: Role) => {
                  void mutate(role);
                },
              } satisfies RoleDetailsOutletContext
            }
          />
        </>
      )}
    </DetailsPage>
  );
}

export default RoleDetails;
