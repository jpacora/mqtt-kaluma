const MQTT = require('../')
const { WiFi } = require('wifi')
const wifi = new WiFi()

const client = new MQTT({
    host: "myBrokerIp",
    cleanSession: true,
    autoConnect: false
})


wifi.connect({ ssid: 'my-wifi-name', password: 'my-password' }, (err) => {
    if (err) {
        return console.error(err)
    }
    // connect to mqtt
    console.log('Connected to wifi, connecting to MQTT broker');
    client.connect()
})

client.on('socketConnect', () => {
    console.log('[MQTT] Socket opened')
})

client.on('connect', () => {
    console.log('[MQTT] Connected success')
    client.subscribe('test/pico')
    // publish
    client.publish("test/pico", "juuu from Pico")
})

client.on('message', ({ topic, payload }) => {
    console.log(`----- ${topic} ----`)
    const strPayload = MQTT.decodeText(payload)
    console.log(strPayload)
})

client.on("error", (err) => {
    console.log(err)
})