import { Config } from '@backstage/config';
import { NetworkRetrieverResult, CspNetworkRetriever } from "../types";
import { CspAccountRow, CspType, VpcSubnetRow, VpcRow } from "../../../database";
import { NetworkManagementClient } from "@azure/arm-network";
import { ClientSecretCredential, DefaultAzureCredential } from "@azure/identity";


export class VnetSubnetRetriever implements CspNetworkRetriever{

    static fromConfig(config: Config): CspNetworkRetriever {
        return new VnetSubnetRetriever("");
    }

    private constructor(creds: string){
        
    }

    async retrieve(account: CspAccountRow): Promise<NetworkRetrieverResult> {
        const vpcRows: VpcRow[] = [];
        const subnetRows: VpcSubnetRow[] = [];
        try{
            console.log("33333333 *******");
            const client = new NetworkManagementClient(new DefaultAzureCredential(), account.account_desc);
            let vnets = await client.virtualNetworks.listAll();

            for await (const vnet of vnets){
                console.log(vnet);
                vpcRows.push({ vpcId: vnet.id ?? "", vpc_detail_id: vnet.resourceGuid ?? "", 
                    vpc_name: vnet.name ?? "", vpc_cidr: vnet.addressSpace?.addressPrefixes?.join(",") ?? "", 
                    csp_type_id: CspType.AZURE, createdAt: new Date(), region: vnet.location ?? "",
                    csp_account_id: account.id ?? "" })

                for(const subnet of vnet.subnets ?? []){
                    subnetRows.push({ subnetId: subnet.id ?? "", vpc_id: vnet?.id ?? "", subnet_name: subnet.name ?? "",
                        csp_type_id: CspType.AZURE, region: vnet.location ?? "", subnet_cidr: subnet.addressPrefix ?? "", createdAt: new Date() })
                }

            }
        }catch(ex){
            console.error(ex);
        }
        return { subnets: subnetRows, vpcs: vpcRows };
    }
}
