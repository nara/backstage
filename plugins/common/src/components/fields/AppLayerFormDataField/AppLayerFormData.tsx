import FormControl from '@material-ui/core/FormControl';
import React, { useEffect } from 'react';
import { z } from 'zod';
import { makeFieldSchemaFromZod } from '@backstage/plugin-scaffolder';

const AppLayerFormDataSchema = makeFieldSchemaFromZod(
  z.string(),
  z.object({
  }),
);

export const AppLayerFormDataFieldSchema = AppLayerFormDataSchema.schema;

type AppLayerFormDataFieldProps = typeof AppLayerFormDataSchema.type;

export const AppLayerFormDataField = ({
  onChange,
  rawErrors,
  required,
  formData,
  formContext,
  uiSchema
}: AppLayerFormDataFieldProps) => {
  console.log("formContext in formdata layers");
  const [value, setValue] = React.useState("");
  
  
  console.log("formContext.formData");
  console.log(formContext.formData);
  const xpath = uiSchema['ui:options']?.xpath as string | "";
  const splitItems = xpath.split(".");
  

  useEffect(() => {
    let parentItem = [];
    let result = "";

    var i = 0;
    while(i < splitItems.length) {
      parentItem = formContext.formData[splitItems[i]];
      if(Array.isArray(parentItem)) {
        for(let j = 0; j < parentItem.length; j++) {
          result = result + (result != "" ? "," : "") + JSON.stringify(parentItem[j][splitItems[i+1]]);
        }
        i++;
      }else{
        result = result + (result != "" ? "," : "") + JSON.stringify(parentItem);
      }
      i++;
    }
    console.log("result");
    console.log(result);
    setValue(result);
  }, [formContext.formData]);

  return (
    <>
    {<FormControl
      margin="normal"
      required={required}
      error={rawErrors?.length > 0 && !formData}
    >
      <input type="text" value={value} style={{ display: 'none' }}/>
    </FormControl>}
    </>
  );
};
