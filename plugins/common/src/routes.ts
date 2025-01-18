import {
  createExternalRouteRef,
  createRouteRef,
  createSubRouteRef,
} from '@backstage/core-plugin-api';

export const rootRouteRef = createRouteRef({
  id: 'common',
});

export const appBuildListTemplateRef = createSubRouteRef({
  id: 'common/appbuilds',
  parent: rootRouteRef,
  path: '/common/appbuilds',
});

export const appBuildDetailTemplateRef = createSubRouteRef({
  id: 'common/appbuilds/appid',
  parent: rootRouteRef,
  path: '/common/appbuilds/:appBuildId',
});

export const appBuildTaskRouteRef = createSubRouteRef({
  id: 'common/task',
  parent: rootRouteRef,
  path: '/common/:taskId',
});

export const appBuildTemplateRouteRef = createSubRouteRef({
  id: 'common/selected-template',
  parent: rootRouteRef,
  path: '/common/:namespace/:templateName',
});