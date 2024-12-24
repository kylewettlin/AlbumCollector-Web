class SpotifyClient {
    constructor() {
        // Use client ID only, no secret needed for this approach
        this.clientId = '9c18388b794041aca87c4f3d975e580e';
        this.accessToken = null;
    }

    async authenticate() {
        try {
            // Use the Implicit Grant Flow
            const authUrl = `https://accounts.spotify.com/authorize?client_id=${this.clientId}&response_type=token&redirect_uri=${encodeURIComponent(window.location.origin)}`;
            
            // If we don't have a token in URL, redirect to auth
            if (!window.location.hash) {
                window.location.href = authUrl;
                return false;
            }

            // Extract token from URL hash
            const hash = window.location.hash.substring(1);
            const params = new URLSearchParams(hash);
            this.accessToken = params.get('access_token');
            
            if (!this.accessToken) {
                window.location.href = authUrl;
                return false;
            }

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