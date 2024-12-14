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
import { ObjectId } from 'mongoose';

beforeAll(async () => {
    dotenv.config();
    await MongoDBHandler.getInstance().connect();
    await InfluxDBHandler.getInstance().getClient();
});

afterAll(async () => {
    await MongoDBHandler.getInstance().disconnect();
});


describe('ThingyController Tests', () => {
    let user_id: ObjectId;
    beforeAll(async () => {
        const ctx = {
            request: {
                body: {
                    username: 'daz',
                    password: 'daz',
                    email: 'daz@gmail.com',
                    transportType: 'bike'
                },
            },
            status: 0,
            body: null,
        } as unknown as Context;
        await AuthController.signUp(ctx);
        user_id = (ctx.body as { id: ObjectId }).id;

    });

    afterAll(async () => {
        await User.deleteMany({});
    });
    describe('getThingy', () => {
        it('should return 200 and an array of thingies', async () => {
            const ctx = {} as Context & { body: any[] };

            jest.spyOn(Thingy, 'find').mockResolvedValueOnce([
                { name: 'yellow-1' },
                { name: 'yellow-2' },
                { name: 'yellow-3' }
            ]);

            await ThingyController.getThingy(ctx);

            expect(ctx.status).toBe(200);
            expect(Array.isArray(ctx.body)).toBeTruthy();
            expect(ctx.body.length).toBe(3);
        });
    });

    describe('bindThingyToUser', () => {
        it('should bind a thingy to a user', async () => {
            const thingy_id: string = (await Thingy.findOne({ name: 'yellow-2' }))._id as string;
            const ctx = {
                params: { thingyId: thingy_id },
                state: { user: { id: user_id } },
                status: 0,
                body: {},
            } as unknown as Context & { body: { message: string } };
            
            const userMock = {
                _id: user_id,
                thingy: null,
                save: jest.fn(),
            };
            const thingyMock = {
                _id: thingy_id,
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

        it('should unbind a thingy from a user', async () => {
            const thingy_id: string = (await Thingy.findOne({ name: 'yellow-2' }))._id as string;
            const ctx = {
                params: { thingyId: thingy_id },
                state: { user: { id: user_id } },
                status: 0,
                body: {},
            } as unknown as Context & { body: { message: string } };
            
            const userMock = {
                _id: user_id,
                thingy: thingy_id,
                save: jest.fn(),
            };
            const thingyMock = {
                _id: thingy_id,
                isAvailable: false,
                save: jest.fn(),
            };

            jest.spyOn(User, 'findById').mockResolvedValueOnce(userMock);
            jest.spyOn(Thingy, 'findById').mockResolvedValueOnce(thingyMock);

            await ThingyController.unbindThingyFromUser(ctx);

            expect(ctx.status).toBe(200);
            expect(ctx.body.message).toBe('Thingy successfully unbound from user');
            expect(userMock.thingy).toBe(undefined);
            expect(thingyMock.isAvailable).toBe(true);
            expect(userMock.save).toHaveBeenCalled();
            expect(thingyMock.save).toHaveBeenCalled();
        });

        it('should return 404 if user not found', async () => {
            const thingy_id: string = (await Thingy.findOne({ name: 'yellow-2' }))._id as string;

            const ctx = {
                params: { thingyId: thingy_id },
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
        beforeAll(async () => {
            const thingy_id: string = (await Thingy.findOne({ name: 'yellow-2' }))._id as string;
            const _ctx = {
                params: { thingyId: thingy_id },
                state: { user: { id: user_id } },
                status: 0,
                body: {},
            } as unknown as Context & { body: { message: string } };
            await ThingyController.bindThingyToUser(_ctx);
        });
        afterAll(async () => { 

            const thingy_id: string = (await Thingy.findOne({ name: 'yellow-2' }))._id as string;
            const _ctx = {
                params: { thingyId: thingy_id },
                state: { user: { id: user_id } },
                status: 0,
                body: {},
            } as unknown as Context & { body: { message: string } };
            await ThingyController.unbindThingyFromUser(_ctx);
        });
        it('should return sensor data for valid request', async () => {
            
            const ctx = {
                params: { sensorType: 'TEMP' },
                request: {
                    query: {
                        startTime: '2024-12-01T00:00:00Z',
                        endTime: '2024-12-31T23:59:59Z',
                    },
                },
                state: { user: { id: user_id } },
                status: 0,
                body: null,
            } as unknown as Context;

            
            

            await ThingyController.getThingySensorData(ctx);

            expect(ctx.status).toBe(200);
        });

        it('should return 400 if startTime or endTime missing', async () => {
            const ctx = {
                params: { sensorType: 'TEMP' },
                request: { query: {} },
                state: { user: { id: user_id } },
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


            await ThingyController.getFlipEventHistory(ctx);

            expect(ctx.status).toBe(200);
        });
    });
});

describe('UserController Tests', () => {
    let user_id: ObjectId;
    beforeAll(async () => {
        const ctx = {
            request: {
                body: {
                    username: 'daz',
                    password: 'daz',
                    email: 'daz@gmail.com',
                    transportType: 'bike'
                },
            },
            status: 0,
            body: null,
        } as unknown as Context;
        await AuthController.signUp(ctx);
        user_id = (ctx.body as { id: ObjectId }).id;
        
    });

    afterAll(async () => {
        await User.deleteMany({});
    });
    describe('signin', () => {
        it('should sign in user with valid credentials', async () => {
            const ctx = {
                request: { body: { 
                    username: 'daz', 
                    password: 'daz',
                } },
                status: 0,
                body: null,
            } as unknown as Context;


            await AuthController.signIn(ctx);
            // console.log(ctx.body);
            expect(ctx.status).toBe(200);
            // expect(ctx.body.token).toBeDefined();
        });

        it('should return 401 for invalid credentials', async () => {
            const ctx = {
                request: { body: { username: 'daz', password: 'wrongpassword' } },
                status: 0,
                body: null,
            } as unknown as Context;


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

MongoDBHandler.getInstance().disconnect();