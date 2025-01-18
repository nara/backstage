import { Config } from '@backstage/config';
import { ProcessJob, CspNetworkRetriever } from "./types";
import { Knex } from 'knex';
import { CspAccountRow, VpcSubnetRow, VpcRow, CspType } from "../../database";

export class NetworkProcessorJob implements ProcessJob {
    
    cspRetriever: CspNetworkRetriever;
    intervalInHours: number;
    name: string;
    csp: CspType;
    private readonly db: Knex;

    constructor(csp: CspType, name: string, config: Config, database: Knex, cspRetriever: CspNetworkRetriever){
        this.csp = csp;
        this.name = name;
        this.cspRetriever = cspRetriever;
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
            const result = await this.cspRetriever.retrieve(account);
            
            for(const vpc of result.vpcs){
                await this.db<VpcRow>('csp_vpcs')
                    .insert(vpc).onConflict('vpcId').merge();
            }
            for(const subnet of result.subnets){
                await this.db<VpcSubnetRow>('csp_vpc_subnets')
                    .insert(subnet).onConflict('subnetId').merge();
            }
        }
    }

}