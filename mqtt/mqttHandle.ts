/**
 * @fileoverview MQTT Handler Module
 * @module mqttHandler
 */
import mqtt from 'mqtt';
import { SensorData } from '../models/thingyModel';

class MqttHandler {
  private mqttClient: mqtt.MqttClient;

  constructor() {
    this.mqttClient = mqtt.connect(process.env.MQTT_SERVER as string, {
      username: process.env.MQTT_USR as string,
      password: process.env.MQTT_PWD as string,
      port: parseInt(process.env.MQTT_PORT as string, 10),
    });

    this.mqttClient.on('connect', () => {
      console.log('Connected to MQTT server.');
      this.mqttClient.subscribe('things/+/shadow/update');
    });

    this.mqttClient.on('message', async (topic, message) => {
      // Parse the MQTT message
      const data = JSON.parse(message.toString());

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
            let sensorData = new SensorData({
                thingyName: deviceId,
                timestamp: new Date(),
                type: data.appId,
                value: data.data,
            });
            sensorData.save();
        } else {
            console.error('Invalid topic format:', topic);
        }
      }
    });

    this.mqttClient.on('error', error => {
      console.error('MQTT connection error:', error);
    });
  }

  /**
     * Publishes a message to the MQTT server.
     * @param deviceId - The device UUID.
     * @param message - The message to publish.
     */
  public publish(deviceId: string, message: string): Promise<void> {
    return new Promise((resolve, reject) => {
        const topic = `things/${deviceId}/shadow/update/accepted`;
        this.mqttClient.publish(topic, message, (err) => {
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
