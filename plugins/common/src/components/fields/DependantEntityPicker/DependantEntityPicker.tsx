import { useApi } from '@backstage/core-plugin-api';
import {
  catalogApiRef
} from '@backstage/plugin-catalog-react';
import { TextField } from '@material-ui/core';
import FormControl from '@material-ui/core/FormControl';
import Autocomplete from '@material-ui/lab/Autocomplete';
import React, { useCallback, useEffect } from 'react';
import { useAsync } from 'react-use';
import { z } from 'zod';
import { makeFieldSchemaFromZod } from '@backstage/plugin-scaffolder';

const DependantEntityPickerFieldSchema = makeFieldSchemaFromZod(
  z.string(),
  z.object({
    dependendsOnField: z
      .string()
      .optional()
      .describe('Which field on the form this field depends on'),
    allowedKind: z
      .string()
      .optional()
      .describe('Which entity to retrieve based on the dependancy'),
  }),
);

export const DependantEntityPickerSchema = DependantEntityPickerFieldSchema.schema;

type DependantEntityPickerFieldProps = typeof DependantEntityPickerFieldSchema.type;

export const DependantEntityPicker = ({
  onChange,
  rawErrors,
  required,
  formData,
  uiSchema,
  formContext,
  idSchema
}: DependantEntityPickerFieldProps) => {
  const dependendsOnField = uiSchema['ui:options']?.dependendsOnField as string | "Domain";
  const dependantFieldValue =  formContext.formData[dependendsOnField] as string | undefined;
  const allowedKind = uiSchema['ui:options']?.allowedKind as string | "System";
  const catalogApi = useApi(catalogApiRef);

  const { value: entities, loading } = useAsync(() =>
    catalogApi.getEntities(
      allowedKind ? { filter: { kind: allowedKind } } : undefined,
    ),
    [dependantFieldValue]
  );

  
  const entityRefs = entities?.items.filter(e => e.spec?.owner == dependantFieldValue).map(e => e.metadata.name);
  if(formData && !entityRefs?.find(r => r == formData)){
    onChange('');
  }
  //console.log(entities?.items);
  //console.log(formData)
  const onSelect = useCallback(
    (_: any, value: string | null) => {
      onChange(value || '');
    },
    [onChange],
  );

  useEffect(() => {
    if (entityRefs?.length === 1) {
      onChange(entityRefs[0]);
    }
  }, [entityRefs, onChange]);

  return (
    <FormControl
      margin="normal"
      required={required}
      error={rawErrors?.length > 0 && !formData}
    >
      <Autocomplete
        disabled={entityRefs?.length === 1}
        id={idSchema?.$id}
        value={(formData as string) || ''}
        loading={loading}
        onChange={onSelect}
        options={entityRefs || []}
        autoSelect
        freeSolo
        renderInput={params => (
          <TextField
            {...params}
            label={allowedKind}
            margin="normal"
            helperText={"Select from the Catalog"}
            variant="outlined"
            required={required}
            InputProps={params.InputProps}
          />
        )}
      />
    </FormControl>
  );
};
