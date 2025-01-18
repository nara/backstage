export interface ScmProvisioner {
    checkIfRepoExists(): Promise<string>;
    checkIfBranchExists(): Promise<boolean>;
    createRepo(ctx: any): Promise<any>;
    createBranch(ctx: any, repoUrl: string): Promise<any>;
    updateBranch(ctx: any, repoUrl: string): Promise<any>;
  }
  
  