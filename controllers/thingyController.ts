/**
 * @file ./controllers/thingyController.ts
 * @description Defines the controller class for handling operations related to Thingy.
 */

import { Context, Next } from 'koa';
import Thingy, { EventData, IThingy, SensorData } from '../models/thingyModel';
import User from '../models/userModel';
import { Schema } from 'mongoose';
import { PassThrough } from 'stream';
import eventEmitter from '../utils/eventHandler';
import { IThingyMessage } from '../mqtt/mqttHandle';
import MqttHandler from '../mqtt/mqttHandle';
import { Point } from '@influxdata/influxdb-client';
import InfluxDBHandler from '../utils/influxDBHandler';
/**
 * Controller class for handling operations related to Thingy.
 */
class ThingyController {
    


    /**
     * Retrieves all Thingy records.
     * @param ctx - Koa context object.
     * @param next - Koa next middleware function.
     */
    static async getThingy(ctx: Context) {
        const things = await Thingy.find();
        ctx.body = things;
        ctx.status = 200;
    }

    /**
     * Binds a Thingy to a user.
     * @param ctx - Koa context object.
     * @param next - Koa next middleware function.
     */
    static async bindThingyToUser(ctx: Context) {
        // console.log('bindThingyToUser');
        // console.log(ctx.state.user);
        const userId = ctx.state.user.id;
        const thingyId = ctx.params.thingyId;

        if (!thingyId) {
            ctx.status = 400;
            ctx.body = { error: 'Thingy ID are required' };
            return;
        }
        const thingy = await Thingy.findById(thingyId);
        if (!thingy) {
            ctx.status = 404;
            ctx.body = { error: 'Thingy not found' };
            return;
        }
        const user = await User.findById(userId);
        if (!user) {
            ctx.status = 404;
            ctx.body = { error: 'User not found' };
            return;
        }
        user.thingy = thingyId;
        await user.save();
        thingy.isAvailable = false;
        await thingy.save();
        ctx.status = 200;
        ctx.body = { 
            message: 'Thingy successfully bound to user',
            thingy: thingy
        };
    }

    /**
     * Unbinds a Thingy from a user.
     * @param ctx - Koa context object.
     * @param next - Koa next middleware function.
     */
    static async unbindThingyFromUser(ctx: Context) {
       const userId = ctx.state.user.id;
        const user = await User.findById(userId);
        if (!user) {
            ctx.status = 404;
            ctx.body = { error: 'User not found' };
            return;
        }

        const thingyId = ctx.params.thingyId;
        if (!thingyId) {
            ctx.status = 400;
            ctx.body = { error: 'Thingy ID is required' };
            return;
        }

        if (!user.thingy || user.thingy.toString() !== thingyId.toString()) {
            ctx.status = 400;
            ctx.body = { error: 'Thingy is not bound to the user' };
            return;
        }

        const thingy = await Thingy.findById(thingyId);
        if (!thingy) {
            ctx.status = 404;
            ctx.body = { error: 'Thingy not found' };
            return;
        }
        delete user.thingy;
        await user.save();
        thingy.isAvailable = true;
        await thingy.save();

        ctx.status = 200;
        ctx.body = { 
            message: 'Thingy successfully unbound from user',
            thingy: thingy
        };

    }

    /**
     * Retrieves sensor data from a Thingy.
     * @param ctx - Koa context object.
     * @param next - Koa next middleware function.
     */
    static async getThingySensorData(ctx: Context) {
        const userId = ctx.state.user.id;
        const sensorType = ctx.params.sensorType;
        const startTime = ctx.request.query.startTime;
        const endTime = ctx.request.query.endTime;
            
        const user = await User.findById(userId);
        if (!user) {
            ctx.status = 404;
            ctx.body = { error: 'User not found' };
            return;
        }
        if (!sensorType || !startTime || !endTime
            || typeof sensorType !== 'string' || typeof startTime !== 'string' || typeof endTime !== 'string'
        ) {
            ctx.status = 400;
            ctx.body = { error: 'sensorType, startTime, and endTime are required' };
            return;
        }
        if (!user.thingy) {
            ctx.status = 400;
            ctx.body = { error: 'Thingy is not bound to the user' };
            return;
        }
        const userPopulated = await user.populate<{ thingy: IThingy }>('thingy');
        if (!userPopulated.thingy) {
            ctx.status = 400;
            ctx.body = { error: 'Thingy is not bound to the user' };
            return;
        }
        
        const query = `from(bucket: "${process.env.INFLUXDB_BUCKET}")
            |> range(start: ${new Date(startTime).toISOString()}, stop: ${new Date(endTime).toISOString()})
            |> filter(fn: (r) => r["_measurement"] == "sensor_data")
            |> filter(fn: (r) => r["thingyName"] == "${userPopulated.thingy.name}")
            |> filter(fn: (r) => r["_field"] == "${sensorType}")`;
        ctx.status = 200;
        ctx.body = await InfluxDBHandler.getInstance().querySensorData(query);
    }
  

