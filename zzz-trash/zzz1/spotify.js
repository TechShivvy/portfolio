const accessToken = ''; // You need to obtain an access token from the Spotify API

// Get the current user's currently playing track
fetch('https://api.spotify.com/v1/me/player/currently-playing', {
  headers: {
    'Authorization': 'Bearer ' + accessToken
  }
})
  .then(response => response.json())
  .then(data => {
    if (data && data.item) {
      const trackName = data.item.name;
      const artistName = data.item.artists.map(artist => artist.name).join(', ');
      const albumName = data.item.album.name;

      console.log(`Currently Playing: ${trackName} by ${artistName} from the album ${albumName}`);
    } else {
      console.log('No track currently playing.');
    }
  })
  .catch(error => console.error('Error fetching currently playing track:', error));

// Get the user's recently played tracks
fetch('https://api.spotify.com/v1/me/player/recently-played', {
  headers: {
    'Authorization': 'Bearer ' + accessToken
  }
})
  .then(response => response.json())
  .then(data => {
    if (data && data.items.length > 0) {
      const lastPlayedTrack = data.items[0].track;
      const trackName = lastPlayedTrack.name;
      const artistName = lastPlayedTrack.artists.map(artist => artist.name).join(', ');
      const albumName = lastPlayedTrack.album.name;

      console.log(`Last Played: ${trackName} by ${artistName} from the album ${albumName}`);
    } else {
      console.log('No recently played tracks.');
    }
  })
  .catch(error => console.error('Error fetching recently played tracks:', error));
