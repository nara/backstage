import { coreServices, createBackendModule } from '@backstage/backend-plugin-api';
import { oktaCatalogBackendEntityProviderFactoryExtensionPoint, EntityProviderFactory, OktaOrgEntityProvider } from '@roadiehq/catalog-backend-module-okta/new-backend';
import { loggerToWinstonLogger } from '@backstage/backend-common';
import { Config } from '@backstage/config';

const oktaCatalogBackendModule = createBackendModule({
  pluginId: 'catalog',
  moduleId: 'okta-entity-provider-custom',
  register(env) {
    env.registerInit({
      deps: {
        provider: oktaCatalogBackendEntityProviderFactoryExtensionPoint,
        logger: coreServices.logger,
        config: coreServices.rootConfig,
      },
      async init({ provider, logger, config }) {
        const oktaConfigs = config.getConfigArray('catalog.providers.okta');
        console.log('11111');
        console.log('oktaConfigs', oktaConfigs);
        const factory: EntityProviderFactory = (oktaConfig: Config) => {
          console.log('11112');
          console.log('oktaConfig', oktaConfig);
          return OktaOrgEntityProvider.fromConfig(config, {
            logger: loggerToWinstonLogger(logger),
            userNamingStrategy: 'strip-domain-email',
            groupNamingStrategy: 'kebab-case-name',
          });
        }
        provider.setEntityProviderFactory(factory);
      },
    });
  },
});

export default oktaCatalogBackendModule;