    static async subscribetoFlipEvent(ctx: Context) {
        console.log('subscribetoFlipEvent');
        const userId = ctx.state.user.id;
        const user = await User.findById(userId);
        if (!user) {
            ctx.status = 404;
            ctx.body = { error: 'User not found' };
            return;
        }
        if (!user.thingy) {
            ctx.status = 400;
            ctx.body = { error: 'Thingy is not bound to the user' };
            return;
        }
        const userPopulated = await user.populate<{ thingy: IThingy }>('thingy');
        if (!userPopulated.thingy) {
            ctx.status = 400;
            ctx.body = { error: 'Thingy is not bound to the user' };
            return;
        }
        const thingyId = userPopulated.thingy.name;
        const stream = new PassThrough();
        eventEmitter.on(thingyId + '-flip', (data: IThingyMessage) => {
            let flipData = new Point('flip_events')
                                .tag('thingyName', thingyId)
                                .stringField(data.appId, data.data)
                                .timestamp(new Date());
            InfluxDBHandler.getInstance().writeData(flipData);
            stream.write(`data: ${data}\n\n`);
            // the data may be lost if there's problem with the connection
            // This is the simplest way to handle it
            // For production, we may need the stream to be closed by frontend user.
            stream.end();
        });
        setInterval(() => {
            if (stream.writable) {
                stream.write('data: beating...\n\n');
            }
        }, 5000);
        
        ctx.request.socket.setTimeout(0);
        ctx.req.socket.setNoDelay(true);
        ctx.req.socket.setKeepAlive(true);
    
        ctx.set({
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
        });

        ctx.status = 200;
        ctx.body = stream;
    }
    
    static async subscribetoButtonEvent(ctx: Context) {
        console.log('subscribetoButtonEvent');
        const userId = ctx.state.user.id;
        const user = await User.findById(userId);
        if (!user) {
            ctx.status = 404;
            ctx.body = { error: 'User not found' };
            return;
        }
        if (!user.thingy) {
            ctx.status = 400;
            ctx.body = { error: 'Thingy is not bound to the user' };
            return;
        }
        const userPopulated = await user.populate<{ thingy: IThingy }>('thingy');
        if (!userPopulated.thingy) {
            ctx.status = 400;
            ctx.body = { error: 'Thingy is not bound to the user' };
            return;
        }
        const thingyId = userPopulated.thingy.name;
        const stream = new PassThrough();
        eventEmitter.on(thingyId + '-button', (data: IThingyMessage) => {
            let buttonData = new Point('button_events')
                                .tag('thingyName', thingyId)
                                .stringField(data.appId, data.data)
                                .timestamp(new Date());
            InfluxDBHandler.getInstance().writeData(buttonData);
            stream.write(`data: ${data}\n\n`);
            // the data may be lost if there's problem with the connection
            // This is the simplest way to handle it
            // For production, we may need the stream to be closed by frontend user.
            stream.end(); 
        });
        setInterval(() => {
            if (stream.writable) {
                stream.write('data: beating...\n\n');
            }
        }, 5000);
        
        ctx.request.socket.setTimeout(0);
        ctx.req.socket.setNoDelay(true);
        ctx.req.socket.setKeepAlive(true);
    
        ctx.set({
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
        });

        ctx.status = 200;
        ctx.body = stream;
    }

   

    /**
     * Retrieves flip event history.
     * @param ctx - Koa context object.
     * @param next - Koa next middleware function.
     */
    static async getFlipEventHistory(ctx: Context) {
        const query = `from(bucket: "${process.env.INFLUXDB_BUCKET}")
            |> range(start: -30d)
            |> filter(fn: (r) => r["_measurement"] == "flip_events")`;
        const flipEvents = await InfluxDBHandler.getInstance().queryEventData(query);
        ctx.status = 200;
        ctx.body = flipEvents;
    }

    /**
     * Retrieves button press event history.
     * @param ctx - Koa context object.
     * @param next - Koa next middleware function.
     */
    static async getButtonEventHistory(ctx: Context) {
        const query = `from(bucket: "${process.env.INFLUXDB_BUCKET}")
            |> range(start: -30d)
            |> filter(fn: (r) => r["_measurement"] == "flip_events")`;
        const buttonEvents = await InfluxDBHandler.getInstance().queryEventData(query);
        ctx.status = 200;
        ctx.body = buttonEvents;
    }

    

   

    


