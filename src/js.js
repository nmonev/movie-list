// Constants and variables
const apiKey = 'feec4c64';
const input = document.getElementById('search-input');
const btn = document.getElementById('search-btn');
const results = document.getElementById('results');
const pagination = document.getElementById('pagination');
const pageInfo = document.getElementById('page-info');
const genreSelect = document.getElementById('genre-select');
const typeSelect = document.getElementById('type-select');
const popularMovies = document.getElementById('popular-movies');
const loadingScreen = document.getElementById('loading-screen');

const prevBlock = document.getElementById('prev-block-btn');
const prevBtn = document.getElementById('prev-btn');
const nextBtn = document.getElementById('next-btn');
const nextBlock = document.getElementById('next-block-btn');

let currentPage = 1;
let totalResults = 0;
let totalPages = 0;
let lastQuery = '';
let allMovies = [];

pagination.style.display = "none";

// Popular movies list for 2025
const popularMoviesList = [
  'Captain America: Brave New World', 'Bridget Jones: Mad About the Boy', 'The Monkey',
  'Peter Pan\'s Neverland Nightmare', 'Thunderbolts', 'Final Destination: Bloodlines',
  'Mission: Impossible – The Final Reckoning', 'Lilo & Stitch', 'Fear Street: Prom Queen',
  'Elio', 'How to Train Your Dragon', '28 Years Later', 'F1: The Movie',
  'Jurassic World Rebirth', 'Superman', 'The Fantastic Four: First Steps',
  'One Battle After Another', 'Ballerina', 'Ne Zha 2', 'Sinners',
  'The Electric State', 'Snow White', 'A Minecraft Movie', 'The Conjuring: Last Rites',
  'Tron: Ares', 'Bugonia', 'Wicked: For Good', 'Zootopia 2', 'Avatar: Fire and Ash',
  'Freakier Friday'
];

// Initialization
window.addEventListener('load', () => {
  setTimeout(() => {
    loadingScreen.style.display = 'none';
    loadPopularMovies();
    setupScrollAnimations();
  }, 1000);
});

// Event listeners
btn.addEventListener('click', () => loadPage(1));
prevBtn.addEventListener('click', () => loadPage(currentPage - 1));
nextBtn.addEventListener('click', () => loadPage(currentPage + 1));
prevBlock.addEventListener('click', () => loadPage(Math.max(1, currentPage - 11)));
nextBlock.addEventListener('click', () => loadPage(Math.min(totalPages, currentPage + 10)));
genreSelect.addEventListener('change', applyFilters);
typeSelect.addEventListener('change', () => loadPage(1));
input.addEventListener('keypress', (e) => { if (e.key === 'Enter') loadPage(1); });

// Load popular movies
async function loadPopularMovies() {
  const scrollY = window.pageYOffset;
  popularMovies.innerHTML = '<div class="loading-message">Loading popular movies...</div>';

  try {
    const shuffledMovies = [...popularMoviesList].sort(() => Math.random() - 0.5).slice(0, 10);
    const moviePromises = shuffledMovies.map(title =>
      fetch(`https://www.omdbapi.com/?apikey=${apiKey}&t=${encodeURIComponent(title)}&y=2025`)
        .then(r => r.json())
    );
    const movieData = (await Promise.all(moviePromises)).filter(m => m.Response === 'True');
    displayPopularMovies(movieData);
  } catch (err) {
    popularMovies.innerHTML = '<p style="color: var(--primary-color);">Error loading popular movies.</p>';
  }

  window.scrollTo(0, scrollY);
}

// Display popular movies
function displayPopularMovies(movies) {
  popularMovies.innerHTML = '';

  movies.forEach((movie, index) => {
    const card = document.createElement('div');
    card.className = 'movie-card fade-in';
    card.style.animationDelay = `${index * 0.5}s`;

    const poster = movie.Poster !== 'N/A' ? movie.Poster : 'download.png';
    const rating = movie.imdbRating !== 'N/A' ? movie.imdbRating : 'N/A';

    card.innerHTML = `
      <img src="${poster}" alt="${movie.Title} poster" loading="lazy">
      <h3>${movie.Title}</h3>
      <p><strong>Year:</strong> ${movie.Year}</p>
      <p><strong>Genre:</strong> ${movie.Genre}</p>
      <div class="rating-display">
        <span class="rating-badge">${rating}</span>
      </div>
      <button data-id="${movie.imdbID}" class="details-btn">
        <span>Details</span>
        <span>⭐</span>
      </button>
    `;

    popularMovies.appendChild(card);

    setTimeout(() => {
      card.classList.add('visible');
    }, index * 200);

    card.querySelector('button').addEventListener('click', () => showModal(movie.imdbID));
  });
}

// Refresh popular movies
function refreshPopularMovies() {
  const refreshBtn = document.querySelector('.refresh-btn');
  refreshBtn.style.transform = 'rotate(360deg)';

  setTimeout(() => {
    loadPopularMovies();
    refreshBtn.style.transform = 'rotate(0deg)';
  }, 300);
}

