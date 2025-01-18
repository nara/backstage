import { CspAccountRow } from '../types/csp_types';
import { DatabaseHandler } from '../DatabaseHandler';

export async function getAccountsFor(this: DatabaseHandler, orgunitId?: string): Promise<CspAccountRow[]> {
    var query = this.database
      .select('*')
      .from('csp_accounts');
    if(orgunitId){
      query = query.whereLike('csp_orgunit_id', `%${orgunitId}`);
    }
      
    let data = await query;
    let typedData = data as CspAccountRow[];
    return typedData;
  }
