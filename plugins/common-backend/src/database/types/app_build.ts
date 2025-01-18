export type AppLayerSchema = {
    id: number;
    appUniqueName: string;
    layerIndex: number;
    layerSchema: Record<string, any>;
    taskId: string;
    schemaHashAtTask: string;
    createdAt: Date;
    createdBy?: string;
    updatedAt?: Date;
    updatedBy?: string;
  }

export interface ApplicationDetail {
    id: string;
    name: string;
    code: string;
    system: string;
    owner: string;
    layers: AppLayerSchema[];
  }