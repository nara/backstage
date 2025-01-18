/*
 * Copyright 2021 The Backstage Authors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import React, { ComponentType, PropsWithChildren, ReactNode } from 'react';
import { Route, Routes, useOutlet } from 'react-router-dom';
import { Entity } from '@backstage/catalog-model';
import { TemplateEntityV1beta3 } from '@backstage/plugin-scaffolder-common';
// import { DEFAULT_SCAFFOLDER_FIELD_EXTENSIONS } from '../extensions/default';
import { scaffolderPlugin } from "@backstage/plugin-scaffolder"
import {
  FieldExtensionOptions,
  useCustomFieldExtensions,
  useCustomLayouts,
  SecretsContextProvider
} from '@backstage/plugin-scaffolder-react';
import { ReviewStepProps } from './types';
import {
  appBuildListTemplateRef,
  appBuildDetailTemplateRef,
  appBuildTaskRouteRef,

} from '../routes';
import { AppBuildComponent } from "./AppBuildComponent";
import { AppBuildListComponent } from "./AppBuildListComponent";
import { useElementFilter } from '@backstage/core-plugin-api';
import { getOrCreateGlobalSingleton } from '@backstage/version-bridge';

type DataContainer = {
  map: Map<string, unknown>;
};

const FIELD_EXTENSION_WRAPPER_KEY = 'scaffolder.extensions.wrapper.v1';
const FIELD_EXTENSION_KEY = 'scaffolder.extensions.field.v1';

/**
 * The props for the entrypoint `ScaffolderPage` component the plugin.
 * @public
 */
export type RouterProps = {
  components?: {
    ReviewStepComponent?: ComponentType<ReviewStepProps>;
    TemplateCardComponent?:
      | ComponentType<{ template: TemplateEntityV1beta3 }>
      | undefined;
    TaskPageComponent?: ComponentType<PropsWithChildren<{}>>;
  };
  groups?: Array<{
    title?: React.ReactNode;
    filter: (entity: Entity) => boolean;
  }>;
  templateFilter?: (entity: TemplateEntityV1beta3) => boolean;
  defaultPreviewTemplate?: string;
  headerOptions?: {
    pageTitleOverride?: string;
    title?: string;
    subtitle?: string;
  };
  /**
   * Options for the context menu on the scaffolder page.
   */
  contextMenu?: {
    /** Whether to show a link to the template editor */
    editor?: boolean;
    /** Whether to show a link to the actions documentation */
    actions?: boolean;
  };
};

const componentDataKey = '__backstage_data';

type ComponentWithData = ComponentType<any> & {
  [componentDataKey]?: DataContainer;
};

type MaybeComponentNode = ReactNode & {
  type?: ComponentWithData;
};

import * as ReactDOM from 'react-dom';


/**
 * The main entrypoint `Router` for the `ScaffolderPlugin`.
 *
 * @public
 */
export const Router = (props: RouterProps) => {

  const outlet = useOutlet();

  const customFieldExtensions = useElementFilter(outlet, elements =>
    elements
    .selectByComponentData({
      key: FIELD_EXTENSION_WRAPPER_KEY,
    })
      .findComponentData<FieldExtensionOptions>({
        key: FIELD_EXTENSION_KEY,
      }),
  );
  
  return (
    <Routes>
      <Route
        path="/"
        element={
          <SecretsContextProvider>
            <AppBuildListComponent customFieldExtensions={customFieldExtensions}/>
          </SecretsContextProvider>
        }
      />
      <Route
        path={appBuildListTemplateRef.path}
        element={
          <SecretsContextProvider>
            <AppBuildListComponent customFieldExtensions={customFieldExtensions} />
          </SecretsContextProvider>
        }
      />
      <Route
        path={appBuildDetailTemplateRef.path}
        element={
          <SecretsContextProvider>
            <AppBuildComponent  {...props} customFieldExtensions={customFieldExtensions} />
          </SecretsContextProvider>
        }
      />
    </Routes>
  );
};
