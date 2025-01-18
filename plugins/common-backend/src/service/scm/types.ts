//write a typescript type below
export type ScmProvisionerOptions = {
    repoUrl: string;
    repoVisibility?: string;
    defaultBranch?: string;
    filesToUpdate?: string[];
    gitCommitMessage?: string;
    gitAuthorName?: string;
    gitAuthorEmail?: string;
    sourcePath?: string;
    targetPath?: string;
    token?: string;
    setUserAsOwner?: boolean;
    topics?: string[];
    workspacePath: string;
    targetBranchName?: string;
    branchName: string;
    title: string;
    commitAction:  'create' | 'update' | 'delete';
}

export interface SerializedFile {
    path: string;
    content: Buffer;
    executable?: boolean;
    symlink?: boolean;
  }