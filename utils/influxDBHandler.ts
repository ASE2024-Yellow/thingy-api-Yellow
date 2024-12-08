/**
 * @file InfluxDBHandler.ts
 * @description Singleton class to handle InfluxDB connection and operations.
 * 
 * This module provides a singleton class `InfluxDBHandler` to manage the connection to an InfluxDB instance.
 * It includes methods to get the client, write data points, and query data from the database.
 * 
 * @module InfluxDBHandler
 */

import { InfluxDB, Point } from '@influxdata/influxdb-client';


/**
 * Interface for sensor data.
 */
export interface ISensorData {
    thingyName: string;
    timestamp: Date;
    type: 'TEMP'| 'CO2_EQUIV'| 'HUMID'| 'AIR_PRESS'| 'AIR_QUAL' | 'LIGHT';
    value: number;
}

/**
 * Singleton class to handle InfluxDB connection.
 * 
 * This class ensures that only one instance of the InfluxDB client is created and reused throughout the application.
 */
class InfluxDBHandler {
    private static instance: InfluxDBHandler;
    private client: InfluxDB | null = null;

    private constructor() {}

    /**
     * Get the singleton instance of the InfluxDBHandler.
     * 
     * @returns {InfluxDBHandler} The singleton instance of the InfluxDBHandler.
     */
    public static getInstance(): InfluxDBHandler {
        if (!InfluxDBHandler.instance) {
            InfluxDBHandler.instance = new InfluxDBHandler();
        }
        return InfluxDBHandler.instance;
    }

    /**
     * Get the InfluxDB client.
     * 
     * If the client is not already connected, it will establish a new connection.
     * 
     * @returns {Promise<InfluxDB>} The InfluxDB client.
     */
    public async getClient(): Promise<InfluxDB> {
        if (!this.client) {
            this.client = await this.connectToInfluxDB();
        }
        return this.client;
    }

    /**
     * Connect to the InfluxDB instance.
     * 
     * This method establishes a connection to the InfluxDB instance using the URI and token from environment variables.
     * 
     * @returns {Promise<InfluxDB>} The connected InfluxDB client.
     * @throws Will throw an error if the connection fails.
     */
    private async connectToInfluxDB(): Promise<InfluxDB> {
        try {
            const client = new InfluxDB({ url: process.env.INFLUXDB_URI!, token: process.env.INFLUXDB_TOKEN! });
            
            console.log('connected to InfluxDB');
            return client;
        } catch (error) {
            console.error('Error connecting to InfluxDB', error);
            throw error;
        }
    }

    /**
     * Write a data point to InfluxDB.
     * 
     * This method writes a data point to the specified bucket and organization in InfluxDB.
     * 
     * @param {Point} point - The data point to be written.
     * @returns {Promise<void>} A promise that resolves when the write operation is complete.
     * @throws Will throw an error if the write operation fails.
     */
    public async writeData(point: Point): Promise<void> {
        try {
            const writeApi = (await this.getClient()).getWriteApi(process.env.INFLUXDB_ORG!, process.env.INFLUXDB_BUCKET!);
            writeApi.writePoint(point);
            writeApi.close().then(() => {
                console.log(`Write point success: ${point}`);
              })
        } catch (error) {
            console.error('Error writing data to InfluxDB', error);
            throw error;
        }
    }

    /**
     * Query data from InfluxDB.
     * 
     * This method executes a Flux query against the InfluxDB instance and logs the results.
     * 
     * @param {string} query - The Flux query to be executed.
     * @returns {Promise<void>} A promise that resolves when the query operation is complete.
     * @throws Will throw an error if the query operation fails.
     */
    public async queryData(query: string): Promise<ISensorData[]> {
        try {
            console.log(query);
            const queryApi = (await this.getClient()).getQueryApi(process.env.INFLUXDB_ORG!);
            var result: ISensorData[] = [];

            await new Promise<void>((resolve, reject) => {
                queryApi.queryRows(query, {
                    next: (row, tableMeta) => {
                        // console.log(row);
                        const rowObject = tableMeta.toObject(row);
                        // console.log(rowObject);
                        result.push({
                            thingyName: rowObject.device,
                            type: rowObject._field,
                            value: rowObject._value,
                            timestamp: rowObject._time,
                        });
                    },
                    error: error => {
                        console.error('Error querying data from InfluxDB', error);
                        reject(error);
                    },
                    complete: () => {
                        console.log('Query complete');
                        console.log(result);
                        resolve();
                    },
                });
            });

            return result;
        } catch (error) {
            console.error('Error querying data from InfluxDB', error);
            throw error;
        }
    }
}

export default InfluxDBHandler;
