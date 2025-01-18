import { Config } from "@backstage/config";
import { ScmProvisioner } from "./scmInterface";
import { createTemplateAction } from '@backstage/plugin-scaffolder-node';
import { Gitlab } from '@gitbeaker/node';
import { Types } from '@gitbeaker/core';
import path from 'path';
import { ScmIntegrationRegistry } from '@backstage/integration';
import { InputError } from '@backstage/errors';
import { resolveSafeChildPath } from '@backstage/backend-common';
import { ScmProvisionerOptions } from "./types";
import { initRepoAndPush, commitAndPushRepo, cloneAndCreateBranch } from './helpers';
import { getRepoSourceDirectory, parseRepoUrl } from './util';
import { serializeDirectoryContents } from './serializeDirectoryContents';

export class GitlabScmProvisioner implements ScmProvisioner {

    private readonly config: Config;
    private readonly integrations: ScmIntegrationRegistry;
    private readonly scmOptions: ScmProvisionerOptions;
    private readonly api: any;
    private fileRoot: string;
    private repoId: string;
    private integrationConfig: any;

    constructor(options: {
        config: Config,
        integrations: ScmIntegrationRegistry,
        scmOptions: ScmProvisionerOptions
    }) {
        this.config = options.config;
        this.integrations = options.integrations;
        this.scmOptions = options.scmOptions;
        this.fileRoot = '';
        this.repoId = '';
        this.api = this.init();
    }

    init(): any {
        const { host, owner, repo, project } = parseRepoUrl(this.scmOptions.repoUrl, this.integrations);

        this.repoId = project ? project : `${owner}/${repo}`;
        
        let fileRoot: string;
        if (this.scmOptions.sourcePath) {
            fileRoot = resolveSafeChildPath(this.scmOptions.workspacePath, this.scmOptions.sourcePath);
        } else if (this.scmOptions.targetPath) {
            // for backward compatibility
            fileRoot = resolveSafeChildPath(this.scmOptions.workspacePath, this.scmOptions.targetPath);
        } else {
            fileRoot = this.scmOptions.workspacePath;
        }
        this.fileRoot = fileRoot;
        
        this.integrationConfig = this.integrations.gitlab.byHost(host);

        if (!this.integrationConfig) {
            throw new InputError(
                `No matching integration configuration for host ${host}, please check your integrations config`,
            );
        }

        let providedToken = this.scmOptions.token;
        if (!this.integrationConfig.config.token && !providedToken) {
            throw new InputError(`No token available for host ${host}`);
        }

        const token = providedToken ?? this.integrationConfig.config.token!;
        const tokenType = providedToken ? 'oauthToken' : 'token';

        return new Gitlab({
            host: this.integrationConfig.config.baseUrl,
            [tokenType]: token,
        });
    }

    async checkIfRepoExists(): Promise<any> {
        try {
            let projectResult = await this.api.Projects.show(this.repoId);
            return projectResult.http_url_to_repo;
        } catch (error) {
            console.log("*************** error checking repo")
            console.log(error)
            return "";
        }
    }

    async checkIfBranchExists(): Promise<any> {
        try {
            await this.api.Branches.show(this.repoId, this.scmOptions.branchName);
            return true;
        } catch (error) {
            console.log("*************** error checking branch")
            console.log(error)
            return false;
        }
    }

