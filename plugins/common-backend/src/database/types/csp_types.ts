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

export enum CspType {
  AWS = 1,
  AZURE = 2,
  GCP = 3,
  ORACLE = 4
}

export type CspOrgUnitRow = {
  id: string;
  csp_type_id: CspType;
  name: string;
  org_unit_id: string;
  parent_org_unit_id: string;
  createdAt: Date;
  children: CspOrgUnitRow[];
}

export type CspAccountRow = {
  id: string;
  csp_type_id: CspType;
  account_alias: string;
  account_status: string;
  account_desc: string;
  csp_orgunit_id: string;
  createdAt: Date;
}

export type VpcRow = {
  vpcId: string;
  vpc_detail_id: string;
  csp_type_id: CspType;
  vpc_name: string;
  vpc_cidr: string;
  csp_account_id: string;
  region: string | null;
  createdAt: Date;
}

export type VpcSubnetRow = {
  subnetId: string;
  csp_type_id: CspType;
  vpc_id: string;
  subnet_name: string;
  region: string;
  subnet_cidr: string;
  createdAt: Date;
}

export interface CspResourceRow {
  resourceId: string;
  csp_account_id: string;
  resource_detail_id: string;
  resourceType: string;
  resourceName: string;
  csp_type_id: CspType;
  region: string;
  createdAt: Date;
}