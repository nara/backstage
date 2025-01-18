import {
    scaffolderPlugin,
} from '@backstage/plugin-scaffolder';
import {
  createScaffolderFieldExtension
} from '@backstage/plugin-scaffolder-react';

import { AppLayerPicker, AppLayerPickerSchema } from './AppLayerPickerField';
  
export const AppLayerPickerExtension = scaffolderPlugin.provide(
  createScaffolderFieldExtension({
    name: 'AppLayerPicker',
    component: AppLayerPicker,
    schema: AppLayerPickerSchema
  }),
);