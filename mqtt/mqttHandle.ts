/**
 * @fileoverview MQTT Handler Module
 * @module mqttHandler
 */
import mqtt from 'mqtt';
import { SensorData } from '../models/thingyModel';

const { addFloatProperty, addIntegerProperty } = require('../utils/utils');

/**
 * MQTT Client for handling communication with an MQTT server.
 * @type {import('mqtt').Client}
 * @alias module:mqttHandler
 */
const mqttClient = mqtt.connect(process.env.MQTT_SERVER as string, {
  username: process.env.MQTT_USR as string,
  password: process.env.MQTT_PWD as string,
});

/**
 * Handles successful MQTT server connection.
 * @event module:mqttHandler#connect
 */
mqttClient.on('connect', () => {
  console.log('Connected to MQTT server.');
//   mqttClient.subscribe('things/yellow-1/shadow/update');
  mqttClient.subscribe('things/yellow-2/shadow/update');
});

/**
 * Handles incoming MQTT messages.
 * @event module:mqttHandler#message
 * @param {string} topic - The topic on which the message was received.
 * @param {Buffer} message - The message payload.
 * @fires addFloatProperty
 * @fires addIntegerProperty
 */
mqttClient.on('message', async (topic, message) => {
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
            thingyId: deviceId,
            timestamp: new Date(),
            type: data.appId,
            value: data.value,
        });
        sensorData.save();
    } else {
        console.error('Invalid topic format:', topic);
    }
  }
});

/**
 * Handles MQTT connection errors.
 * @event module:mqttHandler#error
 * @param {Error} error - The error object.
 */
mqttClient.on('error', error => {
  console.error('MQTT connection error:', error);
});

module.exports = mqttClient;
