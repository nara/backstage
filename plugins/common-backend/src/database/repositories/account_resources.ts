import { CspResourceRow } from '../types/csp_types';
import { DatabaseHandler } from '../DatabaseHandler';

export async function getResources(this: DatabaseHandler, resourceType: string, accountId?: string): Promise<CspResourceRow[]> {
  console.log("getResources")
  console.log(accountId)
  var data = await this.database
    .select('*')
    .from('csp_resources')
    .where('resourceType', resourceType)
    .where('csp_account_id', accountId);
    
  let typedData = data as CspResourceRow[];
  return typedData;
}
