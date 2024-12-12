import { Context } from 'koa';
import { jest } from '@jest/globals';
import ThingyController from '../controllers/thingyController';
import * as UserController from '../controllers/userController';
import * as AuthController from '../controllers/authController';
import User from '../models/userModel';
import Thingy from '../models/thingyModel';
import InfluxDBHandler, { ISensorData, IEventData } from '../utils/influxDBHandler';
import 'koa';
import dotenv from 'dotenv';
import MongoDBHandler from '../utils/mongoDBHandler';
import { Point } from '@influxdata/influxdb-client';

dotenv.config();
// connect to mongodb
MongoDBHandler.getInstance().connect();

// connect to influxdb 
InfluxDBHandler.getInstance().getClient();

describe('ThingyController Tests', () => {
    describe('getThingy', () => {
        it('should return 200 and an array of thingies', async () => {
            const ctx = {} as Context & { body: any[] };

            jest.spyOn(Thingy, 'find').mockResolvedValueOnce([
                { name: 'thingy1' },
                { name: 'thingy2' },
            ]);

            await ThingyController.getThingy(ctx);

            expect(ctx.status).toBe(200);
            expect(Array.isArray(ctx.body)).toBeTruthy();
            expect(ctx.body.length).toBe(2);
        });
    });

    describe('bindThingyToUser', () => {
        it('should bind a thingy to a user', async () => {
            const ctx = {
                params: { thingyId: '6714cc70f9af99960e48f283' },
                state: { user: { id: '67150c77c303bb0753f8bc74' } },
                status: 0,
                body: {},
            } as unknown as Context & { body: { message: string } };
            
            const userMock = {
                _id: '6729ff772786df6ad6d80487',
                thingy: null,
                save: jest.fn(),
            };
            const thingyMock = {
                _id: '6714cc70f9af99960e48f283',
                isAvailable: true,
                save: jest.fn(),
            };

            jest.spyOn(User, 'findById').mockResolvedValueOnce(userMock);
            jest.spyOn(Thingy, 'findById').mockResolvedValueOnce(thingyMock);

            await ThingyController.bindThingyToUser(ctx);

            expect(ctx.status).toBe(200);
            expect(ctx.body.message).toBe('Thingy successfully bound to user');
            expect(userMock.thingy).toBe(thingyMock._id);
            expect(thingyMock.isAvailable).toBe(false);
            expect(userMock.save).toHaveBeenCalled();
            expect(thingyMock.save).toHaveBeenCalled();
        });

        it('should return 404 if user not found', async () => {
            const ctx = {
                params: { thingyId: '6714cc70f9af99960e48f283' },
                state: { user: { id: '67150c77c303bb0753f8bc74' } },
                status: 0,
                body: null,
            } as unknown as Context;
        
            jest.spyOn(User, 'findById').mockResolvedValueOnce(null);
        
            await ThingyController.bindThingyToUser(ctx);
        
            expect(ctx.status).toBe(404);
            // expect(ctx.body.error).toBe('User not found');
        });
    });

    describe('getThingySensorData', () => {
        it('should return sensor data for valid request', async () => {
            const ctx = {
                params: { sensorType: 'TEMP' },
                request: {
                    query: {
                        startTime: '2024-12-01T00:00:00Z',
                        endTime: '2024-12-31T23:59:59Z',
                    },
                },
                state: { user: { _id: '67150c77c303bb0753f8bc74' } },
                status: 0,
                body: null,
            } as unknown as Context;

            const userMock = {
                _id: '67150c77c303bb0753f8bc74',
                thingy: { name: 'yellow-2' },
                // populate: jest.fn().mockResolvedValue({ thingy: { name: 'thingy1' } } as never),
            };

            const sensorData: ISensorData[] = [
                {
                    thingyName: undefined,
                    type: 'TEMP',
                    value: 22.5,
                    timestamp: new Date('2024-01-15T10:00:00Z'),
                },
            ];
            
            jest.spyOn(User, 'findById').mockResolvedValueOnce(userMock);
            

            await ThingyController.getThingySensorData(ctx);

            expect(ctx.status).toBe(200);
            expect(ctx.body).toEqual(sensorData);
        });

        it('should return 400 if startTime or endTime missing', async () => {
            const ctx = {
                params: { sensorType: 'TEMP' },
                request: { query: {} },
                state: { user: { _id: 'userId' } },
                status: 0,
                body: null,
            } as unknown as Context;

            await ThingyController.getThingySensorData(ctx);

            expect(ctx.status).toBe(400);
            // expect(ctx.body.error).toBe('startTime and endTime are required');
        });
    });

    describe('getFlipEventHistory', () => {
        it('should return flip event history', async () => {
            const ctx = {
                status: 0,
                body: null,
            } as Context;

            const flipEvents: IEventData[] = [
                {
                    thingyName: 'thingy1',
                    type: 'FLIP',
                    value: 'ONSIDE',
                    timestamp: new Date('2023-01-10T12:00:00Z'),
                },
            ];

           

            await ThingyController.getFlipEventHistory(ctx);

            expect(ctx.status).toBe(200);
            expect(ctx.body).toEqual(flipEvents);
        });
    });
});

describe('UserController Tests', () => {
    describe('signin', () => {
        it('should sign in user with valid credentials', async () => {
            const ctx = {
                request: { body: { username: 'testuser', password: 'password123' } },
                status: 0,
                body: null,
            } as unknown as Context;

            const userMock = {
                _id: 'userId',
                username: 'testuser',
                password: 'hashedpassword',
                // comparePassword: jest.fn().mockResolvedalue(true),
            };

            jest.spyOn(User, 'findOne').mockResolvedValueOnce(userMock);

            await AuthController.signIn(ctx);

            expect(ctx.status).toBe(200);
            // expect(ctx.body.token).toBeDefined();
        });

        it('should return 401 for invalid credentials', async () => {
            const ctx = {
                request: { body: { username: 'testuser', password: 'wrongpassword' } },
                status: 0,
                body: null,
            } as unknown as Context;

            const userMock = {
                _id: 'userId',
                username: 'testuser',
                password: 'hashedpassword',
            };

            jest.spyOn(User, 'findOne').mockResolvedValueOnce(userMock);

            await AuthController.signIn(ctx);


            expect(ctx.status).toBe(401);
            // expect(ctx.body.error).toBe('Invalid username or password');
        });
    });
});

describe('InfluxDBHandler Tests', () => {
    it('should write and query data point successfully', async () => {
        const query = `from(bucket: "${process.env.INFLUXDB_BUCKET}")
            |> range(start: -30d)
            |> filter(fn: (r) => r["_measurement"] == "flip_events")`;
        const previous = await InfluxDBHandler.getInstance().queryEventData(query);
        
        let pointMock = new Point('flip_events')
                                .tag('thingyName', 'yellow-2')
                                .stringField('FLIP', 'NORMAL')
                                .timestamp(new Date());
       

        await InfluxDBHandler.getInstance().writeData(pointMock);
        
        const now = await InfluxDBHandler.getInstance().queryEventData(query);
        expect(now.length).toBe(previous.length + 1);
    });

});
