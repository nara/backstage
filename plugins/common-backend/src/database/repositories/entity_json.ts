import { EntityJson } from '../types/entity_json';
import { DatabaseHandler } from '../DatabaseHandler';
import { v4 as uuidv4 } from 'uuid';

export async function saveEntityJson(this: DatabaseHandler, entityJson: any): Promise<EntityJson> {
  if(!entityJson.id || entityJson.id == ""){
    entityJson.id = uuidv4();
    let newId = await this.database
      .insert<EntityJson>(entityJson)
      .into('entity_jsons')
  }
  else{
    entityJson = await this.database
      .where('id', entityJson.id)
      .update<EntityJson>(entityJson)
      .into('entity_jsons');
  }
  return entityJson;
}

export async function getEntityJson(this: DatabaseHandler, componentId: string): Promise<EntityJson[]> {
  let result = await this.database
    .select<EntityJson[]>()
    .from('app_layers_schema')
    .where('componentId', componentId);
  return result;
}