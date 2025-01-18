import { Logger } from 'winston';
import { Config } from '@backstage/config';
import {
  LoggerService,
  DatabaseService,
} from '@backstage/backend-plugin-api';

export interface RouterOptions {
    logger: LoggerService;
    database: DatabaseService;
    config: Config;
}