const amqp = require('amqplib');
const config = require('./config');
const notificationController = require('./controllers/notification');


console.log('> notification service starting...');

/**
 *
 * @param {string} q
 * @returns {Promise<amqp.channel | Error>}
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


/**
 *
 * @param {amqp.channel} channel
 * @param {object} msg
 * @param {Buffer} msg.content
 * @returns {Promise<void|Error>}
 */
async function consume(channel, msg) {
    if(msg === null) return;
    try {
        const mail = JSON.parse(msg.content.toString());
        console.log(`> Sending email to ${mail.to} ...`);
        await notificationController.send(mail);
        console.log(`> Email has been successfully send to ${mail.to}`);
        channel.ack(msg);
    }catch (e) {
        console.log(e);
    }
}



createChannel(config.q).then(channel => {
    console.log('> notification service listening for messages');
    channel.consume(config.q, msg => consume(channel, msg));
}).catch(console.log);