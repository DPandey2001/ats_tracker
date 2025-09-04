// Theme Handler for Dark/Light Mode Toggle
class ThemeHandler {
    constructor() {
        this.currentTheme = 'light';
        this.init();
    }

    init() {
        document.addEventListener('DOMContentLoaded', () => {
            this.loadSavedTheme();
            this.setupThemeToggle();
            this.updateThemeIcon();
        });
    }

    setupThemeToggle() {
        const themeToggle = document.getElementById('themeToggle');
        if (themeToggle) {
            themeToggle.addEventListener('click', () => {
                this.toggleTheme();
            });
        }
    }

    toggleTheme() {
        this.currentTheme = this.currentTheme === 'light' ? 'dark' : 'light';
        this.applyTheme();
        this.saveTheme();
        this.updateThemeIcon();
        console.log(`Theme changed to: ${this.currentTheme}`);
    }

    applyTheme() {
        const body = document.body;
        const appContainer = document.querySelector('.app-container');

        if (this.currentTheme === 'dark') {
            body.classList.add('dark-theme');
            appContainer.classList.add('dark-theme');
        } else {
            body.classList.remove('dark-theme');
            appContainer.classList.remove('dark-theme');
        }
    }

    updateThemeIcon() {
        const themeIcon = document.getElementById('themeIcon');
        if (themeIcon) {
            if (this.currentTheme === 'dark') {
                // Moon icon for dark mode
                themeIcon.innerHTML = `
                    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
                `;
            } else {
                // Sun icon for light mode
                themeIcon.innerHTML = `
                    <circle cx="12" cy="12" r="5"></circle>
                    <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"></path>
                `;
            }
        }
    }

    saveTheme() {
        localStorage.setItem('atsTrackerTheme', this.currentTheme);
    }

    loadSavedTheme() {
        const savedTheme = localStorage.getItem('atsTrackerTheme');
        if (savedTheme) {
            this.currentTheme = savedTheme;
            this.applyTheme();
        }
    }

    getCurrentTheme() {
        return this.currentTheme;
    }
}

// Initialize theme handler
const themeHandler = new ThemeHandler();

// Export for use in other modules
window.themeHandler = themeHandler;
