import { Config } from '@backstage/config';
import { CspAccountRow, CspResourceRow, CspType } from "../../../database";
import { ContainerServiceClient } from "@azure/arm-containerservice";
import { DefaultAzureCredential } from "@azure/identity";
import { AksClusterRetrieverResult, CspK8ClusterRetriever } from "../types";


export class AksClusterRetriever implements CspK8ClusterRetriever {
    static fromConfig(config: Config): CspK8ClusterRetriever {
        return new AksClusterRetriever("");
    }

    private constructor(creds: string) {
        
    }

    async retrieve(account: CspAccountRow): Promise<AksClusterRetrieverResult> {
        const clusterRows: CspResourceRow[] = [];
        try {
            const client = new ContainerServiceClient(new DefaultAzureCredential(), account.account_desc);
            let clusters = await client.managedClusters.list();
            console.log("clusters: ", clusters);
            for await (const cluster of clusters) {
                clusterRows.push({
                    resourceId: cluster.id ?? "",
                    resourceName: cluster.name ?? "",
                    resourceType: "k8cluster",
                    resource_detail_id:  "",
                    csp_account_id: account.id ?? "",
                    csp_type_id: CspType.AZURE,
                    region: cluster.location ?? "",
                    createdAt: new Date()
                });
            }
        } catch (ex) {
            console.error(ex);
        }
        return { clusters: clusterRows };
    }
}