import { createPlugin, createRoutableExtension,
   createApiFactory, identityApiRef,
   discoveryApiRef } from '@backstage/core-plugin-api';

import { rootRouteRef } from './routes';
import { commonApiRef, CommonClient } from '@internal/common-package';

import {
  createScaffolderFieldExtension,
  scaffolderApiRef,
} from '@backstage/plugin-scaffolder-react';

export const commonPlugin = createPlugin({
  id: 'common',
  routes: {
    root: rootRouteRef,
  },
  apis: [
    createApiFactory({
      api: commonApiRef,
      deps: {
        identityApi: identityApiRef,
        discoveryApi: discoveryApiRef,
      },
      factory: ({ identityApi, discoveryApi }) =>
        new CommonClient({ identityApi, discoveryApi }),
    }),
  ],
});

export const AppBuildPage = commonPlugin.provide(
  createRoutableExtension({
    name: 'AppBuildPage',
    component: () =>
      import('./components/Router').then(m => m.Router),
    mountPoint: rootRouteRef,
  }),
);