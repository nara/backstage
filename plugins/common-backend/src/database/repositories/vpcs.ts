import { VpcRow, VpcSubnetRow } from '../types/csp_types';
import { DatabaseHandler } from '../DatabaseHandler';

export async function getVpcsFor(this: DatabaseHandler, accountId: string): Promise<VpcRow[]> {
    console.log("getVpcsFor")
    console.log(accountId)
    var data = await this.database
      .select('*')
      .from('csp_vpcs')
      .where('csp_account_id', accountId);
      
    let typedData = data as VpcRow[];
    return typedData;
  }

export async function getSubnetsFor(this: DatabaseHandler, vpcId: string): Promise<VpcSubnetRow[]> {
    var data = await this.database
      .select('*')
      .from('csp_vpc_subnets')
      .where('vpc_id', vpcId);
      
    let typedData = data as VpcSubnetRow[];
    return typedData;
  }
