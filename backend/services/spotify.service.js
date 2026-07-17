const AppError = require('../utils/app-error');

const PLAYLIST_ID = process.env.SPOTIFY_TOP10_PLAYLIST_ID || '37i9dQZF1DX0OEZC3cbQmU';
let token;

function configured() {
  return Boolean(process.env.SPOTIFY_CLIENT_ID && process.env.SPOTIFY_CLIENT_SECRET);
}

async function accessToken() {
  if (!configured()) {
    throw new AppError('A integração com o Spotify ainda não foi configurada no servidor.', 503);
  }
  if (token && token.expiresAt > Date.now()) return token.value;

  const credentials = Buffer.from(`${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`).toString('base64');
  const response = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: { Authorization: `Basic ${credentials}`, 'Content-Type': 'application/x-www-form-urlencoded' },
    body: 'grant_type=client_credentials'
  });
  const data = await response.json();
  if (!response.ok) throw new AppError('Não foi possível autenticar a integração com o Spotify.', 502);
  token = { value: data.access_token, expiresAt: Date.now() + (Number(data.expires_in || 3600) - 60) * 1000 };
  return token.value;
}

async function topTracks() {
  const response = await fetch(`https://api.spotify.com/v1/playlists/${PLAYLIST_ID}/items?limit=10&additional_types=track`, {
    headers: { Authorization: `Bearer ${await accessToken()}` }
  });
  const data = await response.json();
  if (!response.ok) throw new AppError('Não foi possível consultar a playlist de louvores no Spotify.', 502);
  return (data.items || []).map(({ item }, index) => item && {
    position: index + 1,
    id: item.id,
    title: item.name,
    artist: item.artists?.map(artist => artist.name).filter(Boolean).join(', ') || 'Artista não informado',
    url: item.external_urls?.spotify || `https://open.spotify.com/track/${item.id}`,
    image: item.album?.images?.[2]?.url || item.album?.images?.[0]?.url || null
  }).filter(Boolean);
}

module.exports = { configured, topTracks };
