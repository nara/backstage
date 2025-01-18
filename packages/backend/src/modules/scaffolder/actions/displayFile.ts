import { createTemplateAction } from '@backstage/plugin-scaffolder-backend';
import { readdir, emptyDir, remove } from 'fs-extra';
import path from 'path';
import fs from 'fs';

export function debugDisplayFileAction() {
  return createTemplateAction<{ filePath: string; }>({
    id: 'debug:displayFile',
    description:
      'Display the contents of a file in the workspace',
    schema: {
      input: {
        type: 'object',
        properties: {
          filePath: {
            title: 'File path',
            type: 'string',
          }
        },
      },
    },
    async handler(ctx) {

      const relativeFilePath = path.join(ctx.workspacePath, ctx.input.filePath);
      ctx.logger.info(`Reading file ${relativeFilePath}...`);
      const content = fs.readFileSync(relativeFilePath, 'utf8');
      
      ctx.logger.info(`Contents of file ${relativeFilePath}:`);
      ctx.logger.info(content);
    },
  });
}