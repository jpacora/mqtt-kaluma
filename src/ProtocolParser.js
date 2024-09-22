class ProtocolParser {

    strType = null

    constructor(mqttMessage) {
        // bind
        this.parsePacket = this.parsePacket.bind(this)
        this.parsePublishMessage = this.parsePublishMessage.bind(this)
        // validate
        if (mqttMessage.length < 2) {
            throw new Error('The MQTT packets is too short');
        }
        //
        this.messageType = (mqttMessage[0] & 0xF0) >> 4;
        this.controlFlag = mqttMessage[0] & 0x0F;
        this.remainingData = mqttMessage.slice(1)

        this.mqttMessage = mqttMessage
        this._pos = 2
    }

    static readUInt16BE(array, offset) {
        return (array[offset] << 8) | array[offset + 1];
    }

    static decodeText(slice) {
        return new TextDecoder().decode(slice)
    }

    parsePacket(cb) {
        // Determinar el tipo de mensaje MQTT
        switch (this.messageType) {
            case 1:
                this.strType = 'CONNECT';
                cb({ type: this.strType })
                break;
            case 2:
                this.strType = 'CONNACK';
                cb({ type: this.strType })
                break;
            case 3:
                this.strType = 'PUBLISH'
                this.parsePublishMessage(cb)
                break;
            case 4:
                this.strType = 'PUBACK';
                cb({ type: this.strType })
                break;
            case 5:
                this.strType = 'PUBREC';
                cb({ type: this.strType })
                break;
            case 6:
                this.strType = 'PUBREL';
                cb({ type: this.strType })
                break;
            case 7:
                this.strType = 'PUBCOMP';
                cb({ type: this.strType })
                break;
            case 8:
                this.strType = 'SUBSCRIBE';
                cb({ type: this.strType })
                break;
            case 9:
                this.strType = 'SUBACK';
                cb({ type: this.strType })
                break;
            case 10:
                this.strType = 'UNSUBSCRIBE';
                cb({ type: this.strType })
                break;
            case 11:
                this.strType = 'UNSUBACK';
                cb({ type: this.strType })
                break;
            case 12:
                this.strType = 'PINGREQ';
                cb({ type: this.strType })
                break;
            case 13:
                this.strType = 'PINGRESP';
                cb({ type: this.strType })
                break;
            case 14:
                this.strType = 'DISCONNECT';
                cb({ type: this.strType })
                break;
            default:
                this.strType = 'UNKNOWN_TYPE'
                cb({ type: this.strType })
        }
    }

    _parseNum() {
        if (this.mqttMessage.length - this._pos < 2) return -1

        const result = ProtocolParser.readUInt16BE(this.mqttMessage, this._pos)
        this._pos += 2
        return result
    }

    _parseString() {
        const length = this._parseNum()
        const end = length + this._pos

        if (length === -1 || end > this.mqttMessage.length) return null

        const slice = this.mqttMessage.slice(this._pos, end)
        const result = ProtocolParser.decodeText(slice)
        this._pos += length
        return result
    }

    parsePublishMessage(cb) {
        const { strType:type } = this

        const topic = this._parseString()

        const payload = this.mqttMessage.slice(this._pos, this.mqttMessage.length)

        cb({ type, topic, payload })
    }

}

module.exports = ProtocolParser