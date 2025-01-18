import { createTemplateAction } from '@backstage/plugin-scaffolder-backend';
import { ScmIntegrationRegistry } from '@backstage/integration';
import { Config } from '@backstage/config';
import { DatabaseHandler } from '@internal/plugin-common-backend';


export function saveEntityJsonAction(options: {
  integrations: ScmIntegrationRegistry;
  config: Config;
}) {
  
  return createTemplateAction<{ 
    allParameters: any;
    entityId: string;
    templateName: string;
   }>({
    id: 'save:entity:json',
    description:
      'saves entity json based on the given input parameters',
    schema: {
      input: {
        type: 'object',
        properties: {
          allParameters: {
            title: 'All parameters on the form',
            type: 'object',
          },
          entityId: {
            title: 'Entity Id in format kind:namespace/name',
            type: 'string',
          },
          templateName: {
            title: 'Name of the template',
            type: 'string',
          },
        },
      },
    },
    async handler(ctx) {
      await DatabaseHandler.instance.saveEntityJson({ id: 0, 
        componentId: ctx.input.entityId, 
        entityJson: ctx.input.allParameters,
        templateName: ctx.input.templateName
      });
    }
  });
}