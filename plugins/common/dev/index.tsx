import React from 'react';
import { createDevApp } from '@backstage/dev-utils';
import { commonPlugin, CommonPage } from '../src/plugin';

createDevApp()
  .registerPlugin(commonPlugin)
  .addPage({
    element: <CommonPage />,
    title: 'Root Page',
    path: '/common'
  })
  .render();
