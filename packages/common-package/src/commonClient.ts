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

import {
  DiscoveryApi,
  IdentityApi,
} from '@backstage/core-plugin-api';
import { CommonApi } from './commonApi';

export class CommonClient implements CommonApi {
  
  private readonly discoveryApi: DiscoveryApi;

  constructor(options: {
    discoveryApi: DiscoveryApi;
  }) {
    this.discoveryApi = options.discoveryApi;
  }

  async getEntityJson(entityId: string): Promise<any> {
    const baseUrl = await this.discoveryApi.getBaseUrl('common');
    const response = await fetch(
      `${baseUrl}/entityjsons?componentId=${encodeURIComponent(entityId)}`,
      {
        method: 'GET',
      },
    );

    if(response.ok){
      let jsonData = await response.json();
      return jsonData.data;
    }
    return null;
  }

  async saveEntityJson(entity: any): Promise<any> {
    const baseUrl = await this.discoveryApi.getBaseUrl('common');
    let method = 'POST';
    let url = `${baseUrl}/entityjsons`;
    
    const response = await fetch(
      url,
      {
        method: method,
        body: JSON.stringify(entity),
        headers: {
          'Content-Type': 'application/json',
        },
      },
    );

    if(response.ok){
      let jsonData = await response.json();
      return jsonData.data;
    }
    return null;
  }

  async getApps(): Promise<any> {
    const baseUrl = await this.discoveryApi.getBaseUrl('common');
    const response = await fetch(
      `${baseUrl}/apps`,
      {
        method: 'GET',
      },
    );

    if(response.ok){
      let jsonData = await response.json();
      return jsonData.data;
    }
    return null;
  }

  async getAppLayers(appId: string): Promise<any> {
    
    const baseUrl = await this.discoveryApi.getBaseUrl('common');
    const response = await fetch(
      `${baseUrl}/apps/${encodeURIComponent(appId)}/layers`,
      {
        method: 'GET',
      },
    );

    if(response.ok){
      let jsonData = await response.json();
      return jsonData.data;
    }
    return null;

  }

  async saveAppLayer(layer: any): Promise<any> {
    
    const baseUrl = await this.discoveryApi.getBaseUrl('common');
    let method = layer.layerIndex && layer.layerIndex >= 0 ? 'PUT' : 'POST';
    let url = `${baseUrl}/apps/${encodeURIComponent(layer.appId)}/layers`;
    url = method == 'PUT' ? `${url}/${encodeURIComponent(layer.layerIndex)}` : url;
    delete layer.appId;
    
    const response = await fetch(
      url,
      {
        method: method,
        body: JSON.stringify(layer),
        headers: {
          'Content-Type': 'application/json',
        },
      },
    );

    if(response.ok){
      let jsonData = await response.json();
      return jsonData.data;
    }
    return null;

  }

  async getOrgUnits(): Promise<any> {
    const baseUrl = await this.discoveryApi.getBaseUrl('common');

    const response = await fetch(
      `${baseUrl}/orgunits`,
      {
        method: 'GET',
      },
    );

    if(response.ok){
      let jsonData = await response.json();
      return jsonData.data;
    }
    return null;
  }

  async getAccounts(orgId?: string): Promise<any> {
    if (!orgId) {
      return null;
    }

    const baseUrl = await this.discoveryApi.getBaseUrl('common');

    const response = await fetch(
      `${baseUrl}/orgunits/${encodeURIComponent(orgId)}/accounts`,
      {
        method: 'GET',
      },
    );

    if(response.ok){
      let jsonData = await response.json();
      return jsonData.data;
    }
    return null;
  }

  async getAccountResources(resourceType: string, accountId?: string): Promise<any> {
    console.log("*************** calling account resources")

    if (!accountId || accountId == '' || !resourceType || resourceType == '') {
      return null;
    }
    
    const baseUrl = await this.discoveryApi.getBaseUrl('common');

    const response = await fetch(
      `${baseUrl}/accounts/${encodeURIComponent(accountId)}/${resourceType}`,
      {
        method: 'GET',
      },
    );

    if(response.ok){
      let jsonData = await response.json();
      return jsonData.data;
    }
    return null;
  }

  async getVpcs(accountId: string): Promise<any> {
    
    console.log("*************** calling vpcs")

    if (!accountId || accountId == '') {
      return null;
    }

    
    const baseUrl = await this.discoveryApi.getBaseUrl('common');

    const response = await fetch(
      `${baseUrl}/accounts/${encodeURIComponent(accountId)}/vpcs`,
      {
        method: 'GET',
      },
    );

    if(response.ok){
      let jsonData = await response.json();
      return jsonData.data;
    }
    return null;
  }

  async getSubnets(vpcId: string): Promise<any> {
    
    if (!vpcId || vpcId == '') {
      return null;
    }

    const baseUrl = await this.discoveryApi.getBaseUrl('common');

    const response = await fetch(
      `${baseUrl}/vpcs/${encodeURIComponent(vpcId)}/subnets`,
      {
        method: 'GET',
      },
    );

    if(response.ok){
      let jsonData = await response.json();
      return jsonData.data;
    }
    return null;
  }
}