// Search function
function loadPage(page) {
  const q = input.value.trim();
  if (!q) return;

  lastQuery = q;
  currentPage = page;
  results.innerHTML = '<div class="loading-message">Loading results...</div>';

  const selectedType = typeSelect.value;
  let apiUrl = `https://www.omdbapi.com/?apikey=${apiKey}&s=${encodeURIComponent(q)}&page=${page}`;
  if (selectedType) apiUrl += `&type=${selectedType}`;

  fetch(apiUrl)
    .then(r => r.json())
    .then(data => {
      if (data.Response === 'True') {
        allMovies = data.Search;
        totalResults = data.totalResults;
        totalPages = Math.ceil(totalResults / 10);
        applyFilters();
        updatePagination();
        pagination.style.display = 'flex';
      } else {
        results.innerHTML = `<p style="color: var(--primary-color); text-align: center;">${data.Error}</p>`;
        pagination.style.display = 'none';
      }
    })
    .catch(err => {
      results.innerHTML = `<p style="color: var(--primary-color); text-align: center;">Error: ${err.message}</p>`;
      pagination.style.display = 'none';
    });
}

// Apply genre filter
function applyFilters() {
  const selectedGenre = genreSelect.value;
  let filteredMovies = allMovies;

  if (selectedGenre) {
    filterMoviesByGenre(filteredMovies, selectedGenre);
  } else {
    displayMovies(filteredMovies);
  }
}

// Filter by genre
async function filterMoviesByGenre(movies, selectedGenre) {
  results.innerHTML = '<div class="loading-message">Filtering by genre...</div>';
  const filteredMovies = [];

  for (const movie of movies) {
    try {
      const response = await fetch(`https://www.omdbapi.com/?apikey=${apiKey}&i=${movie.imdbID}`);
      const details = await response.json();

      if (details.Response === 'True' && details.Genre && details.Genre.includes(selectedGenre)) {
        filteredMovies.push(movie);
      }
    } catch (error) {
      console.error('Error fetching details:', error);
    }
  }

  displayMovies(filteredMovies);
}

// Display search results
function displayMovies(list) {
  results.innerHTML = '';

  if (list.length === 0) {
    results.innerHTML = '<p style="text-align: center; color: var(--text-muted);">No movies match your criteria.</p>';
    return;
  }

  list.forEach((movie, index) => {
    const card = document.createElement('div');
    card.className = 'movie-card fade-in';
    card.style.animationDelay = `${index * 0.1}s`;

    const poster = movie.Poster !== 'N/A' ? movie.Poster : 'download.png';

    card.innerHTML = `
      <img src="${poster}" alt="${movie.Title} poster" loading="lazy">
      <h3>${movie.Title}</h3>
      <p><strong>Year:</strong> ${movie.Year}</p>
      <p><strong>Type:</strong> ${movie.Type}</p>
      <button data-id="${movie.imdbID}" class="details-btn">
        <span>Details</span>
        <span>🎬</span>
      </button>
    `;

    results.appendChild(card);
    setTimeout(() => {
      card.classList.add('visible');
    }, index * 100);

    card.querySelector('button').addEventListener('click', () => showModal(movie.imdbID));
  });
}

// Update pagination display
function updatePagination() {
  pageInfo.textContent = `Page ${currentPage} of ${totalPages}`;
  prevBtn.disabled = currentPage <= 1;
  nextBtn.disabled = currentPage >= totalPages;
  prevBlock.disabled = currentPage <= 10;
  nextBlock.disabled = currentPage + 10 > totalPages;
}

// Modal functionality
const overlay = document.getElementById('modal-overlay');
const closeBtn = overlay.querySelector('.close-modal');

closeBtn.addEventListener('click', () => overlay.classList.remove('active'));
overlay.addEventListener('click', e => {
  if (e.target === overlay) overlay.classList.remove('active');
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && overlay.classList.contains('active')) {
    overlay.classList.remove('active');
  }
});

// Show movie details in modal
function showModal(imdbID) {
  overlay.querySelector('#modal-poster').src = '';
  overlay.querySelector('#modal-title').textContent = 'Loading...';
  overlay.classList.add('active');

  fetch(`https://www.omdbapi.com/?apikey=${apiKey}&i=${imdbID}&plot=full`)
    .then(r => r.json())
    .then(m => {
      if (m.Response === 'True') {
        overlay.querySelector('#modal-poster').src = m.Poster !== 'N/A' ? m.Poster : 'download.png';
        overlay.querySelector('#modal-title').textContent = m.Title;
        overlay.querySelector('#modal-year').textContent = m.Year;
        overlay.querySelector('#modal-genre').textContent = m.Genre || 'N/A';
        overlay.querySelector('#modal-director').textContent = m.Director || 'N/A';
        overlay.querySelector('#modal-actors').textContent = m.Actors || 'N/A';
        overlay.querySelector('#modal-plot').textContent = m.Plot || 'No plot available.';
      }
    })
    .catch(err => {
      overlay.querySelector('#modal-title').textContent = 'Error loading movie details.';
    });
}

// Optional animation setup function
function setupScrollAnimations() {
  const cards = document.querySelectorAll('.movie-card');
  cards.forEach(card => {
    card.classList.add('fade-in');
  });
}
