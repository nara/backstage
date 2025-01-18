import { AccountRetrieverResult, CspAccountRetriever } from "../types";


export class AccountRetriever implements CspAccountRetriever{

    static fromConfig(config: Config): AccountRetriever {
        return new AccountRetriever("");
    }

    constructor(creds: string){
        
    }

    retrieve(): Promise<AccountRetrieverResult> {
        throw new Error("Method not implemented.");
    }

}