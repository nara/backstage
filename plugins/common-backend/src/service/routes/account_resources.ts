import { Router } from 'express';
import { RouterOptions } from './routerOptions';
import { DatabaseHandler } from '../../database/DatabaseHandler';

export function setupAccountResourceRoutes(router: Router, options: RouterOptions, dbHandler: DatabaseHandler) {
    
  router.get('/accounts/:accountId/:resourceType', async (request, response) => {
    let accountId = request.params.accountId;
    let resourceType = request.params.resourceType;

    const data = await dbHandler.getResources(resourceType, accountId);
    if (data?.length) {
      response.json({ status: 'ok', data: data });
    } else {
      response.json({ status: 'ok', data: [] });
    }
});
}

