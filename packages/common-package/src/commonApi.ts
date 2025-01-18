
export interface CommonApi {
  getOrgUnits(): Promise<any>;
  getAccounts(orgId?: string): Promise<any>;
  getVpcs(accountId: string): Promise<any>;
  getSubnets(vpcId: string): Promise<any>;
  getAccountResources(resourceType: string, accountId: string): Promise<any>;
  getApps(): Promise<any>;
  getAppLayers(appId: string): Promise<any>;
  saveAppLayer(layer: any): Promise<any>;
  getEntityJson(entityId: string): Promise<any>;
  saveEntityJson(entity: any): Promise<any>;
}
