class SpotifyClient {
    constructor() {
        this.accessToken = null;
    }

    async authenticate() {
        try {
            // Instead of direct authentication, call your server endpoint
            const response = await fetch('YOUR_SERVER_ENDPOINT/auth');
            const data = await response.json();
            this.accessToken = data.access_token;
            return true;
        } catch (error) {
            console.error('Authentication failed:', error);
            return false;
        }
    }

    async searchAlbums(query, offset = 0) {
        if (!this.accessToken) {
            await this.authenticate();
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
                // Token expired, try to reauthenticate
                await this.authenticate();
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