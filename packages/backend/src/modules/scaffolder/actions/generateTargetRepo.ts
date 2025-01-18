import { createTemplateAction } from '@backstage/plugin-scaffolder-backend';
import { ScmIntegrationRegistry } from '@backstage/integration';
import { Config } from '@backstage/config';
import { InputError } from '@backstage/errors';
import fs from 'fs-extra';
import nunjucks from 'nunjucks';
import { resolveSafeChildPath } from '@backstage/backend-common';
import { glob } from 'glob';
import path from 'path';

export function generateTargetRepoAction(options: {
  integrations: ScmIntegrationRegistry;
  config: Config;
}) {
  
  return createTemplateAction<{ 
    allParameters: any;
    services: any[];
    perServiceTemplateFiles: string[];
   }>({
    id: 'generate:target:repo',
    description:
      'Generates a target repository based on the given input parameters',
    schema: {
      input: {
        type: 'object',
        properties: {
          allParameters: {
            title: 'All parameters on the form',
            type: 'object',
          },
          services: {
            title: 'Services',
            type: 'array',
          },
          perServiceTemplateFiles: {
            title: 'Per service template files',
            type: 'array',
          },
        },
      },
    },
    async handler(ctx) {
      const env = new nunjucks.Environment();
      env.opts.tags = {
        variableStart: '${{',
        variableEnd: '}}'
      };

      
      const files = glob.sync('**/*.njk', { cwd: ctx.workspacePath, nodir: true });
      for (const file of files) {
        const filePath = path.join(ctx.workspacePath, file);
        const targetDir = path.dirname(filePath);
        const fileContent = fs.readFileSync(filePath, 'utf-8');
        const targetFilePath = path.join(targetDir, path.basename(filePath).replace(".njk", ""));
        if(ctx.input.perServiceTemplateFiles.some(item => filePath.toLowerCase().includes(item.toLowerCase()))){
          for(const service of ctx.input.services){
            ctx.input.allParameters.currentService = service;
            console.log("ctx.input.allParameters: ")
            console.log(JSON.stringify(ctx.input.allParameters, null, 2))
            const renderedContent = env.renderString(fileContent, ctx.input.allParameters);
            const targetFilePath = path.join(targetDir, `${service.name}.yaml`);
            console.log("writing to file ", targetFilePath)
            fs.writeFileSync(targetFilePath, renderedContent);
          }
        }
        else{
          ctx.input.allParameters.current_service = {};
          console.log("else")
          const renderedContent = env.renderString(fileContent, ctx.input.allParameters);
          console.log("writing to file in else ", targetFilePath)
          fs.writeFileSync(targetFilePath, renderedContent);
        }
      }
    }
  });
}