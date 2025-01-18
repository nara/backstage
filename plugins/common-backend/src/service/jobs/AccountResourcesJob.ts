import { Config } from '@backstage/config';
import { ProcessJob, CspK8ClusterRetriever } from "./types";
import { Knex } from 'knex';
import { CspAccountRow, VpcSubnetRow, VpcRow, CspType } from "../../database";

export class AccountResourcesJob implements ProcessJob {
    
    k8Retriever: CspK8ClusterRetriever;
    intervalInHours: number;
    name: string;
    csp: CspType;
    private readonly db: Knex;

    constructor(csp: CspType, name: string, config: Config, database: Knex, k8Retriever: CspK8ClusterRetriever){
        this.csp = csp;
        this.name = name;
        this.k8Retriever = k8Retriever;
        this.intervalInHours = 15/3600;
        this.db = database;
    }

    async run(): Promise<void> {
        let query = this.db<CspAccountRow>("csp_accounts").where({ csp_type_id: this.csp});
        if(this.csp === CspType.GCP){
            query = query.where({account_status: 'ACTIVE'});
        }
        let accounts = await query.select();
        for(const account of accounts){
            const result = await this.k8Retriever.retrieve(account);
            
            for(const cluster of result.clusters){
                await this.db<VpcRow>('csp_clusters')
                    .insert(cluster).onConflict('clusterId').merge();
            }
        }
    }

}