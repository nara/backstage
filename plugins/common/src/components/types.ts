import { UiSchema } from '@rjsf/utils';
import { JsonObject } from '@backstage/types';

export type ReviewStepProps = {
  disableButtons: boolean;
  formData: JsonObject;
  createButtonText: string;
  handleBack: () => void;
  handleReset: () => void;
  handleCreate: () => void;
  steps: {
    uiSchema: UiSchema;
    mergedSchema: JsonObject;
    schema: JsonObject;
  }[];
};

export interface ApplicationTableRow {
  id: string;
  name: string;
  code: string;
  system: string;
  owner: string;
}