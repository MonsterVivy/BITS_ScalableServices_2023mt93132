const amqp = require('amqplib');
const config = require('./config');

const movieController = require('./controllers/movie');
const orderController = require('./controllers/order');
const models = require('./models');

console.log('> movie service starting...');

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
async function processMessage(channel, msg) {
    if (!msg) return;

    try {
        const data = JSON.parse(msg.content.toString());
        console.log('Dispatching action:', data.action);

        let actionResult;

        // Route action to the appropriate handler
        switch (data.action) {
            case 'movie.create':
                actionResult = await movieController.create(data.body);
                break;
            case 'movie.getAll':
                actionResult = await movieController.getAll();
                break;
            case 'movie.getById':
                actionResult = await movieController.getById(parseInt(data.body, 10));
                break;
            case 'movie.getTrailer':
                actionResult = await movieController.getTrailer(data.body);
                break;
            case 'order.create':
                actionResult = await orderController.create(data.body);
                break;
            case 'order.getAll':
                actionResult = await orderController.getAll();
                break;
            default:
                throw new Error(`Invalid action name: ${data.action}`);
        }

        // Build success response
        const response = {
            code: 200,
            body: actionResult,
        };

        // Acknowledge the message and send the response back
        channel.ack(msg);
        channel.sendToQueue(
            msg.properties.replyTo,
            Buffer.from(JSON.stringify(response)),
            { correlationId: msg.properties.correlationId }
        );
    } catch (error) {
        console.error('Error processing message:', error);

        // Build error response
        const errorResponse = {
            code: error.code || 500,
            error: error.message || 'Unknown error occurred',
        };

        if (process.env.NODE_ENV !== 'production') {
            errorResponse.stack = error.stack;
        }

        // Acknowledge the message and send the error response back
        channel.ack(msg);
        channel.sendToQueue(
            msg.properties.replyTo,
            Buffer.from(JSON.stringify(errorResponse)),
            { correlationId: msg.properties.correlationId }
        );
    }
}






// createChannel(config.orders_q).then(channel => {
//     console.log('> orders service listening for messages');
//     channel.consume(config.orders_q, msg => createOrder(channel, msg));
// }).catch(console.log);

// sync() will create all table if they doesn't exist in database
models.db.sync().then(()=>{
    createChannel(config.movies_q).then(channel => {
        console.log('> movie service listening for messages');
        channel.consume(config.movies_q, msg => processMessage(channel, msg));
    }).catch(console.log);
});