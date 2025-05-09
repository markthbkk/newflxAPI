// server.js
const express = require("express");

const app = express();
const PORT = 3100;

const TMDB_TOKEN =
  "eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiJjZmMwNTMyNmQwNWRkMGNhYTE4ZjAzMTRiNWJhZWZjOSIsIm5iZiI6MTcwMzA2NTA1MS4wNzUsInN1YiI6IjY1ODJiNWRiZTgxMzFkNDE0N2E0YWJhNyIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.s-5yc6_ze6KO1V6uNeFzI8EFNTCGAryr4V4acKeQFfQ";

app.use(express.static('public')); // or wherever this file lives


// Route 1: Search movies by title
app.get("/api/search-movie", async (req, res) => {
  const { title } = req.query;
  if (!title) return res.status(400).json({ error: "Missing title parameter" });

  try {
    const url = `https://api.themoviedb.org/3/search/movie?query=${encodeURIComponent(
      title
    )}&include_adult=false&language=en-US&page=1`;

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${TMDB_TOKEN}`,
        accept: "application/json",
      },
    });

    const data = await response.json();
    const results = data.results.map((movie) => ({
      id: movie.id,
      title: movie.title,
      poster_path: movie.poster_path,
      release_date: movie.release_date,
      popularity: movie.popularity,
    }));

    res.json(results);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Route 2: Get movie details including credits
app.get("/api/movie-details/:id", async (req, res) => {
  const { id } = req.params;
  if (!id) return res.status(400).json({ error: "Missing movie ID" });

  try {
    const url = `https://api.themoviedb.org/3/movie/${id}?append_to_response=credits`;

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${TMDB_TOKEN}`,
        accept: "application/json",
      },
    });

    const details = await response.json();

    const result = {
      id: details.id,
      imdb_id: details.imdb_id,
      title: details.title,
      poster_path: details.poster_path,
      popularity: details.popularity,
      release_date: details.release_date,
      tagline: details.tagline,
      cast: details.credits?.cast || [],
      crew: details.credits?.crew || [],
    };

    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get actor or director with their movies
app.get('/api/person/:id', async (req, res) => {
  const { id } = req.params;

  
  const url = `https://api.themoviedb.org/3/person/${id}?append_to_response=movie_credits`;

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${TMDB_TOKEN}`,
      accept: 'application/json',
    },
  });

  const data = await response.json();

  

  const isDirector = data.movie_credits?.crew?.some(job => job.job === "Director");
  const known_for = (isDirector
    ? data.movie_credits.crew.filter(job => job.job === "Director")
    : data.movie_credits.cast
  ).map(movie => ({
    id: movie.id,
    title: movie.title,
    poster_path: movie.poster_path,
    release_date: movie.release_date,
    popularity: movie.popularity,
  }));

  res.json({
    id: data.id,
    name: data.name,
    profile_path: data.profile_path,
    known_for,
    job: isDirector ? "Director" : "Actor"
  });
});

app.get("/health", (req, res) => {
     res.send("OK");
  });


app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
