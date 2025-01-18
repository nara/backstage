/*
 * Copyright 2020 The Backstage Authors
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
import { LinearProgress } from '@material-ui/core';
import { IChangeEvent } from '@rjsf/core';
import qs from 'qs';
import React, { ComponentType, useCallback, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import useAsync from 'react-use/lib/useAsync';
import {
  type FieldExtensionOptions,
  type LayoutOptions,
  scaffolderApiRef,
  useTemplateSecrets,
} from '@backstage/plugin-scaffolder-react';
import { MultistepJsonForm } from '../MultistepJsonForm';
import { createValidator } from './createValidator';

import { Content, Header, InfoCard, Page } from '@backstage/core-components';
import {
  AnalyticsContext,
  errorApiRef,
  useApi,
  useApiHolder,
  useRouteRef,
  useRouteRefParams,
} from '@backstage/core-plugin-api';
import { stringifyEntityRef } from '@backstage/catalog-model';
import { ReviewStepProps } from '../types';
import {
  rootRouteRef
} from '../../routes';

const useTemplateParameterSchema = (templateRef: string) => {
  const scaffolderApi = useApi(scaffolderApiRef);
  const { value, loading, error } = useAsync(
    () => scaffolderApi.getTemplateParameterSchema(templateRef),
    [scaffolderApi, templateRef],
  );
  return { schema: value, loading, error };
};

type Props = {
  templateName: string;
  namespace: string;
  ReviewStepComponent?: ComponentType<ReviewStepProps>;
  customFieldExtensions?: FieldExtensionOptions<any, any>[];
  layouts?: LayoutOptions[];
  inputState: Record<string, any>;
  handleChange: (json: any) => void;
  handleNext: (json: any) => void;
  finishButtonLabel?: string;
  headerOptions?: {
    pageTitleOverride?: string;
    title?: string;
    subtitle?: string;
  };
};

export const TemplatePage = ({
  templateName,
  namespace,
  ReviewStepComponent,
  customFieldExtensions = [],
  layouts = [],
  inputState,
  handleChange,
  handleNext,
  headerOptions,
  templateName: string,
  finishButtonLabel = 'Create',
}: Props) => {
  const apiHolder = useApiHolder();
  const secretsContext = useTemplateSecrets();
  const errorApi = useApi(errorApiRef);
  const scaffolderApi = useApi(scaffolderApiRef);
  const templateRef = stringifyEntityRef({
    name: templateName,
    kind: 'template',
    namespace,
  });
  const rootRoute = useRouteRef(rootRouteRef);
  const { schema, loading, error } = useTemplateParameterSchema(templateRef);
  //const [formState, setFormState] = useState<Record<string, any>>(inputState);
  const handleFormReset = () => {};
  const handleLocalChange = useCallback(
    (e: IChangeEvent) => { 
      //setFormState(e.formData); 
      handleChange(e.formData);
    },
    [],
  );

  const handleCreate = async () => {
    await handleNext(inputState);
    // const { taskId } = await scaffolderApi.scaffold({
    //   templateRef,
    //   values: formState,
    //   secrets: secretsContext?.secrets,
    // });

    // const formParams = qs.stringify(
    //   { formData: formState },
    //   { addQueryPrefix: true },
    // );
    // const newUrl = `${window.location.pathname}${formParams}`;
    // // We use direct history manipulation since useSearchParams and
    // // useNavigate in react-router-dom cause unnecessary extra rerenders.
    // // Also make sure to replace the state rather than pushing to avoid
    // // extra back/forward slots.
    // window.history?.replaceState(null, document.title, newUrl);

    //navigate(scaffolderTaskRoute({ taskId }));
  };

  if (error) {
    errorApi.post(new Error(`Failed to load template, ${error}`));
    return <Navigate to={rootRoute()} />;
  }
  if (!loading && !schema) {
    errorApi.post(new Error('Template was not found.'));
    return <Navigate to={rootRoute()} />;
  }

  const customFieldComponents = Object.fromEntries(
    customFieldExtensions.map(({ name, component }) => [name, component]),
  );

  const customFieldValidators = Object.fromEntries(
    customFieldExtensions.map(({ name, validation }) => [name, validation]),
  );

  //console.log("temp page")
  //console.log(formState)
  return (
    <AnalyticsContext attributes={{ entityRef: templateRef }}>
      <Page themeId="home">
        <Content>
          {loading && <LinearProgress data-testid="loading-progress" />}
          {schema && (
            <InfoCard
              title={schema.title}
              noPadding
              titleTypographyProps={{ component: 'h2' }}
            >
              <MultistepJsonForm
                ReviewStepComponent={ReviewStepComponent}
                formData={inputState}
                fields={customFieldComponents}
                onChange={handleChange}
                onReset={handleFormReset}
                onFinish={handleCreate}
                layouts={layouts}
                finishButtonLabel={finishButtonLabel}
                steps={schema.steps.map(step => {
                  return {
                    ...step,
                    validate: createValidator(
                      step.schema,
                      customFieldValidators,
                      { apiHolder },
                    ),
                  };
                })}
              />
            </InfoCard>
          )}
        </Content>
      </Page>
    </AnalyticsContext>
  );
};
