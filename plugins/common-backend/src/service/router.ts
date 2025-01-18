import { errorHandler } from '@backstage/backend-common';
import express from 'express';
import Router from 'express-promise-router';

import { JobFactory } from './jobs/JobFactory';
import { RouterOptions, setupOrgUnitRoutes, setupAccountRoutes, setupAppLayerRoutes, 
  setupAccountResourceRoutes, setupEntityJsonRoutes } from './routes';
import { DatabaseHandler } from '../database/DatabaseHandler';


export async function createRouter(
  options: RouterOptions,
): Promise<express.Router> {
  const { logger, config } = options;
  const dbClient = await options.database.getClient();
  const dbHandler = await DatabaseHandler.getInstance({ database: dbClient, shouldMigrate: !options.database.migrations?.skip });
  
  const router = Router();
  router.use(express.json());

  router.get('/health', (_, response) => {
    logger.info('PONG!');
    response.json({ status: 'ok' });
  });

  router.use(errorHandler());
  setupOrgUnitRoutes(router, options, dbHandler);
  setupAccountRoutes(router, options, dbHandler);
  setupAppLayerRoutes(router, options, dbHandler);
  setupAccountResourceRoutes(router, options, dbHandler);
  setupEntityJsonRoutes(router, options, dbHandler);

  console.log("starting Jobs")
  JobFactory.fromStatic(config, dbClient).start();
  
  router.get('/health', (_, response) => {
    logger.info('PONG!');
    response.json({ status: 'ok' });
  });
  router.use(errorHandler());
  return router;
}
