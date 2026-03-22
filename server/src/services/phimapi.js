const axios = require('axios');
const config = require('../config');

const client = axios.create({
  baseURL: config.phimapiBase,
  timeout: 25000,
  headers: { Accept: 'application/json' }
});

async function fetchMovieBySlug(slug) {
  const { data } = await client.get(`/phim/${encodeURIComponent(slug)}`);
  if (!data || data.status !== true || !data.movie) {
    const err = new Error(data?.msg || 'Phim không tồn tại trên phimapi');
    err.status = 404;
    throw err;
  }
  return data;
}

async function fetchNewMovies(page = 1) {
  const { data } = await client.get('/danh-sach/phim-moi-cap-nhat', { params: { page } });
  return data;
}

module.exports = { fetchMovieBySlug, fetchNewMovies, client };
