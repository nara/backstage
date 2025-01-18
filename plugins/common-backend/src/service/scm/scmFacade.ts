import { Config } from "@backstage/config";
import { ScmProvisioner } from "./scmInterface";
import { GithubScmProvisioner } from "./github";
import { GitlabScmProvisioner } from "./gitlab";
import { BitbucketScmProvisioner } from "./bitbucket";
import { ScmIntegrationRegistry } from '@backstage/integration';
import { ScmProvisionerOptions } from "./types";

export class ScmFacadeImpl implements ScmProvisioner {
  
    private readonly config: Config;
    private readonly provider: ScmProvisioner;
    private readonly integrations: ScmIntegrationRegistry;
    private readonly scmOptions: ScmProvisionerOptions;

    constructor(options: {
      config: Config,
      integrations: ScmIntegrationRegistry,
      scmOptions: ScmProvisionerOptions
    }) {
      this.config = options.config;
      this.integrations = options.integrations;
      this.scmOptions = options.scmOptions;
      this.provider = this.getProvider();
    }

    getProvider(): ScmProvisioner {
        const provider = this.config.getString('org.scm.provider');
        switch(provider){
            case 'github':
                return new GithubScmProvisioner({ config: this.config });
            case 'gitlab':
                return new GitlabScmProvisioner({ config: this.config, integrations: this.integrations, scmOptions: this.scmOptions });
            case 'bitbucket':
                return new BitbucketScmProvisioner({ config: this.config });
            default:
            throw new Error(`Invalid SCM provider: ${provider}`);
        }
    }

     async checkIfRepoExists(): Promise<string> {
        return this.provider.checkIfRepoExists();
      }
      async checkIfBranchExists(): Promise<any> {
        return this.provider.checkIfBranchExists();
      }
      async createRepo(ctx: any): Promise<any> {
        return this.provider.createRepo(ctx);
      }
      async createBranch(ctx: any, repoUrl: string): Promise<any> {
        return this.provider.createBranch(ctx, repoUrl);
      }
      async updateBranch(ctx: any, repoUrl: string): Promise<any> {
        return this.provider.updateBranch(ctx, repoUrl);
      }
  }