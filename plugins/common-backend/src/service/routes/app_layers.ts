import { Router } from 'express';
import { RouterOptions } from './routerOptions';
import { DatabaseHandler } from '../../database/DatabaseHandler';
import { AppLayerSchema } from '../../database/types/app_build'

export function setupAppLayerRoutes(router: Router, options: RouterOptions, dbHandler: DatabaseHandler) {
    
  router.get('/apps', async (request, response) => {
    const data = await dbHandler.getApps();
    if (data?.length > 0) {
      response.json({ status: 'ok', data: data });
    } else {
      response.json({ status: 'error', data: [] });
    }
  });

    router.get('/apps/:appId/layers', async (request, response) => {
      let appId = request.params.appId;
      const data = await dbHandler.getLayers(appId);
      if (data?.length > 0) {
        response.json({ status: 'ok', data: data });
      } else {
        response.json({ status: 'error', data: [] });
      }
    });

    router.post('/apps/:appId/layers', async (request, response) => {
        let layerSchema: AppLayerSchema = request.body;
        layerSchema.appUniqueName =  request.params.appId;
        
        const data = await dbHandler.saveLayer(layerSchema);
        if (data) {
          response.json({ status: 'ok', data: data });
        } else {
          response.json({ status: 'error', data: [] });
        }
    });

    router.put('/apps/:appId/layers/:layerId', async (request, response) => {
      let layerSchema: AppLayerSchema = request.body;
      layerSchema.appUniqueName = request.params.appId;
      layerSchema.layerIndex = parseInt(request.params.layerId);
      
      const data = await dbHandler.saveLayer(layerSchema);
      if (data) {
        response.json({ status: 'ok', data: data });
      } else {
        response.json({ status: 'error', data: [] });
      }
  });
}

