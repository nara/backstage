import { CspOrgUnitRow, CspAccountRow, VpcSubnetRow, VpcRow, K8ClusterRow } from "../../database"

export type ProcessJob = {
    intervalInHours: number;
    name: string;
    run(): Promise<void>;
}

export type AccountRetrieverResult = {
    orgUnits: CspOrgUnitRow[];
    accounts: CspAccountRow[];
    hasMoreRows: boolean;
}

export type NetworkRetrieverResult = {
    vpcs: VpcRow[],
    subnets: VpcSubnetRow[];
}

export interface AksClusterRetrieverResult {
    clusters: K8ClusterRow[];
}

export type CspAccountRetriever = {
    retrieve(): Promise<AccountRetrieverResult>;
}

export type CspNetworkRetriever = {
    retrieve(account: CspAccountRow): Promise<NetworkRetrieverResult>;
}

export type CspK8ClusterRetriever = {
    retrieve(account: CspAccountRow): Promise<AksClusterRetrieverResult>;
}
