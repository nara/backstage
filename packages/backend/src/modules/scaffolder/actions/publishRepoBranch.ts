import { createTemplateAction } from '@backstage/plugin-scaffolder-backend';
import { ScmIntegrationRegistry } from '@backstage/integration';
import { Config } from '@backstage/config';
import { InputError } from '@backstage/errors';
import fs from 'fs-extra';
import { resolveSafeChildPath } from '@backstage/backend-common';
import {JSONPath} from 'jsonpath-plus';
import { ScmProvisioner, ScmFacadeImpl } from '@internal/plugin-common-backend';
import { ScmProvisionerOptions } from '@internal/plugin-common-backend/src/service/scm/types';

export function publishRepoBranchAction(options: {
  integrations: ScmIntegrationRegistry;
  config: Config;
}) {
  
  return createTemplateAction<{ 
    repoUrl: string;
    defaultBranch?: string;
    errorIfRepoExists: boolean;
    repoVisibility?: 'private' | 'internal' | 'public';
    sourcePath?: string;
    targetPath?: string;
    filesToUpdate?: string[];
    token?: string;
    gitCommitMessage?: string;
    gitAuthorName?: string;
    gitAuthorEmail?: string;
    setUserAsOwner?: boolean;
    commitAction: 'create' | 'update' | 'delete';
    branchName: string;
    title: string;
    topics?: string[];
   }>({
    id: 'publish:repo:branch',
    description:
      'Publishes a repo or branch based on given input parameters',
    schema: {
      input: {
        type: 'object',
        required: ['repoUrl', 'commitAction'],
        properties: {
          repoUrl: {
            title: 'Repository Location',
            type: 'string',
            description: `Accepts the format 'gitlab.com?repo=project_name&owner=group_name' where 'project_name' is the repository name and 'group_name' is a group or username`,
          },
          errorIfRepoExists: {
            title: 'Error if Repository Exists',
            type: 'boolean',
            description: `If set to true, the action will fail if the repository already exists. If set to false, the action will update the repository if it exists. The default value is true`,
          },
          repoVisibility: {
            title: 'Repository Visibility',
            type: 'string',
            enum: ['private', 'public', 'internal'],
          },
          defaultBranch: {
            title: 'Default Branch',
            type: 'string',
            description: `Sets the default branch on the repository. The default value is 'master'`,
          },
          filesToUpdate: {
            title: 'Files to update',
            description: 'Files to update in the repository when repo already exists.',
            type: 'array',
            items: {
              type: 'string',
            },
          },
          gitCommitMessage: {
            title: 'Git Commit Message',
            type: 'string',
            description: `Sets the commit message on the repository. The default value is 'initial commit'`,
          },
          gitAuthorName: {
            title: 'Default Author Name',
            type: 'string',
            description: `Sets the default author name for the commit. The default value is 'Scaffolder'`,
          },
          gitAuthorEmail: {
            title: 'Default Author Email',
            type: 'string',
            description: `Sets the default author email for the commit.`,
          },
          sourcePath: {
            title: 'Source Path',
            description:
              'Path within the workspace that will be used as the repository root. If omitted, the entire workspace will be published as the repository.',
            type: 'string',
          },
          targetPath: {
            type: 'string',
            title: 'Repository Subdirectory',
            description: 'Subdirectory of repository to apply changes to',
          },
          token: {
            title: 'Authentication Token',
            type: 'string',
            description: 'The token to use for authorization to GitLab',
          },
          branchName: {
            type: 'string',
            title: 'Source Branch Name',
            description: 'The source branch name of the merge request',
          },
          targetBranchName: {
            type: 'string',
            title: 'Target Branch Name',
            description: 'The target branch name of the merge request',
          },
          title: {
            type: 'string',
            title: 'Merge Request Name',
            description: 'The name for the merge request',
          },
          commitAction: {
            title: 'Commit action',
            type: 'string',
            enum: ['create', 'update', 'delete'],
            description:
              'The action to be used for git commit. Defaults to create.',
          },
          setUserAsOwner: {
            title: 'Set User As Owner',
            type: 'boolean',
            description:
              'Set the token user as owner of the newly created repository. Requires a token authorized to do the edit in the integration configuration for the matching host',
          },
          topics: {
            title: 'Topic labels',
            description: 'Topic labels to apply on the repository.',
            type: 'array',
            items: {
              type: 'string',
            },
          },
        },
      },
      output: {
        type: 'object',
        properties: {
          remoteUrl: {
            title: 'A URL to the repository with the provider',
            type: 'string',
          },
          repoContentsUrl: {
            title: 'A URL to the root of the repository',
            type: 'string',
          },
          projectId: {
            title: 'The ID of the project',
            type: 'string',
          },
          commitHash: {
            title: 'The git commit hash of the initial commit',
            type: 'string',
          },
        },
      },
    },
    async handler(ctx) {
      let scmOptions: ScmProvisionerOptions = { ...ctx.input, workspacePath: ctx.workspacePath, commitAction: ctx.input.commitAction || 'create'   };
      const scmProvisioner: ScmProvisioner = new ScmFacadeImpl({ config: options.config, integrations: options.integrations, scmOptions });
      let repoUrl = await scmProvisioner.checkIfRepoExists();
      if(repoUrl != ""){
        if(ctx.input.commitAction == 'update'){
          if(await scmProvisioner.checkIfBranchExists()){
              await scmProvisioner.updateBranch(ctx, repoUrl);
          }
          else{
              await scmProvisioner.createBranch(ctx, repoUrl);
          }
        }
        else if(ctx.input.commitAction == 'create' && ctx.input.errorIfRepoExists){
          throw new InputError(`Repository already exists at ${repoUrl}`);
        }
      }
      else{
        if(ctx.input.commitAction == 'create'){
          await scmProvisioner.createRepo(ctx);
        }
      }
    }
  });
} 
