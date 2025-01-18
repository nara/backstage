/*
 * Copyright 2021 The Backstage Authors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { resolvePackagePath } from '@backstage/backend-common';
import { Knex } from 'knex';
import { getOrgUnits } from './repositories/orgunits';
import { getAccountsFor } from './repositories/accounts';
import { getVpcsFor, getSubnetsFor } from './repositories/vpcs';
import { getLayers, saveLayer, getApps } from './repositories/app_layers';
import { getResources } from './repositories/account_resources';
import { getEntityJson, saveEntityJson } from './repositories/entity_json';

const migrationsDir = resolvePackagePath(
  '@internal/plugin-common-backend',
  'migrations',
);

type Options = {
  database: Knex;
  shouldMigrate: boolean
};

export class DatabaseHandler {
  private static async create(options: Options): Promise<DatabaseHandler> {
    const { database } = options;

    console.log("########## Migrating database ##########")
    console.log(migrationsDir)
  
    await database.migrate.latest({
      directory: migrationsDir,
    });

    return new DatabaseHandler(options);
  }

  public static instance: DatabaseHandler;

  static async getInstance(options: Options): Promise<DatabaseHandler> {
    if (!DatabaseHandler.instance) {
      DatabaseHandler.instance = await DatabaseHandler.create(options);
    }
    return DatabaseHandler.instance;
  }

  public readonly database: Knex;

  private constructor(options: Options) {
    this.database = options.database;
  }

  //public methods
  public getOrgUnits = getOrgUnits;
  public getAccountsFor = getAccountsFor;
  public getVpcsFor = getVpcsFor;
  public getSubnetsFor = getSubnetsFor;
  public getLayers = getLayers;
  public saveLayer = saveLayer;
  public getApps = getApps;
  public getResources = getResources;
  public getEntityJson = getEntityJson;
  public saveEntityJson = saveEntityJson;
}
