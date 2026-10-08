import { useState, useEffect } from "react";
import { useGenres, useMovies } from "./Control";

function Dashboard() {
  // 1. State declarations
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedGenre, setSelectedGenre] = useState("");
  const [selectedYear, setSelectedYear] = useState("");
  const [selectedMovie, setSelectedMovie] = useState(null);

  // 2. Custom hooks
  const {
    data: genresData,
    isLoading: genresLoading,
    error: genresError,
  } = useGenres();

  const {
    data: movies = [],
    isLoading: moviesLoading,
    error: moviesError,
  } = useMovies({
    searchTerm,
    selectedGenre,
    selectedYear,
  });

  // 3. Side-effect block for error logging
  useEffect(() => {
    if (genresError) console.log("Genres error:", genresError);
    if (moviesError) console.log("Movies error:", moviesError);
  }, [genresError, moviesError]);

  // Modal Handlers
  const handleOpenModal = (movie) => setSelectedMovie(movie);
  const handleCloseModal = () => setSelectedMovie(null);

  // Fallback for full component error
  if (moviesError) return <p className="error-message">Error loading movies!</p>;

  return (
    <>
      <div className="container">
        <header>
          <h1>🎬 Movie Explorer</h1>
        </header>

        {/* Controls / Filters — ALWAYS VISIBLE */}
        <form className="controls" onSubmit={(e) => e.preventDefault()}>
          <input
            type="text"
            placeholder="Search movies..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />

          <select
            value={selectedGenre}
            onChange={(e) => setSelectedGenre(e.target.value)}
            disabled={genresLoading}
          >
            <option value="">{genresLoading ? "Loading genres..." : "All Genres"}</option>
            {genresData?.genres?.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name}
              </option>
            ))}
          </select>

          <input
            type="number"
            placeholder="Year (e.g. 2023)"
            min="1900"
            max="2030"
            style={{ width: "120px" }}
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
          />
        </form>

        {/* Movie Grid Section */}
        <div className="grid">
          {moviesLoading ? (
            // Render 8 Skeleton Cards while loading instead of clearing the screen
            Array.from({ length: 8 }).map((_, index) => (
              <div key={index} className="skeleton-card">
                <div className="skeleton-poster skeleton-shimmer" />
                <div className="skeleton-body">
                  <div className="skeleton-line title skeleton-shimmer" />
                </div>
              </div>
            ))
          ) : (
            // Render actual movie cards when loaded
            movies.map((movie) => (
              <div
                key={movie.id}
                className="movie-card"
                onClick={() => handleOpenModal(movie)}
              >
                <img
                  src={movie.posterUrl || "https://via.placeholder.com/500x750?text=No+Image"}
                  alt={movie.title}
                />
                <h3>{movie.title}</h3>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Conditionally rendered Modal */}
      {selectedMovie && (
        <div className="modal">
          <div className="modal-content">
            <button className="close-btn" onClick={handleCloseModal}>
              &times;
            </button>
            
            <div className="modal-media">
              {selectedMovie.trailerUrl ? (
                <iframe
                  src={`https://www.youtube.com/embed/${selectedMovie.trailerUrl}?autoplay=1`}
                  title={`${selectedMovie.title} Trailer`}
                  allow="autoplay; encrypted-media"
                  allowFullScreen
                  style={{ width: "100%", height: "100%", border: "none" }}
                />
              ) : (
                <img src={selectedMovie.posterUrl} alt={selectedMovie.title} />
              )}
            </div>

            <div className="modal-details">
              <h2>{selectedMovie.title}</h2>
              {selectedMovie.tagline && (
                <p
                  style={{
                    fontStyle: "italic",
                    color: "var(--text-sub)",
                    marginBottom: "0.5rem",
                  }}
                >
                  {selectedMovie.tagline}
                </p>
              )}
              <p>
                <strong className="rating">Rating:</strong>{" "}
                {selectedMovie.rating}/10
              </p>
              <p>
                <strong>Release Date:</strong> {selectedMovie.releaseDate}
              </p>
              <p style={{ marginTop: "1rem" }}>{selectedMovie.overview}</p>
              {!selectedMovie.trailerUrl && (
                <p className="no-trailer-note">
                  No trailer available for this title.
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default Dashboard;