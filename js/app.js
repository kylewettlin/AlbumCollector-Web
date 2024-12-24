class App {
    constructor() {
        this.spotify = new SpotifyClient();
        this.ui = new UI();
        this.currentSearchQuery = '';
        this.currentSearchOffset = 0;
        this.isSearching = false;
        this.library = new Set();
        this.libraryAlbums = [];
        this.totalResults = 0;

        // Check if we're returning from auth
        if (window.location.hash) {
            // Remove the hash so it doesn't persist
            history.pushState("", document.title, window.location.pathname);
        }

        this.setupEventListeners();
        this.loadLibrary();
        this.loadTheme();
        this.ui.setupThemeGrid();
    }

    setupEventListeners() {
        // Navigation
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', () => {
                this.ui.switchPage(`${item.dataset.page}-page`);
            });
        });

        // Search
        const searchInput = document.getElementById('search-input');
        const searchButton = document.getElementById('search-button');
        const loadMoreButton = document.getElementById('load-more');

        const debounce = (func, wait) => {
            let timeout;
            return (...args) => {
                clearTimeout(timeout);
                timeout = setTimeout(() => func.apply(this, args), wait);
            };
        };

        const performSearch = async (loadMore = false) => {
            if (this.isSearching) return;

            const query = searchInput.value.trim();
            if (!loadMore) {
                this.currentSearchQuery = query;
                this.currentSearchOffset = 0;
                if (!query) {
                    document.getElementById('status-label').textContent = 'Please enter a search term';
                    return;
                }
                document.getElementById('results-list').innerHTML = '';
            }

            this.isSearching = true;
            searchInput.disabled = true;
            searchButton.disabled = true;
            loadMoreButton.disabled = true;
            document.getElementById('status-label').textContent = 'Searching...';

            try {
                const result = await this.spotify.searchAlbums(
                    this.currentSearchQuery, 
                    this.currentSearchOffset
                );

                if (!loadMore) {
                    this.totalResults = result.total;
                }

                this.displayResults(result.albums, loadMore);
                document.getElementById('status-label').textContent = 
                    `Showing ${document.getElementById('results-list').children.length} of ${this.totalResults} results`;
                
                loadMoreButton.style.display = result.hasMore ? 'block' : 'none';
            } catch (error) {
                document.getElementById('status-label').textContent = 'Error performing search';
                console.error('Search error:', error);
            }

            this.isSearching = false;
            searchInput.disabled = false;
            searchButton.disabled = false;
            loadMoreButton.disabled = false;
        };

        searchInput.addEventListener('input', debounce(() => performSearch(), 300));
        searchButton.addEventListener('click', () => performSearch());
        loadMoreButton.addEventListener('click', () => {
            this.currentSearchOffset += 10;
            performSearch(true);
        });

        // Sort functionality
        document.getElementById('sort-select').addEventListener('change', (e) => {
            this.sortLibrary(e.target.value);
        });
    }

    displayResults(albums, append = false) {
        const resultsList = document.getElementById('results-list');
        if (!append) {
            resultsList.innerHTML = '';
        }

        albums.forEach(album => {
            const albumElement = this.ui.createAlbumElement(
                album, 
                this.library.has(album.id)
            );
            
            const addButton = albumElement.querySelector('.add-button');
            addButton.addEventListener('click', () => this.addToLibrary(album));
            
            resultsList.appendChild(albumElement);
        });
    }

    addToLibrary(album) {
        if (this.library.has(album.id)) return;

        this.library.add(album.id);
        this.libraryAlbums.push(album);
        this.saveLibrary();
        this.refreshLibraryDisplay();

        // Update any existing album items in search results
        document.querySelectorAll('.album-item').forEach(item => {
            const addButton = item.querySelector('.add-button');
            if (item.querySelector('.album-info').textContent.includes(album.name)) {
                addButton.classList.add('added');
                addButton.disabled = true;
                addButton.textContent = 'Added';
            }
        });
    }

    sortLibrary(sortBy) {
        this.libraryAlbums.sort((a, b) => {
            switch (sortBy) {
                case 'artist':
                    return a.artist.localeCompare(b.artist);
                case 'album':
                    return a.name.localeCompare(b.name);
                case 'date':
                    return new Date(b.release_date) - new Date(a.release_date);
                default:
                    return 0;
            }
        });
        this.refreshLibraryDisplay();
    }

    refreshLibraryDisplay() {
        const libraryList = document.getElementById('library-list');
        libraryList.innerHTML = '';
        this.libraryAlbums.forEach(album => {
            const albumElement = this.ui.createAlbumElement(album, true);
            libraryList.appendChild(albumElement);
        });
    }

    saveLibrary() {
        localStorage.setItem('library', JSON.stringify({
            albums: this.libraryAlbums,
            ids: Array.from(this.library)
        }));
    }

    loadLibrary() {
        const saved = localStorage.getItem('library');
        if (saved) {
            const data = JSON.parse(saved);
            this.libraryAlbums = data.albums;
            this.library = new Set(data.ids);
            this.refreshLibraryDisplay();
        }
    }

    loadTheme() {
        const savedTheme = localStorage.getItem('selectedTheme');
        if (savedTheme) {
            this.ui.updateTheme(JSON.parse(savedTheme));
        }
    }
}

// Initialize the app when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.app = new App();
}); 