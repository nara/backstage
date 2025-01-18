import { useApi } from '@backstage/core-plugin-api';
import {
  commonApiRef
} from '../../../api';
import { FormLabel, TextField } from '@material-ui/core';
import FormControl from '@material-ui/core/FormControl';
import Autocomplete from '@material-ui/lab/Autocomplete';
import React, { useCallback, useEffect } from 'react';
import { useAsync } from 'react-use';
import { z } from 'zod';
import { makeFieldSchemaFromZod } from '@backstage/plugin-scaffolder';

const AppLayerPickerFieldSchema = makeFieldSchemaFromZod(
  z.string(),
  z.object({
    appNameField: z
      .string()
      .describe('App name field on the form'),
    currentLayerCodeField: z
      .string()
      .describe('Current Layer Code field on the form. defaults to undefined'),
  }),
);

export const AppLayerPickerSchema = AppLayerPickerFieldSchema.schema;

type AppLayerPickerProps = typeof AppLayerPickerFieldSchema.type;

export const AppLayerPicker = ({
  onChange,
  rawErrors,
  required,
  formData,
  uiSchema,
  formContext,
  idSchema,
  schema: { title = 'Field', description = 'Select an item from the list' }
}: AppLayerPickerProps) => {
  console.log("formContext");
  console.log(formContext.formData);
  const [errorMessage, setErrorMessage] = React.useState("");
  const appNameField = uiSchema['ui:options']?.appNameField as string | "appName";
  const appNameFieldValue =  formContext.formData[appNameField] as string | undefined;

  const currentLayerCodeField = uiSchema['ui:options']?.currentLayerCodeField as string | "currentLayerCode";
  const currentLayerCodeFieldValue =  formContext.formData[currentLayerCodeField] as string | undefined;

  if(!appNameFieldValue || !currentLayerCodeFieldValue) {
    let message = "App name or current layer code is not defined or not found on the form";
    console.error(message);
    useEffect(() => setErrorMessage(message));
  }

  const onSelect = useCallback(
    (_: any, value: any | null) => {
      onChange(value);
    },
    [onChange],
  );
  
  const { value: entities, error, loading } = useAsync(async () =>  {
      let defaultValue = ['internet']
      if(formContext.formData.layers && formContext.formData.layers.length > 0) {
        let data = formContext.formData.layers.filter((layer: any) => layer.layerCode != currentLayerCodeFieldValue).
         map((layer: any) => layer.layerCode) as [];
        return defaultValue.concat(data);
      }
      return defaultValue;
  }, [appNameField, currentLayerCodeFieldValue]);

  console.log(formData);

  return (
    <>
    {errorMessage.length > 0 && <FormLabel>Error occurred. Please check console</FormLabel>}
    {errorMessage.length == 0 && <FormControl
      margin="normal"
      required={required}
      error={rawErrors?.length > 0 && !formData}
    >
      <Autocomplete
        //disabled={entities?.length === 1}
        id={idSchema?.$id}
        loading={loading}
        value={entities?.find((code: any) => code === formData) || null}
        getOptionSelected={(option: any, value: any) => option === value}
        onChange={onSelect}
        options={entities || []}
        //getOptionSelected={(option: any, value: any) => option.id === value.id}
        //autoSelect
        //freeSolo
        renderInput={params => (
          <TextField
            {...params}
            label={title}
            margin="normal"
            helperText={description}
            variant="outlined"
            required={required}
            InputProps={params.InputProps}
          />
        )}
      />
    </FormControl>}
    </>
  );
};
