# Movie Service

This project provides a RabbitMQ-based microservice for managing movies and orders. It communicates via RabbitMQ, handling requests for creating and retrieving movies, as well as creating and retrieving orders. This README will guide you through the setup and usage of the service.

## Features

- **Movie Management**:
  - Create a movie.
  - Retrieve all movies.
  - Retrieve a movie by ID.
  - Get a movie trailer by title and year.

- **Order Management**:
  - Create an order.
  - Retrieve all orders.

## Prerequisites

- Node.js (v16 or higher)
- RabbitMQ (with a running instance accessible at `amqp://guest:guest@rabbitmq:5672`)
- Docker (optional, for containerized deployment)

## Configuration

The configuration is managed through the `config` file. Ensure the following structure and values are set:

```javascript
module.exports = {
    services: {
        movies_q: 'movies', // Name of the RabbitMQ queue for movies
        notifications_q: 'notifications',
    }
};
```

## Setup Instructions

### 1. Clone the Repository

```bash
$ git clone https://github.com/MonsterVivy/BITS_ScalableServices_2023mt93132.git
$ cd movie-service
```

### 2. Install Dependencies

```bash
$ npm install
```

### 3. Start RabbitMQ

Ensure RabbitMQ is running and accessible. You can start RabbitMQ using Docker:

```bash
$ docker run -d --name rabbitmq -p 5672:5672 -p 15672:15672 rabbitmq:management
```

Access the RabbitMQ management dashboard at `http://localhost:15672` (default credentials: guest/guest).

### 4. Start the Service

```bash
$ npm start
```

The service will initialize the RabbitMQ channel and start consuming messages from the `movies` queue.

### 5. Run with Docker (Optional)

Build and run the service using Docker:

```bash
$ docker build -t movie-service .
$ docker run -d --name movie-service --network host movie-service
```

## API Reference

The service communicates using RabbitMQ messages. Below is the list of supported actions:

### Movie Actions

1. **Create Movie**
   - **Action**: `movie.create`
   - **Body**: `{ title: string, year: number, director: string }`
   - **Response**: `{ code: 200, body: { movieId, title, year, director } }`

2. **Get All Movies**
   - **Action**: `movie.getAll`
   - **Response**: `{ code: 200, body: [movies] }`

3. **Get Movie by ID**
   - **Action**: `movie.getById`
   - **Body**: `movieId`
   - **Response**: `{ code: 200, body: { movieId, title, year, director } }`

4. **Get Trailer**
   - **Action**: `movie.getTrailer`
   - **Body**: `{ title: string, year: number }`
   - **Response**: `{ code: 200, body: { trailerUrl } }`

### Order Actions

1. **Create Order**
   - **Action**: `order.create`
   - **Body**: `{ movieId: number, userId: number, quantity: number }`
   - **Response**: `{ code: 200, body: { orderId, movieId, userId, quantity, totalPrice } }`

2. **Get All Orders**
   - **Action**: `order.getAll`
   - **Response**: `{ code: 200, body: [orders] }`

## Error Handling

If an error occurs during processing, the service responds with an error object:

```json
{
    "code": 500,
    "error": "Error message",
    "stack": "Stack trace (in non-production mode)"
}
```

## Testing

Use `curl` or a RabbitMQ client to test the service:

- Example: Send a message to create a movie:

```bash
$ curl -X POST \
    -H "Content-Type: application/json" \
    -d '{"action": "movie.create", "body": {"title": "Inception", "year": 2010, "director": "Christopher Nolan"}}' \
    http://localhost:3030/movies
```

## Logging

Logs are printed to the console. You can redirect logs to a file if required by using:

```bash
$ npm start > logs.txt
```

## Troubleshooting

1. **RabbitMQ Channel Not Initialized**:
   - Ensure RabbitMQ is running and the queue name matches the configuration.
   - Check connection logs for errors.

2. **Queue Not Consuming Messages**:
   - Verify the queue exists in RabbitMQ using the RabbitMQ management dashboard.

3. **Unhandled Errors**:
   - Check the logs for stack traces and ensure all dependencies are installed.

## License

This project is licensed under the MIT License. See the LICENSE file for details.

