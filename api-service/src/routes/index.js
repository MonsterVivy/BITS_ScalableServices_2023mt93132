const express = require('express');

const movieController = require('../controllers/movie');
const orderController = require('../controllers/order');


let router = express.Router();


router.get('/', (req, res) => res.status(200).json({text: 'OK'}));

router.post('/movies', (req, res, next) => {
    movieController.create(req.body);
    res.sendStatus(200);

});

router.get('/movies', (req, res, next) => {
    movieController.getAll().then(result => {
        res.status(200).json(result);
    }).catch(next);
});

router.get('/movies/:id', async (req, res) => {
    try {
        const movie = await movieService.getMovieById(req.params.id);
        res.json(movie);
    } catch (error) {
        console.error('Error fetching movie:', error.message);
        res.status(500).json({ error: error.message });
    }
});


router.get('/movies/:id/trailer', (req, res, next) => {
    movieController.getTrailer(req.query.title, req.query.year).then(result => {
        res.status(200).json(result);
    }).catch(next);
});


router.post('/movies/:id/orders', (req, res, next) => {
    orderController.create({movieId: parseInt(req.params.id), seatIds: req.body.seatIds});
    res.sendStatus(200);
});



router.get('/orders', (req, res, next) => {
    orderController.getAll().then(result => {
        res.status(200).json(result);
    }).catch(next);
});


module.exports = router;