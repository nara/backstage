import { Config } from '@backstage/config';
import { ProcessJob, CspAccountRetriever } from "./types";
import { Knex } from 'knex';
import { CspAccountRow, CspOrgUnitRow } from "../../database";

export class AccountProcessorJob implements ProcessJob {
    
    cspRetriever: CspAccountRetriever;
    intervalInHours: number;
    name: string;
    private readonly db: Knex;

    constructor(name: string, config: Config, database: Knex, cspRetriever: CspAccountRetriever){
        this.name = name;
        this.cspRetriever = cspRetriever;
        //this.intervalInHours = 1;
        this.intervalInHours = 10/3600;
        this.db = database;
    }

    async run(): Promise<void> {
        let loop: boolean = true;

        while(loop){
            const result = await this.cspRetriever.retrieve();
            
            for(const orgUnit of result.orgUnits){
                const { ['children']: removedProperty, ...restObject } = orgUnit;
                await this.db('csp_orgunits')
                    .insert(restObject).onConflict('id').merge();
            }

            for(const account of result.accounts){
                console.log("saving account")
                console.log("account: ", account);
                await this.db<CspAccountRow>('csp_accounts')
                    .insert(account).onConflict('id').merge();
            }
            if(!result.hasMoreRows){
                loop = false;
            }
        }
    }

}