    async createRepo(ctx: any): Promise<any> {

        const { host, owner, repo, project } = parseRepoUrl(this.scmOptions.repoUrl, this.integrations);
        const repoID = project ? project : `${owner}/${repo}`;
        
        let { id: targetNamespace } = (await this.api.Namespaces.show(owner)) as {
            id: number;
        };

        const { id: userId } = (await this.api.Users.current()) as {
            id: number;
        };

        if (!targetNamespace) {
            targetNamespace = userId;
        }

        const { id: projectId, http_url_to_repo } = await this.api.Projects.create({
            namespace_id: targetNamespace,
            name: repo,
            visibility: this.scmOptions.repoVisibility,
            ...(this.scmOptions.topics?.length ? { topics: this.scmOptions.topics } : {}),
        });

        // When setUserAsOwner is true the input token is expected to come from an unprivileged user GitLab
        // OAuth flow. In this case GitLab works in a way that allows the unprivileged user to
        // create the repository, but not to push the default protected branch (e.g. master).
        // In order to set the user as owner of the newly created repository we need to check that the
        // GitLab integration configuration for the matching host contains a token and use
        // such token to bootstrap a new privileged client.
        if (this.scmOptions.setUserAsOwner && this.integrationConfig.config.token) {
            const adminClient = new Gitlab({
            host: this.integrationConfig.config.baseUrl,
            token: this.integrationConfig.config.token,
            });

            await adminClient.ProjectMembers.add(projectId, userId, 50);
        }

        const remoteUrl = (http_url_to_repo as string).replace(/\.git$/, '');
        const repoContentsUrl = `${remoteUrl}/-/blob/${this.scmOptions.defaultBranch}`;

        const gitAuthorInfo = {
            name: this.scmOptions.gitAuthorName
            ? this.scmOptions.gitAuthorName
            : this.config.getOptionalString('scaffolder.defaultAuthor.name'),
            email: this.scmOptions.gitAuthorEmail
            ? this.scmOptions.gitAuthorEmail
            : this.config.getOptionalString('scaffolder.defaultAuthor.email'),
        };
        
        const commitResult = await initRepoAndPush({
            dir: getRepoSourceDirectory(ctx.workspacePath, ctx.input.sourcePath),
            remoteUrl: http_url_to_repo as string,
            defaultBranch: this.scmOptions.defaultBranch,
            auth: {
            username: 'oauth2',
            password: this.scmOptions.token ?? "",
            },
            logger: ctx.logger,
            commitMessage: this.scmOptions.gitCommitMessage
            ? this.scmOptions.gitCommitMessage
            : this.config.getOptionalString('scaffolder.defaultCommitMessage'),
            gitAuthorInfo,
        });

        ctx.output('commitHash', commitResult?.commitHash);
        ctx.output('remoteUrl', remoteUrl);
        ctx.output('repoContentsUrl', repoContentsUrl);
        ctx.output('projectId', projectId);    
    }

    async createBranch(ctx: any, repoUrl: string): Promise<any> {
        let targetBranch = this.scmOptions.targetBranchName;
        if (!targetBranch) {
        const projects = await this.api.Projects.show(this.repoId);

        const { default_branch: defaultBranch } = projects;
            targetBranch = defaultBranch!;
        }

        try {
            await this.api.Branches.create(this.repoId, this.scmOptions.branchName, String(targetBranch));
        } catch (e) {
            throw new InputError(
            `The branch creation failed. Please check that your repo does not already contain a branch named '${this.scmOptions.branchName}'. ${e}`,
            );
        }
        
        await this.commitChangedFiles();
    }

    async updateBranch(): Promise<any> {
        await this.commitChangedFiles();
    }

    async commitChangedFiles(): Promise<any> {
        let fileRoot: string;
        let sourcePath = this.scmOptions.sourcePath;
        let targetPath = this.scmOptions.targetPath;

        if (sourcePath) {
            fileRoot = resolveSafeChildPath(this.scmOptions.workspacePath, sourcePath);
        } else if (targetPath) {
            // for backward compatibility
            fileRoot = resolveSafeChildPath(this.scmOptions.workspacePath, targetPath);
        } else {
            fileRoot = this.scmOptions.workspacePath;
        }
        
        const fileContents = await serializeDirectoryContents(fileRoot, {
            gitignore: true,
          });

        const actions: Types.CommitAction[] = fileContents.map(file => ({
            action: this.scmOptions.commitAction ?? 'create',
            filePath: targetPath
                ? path.posix.join(targetPath, file.path)
                : file.path,
            encoding: 'base64',
            content: file.content.toString('base64'),
            execute_filemode: file.executable,
        }));

        try {
            await this.api.Commits.create(this.repoId, this.scmOptions.branchName, this.scmOptions.title, actions);
        } catch (e) {
            console.log(e)
            throw new InputError(
            `Committing the changes to ${this.scmOptions.branchName} failed. Please check that the sourcePath and targetPath are defined correctly. ${e}`,
            );
        }
    }
}