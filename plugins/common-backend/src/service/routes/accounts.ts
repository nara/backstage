import { Router } from 'express';
import { RouterOptions } from './routerOptions';
import { DatabaseHandler } from '../../database/DatabaseHandler';

export function setupAccountRoutes(router: Router, options: RouterOptions, dbHandler: DatabaseHandler) {
    
    router.get('/accounts/:accountId/vpcs', async (request, response) => {
        let accountId = request.params.accountId;

        const data = await dbHandler.getVpcsFor(accountId);
        if (data?.length) {
          response.json({ status: 'ok', data: data });
        } else {
          response.json({ status: 'ok', data: [] });
        }
    });

    router.get('/vpcs/:vpcId/subnets', async (request, response) => {
      let vpcId = request.params.vpcId;

      const data = await dbHandler.getSubnetsFor(vpcId);
      if (data?.length) {
        response.json({ status: 'ok', data: data });
      } else {
        response.json({ status: 'ok', data: [] });
      }
  });
}

