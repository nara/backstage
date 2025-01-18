import {
    scaffolderPlugin,
} from '@backstage/plugin-scaffolder';
import {
  createScaffolderFieldExtension
} from '@backstage/plugin-scaffolder-react';

  import { CspDataPicker, CspDataPickerSchema } from './CspDataPicker';
  
  export const CspDataPickerExtension = scaffolderPlugin.provide(
    createScaffolderFieldExtension({
      name: 'CspDataPicker',
      component: CspDataPicker,
      schema: CspDataPickerSchema
    }),
  );