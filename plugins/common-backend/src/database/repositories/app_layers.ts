import { AppLayerSchema, ApplicationDetail } from '../types/app_build';
import { DatabaseHandler } from '../DatabaseHandler';

export async function saveLayer(this: DatabaseHandler, layer: any): Promise<AppLayerSchema> {
  console.log("saving layer")
  console.log(layer)
  if(!layer.id || layer.id == 0){
    delete layer.id;
    let newId = await this.database
      .insert<AppLayerSchema>(layer)
      .into('app_layers_schema')
      .returning('id');
    layer.id = newId[0];
  }
  else{
    layer = await this.database
      .where('id', layer.id)
      .update<AppLayerSchema>(layer)
      .into('app_layers_schema');
  }
  return layer;
}

export async function getLayers(this: DatabaseHandler, appId: string): Promise<AppLayerSchema[]> {
  let result = await this.database
    .select<AppLayerSchema[]>()
    .from('app_layers_schema')
    .where('appUniqueName', appId);
  return result;
}

export async function getApps(this: DatabaseHandler): Promise<ApplicationDetail[]> {
  let dbData = await this.database
    .select<AppLayerSchema[]>()
    .from('app_layers_schema');
  let result: ApplicationDetail[] = [];
  for (let app of dbData) {
    let appDetail = result.find((a) => a.id == app.appUniqueName);
    if (!appDetail) {
      appDetail = {
        id: app.appUniqueName,
        name: app.appUniqueName,
        code: app.appUniqueName,
        system: app.appUniqueName,
        owner: app.appUniqueName,
        layers: [],
      };
      result.push(appDetail);
    }
    appDetail.layers.push(app);
  }
  return result;
}