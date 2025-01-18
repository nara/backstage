import {
    scaffolderPlugin,
} from '@backstage/plugin-scaffolder';
import {
  createScaffolderFieldExtension
} from '@backstage/plugin-scaffolder-react';

  import { AppLayerFormDataField, AppLayerFormDataFieldSchema } from './AppLayerFormData';
  
  export const AppLayerFormDataFieldExtension = scaffolderPlugin.provide(
    createScaffolderFieldExtension({
      name: 'AppLayerFormDataField',
      component: AppLayerFormDataField,
      schema: AppLayerFormDataFieldSchema
    }),
  );