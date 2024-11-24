const got = require('got');

const fakeData = [
  {
    Title: "Guardians of the Galaxy Vol. 2",
    Year: "2017",
    imdbID: "tt3896198",
    Type: "movie",
    Poster: "https://m.media-amazon.com/images/M/MV5BNWE5MGI3MDctMmU5Ni00YzI2LWEzMTQtZGIyZDA5MzQzNDBhXkFqcGc@._V1_SX300.jpg",
  },
];

const API_KEY = 'a6438d46';

module.exports = {
  getAll() {
    return new Promise((resolve) => {
      resolve(fakeData); // Return the array directly
    });
  },

  async getMovieDetails(imdbID) {
    try {
      const { body } = await got(`http://www.omdbapi.com/?apikey=${API_KEY}&i=${imdbID}`);
      const data = JSON.parse(body);
      return data;
    } catch (error) {
      console.error('Error fetching movie details:', error.message);
      throw new Error('Failed to fetch movie details');
    }
  },
};