    /**
     * Controls the Thingy's buzzer (turn ON/OFF).
     * @param ctx - Koa context object.
     * @param next - Koa next middleware function.
     */
    static async setBuzzer(ctx: Context) {
        const userId = ctx.state.user.id;
        const setting = ctx.params.setting; // 'on' or 'off'

        if (!['on', 'off'].includes(setting)) {
            ctx.status = 400;
            ctx.body = { status: 'error', message: 'Invalid setting parameter' };
            return;
        }

        const user = await User.findById(userId);
        if (!user || !user.thingy) {
            ctx.status = 404;
            ctx.body = { status: 'error', message: 'Thingy not bound to user' };
            return;
        }

        const thingy = await Thingy.findById(user.thingy);
        if (!thingy) {
            ctx.status = 404;
            ctx.body = { status: 'error', message: 'Thingy not found' };
            return;
        }

        const deviceId = thingy.name;

        const frequency = setting === 'on' ? 3000 : 0;
        const message = JSON.stringify({
            appId: 'BUZZER',
            data: { frequency },
            messageType: 'CFG_SET',
        });

        try {
            await MqttHandler.getInstance().publish(deviceId, message);
            ctx.status = 200;
            ctx.body = {
                status: 'success',
                data: { message },
            };
        } catch (error) {
            ctx.status = 500;
            ctx.body = {
                status: 'error',
                message: 'An error occurred while processing the request',
            };
        }
    }

    /**
     * Sets the Thingy's LED color.
     * @param ctx - Koa context object.
     * @param next - Koa next middleware function.
     */
    static async setLEDColor(ctx: Context) {
        const userId = ctx.state.user.id;
        const color = ctx.params.color; // 'green', 'red', 'blue'

        const colorMap: { [key: string]: string } = {
            red: 'ff0000',
            green: '00ff00',
            blue: '0000ff',
        };

        if (!Object.keys(colorMap).includes(color)) {
            ctx.status = 400;
            ctx.body = { status: 'error', message: 'Invalid color parameter' };
            return;
        }

        const user = await User.findById(userId);
        if (!user || !user.thingy) {
            ctx.status = 404;
            ctx.body = { status: 'error', message: 'Thingy not bound to user' };
            return;
        }

        const thingy = await Thingy.findById(user.thingy);
        if (!thingy) {
            ctx.status = 404;
            ctx.body = { status: 'error', message: 'Thingy not found' };
            return;
        }

        const deviceId = thingy.name;

        const message = JSON.stringify({
            appId: 'LED',
            data: { color: colorMap[color] },
            messageType: 'CFG_SET',
        });

        try {
            await MqttHandler.getInstance().publish(deviceId, message);
            ctx.status = 200;
            ctx.body = {
                status: 'success',
                data: { message },
            };
        } catch (error) {
            ctx.status = 500;
            ctx.body = {
                status: 'error',
                message: 'An error occurred while processing the request',
            };
        }
    }

    /**
     * Retrieves statistics of sensor data.
     * @param ctx - Koa context object.
     * @param next - Koa next middleware function.
     */
    static async getSensorDataStatistics(ctx: Context) {
        const userId = ctx.state.user.id;
        const sensorType = ctx.params.sensorType;
        const statistic = ctx.params.statistic; // 'min', 'max', 'average'
        const startTime = ctx.query.startTime as string;
        const endTime = ctx.query.endTime as string;

        const validSensorTypes = ['TEMP', 'HUMID', 'AIR_PRESS', 'AIR_QUAL', 'CO2_EQUIV', 'LIGHT'];
        const validStatistics = ['min', 'max', 'average'];

        if (!validSensorTypes.includes(sensorType) || !validStatistics.includes(statistic)) {
            ctx.status = 400;
            ctx.body = { error: 'Invalid sensorType or statistic parameter' };
            return;
        }

        if (!startTime || !endTime) {
            ctx.status = 400;
            ctx.body = { error: 'startTime and endTime are required' };
            return;
        }

        const user = await User.findById(userId).populate<{ thingy: IThingy }>('thingy');
        if (!user || !user.thingy) {
            ctx.status = 404;
            ctx.body = { error: 'Thingy not bound to user' };
            return;
        }

        const thingyName = user.thingy.name;
        const startDate = new Date(startTime);
        const endDate = new Date(endTime);

        try {
            const matchCondition = {
                thingyName,
                type: sensorType,
                timestamp: { $gte: startDate, $lte: endDate },
            };

            let aggregationPipeline = [
                { $match: matchCondition },
                {
                    $group: {
                        _id: null,
                        value:
                            statistic === 'average'
                                ? { $avg: '$value' }
                                : statistic === 'min'
                                ? { $min: '$value' }
                                : { $max: '$value' },
                    },
                },
            ];

            const result = await SensorData.aggregate(aggregationPipeline);

            if (result.length === 0) {
                ctx.status = 404;
                ctx.body = { error: 'No data found for the given parameters' };
                return;
            }

            ctx.status = 200;
            ctx.body = {
                timestamp: new Date().toISOString(),
                sensorType,
                value: result[0].value,
            };
        } catch (error) {
            ctx.status = 500;
            ctx.body = {
                status: 'error',
                message: 'An error occurred while processing the request',
            };
        }
    }
}

export default ThingyController;