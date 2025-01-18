/*
 * Copyright 2021 The Backstage Authors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { promises as fs } from 'fs';
import { InputError } from '@backstage/errors';
import { isChildPath } from '@backstage/backend-common';
import { join as joinPath, normalize as normalizePath } from 'path';
import { ScmIntegrationRegistry } from '@backstage/integration';
import { SerializedFile } from './types';
import globby from 'globby';
import limiterFactory from 'p-limit';
import { resolveSafeChildPath } from '@backstage/backend-common';
import { isError } from '@backstage/errors';
const DEFAULT_GLOB_PATTERNS = ['./**', '!.git'];

export const getRepoSourceDirectory = (
  workspacePath: string,
  sourcePath: string | undefined,
) => {
  if (sourcePath) {
    const safeSuffix = normalizePath(sourcePath).replace(
      /^(\.\.(\/|\\|$))+/,
      '',
    );
    const path = joinPath(workspacePath, safeSuffix);
    if (!isChildPath(workspacePath, path)) {
      throw new Error('Invalid source path');
    }
    return path;
  }
  return workspacePath;
};
export type RepoSpec = {
  repo: string;
  host: string;
  owner?: string;
  organization?: string;
  workspace?: string;
  project?: string;
};

export const parseRepoUrl = (
  repoUrl: string,
  integrations: ScmIntegrationRegistry,
): RepoSpec => {
  let parsed;
  try {
    parsed = new URL(`https://${repoUrl}`);
  } catch (error) {
    throw new InputError(
      `Invalid repo URL passed to publisher, got ${repoUrl}, ${error}`,
    );
  }
  const host = parsed.host;
  const owner = parsed.searchParams.get('owner') ?? undefined;
  const organization = parsed.searchParams.get('organization') ?? undefined;
  const workspace = parsed.searchParams.get('workspace') ?? undefined;
  const project = parsed.searchParams.get('project') ?? undefined;

  const type = integrations.byHost(host)?.type;

  if (!type) {
    throw new InputError(
      `No matching integration configuration for host ${host}, please check your integrations config`,
    );
  }

  const repo: string = parsed.searchParams.get('repo')!;
  switch (type) {
    case 'bitbucket': {
      if (host === 'www.bitbucket.org') {
        checkRequiredParams(parsed, 'workspace');
      }
      checkRequiredParams(parsed, 'project', 'repo');
      break;
    }
    case 'gitlab': {
      // project is the projectID, and if defined, owner and repo won't be needed.
      if (!project) {
        checkRequiredParams(parsed, 'owner', 'repo');
      }
      break;
    }
    case 'gerrit': {
      checkRequiredParams(parsed, 'repo');
      break;
    }
    default: {
      checkRequiredParams(parsed, 'repo', 'owner');
      break;
    }
  }

  return { host, owner, repo, organization, workspace, project };
};
export const isExecutable = (fileMode: number) => {
  const executeBitMask = 0o000111;
  const res = fileMode & executeBitMask;
  return res > 0;
};

/**
 * This function checks if the required parameters (given as the `params` argument) are present in the URL
 *
 * @param repoUrl - the URL for the repository
 * @param params - a variadic list of URL query parameter names
 *
 * @throws
 * An InputError exception is thrown if any of the required parameters is not in the URL.
 *
 * @public
 */
function checkRequiredParams(repoUrl: URL, ...params: string[]) {
  for (let i = 0; i < params.length; i++) {
    if (!repoUrl.searchParams.get(params[i])) {
      throw new InputError(
        `Invalid repo URL passed to publisher: ${repoUrl.toString()}, missing ${
          params[i]
        }`,
      );
    }
  }
}

async function asyncFilter<T>(
  array: T[],
  callback: (value: T, index: number, array: T[]) => Promise<boolean>,
): Promise<T[]> {
  const filterMap = await Promise.all(array.map(callback));
  return array.filter((_value, index) => filterMap[index]);
}

export async function serializeDirectoryContents(
  sourcePath: string,
  options?: {
    gitignore?: boolean;
    globPatterns?: string[];
  },
): Promise<SerializedFile[]> {
  const paths = await globby(options?.globPatterns ?? DEFAULT_GLOB_PATTERNS, {
    cwd: sourcePath,
    dot: true,
    gitignore: options?.gitignore,
    followSymbolicLinks: false,
    // In order to pick up 'broken' symlinks, we oxymoronically request files AND folders yet we filter out folders
    // This is because broken symlinks aren't classed as files so we need to glob everything
    onlyFiles: false,
    objectMode: true,
    stats: true,
  });

  const limiter = limiterFactory(10);

  const valid = await asyncFilter(paths, async ({ dirent, path }) => {
    if (dirent.isDirectory()) return false;
    if (!dirent.isSymbolicLink()) return true;

    const safePath = resolveSafeChildPath(sourcePath, path);

    // we only want files that don't exist
    try {
      await fs.stat(safePath);
      return false;
    } catch (e) {
      return isError(e) && e.code === 'ENOENT';
    }
  });

  return Promise.all(
    valid.map(async ({ dirent, path, stats }) => ({
      path,
      content: await limiter(async () => {
        const absFilePath = resolveSafeChildPath(sourcePath, path);
        if (dirent.isSymbolicLink()) {
          return fs.readlink(absFilePath, 'buffer');
        }
        return fs.readFile(absFilePath);
      }),
      executable: isExecutable(stats?.mode ?? 0),
      symlink: dirent.isSymbolicLink(),
    })),
  );
}
