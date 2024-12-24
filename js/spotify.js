class SpotifyClient {
    constructor() {
        this.clientId = '9c18388b794041aca87c4f3d975e580e';
        this.accessToken = null;
        this.loadToken();
    }

    loadToken() {
        // Try to load token from localStorage
        const storedToken = localStorage.getItem('spotify_access_token');
        const tokenExpiry = localStorage.getItem('spotify_token_expiry');
        
        if (storedToken && tokenExpiry && Date.now() < parseInt(tokenExpiry)) {
            this.accessToken = storedToken;
            return true;
        }
        
        // Clear invalid/expired token
        this.clearToken();
        return false;
    }

    clearToken() {
        this.accessToken = null;
        localStorage.removeItem('spotify_access_token');
        localStorage.removeItem('spotify_token_expiry');
    }

    saveToken(token, expiresIn) {
        this.accessToken = token;
        const expiry = Date.now() + (expiresIn * 1000);
        localStorage.setItem('spotify_access_token', token);
        localStorage.setItem('spotify_token_expiry', expiry.toString());
    }

    async authenticate() {
        try {
            // First check if we already have a valid token
            if (this.loadToken()) {
                return true;
            }

            // Check if we're returning from auth redirect
            if (window.location.hash) {
                const params = new URLSearchParams(window.location.hash.substring(1));
                const accessToken = params.get('access_token');
                const expiresIn = params.get('expires_in');
                
                if (accessToken && expiresIn) {
                    this.saveToken(accessToken, parseInt(expiresIn));
                    // Clear the hash from URL
                    window.history.replaceState(null, null, window.location.pathname);
                    return true;
                }
            }

            // If we get here, we need to authenticate
            const redirectUri = encodeURIComponent(window.location.origin);
            const scope = encodeURIComponent('user-library-read user-library-modify');
            const authUrl = `https://accounts.spotify.com/authorize?client_id=${this.clientId}&response_type=token&redirect_uri=${redirectUri}&scope=${scope}`;
            
            window.location.href = authUrl;
            return false;
        } catch (error) {
            console.error('Authentication failed:', error);
            this.clearToken();
            return false;
        }
    }

    async searchAlbums(query, offset = 0) {
        try {
            if (!this.accessToken && !(await this.authenticate())) {
                return null;
            }

            const response = await fetch(
                `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=album&limit=10&offset=${offset}`,
                {
                    headers: {
                        'Authorization': `Bearer ${this.accessToken}`
                    }
                }
            );

            if (response.status === 401) {
                this.clearToken();
                return this.searchAlbums(query, offset);
            }

            const data = await response.json();
            
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