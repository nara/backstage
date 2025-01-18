import { createRouter } from './service/router';
import {
    coreServices,
    createBackendPlugin,
  } from '@backstage/backend-plugin-api';

export const commonBackendPlugin = createBackendPlugin({
    pluginId: 'common-backend',
    register(env) {
        env.registerInit({
        deps: {
            /* omitted dependencies but they remain the same as above */
            logger: coreServices.logger,
            config: coreServices.rootConfig,
            database: coreServices.database,
            // The http router service is used to register the router created by the KubernetesBuilder.
            http: coreServices.httpRouter,
        },
        async init({ config, logger, database, http }) {
            // Note that in a real implementation this would be done by the `KubernetesBuilder` instead,
            // but here we've extracted it into a separate call to highlight the example.
            const router  = await createRouter({
            config,
            logger,
            database
            });
            http.use(router);
        },
        });
    },
});