import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";

const API_KEY = import.meta.env.VITE_API_KEY;
const BASE_URL = "https://api.themoviedb.org/3";

// Custom hook to debounce any fast-changing value
const useDebounce = (value, delay = 500) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
};

// Helper function to fetch YouTube trailer key for a specific movie ID
const fetchMovieTrailer = async (movieId) => {
  try {
    const response = await fetch(
      `${BASE_URL}/movie/${movieId}/videos?api_key=${API_KEY}&language=en-US`
    );
    if (!response.ok) return null;

    const data = await response.json();
    // Find official YouTube Trailer or Teaser
    const trailer = data.results?.find(
      (vid) => vid.site === "YouTube" && (vid.type === "Trailer" || vid.type === "Teaser")
    );

    return trailer ? trailer.key : null; // Returns YouTube video key (e.g., "dQw4w9WgXcQ")
  } catch  {
    return null;
  }
};

// Fetch genres
const fetchGenres = async () => {
  const response = await fetch(
    `${BASE_URL}/genre/movie/list?api_key=${API_KEY}&language=en-US`
  );

  if (!response.ok) {
    throw new Error("Failed to fetch genres");
  }

  return response.json();
};

// Fetch movies with trailer URLs included
const fetchMovies = async ({ searchTerm, selectedGenre, selectedYear }) => {
  let url;

  if (searchTerm) {
    url = `${BASE_URL}/search/movie?api_key=${API_KEY}&language=en-US&query=${encodeURIComponent(
      searchTerm
    )}&page=1&include_adult=false`;
  } else {
    const params = new URLSearchParams({
      api_key: API_KEY,
      language: "en-US",
      sort_by: "popularity.desc",
      page: "1",
      include_adult: "false",
    });

    if (selectedGenre) params.append("with_genres", selectedGenre);
    if (selectedYear) params.append("primary_release_year", selectedYear);

    url = `${BASE_URL}/discover/movie?${params.toString()}`;
  }

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error("Failed to fetch movies");
  }

  const data = await response.json();

  // Fetch trailers concurrently for all retrieved movies
  const moviesWithTrailers = await Promise.all(
    data.results.map(async (movie) => {
      const trailerKey = await fetchMovieTrailer(movie.id);

      return {
        id: movie.id,
        title: movie.title,
        overview: movie.overview,
        posterUrl: movie.poster_path
          ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
          : null,
        releaseDate: movie.release_date,
        rating: movie.vote_average,
        genreIds: movie.genre_ids,
        tagline: null,
        trailerUrl: trailerKey, // Populated with YouTube key!
      };
    })
  );

  return moviesWithTrailers;
};

// Hook for genres
export const useGenres = () => {
  return useQuery({
    queryKey: ["genres"],
    queryFn: fetchGenres,
    staleTime: 1000 * 60 * 60,
  });
};

// Hook for movies
export const useMovies = ({ searchTerm, selectedGenre, selectedYear }) => {
  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  return useQuery({
    queryKey: ["movies", debouncedSearchTerm, selectedGenre, selectedYear],
    queryFn: () =>
      fetchMovies({
        searchTerm: debouncedSearchTerm,
        selectedGenre,
        selectedYear,
      }),
    enabled: true,
    staleTime: 1000 * 60 * 5,
  });
};