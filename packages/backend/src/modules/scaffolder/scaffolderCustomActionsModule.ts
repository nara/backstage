import { scaffolderActionsExtensionPoint } from '@backstage/plugin-scaffolder-node/alpha';
import { coreServices, createBackendModule } from '@backstage/backend-plugin-api';
import { DefaultGithubCredentialsProvider, ScmIntegrations, } from '@backstage/integration';
import { buildManagementGroupJson, createCleanWorkspaceAction, debugDisplayFileAction, generateTargetRepoAction, modifyAppNetworkTfVarsAction, 
  modifyTfVarJsonAction, publishRepoBranchAction, saveEntityJsonAction
} from './actions';

export const scaffolderCustionActionsModule = createBackendModule({
    pluginId: 'scaffolder', // name of the plugin that the module is targeting
    moduleId: 'custom-extensions',
    register(env) {
      env.registerInit({
        deps: {
          scaffolder: scaffolderActionsExtensionPoint,
          config: coreServices.rootConfig,
        },
        async init({ scaffolder, config /* ..., other dependencies */ }) {
          const integrations = ScmIntegrations.fromConfig(config);
          scaffolder.addActions(buildManagementGroupJson(), debugDisplayFileAction(), 
          generateTargetRepoAction({ integrations, config }),
          modifyAppNetworkTfVarsAction({ integrations, config }),
          modifyTfVarJsonAction({ integrations, config }),
          publishRepoBranchAction({ integrations, config }),
          saveEntityJsonAction({ integrations, config }));
        },
      });
    },
  });