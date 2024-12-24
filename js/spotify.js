class SpotifyClient {
    constructor() {
        this.clientId = '9c18388b794041aca87c4f3d975e580e';
        this.accessToken = localStorage.getItem('spotify_access_token'); // Check for stored token
    }

    async authenticate() {
        try {
            // If we have a hash in the URL, process it
            if (window.location.hash) {
                const hash = window.location.hash.substring(1);
                const params = new URLSearchParams(hash);
                this.accessToken = params.get('access_token');
                
                if (this.accessToken) {
                    // Store the token
                    localStorage.setItem('spotify_access_token', this.accessToken);
                    return true;
                }
            }

            // If we have a stored token, use it
            if (this.accessToken) {
                return true;
            }

            // If we get here, we need to authenticate
            const authUrl = `https://accounts.spotify.com/authorize?client_id=${this.clientId}&response_type=token&redirect_uri=${encodeURIComponent(window.location.origin)}`;
            window.location.href = authUrl;
            return false;
        } catch (error) {
            console.error('Authentication failed:', error);
            return false;
        }
    }

    async searchAlbums(query, offset = 0) {
        if (!this.accessToken) {
            const authenticated = await this.authenticate();
            if (!authenticated) return null;
        }

        try {
            const response = await fetch(
                `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=album&limit=10&offset=${offset}`,
                {
                    headers: {
                        'Authorization': `Bearer ${this.accessToken}`
                    }
                }
            );

            const data = await response.json();
            
            if (response.status === 401) {
                // Token expired, clear it and try to reauthenticate
                this.accessToken = null;
                localStorage.removeItem('spotify_access_token');
                return this.searchAlbums(query, offset);
            }

            return {
                albums: data.albums.items.map(album => ({
                    name: album.name,
                    artist: album.artists[0].name,
                    id: album.id,
                    release_date: album.release_date,
                    image_url: album.images[0].url
                })),
                total: data.albums.total,
                hasMore: (offset + 10) < data.albums.total
            };
        } catch (error) {
            console.error('Search failed:', error);
            throw error;
        }
    }
} 