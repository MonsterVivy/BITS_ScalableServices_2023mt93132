const config = require('../config');
const amqp = require('amqplib');
const uuid = require('node-uuid');

let globalChannel = null;
let replyQueue = null;
const promises = new Map(); // correlationId => Function - callback

/**
 * Initialize RabbitMQ Channel
 * @param {string} queueName
 * @returns {Promise<void>}
 */
async function initRabbitMQ(queueName) {
    const maxRetries = 5;
    let retries = 0;
    while (retries < maxRetries) {
        try {
            const connection = await amqp.connect('amqp://guest:guest@rabbitmq:5672');
            const channel = await connection.createChannel();

            console.log('RabbitMQ connected and channel created');
            await channel.assertQueue(queueName, { durable: true });
            const { queue: tmp } = await channel.assertQueue('', { exclusive: true });
            replyQueue = tmp;

            globalChannel = channel; // Assign to globalChannel

            // Consume replies
            channel.consume(replyQueue, (msg) => {
                const corrId = msg.properties.correlationId;
                if (!promises.has(corrId)) {
                    console.error('Received message with invalid correlationId:', corrId);
                    return;
                }
                const promise = promises.get(corrId);
                promise(msg);
                promises.delete(corrId);
            }, { noAck: true });

            console.log('RabbitMQ channel initialized for movies queue.');
            return;
        } catch (error) {
            retries += 1;
            console.error(`RabbitMQ initialization failed. Retry ${retries}/${maxRetries}:`, error.message);
            if (retries === maxRetries) throw new Error('RabbitMQ initialization failed after retries.');
            await new Promise(res => setTimeout(res, 5000)); // Wait 5 seconds before retrying
        }
    }
}

/**
 * Send a message to RabbitMQ
 * @param {object} data
 * @returns {Promise<*>}
 */
function sendMessage(data) {
    return new Promise((resolve, reject) => {
        if (!globalChannel) {
            const errorMessage = 'RabbitMQ channel is not initialized.';
            console.error(errorMessage, data);
            return reject(new Error(errorMessage));
        }

        const corrId = uuid();
        promises.set(corrId, (msg) => {
            try {
                const response = JSON.parse(msg.content.toString());
                if (response.error) {
                    console.error('Received error from RabbitMQ:', response.error);
                    reject(response.error);
                } else {
                    resolve(response.body);
                }
            } catch (e) {
                console.error('Failed to process message:', e.message, msg.content.toString());
                reject(new Error('Invalid message format received from RabbitMQ.'));
            }
        });

        try {
            globalChannel.sendToQueue(
                config.services.movies_q,
                Buffer.from(JSON.stringify(data)),
                { correlationId: corrId, replyTo: replyQueue }
            );
        } catch (error) {
            console.error('Error sending message to RabbitMQ queue:', error.message);
            reject(new Error('Failed to send message to RabbitMQ queue.'));
        }
    });
}


// Initialize RabbitMQ on startup
initRabbitMQ(config.services.movies_q).catch(console.error);

module.exports = {
    createMovie(data) {
        return sendMessage({ action: 'movie.create', body: data });
    },
    getAllMovies() {
        return sendMessage({ action: 'movie.getAll' });
    },
    getMovieById(id) {
        return sendMessage({ action: 'movie.getById', body: id });
    },
    getTrailer(title, year) {
        return sendMessage({ action: 'movie.getTrailer', body: { title, year } });
    },
    createOrder(data) {
        return sendMessage({ action: 'order.create', body: data });
    },
    getAllOrders() {
        return sendMessage({ action: 'order.getAll' });
    },
};
