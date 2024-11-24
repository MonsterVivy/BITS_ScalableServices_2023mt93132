const config = require('../config');
const amqp = require('amqplib');


/**
 *
 * @param {string} q
 * @returns {Promise<*|Error>}
 */
async function createChannel(queueName) {
    try {
        const connection = await amqp.connect('amqp://guest:guest@rabbitmq:5672');
        const channel = await connection.createChannel();

        console.log('RabbitMQ connected and channel created');
        await channel.assertQueue(queueName, { durable: true }); // Ensure queue exists
        const { queue: tmp } = await channel.assertQueue('', { exclusive: true });
        replyQueue = tmp;

        globalChannel = channel; // Assign to globalChannel
        return channel;
    } catch (error) {
        console.error('Error creating RabbitMQ channel:', error.message);
        throw new Error('RabbitMQ connection failed');
    }
}



let channel = null;

module.exports = {
    /**
     *
     * @param {object} mail
     * @returns {Promise<void | Error>}
     */
    async send(mail){
        channel = channel || await createChannel(config.services.notifications_q);
        return channel.sendToQueue(config.services.notifications_q, new Buffer(JSON.stringify(mail)));
    }
};