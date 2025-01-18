import { Config } from '@backstage/config';
import { CspOrgUnitRow, CspAccountRow, CspType } from "../../../database"
import { AccountRetrieverResult, CspAccountRetriever } from "../types";
import { ManagementGroupsAPI } from "@azure/arm-managementgroups";
import { ClientSecretCredential, DefaultAzureCredential } from "@azure/identity";

export class SubscriptionRetriever implements CspAccountRetriever{

    private config: Config;

    static fromConfig(config: Config): CspAccountRetriever {
        return new SubscriptionRetriever(config);
    }

    private constructor(config: Config){
        this.config = config;
    }

    async retrieve(): Promise<AccountRetrieverResult> {
        console.log("1111 *******")
        
        
        const client = new ManagementGroupsAPI(new DefaultAzureCredential());
        //write code block to get azure management groups in a hierarchy
        // // For client-side applications running in the browser, use InteractiveBrowserCredential instead of DefaultAzureCredential. See https://aka.ms/azsdk/js/identity/examples for more details.

        
        // // For client-side applications running in the browser, use this code instead:
        // // const credential = new ClientSecretCredential(
        // //     this.config.getString("org.azure.creds.tenantId"),
        // //     this.config.getString("org.azure.creds.clientId"),
        // //     this.config.getString("org.azure.creds.clientSecret"),
        // // );
        // //const client = new ManagementGroupsAPI(credential, subscriptionId);


        let mgList = [];
        const managementGroups = client.managementGroups.list();
        for await (const managementGroup of managementGroups) {
            let item = { name: managementGroup.name, group: managementGroup, info: null, children: [] } as any;
            item.info = await client.managementGroups.get(managementGroup.name ?? "", { expand: "children" });
            mgList.push(item);
        }

        let addChildren = (parent: any, mgList: any[]) => {
            for(let mg of mgList){
                if(mg.info.details.parent?.name == parent.name){
                    parent.children.push(mg);
                    addChildren(mg, mgList);
                }
            }
        }

        let rootManagementGroupName = this.config.getString("org.azure.rootManagementGroupName");
        let hierarchyList = []
        for(let mg of mgList){
            console.log(mg)
            if((mg.info.details && mg.info.details.parent && ((mg.info.details.parent.displayName ?? "").toLowerCase() == rootManagementGroupName.toLowerCase()))){
                addChildren(mg, mgList)
                hierarchyList.push(mg)
            }
        }

        let managementGroupsRows: CspOrgUnitRow[] = [];
        let subscriptionRows: CspAccountRow[] = [];
     
        for(let mg of mgList){
            managementGroupsRows.push({ id: mg.group.id, csp_type_id: CspType.AZURE, org_unit_id: mg.group.id, 
                parent_org_unit_id: mg.info.details.parent?.id ?? null, 
                name: mg.name, createdAt: new Date(), children: []})
            for(let subscription of mg.info?.children ?? []){
                if(subscription.type == "/subscriptions"){
                    let subscriptionRow = { id: subscription.id, csp_type_id: CspType.AZURE, 
                    account_alias: subscription.displayName, account_desc: subscription.name, account_status: "", createdAt: new Date(), 
                    csp_orgunit_id: mg.group.id};
                    subscriptionRows.push(subscriptionRow);
                }
            }
        }

        console.log("2222 *******")
        console.log(JSON.stringify(hierarchyList))
        return { orgUnits: managementGroupsRows, accounts: subscriptionRows, hasMoreRows: false};
    }
}
