const { EventEmitter } = require('events')
const net = require('net')
const ProtocolParser = require('./ProtocolParser')

const DEFAULT_OPTS = {
    host: null,
    port: 1883,
    cleanSession: true,
    autoConnect: false
}

class MQTT extends EventEmitter {

    constructor(opts = DEFAULT_OPTS) {
        super()
        // binding
        this.connect = this.connect.bind(this)
        this.onData = this.onData.bind(this)
        this.onConnect = this.onConnect.bind(this)
        //
        this.opts = {
            ...DEFAULT_OPTS,
            ...opts
        }
        
        if(opts.autoConnect && opts.autoConnect === true) {
            this.connect()
        }
    }

    static decodeText(slice) {
        return ProtocolParser.decodeText(slice)
    }

    connect() {
        this.client = net.createConnection(this.opts, () => {
            this.onConnect()
        })
        
        this.client.on("data", this.onData)
        // handle events
        this.client.on("end", this.onEnd)

        this.client.on("error", err => {
            console.log(err)
        })
    }

    onConnect() {
        const packet = this.mqttConnect()
        //this.emit("connect")
        this.client.write(packet, () => {
            this.emit("socketConnect")
        })
    }

    onData(data) {
        // create a protocol parser
        const parser = new ProtocolParser(data)
        // parse packet with callback because sub-eventEmitter isnt works
        parser.parsePacket(packet => {
            this.onPacket(packet)
        })
    }

    onEnd() {
        console.log('[MQTT] Disconnected from server')
    }

    onPacket(packet) {
        switch(packet.type) {
            case 'CONNACK':
                this.emit('connect', packet)
                break;
            case 'PUBLISH':
                this.emit('message', packet)
                break;
            default:
                console.log("No packet handler for", packet.type)
                break;
        }
    }

    /*
        Internal
    */


    mqttConnect(clientId, username, password) {
        // MQTT CONNECT packet format
        clientId = clientId ? clientId : "MQTT_"+Math.floor(65534 * Math.random())

        const packetLength = 14 + clientId.length + (username ? 2 + username.length : 0) + (password ? 2 + password.length : 0);
    
        const connectPacket = new Uint8Array(packetLength);
    
        // Fixed header for CONNECT packet
        connectPacket[0] = 0x10; // CONNECT command
        connectPacket[1] = packetLength - 2;   // Remaining length
    
        // Variable header for CONNECT packet
        const protocolName = [0x00, 0x04, 0x4d, 0x51, 0x54, 0x54]; // Protocol Name Length (MQTT)
        const protocolLevel = 0x04; // MQTT protocol version 3.1.1
        const connectFlags = 0x02; // Clean session
    
        let offset = 2;
        connectPacket.set([...protocolName, protocolLevel, connectFlags, 0x00, 0x3c], offset);
        offset += 10; // Length of fixed header and variable header bytes
    
        // Client Identifier
        connectPacket[offset++] = (clientId.length >> 8) & 0xFF;
        connectPacket[offset++] = clientId.length & 0xFF;
        for (let i = 0; i < clientId.length; i++) {
            connectPacket[offset++] = clientId.charCodeAt(i);
        }
        
        // Username
        if (username) {
            connectPacket[offset++] = 0x00;
            connectPacket[offset++] = username.length;
            for (let i = 0; i < username.length; i++) {
                connectPacket[offset++] = username.charCodeAt(i);
            }
        }
  
        // Password
        if (password) {
            connectPacket[offset++] = 0x00;
            connectPacket[offset++] = password.length;
            for (let i = 0; i < password.length; i++) {
                connectPacket[offset++] = password.charCodeAt(i);
            }
        }

        return connectPacket
    }

    mqttSubscribe(topic, qosLevel= 0x01, packetId=1) {
        const topicLength = topic.length;
  
        const subscribePacket = new Uint8Array(7 + topicLength); // Fixed and variable header bytes
    
        // Fixed header for SUBSCRIBE packet
        subscribePacket[0] = 0x82; // SUBSCRIBE command with QoS 1
        subscribePacket[1] = 5 + topicLength; // Remaining length
    
        // Variable header for SUBSCRIBE packet - Packet Identifier
        subscribePacket[2] = (packetId >> 8) & 0xFF;
        subscribePacket[3] = packetId & 0xFF;
    
        let offset = 4; // Starting offset for payload
    
        // Payload for SUBSCRIBE packet - Topic
        subscribePacket[offset++] = 0x00; // Topic length MSB
        subscribePacket[offset++] = topicLength; // Topic length LSB
    
        for (let j = 0; j < topicLength; j++) {
        subscribePacket[offset++] = topic.charCodeAt(j); // Topic string
        }
    
        subscribePacket[offset++] = qosLevel; // Requested QoS level
    
        return subscribePacket;
    }

    mqttPublish(topic, message) {
        const topicLength = topic.length;
        const messageLength = message.length;
      
        const publishPacket = new Uint8Array(4 + topicLength + messageLength); // Fixed header (4 bytes) + variable header and payload
      
        // Fixed header for PUBLISH packet
        publishPacket[0] = 0x30; // PUBLISH command with QoS level 0
      
        // Remaining length (variable header + payload)
        publishPacket[1] = 2 + topicLength + messageLength;
      
        let offset = 2; // Starting offset for variable header
      
        // Variable header for PUBLISH packet - Topic Length
        publishPacket[offset++] = 0x00; // Topic length MSB
        publishPacket[offset++] = topicLength; // Topic length LSB
      
        // Topic
        for (let j = 0; j < topicLength; j++) {
          publishPacket[offset++] = topic.charCodeAt(j); // Topic string
        }
      
        // Payload for PUBLISH packet - Message
        for (let j = 0; j < messageLength; j++) {
          publishPacket[offset++] = message.charCodeAt(j); // Message string
        }
      
        return publishPacket;
    }

    /*
        Methods
    */

    subscribe(topic, qosLevel) {
        const subscribePacket = this.mqttSubscribe(topic, qosLevel)        
        this.client.write(subscribePacket)
    }

    publish(topic, payload) {
        const publishPacketEncoded = this.mqttPublish(topic, payload)
        this.client.write(publishPacketEncoded)
    }

}

module.exports = MQTT