import { Config } from '@backstage/config';
import { NetworkRetrieverResult, CspNetworkRetriever } from "../types";
import { CspAccountRow, CspType, VpcSubnetRow, VpcRow } from "../../../database";
import { v1 } from '@google-cloud/compute';


export class VpcSubnetRetriever implements CspNetworkRetriever{

    static fromConfig(config: Config): CspNetworkRetriever {
        return new VpcSubnetRetriever("");
    }

    private constructor(creds: string){
        
    }

    async retrieve(account: CspAccountRow): Promise<NetworkRetrieverResult> {
        const vpcRows: VpcRow[] = [];
        const subnetRows: VpcSubnetRow[] = [];
        try{
            const networkClient = new v1.NetworksClient();
            let vpcs = await networkClient.list({ project: account.id })
            if(vpcs.length > 0){
                for await (const vpc of vpcs[0]){
                    console.log("vpc");
                    console.log(vpc);
                    vpcRows.push({ vpcId: vpc.id?.toString() ?? "", vpc_detail_id: vpc.selfLink ?? "", 
                        vpc_name: vpc.name ?? "", vpc_cidr: vpc.IPv4Range ?? "", csp_type_id: CspType.GCP, createdAt: new Date(), region: null })
                }
            }
            
            const subnetClient = new v1.SubnetworksClient();
            const subnets = await subnetClient.listUsable({ project: account.id });
            console.log('writing subnets:');
            for await (const subnet of subnets[0]) {
                let matches = subnet.subnetwork?.matchAll(/projects\/(.*?)\/regions\/(.*?)\/subnetworks\/(.*)/gm);
                console.log(matches);
                if(matches){
                    for(const match of matches){
                        let matchedVpc = vpcRows.find(v => v.vpc_detail_id == subnet.network)
                        subnetRows.push({ subnetId: subnet.subnetwork ?? "", vpc_id: matchedVpc?.vpcId ?? "", subnet_name: match[3], 
                            csp_type_id: CspType.GCP, region: match[2], subnet_cidr: subnet.ipCidrRange ?? "", createdAt: new Date() })
                    }
                }
                
            }
        }catch(ex){
            console.error(ex);
        }
        return { subnets: subnetRows, vpcs: vpcRows };
    }
}
