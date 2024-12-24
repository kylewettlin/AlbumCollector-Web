class UI {
    constructor() {
        this.themes = [
            {
                name: "Glacier Blue",
                background: "#EEF5FF",
                sidebar: "#C4DFFF",
                text: "#2C3E50",
                accent: "#2E5C9A"
            },
            {
                name: "Dark Mode",
                background: "#1A1A1A",
                sidebar: "#2D2D2D",
                text: "#FFFFFF",
                accent: "#007AFF"
            },
            {
                name: "Forest",
                background: "#F5F9F5",
                sidebar: "#D4E4D4",
                text: "#2C3E50",
                accent: "#3E885B"
            },
            {
                name: "Creamsicle",
                background: "#F7E8D0",
                sidebar: "#E7C697",
                text: "#2C4B3B",
                accent: "#FF7B54"
            }
        ];
    }

    formatDate(dateStr) {
        const date = new Date(dateStr);
        if (isNaN(date)) return dateStr;
        return date.toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        });
    }

    createAlbumElement(album, isInLibrary = false) {
        const div = document.createElement('div');
        div.className = 'album-item';
        div.innerHTML = `
            <img class="album-image" src="${album.image_url}" alt="${album.name}">
            <div class="album-info">
                <div>${album.name} - ${album.artist}</div>
                <div>${this.formatDate(album.release_date)}</div>
            </div>
            <button class="add-button ${isInLibrary ? 'added' : ''}" 
                    ${isInLibrary ? 'disabled' : ''}>
                ${isInLibrary ? 'Added' : 'Add to Library'}
            </button>
        `;
        return div;
    }

    updateTheme(theme) {
        document.documentElement.style.setProperty('--background', theme.background);
        document.documentElement.style.setProperty('--sidebar', theme.sidebar);
        document.documentElement.style.setProperty('--text', theme.text);
        document.documentElement.style.setProperty('--accent', theme.accent);
        localStorage.setItem('selectedTheme', JSON.stringify(theme));
    }

    setupThemeGrid() {
        const themeList = document.getElementById('theme-list');
        themeList.innerHTML = '';

        this.themes.forEach(theme => {
            const themeItem = document.createElement('div');
            themeItem.className = 'theme-item';
            themeItem.innerHTML = `
                <div class="theme-preview" style="background-color: ${theme.background}">
                    <div style="background-color: ${theme.sidebar}; height: 30%"></div>
                    <div style="background-color: ${theme.accent}; height: 20%"></div>
                </div>
                <div>${theme.name}</div>
            `;
            themeItem.addEventListener('click', () => this.updateTheme(theme));
            themeList.appendChild(themeItem);
        });
    }

    switchPage(pageId) {
        document.querySelectorAll('.page').forEach(page => {
            page.classList.add('hidden');
        });
        document.getElementById(pageId).classList.remove('hidden');

        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
            if (item.dataset.page === pageId.replace('-page', '')) {
                item.classList.add('active');
            }
        });
    }
} 