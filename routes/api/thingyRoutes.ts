
/**
 * @file ./routes/api/thingyRoutes.ts
 * @description Defines the routes for the Thingy API using Koa Router.
 */

import Router from 'koa-router';
import ThingyController from '../../controllers/thingyController';

// Create a new Router
const thingyRoutes = new Router();


thingyRoutes.get('/', ThingyController.getThingy);

thingyRoutes.post('/:thingyId/bind', ThingyController.bindThingyToUser);

thingyRoutes.delete('/:thingyId/unbind', ThingyController.unbindThingyFromUser);

thingyRoutes.get('/sensorData/:sensorType', ThingyController.getThingySensorData);

thingyRoutes.post('/buzzer/:setting', ThingyController.setBuzzer);

thingyRoutes.post('/LED/setColor/:color', ThingyController.setLEDColor);

thingyRoutes.get('/sensorData/:sensorType/statistics/:statistic', ThingyController.getSensorDataStatistics);

export default thingyRoutes;