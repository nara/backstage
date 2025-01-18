import { createTemplateAction } from '@backstage/plugin-scaffolder-backend';
import { ScmIntegrationRegistry } from '@backstage/integration';
import { Config } from '@backstage/config';
import { InputError } from '@backstage/errors';
import fs from 'fs-extra';
import { resolveSafeChildPath } from '@backstage/backend-common';

export function modifyAppNetworkTfVarsAction(options: {
  integrations: ScmIntegrationRegistry;
  config: Config;
}) {
  
  return createTemplateAction<{ 
    tfvarsPath: string;
    action: string;
    vnetName: string;
    region: string;
    ipRange: string;
    subnets: string[];
    subnetToActOn: string;
    serviceEndpoints: string[];
    subnetDelegations: string[];
   }>({
    id: 'modify:tfvars:appnetwork',
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
          action: {
            title: 'Action to perform',
            type: 'string',
          },
          vnetName: {
            title: 'VNet name',
            type: 'string',
          },
          region: {
            title: 'Region',
            type: 'string',
          },
          ipRange: {
            title: 'IP range',
            type: 'string',
          },
          subnets: {
            title: 'Subnets',
            type: 'array',
          },
          subnetToActOn: {
            title: 'Subnet to delete',
            type: 'string',
          },
          serviceEndpoints: {
            title: 'Service Endpoints',
            type: 'array',
          },
          subnetDelegations: {
            title: 'Subnet Delegations',
            type: 'array',
          }
        },
      },
    },
    async handler(ctx) {
      //write typescript code to create a branch in gitlab by calling API
      fs.readdirSync(ctx.workspacePath).forEach((file: string) => {
        console.log(file);
      });
      let tfvarsPath = resolveSafeChildPath(ctx.workspacePath, ctx.input.tfvarsPath);
      const inputFileContents = await fs.readFile(tfvarsPath, 'utf-8');
      let toVarSubnet = (uiSubnet: any) => {
        console.log(uiSubnet.subnetDelegations)
        let varSubnet: any = {
          is_automatic: uiSubnet.isAutomatic,
          subnet_type: uiSubnet.subnetType,
          subnet_count: 1, 
          subnet_postfix: uiSubnet.subnetName,
          service_endpoints: uiSubnet.serviceEndpoints,
          subnet_delegation: uiSubnet.subnetDelegations.map((delegation: any, idx: number) => {
            return { name: `delgation-${idx+1}`,  service_name: delegation.serviceName, service_actions: delegation.serviceActions }
          }),
          vnet_address_space_index: 0
        }
        if(uiSubnet.isAutomatic){
          varSubnet.cidr_range = uiSubnet.cidrRange
        }
        else{
          varSubnet.prefix = uiSubnet.ipRange
        }
        return varSubnet;
      }
      let getSubnets = () => {
        let varSubnets = ctx.input.subnets.map((subnet: any) => {
          return toVarSubnet(subnet)
        })
        return { automaticSubnets: varSubnets.filter(sub => sub.is_automatic), manualSubnets: varSubnets.filter(sub => !sub.is_automatic) }
      }

      let jsonTFvars = JSON.parse(inputFileContents);
      console.log(ctx.input)
      if(ctx.input.action != "createVnet"){
        //split ctx.input.vnetName using / and get last element
        let vnetName = ctx.input.vnetName.split("/").pop()
        console.log(vnetName)
        let vnetConfig = jsonTFvars["vnet_config"].find((vnet: any) => vnetName?.includes(`-${vnet.vnet_postfix}`))
        if(!vnetConfig){
          throw new InputError(`VNet ${ctx.input.vnetName} not found in TFVars file`)
        }
        if(ctx.input.action == "addIpToVNet"){
          vnetConfig.address_space.push(ctx.input.ipRange)
        }
        if(ctx.input.action == "createSubnet"){
          let { automaticSubnets, manualSubnets } = getSubnets()
          if(!vnetConfig.automatic_subnet_config){
            vnetConfig.automatic_subnet_config = []
          }
          automaticSubnets.forEach((subnet: any) => { vnetConfig.automatic_subnet_config.push(subnet) });
          if(!vnetConfig.subnets){
            vnetConfig.subnets = []
          }
          manualSubnets.forEach((subnet: any) => { vnetConfig.manual_subnets.push(subnet) });
        }
        if(ctx.input.action == "deleteSubnet" || ctx.input.action == "addServiceEndpoint" || ctx.input.action == "delegateSubnet"){
          let subnetIndex = vnetConfig.automatic_subnet_config.findIndex((subnet: any) => ctx.input.subnetToActOn.includes(subnet.subnet_type.substring(0, 3)) &&
             ctx.input.subnetToActOn.includes(subnet.subnet_postfix))
          let isAutomatic = true
          if(subnetIndex == -1){
            isAutomatic = false
            subnetIndex = vnetConfig.manual_subnets.findIndex((subnet: any) => ctx.input.subnetToActOn.includes(subnet.subnet_type.substring(0, 3)) &&
              ctx.input.subnetToActOn.includes(subnet.subnet_postfix))
            if(subnetIndex == -1){
              throw new InputError(`Subnet ${ctx.input.subnetToActOn} not found in TFVars file`)
            }
          }
          let subnet = isAutomatic ? vnetConfig.automatic_subnet_config[subnetIndex] : vnetConfig.manual_subnets[subnetIndex]
          if(ctx.input.action == "deleteSubnet"){
            vnetConfig.subnets.splice(subnetIndex, 1)
          }else if(ctx.input.action == "addServiceEndpoint"){
            subnet.service_endpoints = ctx.input.serviceEndpoints
          }else if(ctx.input.action == "delegateSubnet"){
            subnet.subnet_delegation = ctx.input.subnetDelegations.map((delegation: any, idx: number) => {
              return { name: `delgation-${idx+1}`,  service_name: delegation.serviceName, service_actions: delegation.serviceActions }
            })
          }
        }
      }
      else{
        let { automaticSubnets, manualSubnets } = getSubnets()
        let vnetConfig = {
          vnet_postfix: ctx.input.vnetName,
          address_space: [ctx.input.ipRange],
          vnet_location: ctx.input.region,
          automatic_subnet_config: automaticSubnets,
          manual_subnets: manualSubnets
        }
        jsonTFvars["vnet_config"].push(vnetConfig)
      }
      let jsString  = JSON.stringify(jsonTFvars, null, 2)
      console.log("jsString")
      console.log(jsString)
      ctx.logger.info(jsString);
      await fs.writeFile(tfvarsPath, jsString);
    },
  });
}