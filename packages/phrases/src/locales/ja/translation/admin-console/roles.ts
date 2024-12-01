const roles = {
  page_title: 'ロール',
  title: 'ロール',
  subtitle:
    'ロールには、ユーザーが実行できるアクションを決定する権限が含まれます。RBACは、特定のアクションのためにリソースにアクセスするためにユーザーに権限を付与するために、ロールを使用します。',
  create: 'ロールを作成する',
  role_name: '役割名',
  role_type: '役割タイプ',
  type_user: 'ユーザー',
  type_machine_to_machine: 'マシン間',
  role_description: '説明',
  role_name_placeholder: 'ロールの名前を入力してください',
  role_description_placeholder: 'ロールの説明を入力してください',
  col_roles: 'ロール',
  col_type: 'タイプ',
  col_description: '説明',
  col_assigned_entities: '割り当てられました',
  user_counts: '{{count}} ユーザー',
  application_counts: '{{count}} アプリ',
  user_count: '{{count}} ユーザー',
  application_count: '{{count}} アプリ',
  assign_permissions: '権限の割り当て',
  create_role_title: 'ロールを作成する',
  create_role_description: 'ロールを使用して権限を整理し、ユーザーに割り当てます。',
  create_role_button: 'ロールを作成する',
  role_created: '{{name}}ロールが正常に作成されました。',
  search: 'ロール名、説明、またはIDで検索',
  placeholder_title: 'ロール',
  placeholder_description:
    'ロールは、ユーザーに割り当てられる権限のグループです。ロールを作成する前に、まず権限を追加してください。',
  assign_roles: 'ロールを割り当てる',
  management_api_access_notification:
    'Logto 管理 API へのアクセスには、管理 API 権限を持つ役割を選択してください<flag/>。',
  with_management_api_access_tip:
    'このマシン間役割には、Logto 管理 API のアクセス権が含まれています',
  role_creation_hint: '適切なロールが見つかりませんか？<a>ロール を作成する</a>',
};

export default Object.freeze(roles);
