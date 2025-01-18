import { Config } from '@backstage/config';
import { AccountRetrieverResult, CspAccountRetriever } from "../types";
import { CspAccountRow, CspType } from "../../../database";
import { ProjectsClient } from '@google-cloud/resource-manager';


export class AccountRetriever implements CspAccountRetriever{

    static fromConfig(config: Config): CspAccountRetriever {
        return new AccountRetriever("");
    }

    private constructor(creds: string){
        
    }

    async retrieve(): Promise<AccountRetrieverResult> {
        console.log("1111 *******")
        const client = new ProjectsClient();
        const projects = client.searchProjectsAsync();
        console.log('Projects:');
        const accounts: CspAccountRow[] = [];
        for await (const project of projects) {
            accounts.push({ id: project.projectId ?? "", csp_type_id: CspType.GCP, 
                account_alias: project.name ?? "", account_desc: project.displayName ?? "", account_status: project.state?.toString() ?? "", createdAt: new Date(), 
                csp_orgunit_id: ""});
            console.info(project);
        }
        return {accounts: accounts, orgUnits: [], hasMoreRows: false};
    }
}
