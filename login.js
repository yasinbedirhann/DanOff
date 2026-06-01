// DanOff Login Application Logic
const loginApp = {
    lang: 'bs',
    theme: 'light',
    selectedRole: 'employee',
    selectedEntity: 'fbih',

    // Entity configurations
    entities: {
        fbih: {
            name: 'FBiH',
            days: 20,
            description: 'Zakon o radu FBiH - 20 radnih dana godišnjeg odmora',
            descriptionEn: 'Labor Law FBiH - 20 working days of annual leave'
        },
        rs: {
            name: 'RS',
            days: 18,
            description: 'Zakon o radu RS - 18 radnih dana godišnjeg odmora',
            descriptionEn: 'Labor Law RS - 18 working days of annual leave'
        },
        brcko: {
            name: 'Brčko',
            days: 20,
            description: 'Zakon o radu Brčko Distrikta - 20 radnih dana godišnjeg odmora',
            descriptionEn: 'Labor Law Brčko District - 20 working days of annual leave'
        }
    },

    // Demo users database
    users: [
        { email: 'zaposlenik@danoff.ba', password: 'pass123', role: 'employee', name: 'Amar Hodžić', position: 'Senior Developer', id: 'EMP001' },
        { email: 'menadzer@danoff.ba', password: 'pass123', role: 'manager', name: 'Emina Hadžić', position: 'Team Lead', id: 'MGR001' },
        { email: 'admin@danoff.ba', password: 'admin123', role: 'admin', name: 'Admin Sistem', position: 'System Administrator', id: 'ADM001' },
        { email: 'sara@danoff.ba', password: 'pass123', role: 'employee', name: 'Sara Kovač', position: 'UX Designer', id: 'EMP002' },
        { email: 'ema@danoff.ba', password: 'pass123', role: 'employee', name: 'Ema Hadžić', position: 'Project Manager', id: 'EMP003' }
    ],

    translations: {
        bs: {
            subtitle: 'DanOff',
            selectEntity: 'Odaberite entitet',
            selectRole: 'Odaberite ulogu',
            employee: 'Zaposlenik',
            manager: 'Menadžer',
            admin: 'Administrator',
            email: 'Email adresa',
            password: 'Lozinka',
            rememberMe: 'Zapamti me',
            forgotPassword: 'Zaboravili lozinku?',
            login: 'Prijavi se',
            demoHint: 'Demo podaci za testiranje:',
            allRightsReserved: 'Sva prava pridržana.',
            loggingIn: 'Prijava u toku...',
            invalidCredentials: 'Neispravni podaci za prijavu',
            fillAllFields: 'Molimo popunite sva polja',
            passwordReset: 'Link za reset lozinke poslan na email',
            loggingInAs: 'Prijavljujete se kao',
            adminSubtitle: 'Pristup sistemu za upravljanje',
            managerSubtitle: 'Upravljanje timom i odobravanje',
            employeeSubtitle: 'Podnošenje zahtjeva za odmor',
            welcomeTitle: 'DanOff',
            welcomeHighlight: 'Jednostavno i Efikasno',
            welcomeDesc: 'DanOff je moderni sistem za upravljanje godišnjim odomorom prilagođen zakonima Bosne i Hercegovine. Podnesite zahtjeve, pratite stanje i generišite pravne dokumente u par klikova.',
            feature1Title: 'Brzo podnošenje',
            feature1Desc: 'Podnesite zahtjev za odmor za manje od minute',
            feature2Title: 'Pravna usklađenost',
            feature2Desc: 'Automatski generisani dokumenti po zakonu BiH',
            feature3Title: 'Timska sinhronizacija',
            feature3Desc: 'Vidite ko je na poslu u svakom trenutku',
            feature4Title: 'Mobile ready',
            feature4Desc: 'Pristup sa bilo kojeg uređaja, bilo gdje',
            supportedEntities: 'Podržani entiteti:',
            loginTitle: 'Prijava',
            loginSubtitle: 'Pristupite vašem nalogu'
        },
        en: {
            subtitle: 'DanOff',
            selectEntity: 'Select entity',
            selectRole: 'Select role',
            employee: 'Employee',
            manager: 'Manager',
            admin: 'Administrator',
            email: 'Email address',
            password: 'Password',
            rememberMe: 'Remember me',
            forgotPassword: 'Forgot password?',
            login: 'Sign In',
            demoHint: 'Demo credentials for testing:',
            allRightsReserved: 'All rights reserved.',
            loggingIn: 'Logging in...',
            invalidCredentials: 'Invalid credentials',
            fillAllFields: 'Please fill in all fields',
            passwordReset: 'Password reset link sent to email',
            loggingInAs: 'Logging in as',
            adminSubtitle: 'System administration access',
            managerSubtitle: 'Team management and approvals',
            employeeSubtitle: 'Submit leave requests',
            welcomeTitle: 'DanOff',
            welcomeHighlight: 'Simple and efficient',
            welcomeDesc: 'DanOff is a modern leave management system adapted to the laws of Bosnia and Herzegovina. Submit requests, track balance and generate legal documents in a few clicks.',
            feature1Title: 'Fast submission',
            feature1Desc: 'Submit a leave request in under a minute',
            feature2Title: 'Legal compliance',
            feature2Desc: 'Automatically generated documents per BiH law',
            feature3Title: 'Team sync',
            feature3Desc: 'See who is at work at any moment',
            feature4Title: 'Mobile ready',
            feature4Desc: 'Access from any device, anywhere',
            supportedEntities: 'Supported entities:',
            loginTitle: 'Login',
            loginSubtitle: 'Access your account'
        }
    },

    init() {
        this.loadData();
        this.applyTranslations();
        lucide.createIcons();
        
        // Check for saved session
        const session = localStorage.getItem('danoff_session');
        if (session) {
            const parsed = JSON.parse(session);
            if (parsed.rememberMe && new Date(parsed.expires) > new Date()) {
                this.redirectToApp(parsed.role);
            }
        }
    },

    toggleLanguage() {
        this.lang = this.lang === 'bs' ? 'en' : 'bs';
        document.getElementById('lang-label').textContent = this.lang.toUpperCase();
        this.applyTranslations();
        this.saveData();
    },

    toggleTheme() {
        this.theme = this.theme === 'light' ? 'dark' : 'light';
        this.applyTheme();
        this.saveData();
    },

    applyTheme() {
        if (this.theme === 'dark') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    },

    applyTranslations() {
        const t = this.translations[this.lang];
        document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.getAttribute('data-i18n');
            if (t[key]) el.textContent = t[key];
        });
    },

    updateRoleUI(role) {
        this.selectedRole = role;
        const subtitles = {
            employee: this.translations[this.lang].employeeSubtitle,
            manager: this.translations[this.lang].managerSubtitle,
            admin: this.translations[this.lang].adminSubtitle
        };
        // Visual feedback could be added here
    },

    updateEntityUI(entity) {
        this.selectedEntity = entity;
        const entityData = this.entities[entity];
        const descElement = document.getElementById('entity-description');
        if (descElement) {
            descElement.textContent = this.lang === 'bs' ? entityData.description : entityData.descriptionEn;
        }
        this.saveData();
    },

    togglePassword() {
        const input = document.getElementById('password');
        const icon = document.getElementById('eye-icon');
        if (input.type === 'password') {
            input.type = 'text';
            icon.setAttribute('data-lucide', 'eye-off');
        } else {
            input.type = 'password';
            icon.setAttribute('data-lucide', 'eye');
        }
        lucide.createIcons();
    },

    showError(message) {
        const errorDiv = document.getElementById('error-message');
        const errorText = document.getElementById('error-text');
        errorText.textContent = message;
        errorDiv.classList.remove('hidden');
        
        // Shake animation
        const form = document.querySelector('.glass');
        form.classList.add('shake');
        setTimeout(() => form.classList.remove('shake'), 500);
        
        setTimeout(() => {
            errorDiv.classList.add('hidden');
        }, 5000);
    },

    async login() {
        const email = document.getElementById('email').value.trim().toLowerCase();
        const password = document.getElementById('password').value;
        const rememberMe = document.getElementById('remember-me').checked;
        const role = document.querySelector('input[name="role"]:checked').value;

        // Validation
        if (!email || !password) {
            this.showError(this.translations[this.lang].fillAllFields);
            return;
        }

        // Show loading
        document.getElementById('loading-overlay').classList.remove('hidden');
        document.getElementById('loading-overlay').classList.add('flex');

        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 800));

        // Authenticate via API
        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password, role })
            });

            const user = await response.json();

            if (!response.ok) {
                document.getElementById('loading-overlay').classList.add('hidden');
                document.getElementById('loading-overlay').classList.remove('flex');
                this.showError(this.translations[this.lang].invalidCredentials);
                return;
            }

        // Get selected entity
        const entity = document.querySelector('input[name="entity"]:checked')?.value || this.selectedEntity;

        // Create session
        const session = {
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                position: user.position
            },
           entity: entity,
            entityData: this.entities[entity],
            loginTime: new Date().toISOString(),
            expires: new Date(Date.now() + (rememberMe ? 30 : 1) * 24 * 60 * 60 * 1000).toISOString(),
            rememberMe: rememberMe
        };

        localStorage.setItem('danoff_session', JSON.stringify(session));
        
        // Also update the main app data
        const appData = JSON.parse(localStorage.getItem('danoff_data') || '{}');
        appData.currentUser = session.user;
        appData.entity = entity;
        appData.entityData = this.entities[entity];
        localStorage.setItem('danoff_data', JSON.stringify(appData));

        // Redirect based on role
        setTimeout(() => {
            this.redirectToApp(user.role);
        }, 500);

} catch (err) {
            console.error(err);
            document.getElementById('loading-overlay').classList.add('hidden');
            document.getElementById('loading-overlay').classList.remove('flex');
            this.showError('Server error. Please try again.');
        }

    },

    redirectToApp(role) {
        // Pass role and user info via URL or localStorage is already set
        window.location.href = 'index.html?role=' + role + '&auth=true';
    },

    forgotPassword() {
        const email = document.getElementById('email').value;
        if (!email) {
            this.showError(this.lang === 'bs' ? 'Unesite email adresu' : 'Please enter email address');
            return;
        }
        
        // In real app, this would send reset email
        alert(this.translations[this.lang].passwordReset + ': ' + email);
    },

    saveData() {
        const data = {
            lang: this.lang,
            theme: this.theme,
            selectedEntity: this.selectedEntity
        };
        localStorage.setItem('danoff_login_data', JSON.stringify(data));
    },

    loadData() {
        const saved = localStorage.getItem('danoff_login_data');
        if (saved) {
            const data = JSON.parse(saved);
            this.lang = data.lang || 'bs';
            this.theme = data.theme || 'light';
            this.selectedEntity = data.selectedEntity || 'fbih';
            
            // Restore entity selection
            const entityRadio = document.querySelector(`input[name="entity"][value="${this.selectedEntity}"]`);
            if (entityRadio) {
                entityRadio.checked = true;
                this.updateEntityUI(this.selectedEntity);
            }
            
            document.getElementById('lang-label').textContent = this.lang.toUpperCase();
            this.applyTheme();
        }
        
    }
};

// Initialize on load
document.addEventListener('DOMContentLoaded', () => {
    loginApp.init();
});
