import { createTemplateAction } from '@backstage/plugin-scaffolder-backend';
import { readdir, emptyDir, remove } from 'fs-extra';

export function createCleanWorkspaceAction() {
  return createTemplateAction<{ filterRegex?: string; emptyDir?: boolean }>({
    id: 'clean:workspace',
    description:
      'Deletes all or filter files from current workspace (temp directory)',
    schema: {
      input: {
        type: 'object',
        properties: {
          filterRegex: {
            title: 'Delete files that match given filter',
            type: 'string',
          },
          emptyDir: {
            title: 'Empty workspace directory',
            type: 'boolean',
          }
        },
      },
    },
    async handler(ctx) {
      ctx.logger.info(JSON.stringify(ctx.input, null, 2));

      if (ctx.input?.emptyDir) {
        ctx.logger.info("Deleting all files and subdirectories from current workspace...");
        try {
          await await emptyDir(ctx.workspacePath)
          ctx.logger.info("Success!");
        } catch (err) {
          ctx.logger.error(err);
        }
      }
      else if(ctx.input?.filterRegex) {
        ctx.logger.info(`Deleting files matching filter ${ctx.input?.filterRegex}...`);
        try {
          let regex = new RegExp(ctx.input?.filterRegex);
          let filterFn = (file: string) => regex.test(file);
          let files = await readdir('dir')
          await files.filter(filterFn).map((file: string) => remove(file))
          ctx.logger.info("Success!");
        } catch (err) {
          ctx.logger.error(err);
        }
      }
    },
  });
}