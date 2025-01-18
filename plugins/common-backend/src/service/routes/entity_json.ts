import { Router } from 'express';
import { RouterOptions } from './routerOptions';
import { DatabaseHandler } from '../../database/DatabaseHandler';
import { EntityJson } from '../../database/types/entity_json';

export function setupEntityJsonRoutes(router: Router, options: RouterOptions, dbHandler: DatabaseHandler) {
    
    router.get('/entityjsons', async (request, response) => {
      let componentId = request.query.componentId as string;
      const data = await dbHandler.getEntityJson(componentId);
      if (data?.length > 0) {
        response.json({ status: 'ok', data: data });
      } else {
        response.json({ status: 'error', data: [] });
      }
    });

    router.post('/entityjsons', async (request, response) => {
        let entityJson: EntityJson = request.body;
        
        const data = await dbHandler.saveEntityJson(entityJson);
        if (data) {
          response.json({ status: 'ok', data: data });
        } else {
          response.json({ status: 'error', data: [] });
        }
    });
}

