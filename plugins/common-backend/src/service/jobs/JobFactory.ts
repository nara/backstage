import { Config } from '@backstage/config';
import { AccountProcessorJob } from './AccountProcessorJob';
import { ProcessJob } from './types';
import { AccountRetriever as GcpAccountRetriever, VpcSubnetRetriever as GcpSubnetRetriever } from './Gcp';
import { SubscriptionRetriever, VnetSubnetRetriever, AksClusterRetriever } from './Azure';
import { TaskScheduler } from '@backstage/backend-tasks';
import { Duration } from 'luxon';
import { Knex } from 'knex';
import { NetworkProcessorJob } from './NetworkProcessorJob';
import { AccountResourcesJob } from './AccountResourcesJob'
import { CspType } from '../../database';

export class JobFactory {
    
    private jobs: ProcessJob[];
    private config: Config;

    private constructor(config: Config, database: Knex){
        this.jobs = [];
        this.config = config;
        if(config.getOptionalBoolean("org.gcp.jobs.retrieveProjects")){
            this.jobs.push(new AccountProcessorJob("refresh-gcp-projects", config, database, GcpAccountRetriever.fromConfig(config)))
        }
        if(config.getOptionalBoolean("org.gcp.jobs.retrieveSubnets")){
            this.jobs.push(new NetworkProcessorJob(CspType.GCP, "refresh-gcp-vpcsubnets", config, database, GcpSubnetRetriever.fromConfig(config)))
        }
        if(config.getOptionalBoolean("org.azure.jobs.retrieveSubscriptions")){
            this.jobs.push(new AccountProcessorJob("refresh-azure-subscriptions", config, database, SubscriptionRetriever.fromConfig(config)))
        }
        if(config.getOptionalBoolean("org.azure.jobs.retrieveSubnets")){
            this.jobs.push(new NetworkProcessorJob(CspType.AZURE, "refresh-azure-ventsubnets", config, database, VnetSubnetRetriever.fromConfig(config)))
        }
        if(config.getOptionalBoolean("org.azure.jobs.retrieveK8Clusters")){
            this.jobs.push(new AccountResourcesJob(CspType.AZURE, "refresh-azure-k8Clusters", config, database, AksClusterRetriever.fromConfig(config)))
        }
    }

    static fromStatic(config: Config, database: Knex): JobFactory {
        return new JobFactory(config, database);
    }

    getJobs(): ProcessJob[] {
        return this.jobs;
    }

    start(): void {
        const scheduler = TaskScheduler.fromConfig(this.config).forPlugin('common-backend');

        this.jobs.forEach(async (job) =>  {
            console.log("starting job: " + job.name)
        });
        this.jobs.forEach(async (job) => {
            scheduler.scheduleTask({
                id: job.name,
                timeout: Duration.fromObject({ minutes: 100 }),
                //frequency: Duration.fromObject({ seconds: job.intervalInHours*3600 }),
                frequency: Duration.fromObject({ seconds: job.intervalInHours*3600 }),
                fn: async () => {
                    await job.run()
                },
            });
        });
    }
}