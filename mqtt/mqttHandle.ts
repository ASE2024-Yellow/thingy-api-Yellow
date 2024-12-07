/**
 * @fileoverview MQTT Handler Module
 * @module mqttHandler
 */
import mqtt from 'mqtt';
import { SensorData, EventData } from '../models/thingyModel';
import eventEmitter from '../utils/eventHandler';
import InfluxDBHandler from '../utils/influxDBHandler';
import { Point } from '@influxdata/influxdb-client';

export interface IThingyMessage {
  appId: string;
  data: string;
  messageType: string;
  ts: number;
}



class MqttHandler {
  private static instance: MqttHandler;
  private client: mqtt.MqttClient | null = null;
  private constructor() {}

  public static getInstance(): MqttHandler {
    if (!MqttHandler.instance) {
      MqttHandler.instance = new MqttHandler();
    }
    return MqttHandler.instance;
  }

  public async getClient(): Promise<mqtt.MqttClient> {
    if (!this.client) {
        this.client = await this.connectToMQTTServer();
    }
    return this.client;
  }

  private async connectToMQTTServer(): Promise<mqtt.MqttClient> {
    try {
        const client = mqtt.connect(process.env.MQTT_SERVER as string, {
          username: process.env.MQTT_USR as string,
          password: process.env.MQTT_PWD as string,
          port: parseInt(process.env.MQTT_PORT as string, 10),
        });
        client.on('connect', () => {
          console.log('Connected to MQTT server.');
          client.subscribe('things/+/shadow/update');
          
        });
    
        client.on('message', async (topic, message) => {
          // Parse the MQTT message
          const data: IThingyMessage = JSON.parse(message.toString());
      
          // Split the topic string by '/'
          const topicParts = topic.split('/');
    
          // Find the index of 'things' in the array
          const thingsIndex = topicParts.indexOf('things');
    
          // Check if 'things' is found and there is a subsequent part
          if (thingsIndex !== -1 && thingsIndex + 1 < topicParts.length) {
            // Retrieve the deviceId
            const deviceId = topicParts[thingsIndex + 1];
    
            if (['TEMP', 'CO2_EQUIV', 'HUMID', 'AIR_PRESS', 'AIR_QUAL'].includes(data.appId)){
                console.log('thingyId:', deviceId, 'data:', data);
                let point = new Point('sensor_data')
                                .tag('thingyName', deviceId)
                                .floatField(data.appId, parseFloat(data.data))
                                .timestamp(new Date());
                InfluxDBHandler.getInstance().writeData(point);
            } else if (data.appId === 'FLIP') {
                console.log('thingyId:', deviceId, 'data:', data);
                eventEmitter.emit(deviceId + '-flip', data);
            } else if (data.appId === 'BUTTON') {
                console.log('thingyId:', deviceId, 'data:', data);
                eventEmitter.emit(deviceId + '-button', data);
            } else {
                console.error('Invalid topic format:', data);
            }
          }
        });
    
        client.on('error', error => {
          console.error('MQTT connection error:', error);
        });
        return client;
    } catch (error) {
        console.error('Error connecting to MQTT server', error);
        throw error;
    }
  }


  /**
     * Publishes a message to the MQTT server.
     * @param deviceId - The device UUID.
     * @param message - The message to publish.
     */
  public async publish(deviceId: string, message: string): Promise<void> {
    return new Promise(async (resolve, reject) => {
        const topic = `things/${deviceId}/shadow/update/accepted`;
        const client = await this.getClient();
        client.publish(topic, message, (err) => {
            if (err) {
                console.error('Error publishing MQTT message:', err);
                reject(err);
            } else {
                console.log('Message published to MQTT topic:', topic);
                resolve();
            }
        });
    });
  }
}



export default MqttHandler;
