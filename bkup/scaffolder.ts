import { CatalogClient } from '@backstage/catalog-client';
import { createRouter } from '@backstage/plugin-scaffolder-backend';
import { Router } from 'express';
import type { PluginEnvironment } from '../types';
import { createBuiltinActions } from '@backstage/plugin-scaffolder-backend';
import { ScmIntegrations } from '@backstage/integration';
import { createCleanWorkspaceAction } from './scaffolder/actions/cleanWorkspace';
import { buildManagementGroupJson } from './scaffolder/actions/buildManagementGroupJson';
import { modifyAppNetworkTfVarsAction } from './scaffolder/actions/modifyAppNetworkTfVars';
import { modifyTfVarJsonAction } from './scaffolder/actions/modifyTfVarJson';
import { publishRepoBranchAction } from './scaffolder/actions/publishRepoBranch';
import { debugDisplayFileAction } from './scaffolder/actions/displayFile';
import { generateTargetRepoAction } from './scaffolder/actions/generateTargetRepo';
import { saveEntityJsonAction } from './scaffolder/actions/saveEntityJson';

export default async function createPlugin(
  env: PluginEnvironment,
): Promise<Router> {
  const catalogClient = new CatalogClient({
    discoveryApi: env.discovery,
  });

  //const commonClient = new CommonClient({ discoveryApi: env.discovery });

  const integrations = ScmIntegrations.fromConfig(env.config);

  const builtInActions = createBuiltinActions({
    integrations,
    catalogClient,
    config: env.config,
    reader: env.reader,
  });

  const actions = [...builtInActions, 
    createCleanWorkspaceAction(), 
    buildManagementGroupJson(), 
    modifyAppNetworkTfVarsAction({integrations, config: env.config}), 
    modifyTfVarJsonAction({integrations, config: env.config}),
    publishRepoBranchAction({integrations, config: env.config}),
    generateTargetRepoAction({integrations, config: env.config}),
    debugDisplayFileAction(),
    saveEntityJsonAction({integrations, config: env.config })
  ];

  return await createRouter({
    actions,
    logger: env.logger,
    config: env.config,
    database: env.database,
    reader: env.reader,
    catalogClient,
    identity: env.identity,
  });
}
