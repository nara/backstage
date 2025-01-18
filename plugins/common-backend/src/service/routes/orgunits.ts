import { Router } from 'express';
import { RouterOptions } from './routerOptions';
import { DatabaseHandler } from '../../database/DatabaseHandler';

export function setupOrgUnitRoutes(router: Router, options: RouterOptions, dbHandler: DatabaseHandler) {
    
    router.get('/orgunits', async (request, response) => {
        let asHiearchy = request.query.asHierarchy == 'true';
        const data = await dbHandler.getOrgUnits(asHiearchy);
        if (data?.length) {
          response.json({ status: 'ok', data: data });
        } else {
          response.json({ status: 'ok', data: [] });
        }
    });

    router.get('/orgunits/:orgId/accounts', async (request, response) => {
        let orgId = request.params.orgId;

        const data = await dbHandler.getAccountsFor(orgId);
        if (data?.length) {
          response.json({ status: 'ok', data: data });
        } else {
          response.json({ status: 'ok', data: [] });
        }
    });
}

