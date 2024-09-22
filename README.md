# mqtt-kaluma
 MQTT protocol library for the Kaluma runtime

### This library is under active development. Use at your own risk until a stable version is released.

## Install

```sh
npm install https://github.com/jpacora/mqtt-kaluma
```

## Basic Example:

```javascript
const MQTTClient = require('mqtt-kaluma');

// Configuration options for MQTT connection
const options = {
    host: 'myBrokerIp',  // MQTT broker IP address
    port: 1883,          // Broker port (optional)
    cleanSession: true,  // Clean session on connect
    autoConnect: false    // Automatically connect upon client creation
};

// Create an instance of the MQTT client
const mqttClient = new MQTTClient(options);

// Manually connect if 'autoConnect' is set to false
mqttClient.connect();

// MQTT client event handlers
mqttClient.on('connect', (packet) => {
    console.log('Connected to MQTT broker');
    
    // Publish a message to the topic "my-topic"
    mqttClient.publish('my-topic', 'Hello world!');
});

mqttClient.on('message', (packet) => {
    console.log('Received message:', packet.message.toString(), 'on topic:', packet.topic);
});

mqttClient.on('disconnect', () => {
    console.log('Disconnected from MQTT broker');
});

mqttClient.on('error', (err) => {
    console.error('Error:', err);
});

// Example of subscribing to a topic
mqttClient.subscribe('my-topic');
```