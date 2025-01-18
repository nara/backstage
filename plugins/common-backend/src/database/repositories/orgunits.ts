import { DatabaseHandler } from '../DatabaseHandler';
import { CspOrgUnitRow } from '../types/csp_types';

export async function getOrgUnits(this: DatabaseHandler, asHiearchy: boolean, ): Promise<CspOrgUnitRow[]> {
    var data = await this.database
      .select('*')
      .from('csp_orgunits')
    let typedData = data as CspOrgUnitRow[];

    if(!asHiearchy){
      return typedData;
    }

    let hierarchyList: CspOrgUnitRow[] = [];

    let addChildren = (parent: CspOrgUnitRow, list: CspOrgUnitRow[]) => {
      for(let mg of list){
          if(mg.parent_org_unit_id == parent.id){
              parent.children.push(mg);
              addChildren(mg, list);
          }
      }
    }

    for(let mg of typedData){
        if((mg.parent_org_unit_id == null) || (mg.parent_org_unit_id == "")){
            addChildren(mg, typedData)
            hierarchyList.push(mg)
        }
    }

    return hierarchyList;
  }