import {
    scaffolderPlugin,
    createScaffolderFieldExtension
} from '@backstage/plugin-scaffolder';
  import { DependantEntityPicker, DependantEntityPickerSchema } from './DependantEntityPicker';
  
  export const DependantEntityPickerExtension = scaffolderPlugin.provide(
    createScaffolderFieldExtension({
      name: 'DependantEntityPicker',
      component: DependantEntityPicker,
      schema: DependantEntityPickerSchema
    }),
  );