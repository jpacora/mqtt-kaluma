const MQTT = require('../')

const client = new MQTT({
    host: "myBrokerIp",
    cleanSession: true,
    autoConnect: false
})

client.on('socketConnect', () => {
    console.log('[MQTT] Socket opened')
})

client.on('connect', () => {
    console.log('[MQTT] Connected success')
    client.subscribe('test/pico')
    // publish
    client.publish("test/pico", "juuu from js")
})

client.on('message', ({ topic, payload }) => {
    console.log(`----- ${topic} ----`)
    console.log(payload.toString())
})

client.on("error", (err) => {
    console.log(err)
})

client.connect()