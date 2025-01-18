import { Utils } from "../../../utils";

import { createTemplateAction } from '@backstage/plugin-scaffolder-backend';

export function buildManagementGroupJson() {
  return createTemplateAction<{ level1OrgName: string; level2Groups: string[], level3Groups?: { name: string, level2Index: number }[], level4Groups?: { name: string, level3Index: number }[]  }>({
    id: 'custom:azure:buildManagementGroupJson',
    description:
      'Creates JSON object for Azure Management Group from input parameters',
    schema: {
      input: {
        type: 'object',
        properties: {
          level1OrgName: {
            title: 'Level 1',
            type: 'string',
          },
          level2Groups: {
            title: 'Level 2',
            type: 'array',
          },
          level3Groups: {
            title: 'Level 3',
            type: 'array',
          },
          level4Groups: {
            title: 'Level 4',
            type: 'array',
          },
          emptyDir: {
            title: 'Empty workspace directory',
            type: 'boolean',
          }
        },
      },
      output: {
        type: 'object',
        properties: {
          managementGroupMapVar: {
            title: 'Management group map variable value as needed by TF variable file',
            type: 'string',
          }
        },
      },
    },
    async handler(ctx) {
      //ctx.logger.info(JSON.stringify(ctx.input, null, 2));
      let jsonObject: any = {}
      jsonObject[ctx.input.level1OrgName] = {}
      for (let i = 0; i < ctx.input.level2Groups.length; i++) {
        jsonObject[ctx.input.level1OrgName][ctx.input.level2Groups[i]] = {}
      }
      if(ctx.input.level3Groups){
        for (let i = 0; i < ctx.input.level3Groups.length; i++) {
          let level3Item = ctx.input.level3Groups[i]
          let level2Item = ctx.input.level2Groups[level3Item.level2Index-1]
          jsonObject[ctx.input.level1OrgName][level2Item][level3Item.name] = {}
        }
      }
      if(ctx.input.level3Groups && ctx.input.level4Groups){
        for (let i = 0; i < ctx.input.level4Groups?.length; i++) {
          let level4Item = ctx.input.level4Groups[i]
          let level3Item = ctx.input.level3Groups[level4Item.level3Index-1]
          let level2Item = ctx.input.level2Groups[level3Item.level2Index-1]
          jsonObject[ctx.input.level1OrgName][level2Item][level3Item.name][level4Item.name] = {}
        }
      }
      let result = `{\n${Utils.convertToTfvars(jsonObject, ' ')}\n}` 
      ctx.logger.info(result);
      ctx.output('managementGroupMapVar', result)
    },
  });
}