import { createApiRef } from '@backstage/core-plugin-api';
import { CommonApi } from './commonApi';


export const commonApiRef = createApiRef<CommonApi>({
  id: 'common',
});
