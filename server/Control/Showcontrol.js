import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import Movie from '../models/Movie.js';
import Show from '../models/Show.js';
import { inngest } from '../Inngest/index.js';

// Get a list of movies from our local movies.json file
export const getnowplayingMovies = async (req, res) => {
  try {
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    const moviesPath = path.join(__dirname, '..', 'movies.json');
    const moviesData = JSON.parse(fs.readFileSync(moviesPath, 'utf-8'));

    const movies = moviesData.map(movie => ({
      id: movie._id,
      primaryImage: { url: movie.primaryImage },
      titleText: { text: movie.originalTitle }
    }));
    
    res.json({ success: true, movies: movies });
  } catch (error) {
    console.error("Error reading local movies file:", error.message);
    res.status(500).json({ success: false, message: "Failed to load movies." });
  }
};

// Admin can add any movie from that list to the database
export const addshow = async (req, res) => {
  try {
    const { movieId, showsInput, showprice } = req.body;
    let movie = await Movie.findById(movieId);

    if (!movie) {
      const __filename = fileURLToPath(import.meta.url);
      const __dirname = path.dirname(__filename);
      const moviesPath = path.join(__dirname, '..', 'movies.json');
      const moviesData = JSON.parse(fs.readFileSync(moviesPath, 'utf-8'));
      
      const moviedata = moviesData.find(m => m._id === movieId);
      if (!moviedata) {
        return res.status(404).json({ success: false, message: "Movie not found in local list." });
      }

      const movieDetails = {
        _id: moviedata._id,
        originalTitle: moviedata.originalTitle,
        description: moviedata.description,
        primaryImage: moviedata.primaryImage,
        releaseDate: moviedata.releaseYear.toString(),
        genres: moviedata.genres,
        averageRating: moviedata.averageRating,
        runtime: moviedata.runtime,
      };

      movie = await Movie.create(movieDetails);
    }

    const showstoCreate = [];
    showsInput.forEach((show) => {
      const showdate = show.date;
      const time = show.time;
      const datetimeString = `${showdate}T${time}`;
      showstoCreate.push({
        movie: movieId,
        showDateTime: new Date(datetimeString),
        showprice,
        occupiedSeats: {},
      });
    });

    if (showstoCreate.length > 0) {
      await Show.insertMany(showstoCreate);
    }

    /* await inngest.send({
      name: 'app/show.added',
      data: { movieId: movie._id }
    }); */

    res.json({ success: true, message: "Show(s) added successfully." });
  } catch (error) {
    console.error("Error in addshow:", error.message);
    res.status(500).json({ success: false, message: "Failed to add show." });
  }
};

// The other functions remain the same
export const getmovies = async (req, res) => {
  try {
    const shows = await Show.find({ showDateTime: { $gte: new Date() } })
      .populate("movie")
      .sort({ showDateTime: 1 });
    const movieMap = new Map();
    shows.forEach((show) => {
      if (show.movie) { movieMap.set(show.movie._id.toString(), show.movie); }
    });
    res.json({ success: true, movies: Array.from(movieMap.values()) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getmovie = async (req, res) => {
  try {
    const { movieId } = req.params;
    const shows = await Show.find({ movie: movieId, showDateTime: { $gte: new Date() } });
    const movie = await Movie.findById(movieId);
    const datetime = {};
    shows.forEach((show) => {
      const date = show.showDateTime.toISOString().split('T')[0];
      if (!datetime[date]) { datetime[date] = []; }
      datetime[date].push({ time: show.showDateTime, showId: show._id });
    });
    res.json({ success: true, movie, datetime });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};