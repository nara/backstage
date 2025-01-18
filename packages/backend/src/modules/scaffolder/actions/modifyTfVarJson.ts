import { createTemplateAction } from '@backstage/plugin-scaffolder-backend';
import { ScmIntegrationRegistry } from '@backstage/integration';
import { Config } from '@backstage/config';
import { InputError } from '@backstage/errors';
import fs from 'fs-extra';
import { resolveSafeChildPath } from '@backstage/backend-common';
import {JSONPath} from 'jsonpath-plus';

export function modifyTfVarJsonAction(options: {
  integrations: ScmIntegrationRegistry;
  config: Config;
}) {
  
  return createTemplateAction<{ 
    tfvarsPath: string;
    queryPath: string;
    queryValue?: string;
    formDataJsonStr: string;
    updateNodes: any;
   }>({
    id: 'modify:tfvars:json',
    description:
      'Updates TFVars file based on given input parameters',
    schema: {
      input: {
        type: 'object',
        properties: {
          tfvarsPath: {
            title: 'Path to TFVars file',
            type: 'string',
          },
          queryPath: {
            title: 'Query path to select a node in JSON',
            type: 'string',
          },
          queryValue: {
            title: 'Query path to select a node in JSON',
            type: 'string',
          },
          formDataJsonStr: {
            title: 'Form Data for the layer passed using hidden custom field AppLayerFormDataField',
            type: 'string',
          },
          updateNodes: {
            title: 'Update nodes in json',
            type: 'object',
          },
        },
      },
    },
    async handler(ctx) {
      let tfvarsPath = resolveSafeChildPath(ctx.workspacePath, ctx.input.tfvarsPath);
      const inputFileContents = await fs.readFile(tfvarsPath, 'utf-8');
      
      console.log("ctx.input.queryValue")
      console.log(ctx.input.queryValue)
      let formData = ctx.input.formDataJsonStr ? JSON.parse(ctx.input.formDataJsonStr) : undefined
      let jsonTFvars = JSON.parse(inputFileContents);
      if(ctx.input.queryValue && ctx.input.queryValue.length > 0){
        let queryPathParts = ctx.input.queryPath.split(".")
        let previosNode = jsonTFvars;
        for(let i = 0; i < queryPathParts.length; i++){
          if(Array.isArray(previosNode)){
            previosNode = previosNode.find((node: any) => node[queryPathParts[i]] === ctx.input.queryValue)
          }else{
            previosNode = previosNode[queryPathParts[i]]
          }
        }
        if(previosNode){
          for (const key in ctx.input.updateNodes) {
            previosNode[key] = ctx.input.updateNodes[key];
          }
          let jsString  = JSON.stringify(jsonTFvars, null, 2)
          console.log("writing to file")
          console.log(jsString)
          console.log(tfvarsPath)
          await fs.writeFile(tfvarsPath, jsString);
        }else{
          ctx.logger.error("QueryPath and QueryValue did not match any node in JSON. Please check the input parameters.");
          throw new InputError("QueryPath and QueryValue did not match any node in JSON. Please check the input parameters.");
        }
      }
      else{
        for (const key in ctx.input.updateNodes) {
          console.log("key")
          console.log(key)
          if(typeof ctx.input.updateNodes[key] === 'string' && ctx.input.updateNodes[key].startsWith("formDataPath")){
            console.log("in if condition 0")
            if(!formData){
              throw new InputError("formDataJsonStr is not provided. Please check the input parameters.");
            }
            let formDataPath = ctx.input.updateNodes[key].split("=")[1];
            console.log("in if condition")
            console.log(JSON.stringify(formData, null, 2))
            jsonTFvars[key] = JSONPath({path: formDataPath, json: formData});
          }
          else{
            jsonTFvars[key] = ctx.input.updateNodes[key];
          }
        }
      }
    }
  });
} 
