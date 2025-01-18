import { useApi } from '@backstage/core-plugin-api';
import {
  commonApiRef
} from '@internal/common-package';
import { TextField } from '@material-ui/core';
import FormControl from '@material-ui/core/FormControl';
import Autocomplete from '@material-ui/lab/Autocomplete';
import React, { useCallback, useEffect } from 'react';
import { useAsync } from 'react-use';
import { z } from 'zod';
import { makeFieldSchemaFromZod } from '@backstage/plugin-scaffolder';

const CspDataPickerFieldSchema = makeFieldSchemaFromZod(
  z.string(),
  z.object({
    csp: z
      .string()
      .describe('Which CSP to retrieve data from'),
    dataType: z
      .string()
      .describe('Which data type to retrieve: list of values orgunits, accounts, vpcs, subnets, etc.'),
    dependendsOnField: z
      .string()
      .optional()
      .describe('Which field on the form this field depends on. Usually the parent entity'),
    dataOption: z
      .string()
      .describe('For azure subnet, options are firewall, firewallmanagement, bastion.'),
  }),
);

export const CspDataPickerSchema = CspDataPickerFieldSchema.schema;

type CspDataPickerProps = typeof CspDataPickerFieldSchema.type;

export const CspDataPicker = ({
  onChange,
  rawErrors,
  required,
  formData,
  uiSchema,
  formContext,
  idSchema,
  schema: { title = 'Field', description = 'Select an item from the list' }
}: CspDataPickerProps) => {
  let subnetToOptionMap: Record<string,string> = { "firewall": "AzureFirewallSubnet", "bastion": "AzureBastionSubnet", "firewallmanagement": "AzureFirewallManagementSubnet"}
  const csp = uiSchema['ui:options']?.csp as string | "aws"; ""
  const dataType = uiSchema['ui:options']?.dataType as string | "orgunits";
  const dependendsOnField = uiSchema['ui:options']?.dependendsOnField as string | undefined;
  const dependantFieldValue =  dependendsOnField ? formContext.formData[dependendsOnField] as string : undefined;
  const dataOption = uiSchema['ui:options']?.dataOption as string | "";


  //console.log("data type: " + dataType);
  const commonApi = useApi(commonApiRef);
  console.log(dependendsOnField)
  console.log(dataType)

  const { value: entities, error, loading } = useAsync(async () => {
    let data = dataType == "orgunits" ? commonApi.getOrgUnits() : 
      dataType == "accounts" ? commonApi.getAccounts(dependantFieldValue) :
      dataType == "vpcs" ? commonApi.getVpcs(dependantFieldValue || "") :
      dataType == "subnets" ? commonApi.getSubnets(dependantFieldValue || "") :
      dataType == "k8cluster" ? commonApi.getAccountResources("k8cluster", dependantFieldValue || "") :
      commonApi.getSubnets(dependantFieldValue || "");
    if(dataType == "subnets" && dataOption && dataOption != ""){
      data = (await data).filter((subnet: any) => subnet.subnet_name == subnetToOptionMap[dataOption]);
      console.log(data)
      console.log("inner")
    }
    console.log(data)
    return data;
    }, [dependantFieldValue]);
  

  // if(formData && entities?.length == 0){
  //   onChange(null);
  // }

  const getOptionLabel = (option: any) => {
    if (option == null || option == undefined) {
      return '';
    }
    return dataType == "orgunits" ? option.name : 
      dataType == "accounts" ? option.account_alias : 
      dataType == "vpcs" ? option.vpc_name :
      dataType == "subnets" ? option.subnet_name : '';
  }

  const getOptionId = (option: any) => {
    return dataType == "orgunits" ? option.name : 
      dataType == "accounts" ? option.id :
      dataType == "vpcs" ? option.vpcId :
      dataType == "subnets" ? option.subnetId : '';
  }

  const onSelect = useCallback(
    (_: any, value: any | null) => {
      onChange(value ? getOptionId(value) : '');
    },
    [onChange],
  );

  useEffect(() => {
    if (entities?.length === 0) {
      //console.log("formData");
      //console.log(formData);
      onChange('');
    }
    if (entities?.length === 1) {
      onChange(getOptionId(entities[0]));
    }
  }, [entities, onChange, dependantFieldValue]);

  //console.log(dataType + ' ' + dependantFieldValue);
  //console.log(entities)
  return (
    <FormControl
      margin="normal"
      required={required}
      error={rawErrors?.length > 0 && !formData}
    >
      <Autocomplete
        //disabled={entities?.length === 1}
        id={idSchema?.$id}
        loading={loading}
        value={entities?.find((entity: any) => getOptionId(entity) === formData) || null}
        getOptionSelected={(option: any, value: any) => getOptionId(option) === getOptionId(value)}
        onChange={onSelect}
        options={entities || []}
        getOptionLabel={(option: any) => getOptionLabel(option)}
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
    </FormControl>
  );
};
