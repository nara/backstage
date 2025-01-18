import { Config } from "@backstage/config";
import { ScmProvisioner } from "./scmInterface";

export class BitbucketScmProvisioner implements ScmProvisioner {
  
    private readonly config: Config;

    constructor(options: {
      config: Config
    }) {
      this.config = options.config;
    }

     async checkIfRepoExists(): Promise<any> {
          throw new Error("Method not implemented.");
      }
      async checkIfBranchExists(): Promise<any> {
          throw new Error("Method not implemented.");
      }
      async createRepo(): Promise<any> {
          throw new Error("Method not implemented.");
      }
      async createBranch(): Promise<any> {
          throw new Error("Method not implemented.");
      }
      async updateBranch(): Promise<any> {
          throw new Error("Method not implemented.");
      }
  }