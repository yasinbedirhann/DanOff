// DanOff Application Logic
const DATA_VERSION = 2;

const app = {
    lang: 'bs',
    role: null,
    theme: 'light',
    entity: 'fbih', // fbih, rs, brcko
    medicalFile: null,
    currentHapticRequest: null,
    currentUser: null,
    editingRequestId: null,
    users: [],
    editingUserId: null,
    calendarYear: new Date().getFullYear(),
    calendarMonth: new Date().getMonth(),
    
    // Entity configurations (holidays stored as MM-DD, resolved dynamically)
    entities: {
        fbih: {
            name: 'FBiH',
            totalDays: 20,
            maxCarryOver: 30,
            legalRef: 'Zakon o radu FBiH (Sl.novine FBiH br. 66/16)',
            holidayDays: ['01-01', '01-02', '03-01', '05-01', '05-02', '11-25', '12-25']
        },
        rs: {
            name: 'RS',
            totalDays: 18,
            maxCarryOver: 20,
            legalRef: 'Zakon o radu RS (Službeni glasnik RS br. 103/17)',
            holidayDays: ['01-01', '01-07', '05-01', '05-09', '11-21']
        },
        brcko: {
            name: 'Brčko',
            totalDays: 20,
            maxCarryOver: 25,
            legalRef: 'Zakon o radu Brčko Distrikta',
            holidayDays: ['01-01', '01-02', '05-01', '12-25']
        }
    },

    getEntityHolidays(entity) {
        const year = new Date().getFullYear();
        const defs = this.entities[entity]?.holidayDays || [];
        // Include current and next year so upcoming requests are covered
        const holidays = [];
        [year, year + 1].forEach(y => defs.forEach(md => holidays.push(`${y}-${md}`)));
        return holidays;
    },

    // Translations
    translations: {
        bs: {
            subtitle: 'Sistem za upravljanje godišnjim odmorom',
            employee: 'Zaposlenik',
            employeeDesc: 'Podnesite zahtjev za godišnji odmor',
            manager: 'Menadžer',
            managerDesc: 'Odobrite zahtjeve i upravljajte timom',
            enableNotifications: 'Omogući obavještenja',
            myLeave: 'Moj godišnji',
            daysLeft: 'dana preostalo',
            annualBalance: 'Godišnje stanje',
            totalEntitlement: 'Ukupno: 20 dana | Iskorišteno: 0 dana',
            newRequest: 'Novi zahtjev',
            recentRequests: 'Nedavni zahtjevi',
            noRequests: 'Nema podnesenih zahtjeva',
            teamManagement: 'Upravljanje timom',
            teamActive: '5 aktivnih članova',
            legalReport: 'Izvještaj',
            pending: 'Na čekanju',
            approvedThisMonth: 'Odobreno ovaj mjesec',
            teamCoverage: 'Pokrivenost tima',
            pendingRequests: 'Na čekanju',
            approved: 'Odobreno',
            rejected: 'Odbijeno',
            cancel: 'Otkaži',
            newLeaveRequest: 'Novi zahtjev za odmor',
            submit: 'Pošalji',
            startDate: 'Datum početka',
            endDate: 'Datum završetka',
            totalDays: 'Ukupno dana:',
            holidayWarning: 'Odabrani period uključuje državni praznik. Radni dani će biti automatski preračunati.',
            leaveType: 'Vrsta odmora',
            annual: 'Godišnji',
            sick: 'Bolovanje',
            notes: 'Napomene',
            legalDocument: 'Pravni dokument',
            downloadPdf: 'Preuzmi PDF',
            requestSubmitted: 'Zahtjev uspješno podnesen',
            requestApproved: 'Zahtjev odobren',
            requestRejected: 'Zahtjev odbijen',
            awaitingApproval: 'Čeka na odobrenje',
            approvedStatus: 'Odobreno',
            rejectedStatus: 'Odbijeno',
            days: 'dana',
            from: 'Od',
            to: 'Do',
            employeeInfo: 'Podaci o zaposleniku',
            companyInfo: 'Podaci o poslodavcu',
            documentTitle: 'OBRAZAC O KORIŠTENJU GODIŠNJEG ODMORA',
            legalBasis: 'Pravna osnova: Zakon o radu Federacije Bosne i Hercegovine (Sl.novine FBiH br. 66/16, 67/16, 1/17)',
            articleReference: 'Član 64. - Pravo na godišnji odmor',
            employer: 'Poslodavac',
            employeeName: 'Zaposlenik',
            position: 'Radno mjesto',
            period: 'Period korištenja',
            workingDays: 'Radnih dana',
            signatureEmployee: 'Potpis zaposlenika',
            signatureEmployer: 'Potpis poslodavca / Pečat',
            date: 'Datum',
            generatedBy: 'Dokument generisan putem DanOff sistema',
            logout: 'Odjava',
            logoutSuccess: 'Uspješno ste odjavljeni',
            forecastTitle: 'Predviđanje godišnjeg',
            archivePlaceholder: "Pretraži arhivu (npr. 'august 2023', 'bolovanje')...",
            notesPlaceholder: 'Dodatne informacije...',
            daySwap: 'Zamjena dana',
            whoIsAtWork: 'Tko je na poslu?',
            whoIsAtWorkToday: 'Tko je na poslu danas?',
            tradeSend: 'Pošalji',
            tradeDesc: 'Predložite zamjenu dana sa kolegom. Obje strane moraju prihvatiti.',
            tradeColleague: 'Kolege',
            tradeYouGive: 'Vi dajete',
            tradeYouReceive: 'Vi dobijate',
            tradeDuringAbsence: 'Zamjena tokom odsustva',
            leaveCost: 'Trošak odmora',
            estimatedCost: 'Procijenjeni trošak',
            teamHealth: 'Zdravlje tima',
            lowBurnoutRisk: 'Niski rizik od burn-outa',
            other: 'Ostalo',
            coveragePlaceholder: 'Neko će preuzeti moja zaduženja...',
            coverageNone: 'Niko ne preuzima',
            burnoutRisk: 'Uzorak bolovanja - preporučujemo odmor',
            administration: 'Administracija',
            totalUsers: 'Ukupno korisnika',
            activeRequests: 'Aktivnih zahtjeva',
            entity: 'Entitet',
            userManagement: 'Upravljanje korisnicima',
            addUser: 'Dodaj korisnika',
            nameCol: 'Ime',
            roleCol: 'Uloga',
            positionCol: 'Pozicija',
            actionsCol: 'Akcije',
            allRequests: 'Svi zahtjevi',
            periodCol: 'Period',
            daysCol: 'Dana',
            typeCol: 'Vrsta',
            aiConflictTitle: 'AI Upozorenje o konfliktu',
            aiConflictMsg: '3 člana tima već planiraju odmor u ovom periodu. Preporučujemo pomeranje za 7 dana.',
            showHeatmap: 'Prikaži heat map',
            dismiss: 'Odbaci',
            teamHeatmap: 'Zauzetost tima - Heat Map',
            heatFree: 'Slobodno',
            heat12: '1-2 na odmoru',
            heatCritical: 'Kritično (>3)',
            onLeave: 'Na odmoru',
            atWork: 'Na poslu',
            focusTitle: 'Na odmoru',
            focusSubtitle: 'Ne pitajte me o poslu.',
            timeRemaining: 'Preostalo vremena',
            emergency: 'Hitni slučaj',
            emergencyContactLabel: 'Kontakt za hitne slučajeve:',
            extendLeave: 'Produži odmor',
            touchToConfirm: 'Dodirnite za potvrdu',
            addUserTitle: 'Dodaj korisnika',
            editUserTitle: 'Uredi korisnika',
            fullName: 'Ime i prezime',
            roleLabel: 'Uloga',
            saveBtn: 'Sačuvaj',
            editBtn: 'Uredi',
            deleteBtn: 'Obriši',
            approveBtn: 'Odobri',
            rejectBtn: 'Odbij',
            deleteConfirm: 'Da li ste sigurni da želite obrisati ovog korisnika?',
            deleteRequestConfirm: 'Obrisati ovaj zahtjev?',
            userDeleted: 'Korisnik obrisan',
            userDeletedMsg: 'Korisnik je uspješno uklonjen',
            userAdded: 'Korisnik dodan',
            requestDeleted: 'Zahtjev obrisan',
            noResults: 'Nema rezultata pretrage',
            emergencyContactToast: 'Hitni kontakt',
            tradeSelectError: 'Odaberite kolegu',
            tradeSentMsg: 'Prijedlog zamjene',
            teamHealthMsg: 'Svi članovi tima su u dobrom stanju. Nema znakova preopterećenosti.',
            hapticCancelled: 'Otkazano',
            hapticCancelledMsg: 'Zahtjev za odmor je otkazan',
            biometricSuccess: 'Autentifikacija uspješna',
            biometricMsg: 'Biometrijska potvrda prihvaćena',
            addToCalendar: 'Dodaj u kalendar',
            calendarExported: 'Kalendar je preuzet',
            noDataError: 'Nema podataka za izvoz',
            noShareData: 'Nema podataka za dijeljenje',
            egovTitle: 'e-Građani',
            egovMsg: 'Izvoz za e-Građani portal je u razvoju',
            permissionError: 'Nemate dozvolu za ovu ulogu',
            salaryLabel: 'Plata (KM/mj.)',
            moderateRisk: 'Umjereni rizik',
            highBurnoutRisk: 'Visoki rizik od burn-outa',
            sickDaysIn90: 'dana bolovanja u 90 dana',
            noAnnualIn6m: 'Nema godišnjeg odmora u 6 mj.',
            phoneLabel: 'Telefon',
            entityLabel: 'Entitet',
            passwordLabel: 'Lozinka',
            userAddedPassword: 'Privremena lozinka',
            noPhone: 'Broj nije unesen',
            balanceExceeded: 'Prekoračen godišnji odmor',
            balanceExceededMsg: 'Preostalo dana',
            yearOverview: 'Pregled godine',
            calendarDays: 'Pon,Uto,Sri,Čet,Pet,Sub,Ned',
            tradeColleaguePlaceholder: 'Odaberite kolege...',
            day1: '1 dan',
            day2: '2 dana',
            day3: '3 dana'
        },
        en: {
            burnoutRisk: 'Sick leave pattern - we recommend rest',
            administration: 'Administration',
            totalUsers: 'Total users',
            activeRequests: 'Active requests',
            entity: 'Entity',
            userManagement: 'User management',
            addUser: 'Add user',
            nameCol: 'Name',
            roleCol: 'Role',
            positionCol: 'Position',
            actionsCol: 'Actions',
            allRequests: 'All requests',
            periodCol: 'Period',
            daysCol: 'Days',
            typeCol: 'Type',
            aiConflictTitle: 'AI Conflict Warning',
            aiConflictMsg: '3 team members are already planning leave in this period. We recommend shifting by 7 days.',
            showHeatmap: 'Show heat map',
            dismiss: 'Dismiss',
            teamHeatmap: 'Team Occupancy - Heat Map',
            heatFree: 'Free',
            heat12: '1-2 on leave',
            heatCritical: 'Critical (>3)',
            onLeave: 'On Leave',
            atWork: 'At work',
            focusTitle: 'On Leave',
            focusSubtitle: 'Do not ask me about work.',
            timeRemaining: 'Time remaining',
            emergency: 'Emergency',
            emergencyContactLabel: 'Emergency contact:',
            extendLeave: 'Extend leave',
            touchToConfirm: 'Touch to confirm',
            addUserTitle: 'Add user',
            editUserTitle: 'Edit user',
            fullName: 'Full name',
            roleLabel: 'Role',
            saveBtn: 'Save',
            editBtn: 'Edit',
            deleteBtn: 'Delete',
            approveBtn: 'Approve',
            rejectBtn: 'Reject',
            deleteConfirm: 'Are you sure you want to delete this user?',
            deleteRequestConfirm: 'Delete this request?',
            userDeleted: 'User deleted',
            userDeletedMsg: 'User has been successfully removed',
            userAdded: 'User added',
            requestDeleted: 'Request deleted',
            noResults: 'No search results',
            emergencyContactToast: 'Emergency contact',
            tradeSelectError: 'Select a colleague',
            tradeSentMsg: 'Swap proposal',
            teamHealthMsg: 'All team members are in good condition. No signs of overload.',
            hapticCancelled: 'Cancelled',
            hapticCancelledMsg: 'Leave request has been cancelled',
            biometricSuccess: 'Authentication successful',
            biometricMsg: 'Biometric confirmation accepted',
            addToCalendar: 'Add to Calendar',
            calendarExported: 'Calendar downloaded',
            noDataError: 'No data to export',
            noShareData: 'No data to share',
            egovTitle: 'e-Government',
            egovMsg: 'Export for e-Government portal is in development',
            permissionError: 'You do not have permission for this role',
            salaryLabel: 'Salary (KM/mo.)',
            moderateRisk: 'Moderate risk',
            highBurnoutRisk: 'High burnout risk',
            sickDaysIn90: 'sick days in 90 days',
            noAnnualIn6m: 'No annual leave in 6 months',
            phoneLabel: 'Phone',
            entityLabel: 'Entity',
            passwordLabel: 'Password',
            userAddedPassword: 'Temporary password',
            noPhone: 'No phone number set',
            balanceExceeded: 'Annual leave balance exceeded',
            balanceExceededMsg: 'Days remaining',
            yearOverview: 'Year overview',
            calendarDays: 'Mon,Tue,Wed,Thu,Fri,Sat,Sun',
            tradeColleaguePlaceholder: 'Select a colleague...',
            day1: '1 day',
            day2: '2 days',
            day3: '3 days',
            subtitle: 'Annual Leave Management System',
            employee: 'Employee',
            employeeDesc: 'Submit your leave request',
            manager: 'Manager',
            managerDesc: 'Approve requests and manage team',
            enableNotifications: 'Enable Notifications',
            myLeave: 'My Leave',
            daysLeft: 'days left',
            annualBalance: 'Annual Balance',
            totalEntitlement: 'Total: 20 days | Used: 0 days',
            newRequest: 'New Request',
            recentRequests: 'Recent Requests',
            noRequests: 'No requests submitted',
            teamManagement: 'Team Management',
            teamActive: '5 active members',
            legalReport: 'Legal Report',
            pending: 'Pending',
            approvedThisMonth: 'Approved this month',
            teamCoverage: 'Team Coverage',
            pendingRequests: 'Pending',
            approved: 'Approved',
            rejected: 'Rejected',
            cancel: 'Cancel',
            newLeaveRequest: 'New Leave Request',
            submit: 'Submit',
            startDate: 'Start Date',
            endDate: 'End Date',
            totalDays: 'Total days:',
            holidayWarning: 'Selected period includes a public holiday. Working days will be calculated automatically.',
            leaveType: 'Leave Type',
            annual: 'Annual Leave',
            sick: 'Sick Leave',
            notes: 'Notes',
            legalDocument: 'Legal Document',
            downloadPdf: 'Download PDF',
            requestSubmitted: 'Request submitted successfully',
            requestApproved: 'Request approved',
            requestRejected: 'Request rejected',
            awaitingApproval: 'Awaiting approval',
            approvedStatus: 'Approved',
            rejectedStatus: 'Rejected',
            days: 'days',
            from: 'From',
            to: 'To',
            employeeInfo: 'Employee Information',
            companyInfo: 'Employer Information',
            documentTitle: 'ANNUAL LEAVE USAGE FORM',
            legalBasis: 'Legal Basis: Labor Law of the Federation of Bosnia and Herzegovina (Official Gazette of FBiH No. 66/16, 67/16, 1/17)',
            articleReference: 'Article 64 - Right to Annual Leave',
            employer: 'Employer',
            employeeName: 'Employee',
            position: 'Position',
            period: 'Usage Period',
            workingDays: 'Working Days',
            signatureEmployee: 'Employee Signature',
            signatureEmployer: 'Employer Signature / Stamp',
            date: 'Date',
            generatedBy: 'Document generated via DanOff system',
            logout: 'Logout',
            logoutSuccess: 'You have been successfully logged out',
            forecastTitle: 'Leave Forecast',
            archivePlaceholder: "Search archive (e.g. 'august 2023', 'sick leave')...",
            notesPlaceholder: 'Additional information...',
            daySwap: 'Day Swap',
            whoIsAtWork: 'Who is at work?',
            whoIsAtWorkToday: 'Who is at work today?',
            tradeSend: 'Send',
            tradeDesc: 'Propose a day swap with a colleague. Both parties must accept.',
            tradeColleague: 'Colleague',
            tradeYouGive: 'You give',
            tradeYouReceive: 'You receive',
            tradeDuringAbsence: 'Replacement during absence',
            leaveCost: 'Leave Cost',
            estimatedCost: 'Estimated cost',
            teamHealth: 'Team Health',
            lowBurnoutRisk: 'Low burnout risk',
            other: 'Other',
            coveragePlaceholder: 'Someone will cover my duties...',
            coverageNone: 'Nobody covers'
        }
    },

    bosnianHolidays: [], // Will be set based on entity

    init() {
        this.loadData();
        this.checkAuth();
        this.loadRequests();
        this.loadUsers();
        this.applyTranslations();
        lucide.createIcons();
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('/sw.js').catch(err => console.error('SW register error:', err));
        }
    },

    checkAuth() {
        // Check URL params for role from login
        const urlParams = new URLSearchParams(window.location.search);
        const roleFromUrl = urlParams.get('role');
        const isAuth = urlParams.get('auth') === 'true';
        
        // Check session
        const session = localStorage.getItem('danoff_session');
        
        if (session) {
            const parsed = JSON.parse(session);
            this.currentUser = parsed.user;
            
            // Load entity from session if available
            if (parsed.entity) {
                this.entity = parsed.entity;
                this.userEntityData = parsed.entityData;
                // Populate holidays for this entity (current year)
                this.bosnianHolidays = this.getEntityHolidays(this.entity);
            }
            
            // Update UI with user info
            this.updateUserUI();
            
            // If role passed from login, use it
            if (roleFromUrl && isAuth) {
                // Clear the URL params but keep auth
                const newUrl = window.location.pathname + '?auth=true';
                window.history.replaceState({}, '', newUrl);
                
                // Auto-select role if it matches user's role
                if (this.currentUser.role === roleFromUrl) {
                    setTimeout(() => this.setRole(roleFromUrl), 100);
                }
            }
        }
    },

    updateUserUI() {
        if (!this.currentUser) return;
        
        const user = this.currentUser;
        const initials = user.name.split(' ').map(n => n[0]).join('');
        
        // Update role selection screen
        document.getElementById('user-info-card')?.classList.remove('hidden');
        document.getElementById('user-name').textContent = user.name;
        document.getElementById('user-role').textContent = user.position;
        document.getElementById('user-avatar').textContent = initials;
        
        // Show/hide role buttons based on user role
        const btnEmployee = document.getElementById('btn-employee');
        const btnManager = document.getElementById('btn-manager');
        const btnAdmin = document.getElementById('btn-admin');
        
        if (user.role === 'admin') {
            btnAdmin?.classList.remove('hidden');
            btnEmployee?.classList.add('hidden');
            btnManager?.classList.add('hidden');
        } else if (user.role === 'manager') {
            btnManager?.classList.remove('hidden');
            btnEmployee?.classList.add('hidden');
        } else {
            btnEmployee?.classList.remove('hidden');
            btnManager?.classList.add('hidden');
            btnAdmin?.classList.add('hidden');
        }
        
        // Update employee dashboard
        const empAvatar = document.getElementById('employee-avatar');
        const empName = document.getElementById('employee-name');
        const empPosition = document.getElementById('employee-position');
        
        if (empAvatar) empAvatar.textContent = initials;
        if (empName) empName.textContent = user.name;
        if (empPosition) empPosition.textContent = user.position;
        
        // Update manager dashboard
        const mgrAvatar = document.getElementById('manager-avatar');
        const mgrName = document.getElementById('manager-name');
        
        if (mgrAvatar) mgrAvatar.textContent = initials;
        if (mgrName) mgrName.textContent = user.name;
        
        // Update admin dashboard
        const admAvatar = document.getElementById('admin-avatar');
        const admName = document.getElementById('admin-name');
        
        if (admAvatar) admAvatar.textContent = initials;
        if (admName) admName.textContent = user.name;
    },

    logout() {
        try {
            this.showToast(this.t('logout') || 'Odjava', this.t('logoutSuccess') || 'Uspješno ste odjavljeni', 'success');
        } catch (e) {}

        // Only clear auth session — keep danoff_data so requests persist across logins
        localStorage.removeItem('danoff_session');
        this.currentUser = null;
        this.role = null;

        setTimeout(() => {
            window.location.href = 'login.html';
        }, 500);
    },

    toggleLanguage() {
        this.lang = this.lang === 'bs' ? 'en' : 'bs';
        document.getElementById('lang-label').textContent = this.lang.toUpperCase();
        this.applyTranslations();
        this.saveData();
    },

    // Entity toggle removed from main app - should only be set at login
    // Entity is determined by user account and stored in session

    applyTranslations() {
        const t = this.translations[this.lang];
        document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.getAttribute('data-i18n');
            const camelKey = key.replace(/-([a-z])/g, (_, l) => l.toUpperCase());
            if (t[camelKey]) el.textContent = t[camelKey];
            else if (t[key]) el.textContent = t[key];
        });
        document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
            const key = el.getAttribute('data-i18n-placeholder');
            const camelKey = key.replace(/-([a-z])/g, (_, l) => l.toUpperCase());
            if (t[camelKey]) el.placeholder = t[camelKey];
            else if (t[key]) el.placeholder = t[key];
        });
        this.updateDashboard();
    },

    t(key) {
        return this.translations[this.lang][key] || key;
    },

    toggleTheme() {
        const newTheme = this.theme === 'light' ? 'dark' : 'light';
        this.setTheme(newTheme);
    },

    setTheme(theme) {
        this.theme = theme;
        if (theme === 'dark') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
        this.saveData();
    },

    setRole(role) {
        // Check if user has permission for this role
        if (this.currentUser && this.currentUser.role !== role && this.currentUser.role !== 'admin') {
            this.showToast('Error', this.t('permissionError'), 'error');
            return;
        }
        
        this.role = role;
        document.getElementById('role-selection').classList.add('hidden');

        if (role === 'employee') {
            document.getElementById('employee-dashboard').classList.remove('hidden');
        } else if (role === 'manager') {
            document.getElementById('manager-dashboard').classList.remove('hidden');
        } else if (role === 'admin') {
            document.getElementById('admin-dashboard').classList.remove('hidden');
        }

        // Initialize demo data first, then update dashboard
        if (!this.requests || this.requests.length === 0) {
            this.initializeDemoData();
        } else {
            if (role === 'employee') this.updateEmployeeDashboard();
            else if (role === 'manager') this.updateManagerDashboard();
            else if (role === 'admin') this.updateAdminDashboard();
        }
    },

    getDefaultUsers() {
        return [
            { id: 'EMP001', name: 'Amar Hodžić',  email: 'zaposlenik@danoff.ba', role: 'employee', position: 'Senior Developer' },
            { id: 'MGR001', name: 'Emina Hadžić',  email: 'menadzer@danoff.ba',  role: 'manager',  position: 'Team Lead' },
            { id: 'ADM001', name: 'Admin Sistem',   email: 'admin@danoff.ba',     role: 'admin',    position: 'System Administrator' },
            { id: 'EMP002', name: 'Sara Kovač',     email: 'sara@danoff.ba',      role: 'employee', position: 'UX Designer' },
            { id: 'EMP003', name: 'Ema Hadžić',     email: 'ema@danoff.ba',       role: 'employee', position: 'Project Manager' }
        ];
    },

    updateAdminDashboard() {
        if (!this.users || this.users.length === 0) {
            this.users = this.getDefaultUsers();
            this.saveData();
        }

        const pending  = this.requests?.filter(r => r.status === 'pending')  || [];
        const approved = this.requests?.filter(r => r.status === 'approved') || [];
        const now = new Date();

        document.getElementById('admin-stat-pending').textContent = pending.length;
        document.getElementById('admin-stat-approved').textContent = approved.filter(r => {
            const d = new Date(r.startDate);
            return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
        }).length;
        document.getElementById('admin-entity-display').textContent = this.entities[this.entity].name;

        // Update user count
        const statUsers = document.getElementById('admin-stat-users');
        if (statUsers) statUsers.textContent = this.users.length;

        // Render users table
        const usersList = document.getElementById('admin-users-list');
        if (usersList) {
            const roleLabel  = r => r === 'admin' ? this.t('admin') : r === 'manager' ? this.t('manager') : this.t('employee');
            const roleColor  = r => r === 'admin'
                ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
                : r === 'manager'
                ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300'
                : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300';

            usersList.innerHTML = this.users.map(u => `
                <tr class="border-b border-gray-100 dark:border-gray-800">
                    <td class="py-3 font-medium" data-label="${this.t('nameCol')}">${u.name}</td>
                    <td class="py-3 text-gray-500 text-sm" data-label="Email">${u.email}</td>
                    <td class="py-3" data-label="${this.t('roleCol')}">
                        <span class="px-2 py-1 rounded-full text-xs ${roleColor(u.role)}">${roleLabel(u.role)}</span>
                    </td>
                    <td class="py-3 text-gray-500 text-sm" data-label="${this.t('positionCol')}">${u.position}</td>
                    <td class="py-3" data-label="">
                        <div class="flex gap-3">
                            <button onclick="app.editUser('${u.id}')" class="text-bosnianBlue hover:underline text-sm">${this.t('editBtn')}</button>
                            <button onclick="app.deleteUser('${u.id}')" class="text-red-500 hover:underline text-sm">${this.t('deleteBtn')}</button>
                        </div>
                    </td>
                </tr>
            `).join('');
        }

        // Render all requests for admin
        const adminRequests = document.getElementById('admin-requests-list');
        if (adminRequests) {
            const all = this.requests || [];
            if (all.length === 0) {
                adminRequests.innerHTML = `<tr><td colspan="6" class="py-8 text-center text-gray-400">${this.t('noRequests')}</td></tr>`;
            } else {
                const statusColor = s => s === 'approved' ? 'bg-green-100 text-green-700' : s === 'rejected' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700';
                const statusLabel = s => s === 'approved' ? this.t('approvedStatus') : s === 'rejected' ? this.t('rejectedStatus') : this.t('pending');
                adminRequests.innerHTML = all.map(r => `
                    <tr class="border-b border-gray-100 dark:border-gray-800">
                        <td class="py-3 font-medium text-sm" data-label="${this.t('employee')}">${r.employee}</td>
                        <td class="py-3 text-sm text-gray-500" data-label="${this.t('periodCol')}">${this.formatDate(r.startDate)} – ${this.formatDate(r.endDate)}</td>
                        <td class="py-3 text-sm" data-label="${this.t('daysCol')}">${r.days}</td>
                        <td class="py-3 text-sm text-gray-500" data-label="${this.t('typeCol')}">${r.type === 'annual' ? this.t('annual') : r.type === 'sick' ? this.t('sick') : this.t('other')}</td>
                        <td class="py-3" data-label="Status">
                            <span class="px-2 py-1 rounded-full text-xs ${statusColor(r.status)}">${statusLabel(r.status)}</span>
                        </td>
                        <td class="py-3" data-label="">
                            <div class="flex gap-2 flex-wrap">
                                ${r.status === 'pending' ? `
                                    <button onclick="app.adminHandleRequest(${r.id}, 'approved')" class="text-xs bg-green-500 text-white px-2 py-1 rounded-lg ios-button hover:bg-green-600">${this.t('approveBtn')}</button>
                                    <button onclick="app.adminHandleRequest(${r.id}, 'rejected')" class="text-xs bg-red-500 text-white px-2 py-1 rounded-lg ios-button hover:bg-red-600">${this.t('rejectBtn')}</button>
                                ` : ''}
                                ${r.status === 'approved' ? `
                                    <button onclick="app.viewLegalDocument(${r.id})" class="text-xs bg-bosnianBlue/10 text-bosnianBlue px-2 py-1 rounded-lg ios-button hover:bg-bosnianBlue/20">PDF</button>
                                ` : ''}
                                <button onclick="app.adminDeleteRequest(${r.id})" class="text-xs text-red-400 hover:underline">${this.t('deleteBtn')}</button>
                            </div>
                        </td>
                    </tr>
                `).join('');
            }
        }

        lucide.createIcons();
    },

    showAddUserModal() {
        this.editingUserId = null;
        document.getElementById('user-modal-title').textContent = this.t('addUserTitle');
        document.getElementById('user-name-input').value = '';
        document.getElementById('user-email-input').value = '';
        document.getElementById('user-email-input').readOnly = false;
        document.getElementById('user-role-input').value = 'employee';
        document.getElementById('user-entity-input').value = this.entity || 'fbih';
        document.getElementById('user-position-input').value = '';
        document.getElementById('user-salary-input').value = '';
        document.getElementById('user-phone-input').value = '';
        document.getElementById('user-password-input').value = '';
        document.getElementById('user-password-field').classList.remove('hidden');
        this.hideGlobalControls();
        document.getElementById('user-modal').classList.remove('hidden');
    },

    closeUserModal() {
        document.getElementById('user-modal').classList.add('hidden');
        this.showGlobalControls();
        this.editingUserId = null;
    },

    editUser(id) {
        const user = this.users.find(u => String(u.id) === String(id));
        if (!user) return;
        this.editingUserId = id;
        document.getElementById('user-modal-title').textContent = this.t('editUserTitle');
        document.getElementById('user-name-input').value = user.name;
        document.getElementById('user-email-input').value = user.email;
        document.getElementById('user-email-input').readOnly = true;
        document.getElementById('user-role-input').value = user.role;
        document.getElementById('user-entity-input').value = user.entity || 'fbih';
        document.getElementById('user-position-input').value = user.position;
        document.getElementById('user-salary-input').value = user.salary || '';
        document.getElementById('user-phone-input').value = user.phone || '';
        document.getElementById('user-password-field').classList.add('hidden');
        this.hideGlobalControls();
        document.getElementById('user-modal').classList.remove('hidden');
    },

    async deleteUser(id) {
        if (!confirm(this.t('deleteConfirm'))) return;
        const session = JSON.parse(localStorage.getItem('danoff_session'));
        try {
            const response = await fetch(`/api/users/${id}`, {
                method: 'DELETE',
                headers: { 'x-user-id': session.user.id }
            });
            if (response.ok) {
                await this.loadUsers();
                this.updateAdminDashboard();
                this.showToast(this.t('userDeleted'), this.t('userDeletedMsg'), 'info');
            }
        } catch (err) {
            console.error(err);
            this.showToast('Error', 'Server error', 'error');
        }
    },

    async saveUser() {
        const name     = document.getElementById('user-name-input').value.trim();
        const email    = document.getElementById('user-email-input').value.trim().toLowerCase();
        const role     = document.getElementById('user-role-input').value;
        const entity   = document.getElementById('user-entity-input').value;
        const position = document.getElementById('user-position-input').value.trim();
        const salary   = parseFloat(document.getElementById('user-salary-input').value) || 0;
        const phone    = document.getElementById('user-phone-input').value.trim();
        const password = document.getElementById('user-password-input').value.trim() || 'pass123';

        if (!name || !email || !position) {
            this.showToast('Error', this.lang === 'bs' ? 'Molimo popunite sva polja' : 'Please fill in all fields', 'error');
            return;
        }

        const nameParts = name.split(' ');
        const first_name = nameParts[0];
        const last_name = nameParts.slice(1).join(' ') || '-';
        const session = JSON.parse(localStorage.getItem('danoff_session'));

        try {
            if (this.editingUserId) {
                const response = await fetch(`/api/users/${this.editingUserId}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'x-user-id': session.user.id
                    },
                    body: JSON.stringify({ first_name, last_name, role, entity, position, salary, phone })
                });
                if (response.ok) {
                    this.showToast(this.t('editBtn'), name, 'success');
                    this.closeUserModal();
                    await this.loadUsers();
                    this.updateAdminDashboard();
                } else {
                    const err = await response.json();
                    this.showToast('Error', err.error || 'Failed to update user', 'error');
                }
            } else {
                const response = await fetch('/api/users', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'x-user-id': session.user.id
                    },
                    body: JSON.stringify({
                        first_name,
                        last_name,
                        email,
                        password,
                        role,
                        position,
                        salary,
                        phone,
                        entity
                    })
                });

                if (response.ok) {
                    this.showToast(this.t('userAdded'), `${name} — ${this.t('userAddedPassword')}: ${password}`, 'success');
                    this.closeUserModal();
                    await this.loadUsers();
                    this.updateAdminDashboard();
                } else {
                    const err = await response.json();
                    this.showToast('Greška', err.error || 'Failed to add user', 'error');
                }
            }
        } catch (err) {
            console.error(err);
            this.showToast('Error', 'Server error', 'error');
        }
    },

    adminHandleRequest(id, status) {
        const req = this.requests.find(r => r.id === id);
        if (!req) return;
        req.status = status;
        req.approvedAt = new Date().toISOString();
        req.approvedBy = 'Admin';
        this.saveData();
        this.updateAdminDashboard();
        this.showToast(
            status === 'approved' ? this.t('requestApproved') : this.t('requestRejected'),
            `${req.employee} – ${req.days} ${this.t('days')}`,
            status === 'approved' ? 'success' : 'error'
        );
        if (status === 'approved') setTimeout(() => this.viewLegalDocument(id), 500);
    },

    async adminDeleteRequest(id) {
        if (!confirm(this.t('deleteRequestConfirm'))) return;
        const session = JSON.parse(localStorage.getItem('danoff_session'));
        if (!session) return;
        try {
            const response = await fetch(`/api/requests/${id}`, {
                method: 'DELETE',
                headers: { 'x-user-id': session.user.id }
            });
            if (response.ok) {
                await this.loadRequests();
                this.updateAdminDashboard();
                this.showToast(this.t('requestDeleted'), '', 'info');
            }
        } catch (err) {
            console.error(err);
            this.showToast('Error', 'Server error', 'error');
        }
    },

    resetRole() {
        this.role = null;
        document.getElementById('employee-dashboard').classList.add('hidden');
        document.getElementById('manager-dashboard').classList.add('hidden');
        document.getElementById('admin-dashboard').classList.add('hidden');
        document.getElementById('role-selection').classList.remove('hidden');
    },

    initializeDemoData() {
        this.requests = [];
        this.saveData();
        this.updateDashboard();
    },

    updateDashboard() {
        if (this.role === 'employee') this.updateEmployeeDashboard();
        if (this.role === 'manager') this.updateManagerDashboard();
        if (this.role === 'admin') this.updateAdminDashboard();
    },

    updateEmployeeDashboard() {
        const container = document.getElementById('employee-requests');
        const myName = this.currentUser?.name || 'Amar Hodžić';
        const myRequests = this.requests?.filter(r => r.employee === myName) || [];

        // Count days used across all types
        const approvedDays = myRequests.filter(r => r.status === 'approved').reduce((sum, r) => sum + r.days, 0);
        const pendingDays = myRequests.filter(r => r.status === 'pending').reduce((sum, r) => sum + r.days, 0);
        const annualDays = myRequests.filter(r => r.status === 'approved' && r.type === 'annual').reduce((sum, r) => sum + r.days, 0);
        const sickDays = myRequests.filter(r => r.status === 'approved' && r.type === 'sick').reduce((sum, r) => sum + r.days, 0);
        const otherDays = approvedDays - annualDays - sickDays;

        // Update ring
        const ringCircle = document.getElementById('days-ring');
        const daysNumberEl = document.getElementById('days-used-number');
        if (daysNumberEl) daysNumberEl.textContent = approvedDays;
        if (ringCircle) {
            const circumference = 364.42;
            const fill = Math.min(approvedDays / 365, 1);
            ringCircle.style.strokeDashoffset = circumference * (1 - fill);
        }

        // Update breakdown text (informational only — no limit enforced)
        const parts = [];
        if (annualDays > 0) parts.push(this.lang === 'bs' ? `Godišnji: ${annualDays}` : `Annual: ${annualDays}`);
        if (sickDays > 0) parts.push(this.lang === 'bs' ? `Bolovanje: ${sickDays}` : `Sick: ${sickDays}`);
        if (otherDays > 0) parts.push(this.lang === 'bs' ? `Ostalo: ${otherDays}` : `Other: ${otherDays}`);
        if (pendingDays > 0) parts.push(this.lang === 'bs' ? `Na čekanju: ${pendingDays}` : `Pending: ${pendingDays}`);
        const entitlementEl = document.getElementById('total-entitlement');
        if (entitlementEl) entitlementEl.textContent = parts.length ? parts.join(' | ') : (this.lang === 'bs' ? 'Nema iskorištenih dana' : 'No days used yet');

        // Update request count badge
        const countEl = document.getElementById('request-count');
        if (countEl) countEl.textContent = `(${myRequests.length})`;

        // Render leave calendar
        this.renderLeaveCalendar(myRequests);

        // Render requests
        if (myRequests.length === 0) {
            container.innerHTML = `
                <div class="text-center py-12 text-gray-400">
                    <i data-lucide="inbox" class="w-12 h-12 mx-auto mb-3 opacity-50"></i>
                    <p>${this.t('noRequests')}</p>
                </div>
            `;
        } else {
            container.innerHTML = myRequests.map(req => this.createRequestCard(req)).join('');
        }

        lucide.createIcons();
    },

    createRequestCard(req) {
        const statusColors = {
            pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200',
            approved: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200',
            rejected: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200'
        };
        
        const statusText = {
            pending: this.t('awaitingApproval'),
            approved: this.t('approvedStatus'),
            rejected: this.t('rejectedStatus')
        };

        return `
            <div class="glass rounded-2xl p-4 kanban-card border border-gray-200 dark:border-gray-800" oncontextmenu="app.showHapticMenu(event,${req.id})">
                <div class="flex items-start justify-between mb-2">
                    <div>
                        <span class="inline-block px-3 py-1 rounded-full text-xs font-medium ${statusColors[req.status]} mb-2">
                            ${statusText[req.status]}
                        </span>
                        <h4 class="font-semibold text-lg">${req.days} ${this.t('days')}</h4>
                    </div>
                    <div class="text-right text-sm text-gray-500 dark:text-gray-400">
                        ${req.type === 'annual' ? this.t('annual') : this.t('sick')}
                    </div>
                </div>
                <div class="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300 mb-2">
                    <i data-lucide="calendar" class="w-4 h-4"></i>
                    <span>${this.formatDate(req.startDate)} - ${this.formatDate(req.endDate)}</span>
                </div>
                ${req.notes ? `<p class="text-sm text-gray-500 dark:text-gray-400 mt-2 border-t border-gray-200 dark:border-gray-700 pt-2">${req.notes}</p>` : ''}
                ${req.status === 'pending' ? `
                    <div class="flex gap-3 mt-3 pt-2 border-t border-gray-200 dark:border-gray-700">
                        <button onclick="app.editRequest(${req.id})" class="flex items-center gap-1 text-sm text-bosnianBlue hover:underline">
                            <i data-lucide="pencil" class="w-3 h-3"></i>
                            ${this.lang === 'bs' ? 'Uredi' : 'Edit'}
                        </button>
                        <button onclick="app.cancelRequest(${req.id})" class="flex items-center gap-1 text-sm text-red-500 hover:underline">
                            <i data-lucide="x" class="w-3 h-3"></i>
                            ${this.lang === 'bs' ? 'Otkaži zahtjev' : 'Cancel request'}
                        </button>
                    </div>
                ` : ''}
            </div>
        `;
    },

    updateManagerDashboard() {
        const pending = this.requests?.filter(r => r.status === 'pending') || [];
        const approved = this.requests?.filter(r => r.status === 'approved') || [];
        const rejected = this.requests?.filter(r => r.status === 'rejected') || [];
        
        document.getElementById('stat-pending').textContent = pending.length;
        document.getElementById('stat-approved').textContent = approved.filter(r => {
            const date = new Date(r.startDate);
            const now = new Date();
            return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
        }).length;

        const totalCost = approved.reduce((sum, r) => {
            const emp = (this.users || []).find(u => u.name === r.employee);
            const dailyRate = emp?.salary ? emp.salary / 22 : 0;
            return sum + dailyRate * r.days;
        }, 0);
        const statCostEl = document.getElementById('stat-cost');
        if (statCostEl) statCostEl.textContent = `${Math.round(totalCost).toLocaleString()} KM`;
        
        document.getElementById('count-pending').textContent = pending.length;
        document.getElementById('count-approved').textContent = approved.length;
        document.getElementById('count-rejected').textContent = rejected.length;
        
        document.getElementById('kanban-pending').innerHTML = pending.map(req => this.createManagerCard(req)).join('') ||
            `<div class="text-center py-8 text-gray-400 text-sm">${this.t('noRequests')}</div>`;
        document.getElementById('kanban-approved').innerHTML = approved.map(req => this.createManagerCard(req)).join('') ||
            `<div class="text-center py-8 text-gray-400 text-sm">${this.t('noRequests')}</div>`;
        document.getElementById('kanban-rejected').innerHTML = rejected.map(req => this.createManagerCard(req)).join('') ||
            `<div class="text-center py-8 text-gray-400 text-sm">${this.t('noRequests')}</div>`;

        this.calculateTeamHealth();
        lucide.createIcons();
    },

    createManagerCard(req) {
        return `
            <div class="glass rounded-xl p-4 kanban-card border border-gray-200 dark:border-gray-800 bg-white/50 dark:bg-gray-800/50">
                <div class="flex items-start justify-between mb-3">
                    <div>
                        <h4 class="font-semibold">${req.employee}</h4>
                        <p class="text-sm text-gray-500 dark:text-gray-400">${req.position}</p>
                    </div>
                    <span class="text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 px-2 py-1 rounded">
                        ${req.days} ${this.t('days')}
                    </span>
                </div>
                <div class="text-sm text-gray-600 dark:text-gray-300 mb-3">
                    <div class="flex items-center gap-2 mb-1">
                        <i data-lucide="calendar" class="w-4 h-4"></i>
                        <span>${this.formatDate(req.startDate)} - ${this.formatDate(req.endDate)}</span>
                    </div>
                </div>
                ${req.status === 'pending' ? `
                    <div class="flex gap-2 mt-3">
                        <button onclick="app.handleRequest(${req.id}, 'approved')" class="flex-1 bg-green-500 text-white py-2 rounded-lg text-sm font-medium ios-button hover:bg-green-600">
                            ${this.t('approved')}
                        </button>
                        <button onclick="app.handleRequest(${req.id}, 'rejected')" class="flex-1 bg-red-500 text-white py-2 rounded-lg text-sm font-medium ios-button hover:bg-red-600">
                            ${this.t('rejected')}
                        </button>
                    </div>
                ` : ''}
                ${req.status === 'approved' ? `
                    <button onclick="app.viewLegalDocument(${req.id})" class="w-full mt-3 bg-bosnianBlue/10 text-bosnianBlue py-2 rounded-lg text-sm font-medium ios-button hover:bg-bosnianBlue/20 flex items-center justify-center gap-2">
                        <i data-lucide="file-text" class="w-4 h-4"></i>
                        ${this.t('legalDocument')}
                    </button>
                ` : ''}
            </div>
        `;
    },

    hideGlobalControls() {
        document.getElementById('global-controls')?.classList.add('hidden');
    },

    showGlobalControls() {
        document.getElementById('global-controls')?.classList.remove('hidden');
    },

    openRequestSheet() {
        this.hideGlobalControls();
        const sheet = document.getElementById('request-sheet');
        sheet.classList.remove('hidden');
        setTimeout(() => {
            sheet.querySelector('.sheet-modal').classList.remove('translate-y-full');
        }, 10);

        // Initialize Flatpickr with DD/MM/YYYY display format
        const fpConfig = {
            dateFormat: 'Y-m-d',       // internal value stays YYYY-MM-DD
            altInput: true,
            altFormat: 'd/m/Y',        // displayed as DD/MM/YYYY
            allowInput: false,
            onChange: () => this.calculateDays()
        };

        if (this._fpStart) this._fpStart.destroy();
        if (this._fpEnd) this._fpEnd.destroy();
        this._fpStart = flatpickr('#start-date', fpConfig);
        this._fpEnd   = flatpickr('#end-date',   fpConfig);

        // Set default dates
        const today = new Date();
        const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
        this._fpStart.setDate(today, true);
        this._fpEnd.setDate(nextWeek, true);
        this.calculateDays();
    },

    closeRequestSheet() {
        this.showGlobalControls();
        const sheet = document.getElementById('request-sheet');
        const modal = sheet.querySelector('.sheet-modal');
        modal.classList.add('translate-y-full');
        setTimeout(() => {
            sheet.classList.add('hidden');
        }, 300);
        this.editingRequestId = null;
    },

    calculateDays() {
        const start = new Date(document.getElementById('start-date').value);
        const end = new Date(document.getElementById('end-date').value);
        
        if (start && end && end >= start) {
            let workingDays = 0;
            let current = new Date(start);
            let hasHoliday = false;
            
            while (current <= end) {
                const day = current.getDay();
                const dateStr = current.toISOString().split('T')[0];
                
                if (day !== 0 && day !== 6 && !this.bosnianHolidays.includes(dateStr)) {
                    workingDays++;
                }
                if (this.bosnianHolidays.includes(dateStr)) {
                    hasHoliday = true;
                }
                current.setDate(current.getDate() + 1);
            }
            
            document.getElementById('calculated-days').textContent = workingDays;
            document.getElementById('holiday-warning').classList.toggle('hidden', !hasHoliday);
        } else {
            document.getElementById('calculated-days').textContent = '0';
        }
    },

    async submitRequest() {
        const startDate = document.getElementById('start-date').value;
        const endDate = document.getElementById('end-date').value;
        const days = parseInt(document.getElementById('calculated-days').textContent);
        const type = document.querySelector('input[name="leave-type"]:checked').value;
        const notes = document.getElementById('request-notes').value;

        if (!startDate || !endDate || days === 0) {
            this.showToast('Error', this.lang === 'bs' ? 'Odaberite ispravne datume' : 'Please select valid dates', 'error');
            return;
        }

        const session = JSON.parse(localStorage.getItem('danoff_session'));
        if (!session) return;

        try {
            let response;
            if (this.editingRequestId) {
                response = await fetch(`/api/requests/${this.editingRequestId}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json', 'x-user-id': session.user.id },
                    body: JSON.stringify({ leave_type: type, start_date: startDate, end_date: endDate, days, notes })
                });
            } else {
                response = await fetch('/api/requests', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'x-user-id': session.user.id },
                    body: JSON.stringify({ employee_id: session.user.id, leave_type: type, start_date: startDate, end_date: endDate, days, notes })
                });
            }

            if (response.ok) {
                this.editingRequestId = null;
                this.showToast(this.t('requestSubmitted'), `${days} ${this.t('days')}`, 'success');
                await this.loadRequests();
                this.updateEmployeeDashboard();
                this.closeRequestSheet();
                document.getElementById('request-notes').value = '';
            } else {
                this.showToast('Error', 'Failed to submit request', 'error');
            }
        } catch (err) {
            console.error(err);
            this.showToast('Error', 'Server error', 'error');
        }
    },

    async cancelRequest(id) {
        const session = JSON.parse(localStorage.getItem('danoff_session'));
        if (!session) return;
        try {
            const response = await fetch(`/api/requests/${id}`, {
                method: 'DELETE',
                headers: { 'x-user-id': session.user.id }
            });
            if (response.ok) {
                await this.loadRequests();
                this.updateEmployeeDashboard();
                this.showToast(
                    this.lang === 'bs' ? 'Zahtjev otkazan' : 'Request cancelled',
                    this.lang === 'bs' ? 'Zahtjev za odmor je uklonjen' : 'Leave request has been removed',
                    'info'
                );
            }
        } catch (err) {
            console.error(err);
            this.showToast('Error', 'Server error', 'error');
        }
    },

    editRequest(id) {
        const req = this.requests.find(r => r.id === id);
        if (!req || req.status !== 'pending') return;

        this.editingRequestId = id;
        this.openRequestSheet();

        setTimeout(() => {
            if (this._fpStart) this._fpStart.setDate(req.startDate, true);
            if (this._fpEnd) this._fpEnd.setDate(req.endDate, true);
            document.getElementById('request-notes').value = req.notes || '';
            const typeRadio = document.querySelector(`input[name="leave-type"][value="${req.type}"]`);
            if (typeRadio) typeRadio.checked = true;
            this.calculateDays();
        }, 100);
    },

    async handleRequest(id, status) {
        const session = JSON.parse(localStorage.getItem('danoff_session'));
        if (!session) return;

        try {
            const response = await fetch(`/api/requests/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'x-user-id': session.user.id
                },
                body: JSON.stringify({
                    status: status,
                    approved_by: session.user.id
                })
            });

            if (response.ok) {
                await this.loadRequests();
                this.updateManagerDashboard();
                this.showToast(
                    status === 'approved' ? this.t('requestApproved') : this.t('requestRejected'),
                    status === 'approved' ? 'success' : 'error'
                );

                if (status === 'approved') {
                    setTimeout(() => this.viewLegalDocument(id), 500);
                }
            } else {
                this.showToast('Error', 'Failed to update request', 'error');
            }
        } catch (err) {
            console.error(err);
            this.showToast('Error', 'Server error', 'error');
        }
    },

    viewLegalDocument(requestId) {
        const req = this.requests.find(r => r.id === requestId);
        if (!req) return;

        const empUser = (this.users || []).find(u => u.name === req.employee);
        const entity = empUser?.entity || this.entity || 'fbih';

        const modal = document.getElementById('pdf-modal');
        const content = document.getElementById('pdf-content');

        content.innerHTML = this.buildDocumentHTML(req, entity);
        this.currentPdfData = req;
        this.currentPdfEntity = entity;

        this.hideGlobalControls();
        modal.classList.remove('hidden');
    },

    buildDocumentHTML(req, entity) {
        const wrap = (inner) => `<div class="bg-white text-black p-6 sm:p-10 font-serif text-sm leading-relaxed" style="color:#000;background:#fff;">${inner}</div>`;
        const line = (w = '100%') => `<div style="border-bottom:1px solid #000;width:${w};display:inline-block;min-width:60px;">&nbsp;</div>`;
        const today = new Date().toLocaleDateString('bs-BA');
        const year = new Date().getFullYear();
        const docNum = `${entity.toUpperCase()}-${year}-${String(req.id).padStart(3,'0')}`;
        const sd = this.formatDate(req.startDate);
        const ed = this.formatDate(req.endDate);

        if (entity === 'fbih') {
            if (req.type === 'annual') {
                return wrap(`
                    <p class="text-center font-bold text-xs mb-0">PRIMJER</p>
                    <h1 class="text-center font-bold text-sm mb-4">RJEŠENJE O KORIŠTENJU GODIŠNJEG ODMORA</h1>
                    <p class="italic text-xs mb-0">(naziv i sjedište poslodavca)</p>
                    <p class="mb-0">Broj: ${docNum}</p>
                    <p class="mb-5">U __________ dana ${today}</p>
                    <p class="mb-6 text-justify">Na osnovu člana 52. stav (2) Zakona o radu („Službene novine Federacije BiH", broj: 26/16 i 89/18), člana ___ Pravilnika o radu, člana ___ Ugovora o radu, i Plana korištenja godišnjih odmora za ${year}. godinu, donosim:</p>
                    <h2 class="text-center font-bold mb-5">Rješenje</h2>
                    <p class="mb-0"><strong>1.</strong> ${line('240px')} <strong>${req.employee}</strong> ${line('240px')}, radniku na</p>
                    <p class="text-center italic text-xs mb-0">(ime i prezime)</p>
                    <p class="mb-0">radnom mjestu ${line('180px')} <strong>${req.position || ''}</strong> ${line('60px')} (u daljnem tekstu: radnik)</p>
                    <p class="text-center italic text-xs mb-4">(navesti radno mjesto)</p>
                    <p class="mb-1 text-justify">utvrđuje se pravo na godišnji odmor za ${year}. godinu, u trajanju od ukupno <strong>${req.days}</strong> radnih dana, prema sljedećim osnovama i kriterijima:</p>
                    <p class="mb-0">- zakonski osnov 20 radnih dana <em>(za maloljetnog radnika 24 radna dana)</em></p>
                    <p class="mb-4">- navesti druge osnove za povećanje broja dana.</p>
                    <p class="mb-1"><strong>2.</strong> Radnik će koristiti godišnji odmor od <strong>${sd}</strong> do <strong>${ed}</strong>.</p>
                    <p class="mb-1 text-justify"><strong>3.</strong> Jedan dan godišnjeg odmora radnik može koristiti kad on to želi, uz obavezu da o tome obavijesti poslodavca najmanje tri dana prije njegovog korištenja.</p>
                    <p class="mb-7 text-justify"><strong>4.</strong> Za vrijeme korištenja godišnjeg odmora radnik ima pravo na naknadu plaće u skladu sa članom 52. stav (3) Zakona o radu.</p>
                    <h2 class="text-center font-bold mb-3">Obrazloženje</h2>
                    <p class="mb-2 text-justify">Obrazložiti po kojem osnovu radniku pripadaju dani godišnjeg odmora preko zakonskog minimuma i čime dokazuje da mu pripada pravo po tom osnovu.</p>
                    <p class="mb-7 text-justify">Raspored korištenja godišnjeg odmora utvrđen je u skladu sa Planom korištenja godišnjih odmora iz člana 52. stav (1) Zakona o radu, koji je donesen uz prethodnu konsultaciju sa radnicima ili njihovim predstavnicima u skladu sa zakonom, uzimajući u obzir potrebe posla, kao i opravdane razloge radnika.</p>
                    <p class="mb-8 text-justify"><strong>Pouka o pravnom lijeku:</strong> Protiv ovog rješenja može se uložiti pismeni prigovor poslodavcu, u roku 30 dana od dana dostavljanja ovog rješenja.</p>
                    <div class="flex justify-end mt-8">
                        <div class="text-center">
                            <p class="font-bold mb-6">POSLODAVAC</p>
                            <div style="border-bottom:1px solid #000;width:180px;" class="mb-1"></div>
                            <p class="italic text-xs">(potpis i pečat)</p>
                        </div>
                    </div>`);
            }
            if (req.type === 'sick') {
                return wrap(`
                    <p class="text-center font-bold text-xs mb-0">PRIMJER</p>
                    <h1 class="text-center font-bold text-sm mb-4">RJEŠENJE O PLAĆENOM ODSUSTVU</h1>
                    <p class="mb-0">Broj: ${docNum}</p>
                    <p class="mb-5">U __________ dana ${today}</p>
                    <p class="mb-6 text-justify">Na osnovu člana 53. stav (1) i člana 81. stav (1) Zakona o radu („Službene novine Federacije BiH", broj: 26/16 i 89/18) člana ___ Pravilnika o radu, člana ___ Ugovora o radu donosim:</p>
                    <h2 class="text-center font-bold mb-5">Rješenje</h2>
                    <p class="mb-0">1. Radniku ${line('240px')} <strong>${req.employee}</strong> ${line('60px')},</p>
                    <p class="text-center italic text-xs mb-0">(ime i prezime)</p>
                    <p class="mb-0">na radnom mjestu ${line('120px')} <strong>${req.position || ''}</strong> ${line('40px')} utvrđuje se pravo na odsustvo sa rada uz naknadu plaće (plaćeno odsustvo) u trajanju od <strong>${req.days}</strong> radnih dana radi</p>
                    <p class="mb-0">${line('300px')} ${req.notes ? `<strong>${req.notes}</strong>` : ''} ${line('60px')}.</p>
                    <p class="text-center italic text-xs mb-4">(navesti razloge za korištenje ovog odsustva)</p>
                    <p class="mb-1">2. Radnik će plaćeno odsustvo koristiti od <strong>${sd}</strong> do <strong>${ed}</strong>.</p>
                    <p class="mb-1 text-justify">3. Za vrijeme korištenja plaćenog odsustva imenovani-a ima pravo na naknadu plaće u visini ${line('180px')}.</p>
                    <p class="text-center italic text-xs mb-7">(navesti visinu naknade plaće)</p>
                    <h2 class="text-center font-bold mb-3">Obrazloženje</h2>
                    <p class="mb-1 text-justify">Radnik je podnio zahtjev da mu se odobri plaćeno odsustvo za slučaj ${line('180px')}.</p>
                    <p class="mb-1 text-justify">Uz zahtjev je priložio sljedeće dokaze ${line('180px')}</p>
                    <p class="mb-7 text-justify">S obzirom na to da su ispunjeni uvjeti utvrđeni Zakonom, Pravilnikom o radu i Ugovorom o radu, riješeno je kao u dispozitivu.</p>
                    <p class="mb-8 text-justify"><strong>Pouka o pravnom lijeku:</strong> Protiv ovog rješenja može se uložiti prigovor pismenim putem poslodavcu, u roku od 30 dana od dana dostavljanja ovog rješenja.</p>
                    <div class="flex justify-end mt-8">
                        <div class="text-center">
                            <p class="font-bold mb-6">POSLODAVAC</p>
                            <div style="border-bottom:1px solid #000;width:180px;" class="mb-1"></div>
                            <p class="italic text-xs">(potpis i pečat)</p>
                        </div>
                    </div>`);
            }
            // other → neplaćeno
            return wrap(`
                    <p class="text-center font-bold text-xs mb-0">PRIMJER</p>
                    <h1 class="text-center font-bold text-sm mb-4">RJEŠENJE O NEPLAĆENOM ODSUSTVU</h1>
                    <p class="italic text-xs mb-0">(naziv i sjedište poslodavca)</p>
                    <p class="mb-0">Broj: ${docNum}</p>
                    <p class="mb-5">U __________ dana ${today}</p>
                    <p class="mb-6 text-justify">Na osnovu člana 54. stav (1) Zakona o radu („Službene novine Federacije BiH", broj: 26/16 i 89/18), člana ___ Pravilnika o radu i pismenog zahtjeva radnika, donosim:</p>
                    <h2 class="text-center font-bold mb-5">RJEŠENJE</h2>
                    <p class="mb-0"><strong>1.</strong> Radniku ${line('240px')} <strong>${req.employee}</strong> ${line('60px')},</p>
                    <p class="text-center italic text-xs mb-0">(ime i prezime)</p>
                    <p class="mb-0">u radnom odnosu kod poslodavca ${line('200px')}</p>
                    <p class="mb-0 text-justify">utvrđuje se pravo na odsustvo sa rada bez naknade plaće (neplaćeno odsustvo) u trajanju od <strong>${req.days}</strong> dana radi ${line('180px')} ${req.notes ? `<strong>${req.notes}</strong>` : ''} ${line('40px')}.</p>
                    <p class="text-center italic text-xs mb-4">(navesti razloge za korištenje ovog odsustva)</p>
                    <p class="mb-1"><strong>2.</strong> Radnik će neplaćeno odsustvo koristiti od <strong>${sd}</strong> do <strong>${ed}</strong>.</p>
                    <p class="mb-7 text-justify"><strong>3.</strong> Za vrijeme korištenja neplaćenog odsustva prava i obaveze zaposlenika, koji se stiču na radu i po osnovu rada, miruju.</p>
                    <h2 class="text-center font-bold mb-3">Obrazloženje</h2>
                    <p class="mb-1">Obrazložiti:</p>
                    <p class="mb-1 text-justify">da je radnik podnio zahtjev da mu se odobri plaćeno odsustvo za slučaj ${line('180px')}, koji je predviđen u članu ${line('120px')} (navesti propis) u trajanju ${line('80px')}.</p>
                    <p class="mb-7">- da su ispunjeni uvjeti utvrđeni Zakonom i Pravilnikom o radu, riješeno je kao u dispozitivu.</p>
                    <p class="mb-8"><strong>Pouka o pravnom lijeku:</strong> Protiv ovog rješenja može se uložiti prigovor poslodavcu, u roku od 30 dana.</p>
                    <div class="flex justify-end mt-8">
                        <div class="text-center">
                            <p class="font-bold mb-6">POSLODAVAC</p>
                            <div style="border-bottom:1px solid #000;width:180px;" class="mb-1"></div>
                            <p class="italic text-xs">(potpis i pečat)</p>
                        </div>
                    </div>`);
        }

        if (entity === 'rs') {
            const legalBase = (clan) => `Na osnovu člana 192, a u vezi sa ${clan} Zakona o radu ("Službeni glasnik RS", br. 24/2005, 61/2005, 54/2009, 32/2013 i 75/2014, dalje: Zakon), a u skladu sa članom ___. <em>${line('120px')} (naziv opšteg akta ili ugovora o radu)</em> <em>${line('160px')} (naziv i sedište poslodavca)</em>, <em>${line('160px')} (nadležni organ/lice utvrđeno zakonom ili opštim aktom/ovlašćeno lice)</em> dana ______ 20__ godine, donosi`;
            const rsFooter = `
                    <p class="mb-1">U ${line('180px')}</p>
                    <p class="mb-8">Dana __________ 20___. godine</p>
                    <div class="flex justify-end mb-6">
                        <div class="text-center">
                            <div style="border-bottom:1px solid #000;width:220px;" class="mb-1"></div>
                            <p class="italic text-xs">(nadležni organ poslodavca/ lice<br>utvrđeno Zakonom ili opštim aktom poslodavca)</p>
                        </div>
                    </div>
                    <p class="mb-0">Dostavljeno:</p>
                    <p class="mb-0">- Zaposlenom</p>
                    <p class="mb-0">- Službi za obračun zarada</p>
                    <p class="mb-0">- Arhivi</p>`;

            if (req.type === 'annual') {
                return wrap(`
                    <p class="mb-5 text-justify text-xs italic">${legalBase('čl. 68. do 75.')}</p>
                    <h2 class="text-center font-bold mb-5">Rešenje o korišćenju godišnjeg odmora</h2>
                    <p class="mb-0 pl-8">1. Zaposlenom ${line('220px')} <strong>${req.employee}</strong> ${line('60px')} <em>(dalje: Zaposleni)</em></p>
                    <p class="text-center italic text-xs mb-0">(ime i prezime)</p>
                    <p class="mb-4 pl-8">na poslovima ${line('120px')} <strong>${req.position || ''}</strong> ${line('40px')} odobrava se godišnji odmor za ${year}. godinu u trajanju od <strong>${req.days}</strong> radnih dana.</p>
                    <p class="mb-3 pl-8">2. Godišnji odmor koristiće u celini u periodu od <strong>${sd}</strong> do <strong>${ed}</strong> godine.</p>
                    <p class="mb-3 pl-8">3. Zaposleni je dužan da se javi na rad dana ${line('80px')}, ${line('80px')} godine.</p>
                    <p class="mb-3 pl-8 italic text-xs">Alternativa:</p>
                    <p class="mb-3 pl-8 italic text-xs">Prvi deo godišnjeg odmora zaposleni će koristiti u trajanju od ___ radnih dana¹ u periodu od ___ do ____ godine, a drugi deo u trajanju od __ radnih dana će koristiti najkasnije do 30. juna naredne godine.</p>
                    <p class="mb-7 pl-8 text-justify">3. Za vreme korišćenja godišnjeg odmora zaposlenom pripada naknada zarade u skladu sa Zakonom i opštim aktom.</p>
                    <h2 class="text-center font-bold mb-3">Obrazloženje</h2>
                    <p class="mb-2 pl-8 text-justify">Zaposleni u skladu sa Zakonom i kriterijumima utvrđenim ${line('180px')} <em>(naziv opšteg akta/ugovora o radu)</em> ima pravo na godišnji odmor u trajanju od <strong>${req.days}</strong> radnih dana.</p>
                    <p class="mb-7 pl-8 text-justify">Vreme korišćenja godišnjeg odmora određeno je kao u dispozitivu ovog rešenja u skladu sa potrebama posla i uz konsultaciju sa zaposlenim.</p>
                    <p class="mb-7 text-justify"><strong>Pouka o pravnom leku:</strong> Protiv ovog rešenja zaposleni može da pokrene spor pred nadležnim sudom u roku od 60 dana od dana dostavljanja rešenja.</p>
                    ${rsFooter}
                    <div class="mt-10 border-t border-black pt-2 text-xs">
                        <p>¹ Član 73. Zakona o radu: „Ako zaposleni koristi godišnji odmor u delovima, prvi deo koristi u trajanju od najmanje dve radne nedelje neprekidno u toku kalendarske godine, a ostatak najkasnije do 30. juna naredne godine."</p>
                    </div>`);
            }
            if (req.type === 'sick') {
                return wrap(`
                    <p class="mb-5 text-justify text-xs italic">${legalBase('članom 77.')}</p>
                    <h2 class="text-center font-bold mb-5">Rešenje o plaćenom odsustvu¹</h2>
                    <p class="mb-0 pl-8">1. Zaposlenom ${line('200px')} <strong>${req.employee}</strong> ${line('60px')}, na poslovima ${line('120px')} <strong>${req.position || ''}</strong> ${line('40px')}</p>
                    <p class="text-center italic text-xs mb-0">(ime i prezime zaposlenog) &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; (naziv poslova)</p>
                    <p class="mb-4 pl-8 text-justify">odobrava se korišćenje plaćenog odsustva u trajanju od <strong>${req.days}</strong> radnih dana, zbog ${line('120px')} ${req.notes ? `<strong>${req.notes}</strong>` : ''} ${line('40px')}.</p>
                    <p class="mb-3 pl-8">2. Zaposleni će koristiti plaćeno odsustvo u periodu od <strong>${sd}</strong> do <strong>${ed}</strong> 20__ godine.</p>
                    <p class="mb-3 pl-8">3. Zaposleni je dužan da se vrati na rad dana ${line('100px')} 20___ godine.</p>
                    <p class="mb-7 pl-8 text-justify">4. Za vreme plaćenog odsustva zaposlenom pripada naknada zarade u skladu sa Zakonom i opštim aktom.</p>
                    <h2 class="text-center font-bold mb-3">Obrazloženje</h2>
                    <p class="mb-2 pl-8 text-justify">Zaposleni je dana ______ godine podneo zahtev da mu se odobri plaćeno odsustvo zbog ${line('120px')} ${req.notes ? `<strong>${req.notes}</strong>` : ''} ${line('40px')}.</p>
                    <p class="mb-2 pl-8 text-justify">Zaposleni u skladu sa Zakonom i kriterijumima utvrđenim ${line('180px')} <em>(naziv opšteg akta/ugovora o radu)</em> ima pravo na plaćeno odsustvo po ovom osnovu u trajanju od <strong>${req.days}</strong> radnih dana, pa je odlučeno kao u dispozitivu rešenja.</p>
                    <p class="mb-7 text-justify"><strong>Pouka o pravnom leku:</strong> Protiv ovog rešenja zaposleni može da pokrene spor pred nadležnim sudom u roku od 60 dana od dana dostavljanja rešenja.</p>
                    ${rsFooter}
                    <div class="mt-10 border-t border-black pt-2 text-xs">
                        <p>¹ Član 77. st. 1. i 2. Zakona o radu: "Zaposleni ima pravo na odsustvo sa rada uz naknadu zarade (plaćeno odsustvo) u ukupnom trajanju do pet radnih dana u toku kalendarske godine, u slučaju sklapanja braka, porođaja supruge, teže bolesti člana uže porodice i u drugim slučajevima utvrđenim opštim aktom i ugovorom o radu. Vreme trajanja plaćenog odsustva iz stava 1. ovog člana utvrđuje se opštim aktom i ugovorom o radu."</p>
                    </div>`);
            }
            // other → neplaćeno
            return wrap(`
                    <p class="mb-5 text-justify text-xs italic">${legalBase('članom 78.')}</p>
                    <h2 class="text-center font-bold mb-5">Rešenje o neplaćenom odsustvu</h2>
                    <p class="mb-0 pl-8">1. Zaposlenom ${line('200px')} <strong>${req.employee}</strong> ${line('60px')}, na poslovima ${line('120px')} <strong>${req.position || ''}</strong> ${line('40px')}</p>
                    <p class="text-center italic text-xs mb-1">(ime i prezime zaposlenog) &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; (naziv poslova)</p>
                    <p class="mb-4 pl-8 text-justify">odobrava se korišćenje neplaćenog odsustva u trajanju od _____ do _____ 20__ godine, zbog ${line('120px')} ${req.notes ? `<strong>${req.notes}</strong>` : ''} ${line('40px')}.</p>
                    <p class="mb-3 pl-8">2. Zaposleni će koristiti neplaćeno odsustvo u periodu od <strong>${sd}</strong> do <strong>${ed}</strong> 20__ godine.</p>
                    <p class="mb-3 pl-8">3. Zaposleni je dužan da se vrati na rad dana ${line('100px')} 20___ godine.</p>
                    <p class="mb-3 pl-8 text-justify">4. Za vreme neplaćenog odsustva zaposlenom miruju prava i obaveze iz radnog odnosa osim ${line('200px')}.</p>
                    <p class="text-center italic text-xs mb-7">(navesti prava i obaveze koje ne miruju prema opštem aktu)</p>
                    <h2 class="text-center font-bold mb-3">Obrazloženje</h2>
                    <p class="mb-2 pl-8 text-justify">Zaposleni je dana _______ 20__ godine podneo zahtev da mu se odobri neplaćeno odsustvo u periodu od <strong>${sd}</strong> do <strong>${ed}</strong> 20__ godine, zbog ${line('120px')} ${req.notes ? `<strong>${req.notes}</strong>` : ''} ${line('40px')}.</p>
                    <p class="mb-7 pl-8 text-justify">Pošto ne postoje razlozi da se zaposlenom ne odobri traženo neplaćeno odsustvo odlučeno je kao u dispozitivu.</p>
                    <p class="mb-7 text-justify"><strong>Pouka o pravnom leku:</strong> Protiv ovog rešenja zaposleni može u roku od 60 dana od dana dostavljanja da pokrene spor pred nadležnim sudom.</p>
                    ${rsFooter}`);
        }

        // Brčko — table-based ZAHTJEV
        const brckoTableRow = (label, value = '') => `
            <tr>
                <td style="border:1px solid #000;padding:10px 8px;width:55%;font-size:0.8rem;">${label}</td>
                <td style="border:1px solid #000;padding:10px 8px;width:45%;font-size:0.8rem;">${value}</td>
            </tr>`;
        const brckoHRSection = (label1, label2) => `
            <tr>
                <td colspan="2" style="border:1px solid #000;padding:8px;text-align:center;font-weight:bold;font-size:0.8rem;">POPUNjAVA PODODJELjENjE ZA OSOBLjE I PLATE</td>
            </tr>
            ${brckoTableRow(label1)}
            ${brckoTableRow(label2)}`;

        const empPhone = (this.users || []).find(u => u.name === req.employee)?.phone || '';

        if (req.type === 'annual') {
            return wrap(`
                    <h1 class="text-center font-bold text-sm mb-6">ZAHTJEV ZA GODIŠNjI ODMOR</h1>
                    <table style="width:100%;border-collapse:collapse;">
                        <tbody>
                            ${brckoTableRow('Organ javne uprave/Institucija')}
                            ${brckoTableRow('Ime i prezime zaposlenika', `<strong>${req.employee}</strong>`)}
                            ${brckoTableRow('Pozicija zaposlenika', `<strong>${req.position || ''}</strong>`)}
                            ${brckoTableRow('Datum podnošenja zahtjeva', today)}
                            ${brckoTableRow('Broj dana koje bi uzeo za godišnji odmor', `<strong>${req.days}</strong>`)}
                            ${brckoTableRow('Prvi dan godišnjeg odmora', `<strong>${sd}</strong>`)}
                            ${brckoTableRow('Zadnji dan godišnjeg odmora', `<strong>${ed}</strong>`)}
                            ${brckoTableRow('Kontakt adresa zaposlenika')}
                            ${brckoTableRow('Kontakt telefon', empPhone)}
                            ${brckoTableRow('Potpis zaposlenika')}
                            ${brckoTableRow('Potpis rukovodioca')}
                            ${brckoHRSection('Obračun za vrijeme godišnjeg odmora', 'Potpis odgovorne osobe')}
                        </tbody>
                    </table>`);
        }
        if (req.type === 'sick') {
            return wrap(`
                    <h1 class="text-center font-bold text-sm mb-6">ZAHTJEV ZA PLAĆENO ODSUSTVO</h1>
                    <table style="width:100%;border-collapse:collapse;">
                        <tbody>
                            ${brckoTableRow('Organ javne uprave/Institucija')}
                            ${brckoTableRow('Ime i prezime zaposlenika', `<strong>${req.employee}</strong>`)}
                            ${brckoTableRow('Pozicija zaposlenika', `<strong>${req.position || ''}</strong>`)}
                            ${brckoTableRow('Datum podnošenja zahtjeva', today)}
                            ${brckoTableRow('Broj dana koje bi uzeo za plaćeno odsustvo', `<strong>${req.days}</strong>`)}
                            ${brckoTableRow('Prvi dan plaćenog odsustva', `<strong>${sd}</strong>`)}
                            ${brckoTableRow('Zadnji dan plaćenog odsustva', `<strong>${ed}</strong>`)}
                            ${brckoTableRow('Kontakt adresa zaposlenika')}
                            ${brckoTableRow('Kontakt telefon', empPhone)}
                            ${brckoTableRow('Potpis zaposlenika')}
                            ${brckoTableRow('Potpis rukovodioca')}
                            ${brckoHRSection('Obračun za vrijeme plaćenog odsustva', 'Potpis odgovorne osobe')}
                        </tbody>
                    </table>`);
        }
        // other → neplaćeno
        return wrap(`
                    <h1 class="text-center font-bold text-sm mb-6">ZAHTJEV ZA NEPLAĆENO ODSUSTVO</h1>
                    <table style="width:100%;border-collapse:collapse;">
                        <tbody>
                            ${brckoTableRow('Organ javne uprave/Institucija')}
                            ${brckoTableRow('Ime i prezime zaposlenika', `<strong>${req.employee}</strong>`)}
                            ${brckoTableRow('Pozicija zaposlenika', `<strong>${req.position || ''}</strong>`)}
                            ${brckoTableRow('Datum podnošenja zahtjeva', today)}
                            ${brckoTableRow('Dužina neplaćenog odsustva', `<strong>${req.days} dana</strong>`)}
                            ${brckoTableRow('Razlog za uzimanje neplaćenog odsustva', req.notes || '')}
                            ${brckoTableRow('Prvi dan neplaćenog odsustva', `<strong>${sd}</strong>`)}
                            ${brckoTableRow('Zadnji dan neplaćenog odsustva', `<strong>${ed}</strong>`)}
                            ${brckoTableRow('Kontakt adresa zaposlenika')}
                            ${brckoTableRow('Kontakt telefon', empPhone)}
                            ${brckoTableRow('Potpis zaposlenika')}
                            ${brckoTableRow('Potpis rukovodioca')}
                            ${brckoHRSection('Vrijeme mirovanja prava i obaveza zaposlenika za vrijeme neplaćenog odsustva', 'Potpis odgovorne osobe')}
                        </tbody>
                    </table>
                    <div class="mt-4 text-sm">
                        <p class="font-bold">Uz zahtjev obavezno priložiti:</p>
                        <ul class="list-disc ml-6 mt-1">
                            <li>Obrazloženje o razlozima podnošenja zahtjeva;</li>
                            <li>Akt koji dokazuje postojanje slučaja u kojem se može odobriti neplaćeno odsustvo.</li>
                        </ul>
                    </div>`);
    },

    closePdfModal() {
        document.getElementById('pdf-modal').classList.add('hidden');
        this.showGlobalControls();
    },

    downloadPDF() {
        const { jsPDF } = window.jspdf;
        const req = this.currentPdfData;
        const entity = this.currentPdfEntity || this.entity || 'fbih';
        const year = new Date().getFullYear();
        const today = new Date().toLocaleDateString('bs-BA');
        const docNumber = `${entity.toUpperCase()}-${year}-${String(req.id).padStart(3,'0')}`;
        const empPhone = (this.users || []).find(u => u.name === req.employee)?.phone || '';

        if (entity === 'brcko') {
            this.downloadPdfBrcko(req, year, today, empPhone);
            return;
        }
        if (entity === 'rs') {
            this.downloadPdfRs(req, year, today, docNumber);
            return;
        }
        this.downloadPdfFbih(req, year, today, docNumber);
    },

    downloadPdfFbih(req, year, today, docNumber) {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        doc.setFont('helvetica');
        const sd = this.formatDate(req.startDate);
        const ed = this.formatDate(req.endDate);

        let y = 20;
        const split = (t, w = 170) => doc.splitTextToSize(t, w);
        const block = (t, indent = 20) => { const s = split(t, 170 - (indent - 20)); doc.text(s, indent, y); y += s.length * 6; };
        const poukaBold = (label, txt) => { doc.setFont('helvetica', 'bold'); doc.text(label, 20, y); doc.setFont('helvetica', 'normal'); const w = doc.getTextWidth(label); const s = split(txt, 170 - w); doc.text(s, 20 + w + 1, y); y += s.length * 6 + 8; };
        const signatureRight = () => { y += 4; doc.setFont('helvetica', 'bold'); doc.text('POSLODAVAC', 160, y, { align: 'center' }); y += 14; doc.line(130, y, 190, y); y += 5; doc.setFont('helvetica', 'italic'); doc.text('(potpis i pecat)', 160, y, { align: 'center' }); doc.setFont('helvetica', 'normal'); };

        if (req.type === 'annual') {
            doc.setFontSize(10); doc.setFont('helvetica', 'bold'); doc.text('PRIMJER', 105, y, { align: 'center' }); y += 5;
            doc.setFontSize(12); doc.text('RJESENJE O KORISTENJU GODISNJEG ODMORA', 105, y, { align: 'center' }); y += 8;
            doc.setFont('helvetica', 'italic'); doc.setFontSize(10); doc.text('(naziv i sjediste poslodavca)', 20, y); y += 5;
            doc.setFont('helvetica', 'normal'); doc.text(`Broj: ${docNumber}`, 20, y); y += 5;
            doc.text(`U __________ dana ${today}`, 20, y); y += 8;
            block(`Na osnovu clana 52. stav (2) Zakona o radu (Sl. novine FBiH, br. 26/16 i 89/18), clana ___ Pravilnika o radu, clana ___ Ugovora o radu, i Plana koristenja godišnjih odmora za ${year}. godinu, donosim:`); y += 6;
            doc.setFont('helvetica', 'bold'); doc.setFontSize(12); doc.text('Rješenje', 105, y, { align: 'center' }); doc.setFont('helvetica', 'normal'); doc.setFontSize(10); y += 8;
            doc.text('1. ', 20, y); doc.line(25, y, 148, y); doc.text(req.employee, 86, y - 1, { align: 'center' }); doc.text(', radniku na', 149, y); y += 4;
            doc.setFont('helvetica', 'italic'); doc.text('(ime i prezime)', 86, y, { align: 'center' }); doc.setFont('helvetica', 'normal'); y += 5;
            doc.text('radnom mjestu ', 20, y); doc.line(51, y, 138, y); doc.text(req.position || '', 94, y - 1, { align: 'center' }); doc.text('(u daljnem tekstu: radnik)', 139, y); y += 4;
            doc.setFont('helvetica', 'italic'); doc.text('(navesti radno mjesto)', 69, y, { align: 'center' }); doc.setFont('helvetica', 'normal'); y += 7;
            block(`utvrđuje se pravo na godišnji odmor za ${year}. godinu, u trajanju od ukupno ${req.days} radnih dana, prema sljedecim osnovama i kriterijima:`); y += 2;
            doc.text('- zakonski osnov 20 radnih dana ', 20, y); doc.setFont('helvetica', 'italic'); doc.text('(za maloljetnog radnika 24 radna dana)', 86, y); doc.setFont('helvetica', 'normal'); y += 5;
            doc.text('- navesti druge osnove za povecanje broja dana.', 20, y); y += 9;
            doc.text(`2. Radnik ce koristiti godišnji odmor od ${sd} do ${ed}.`, 20, y); y += 7;
            block('3. Jedan dan godišnjeg odmora radnik može koristiti kad on to želi, uz obavezu da o tome obavijesti poslodavca najmanje tri dana prije njegovog koristenja.'); y += 6;
            block('4. Za vrijeme koristenja godišnjeg odmora radnik ima pravo na naknadu place u skladu sa clanom 52. stav (3) Zakona o radu.'); y += 10;
            doc.setFont('helvetica', 'bold'); doc.text('Obrazloženje', 105, y, { align: 'center' }); doc.setFont('helvetica', 'normal'); y += 8;
            block('Obrazložiti po kojem osnovu radniku pripadaju dani godišnjeg odmora preko zakonskog minimuma i cime dokazuje da mu pripada pravo po tom osnovu.'); y += 5;
            block('Raspored koristenja godišnjeg odmora utvrden je u skladu sa Planom koristenja godišnjih odmora iz clana 52. stav (1) Zakona o radu, koji je donesen uz prethodnu konsultaciju sa radnicima ili njihovim predstavnicima u skladu sa zakonom, uzimajuci u obzir potrebe posla, kao i opravdane razloge radnika.'); y += 10;
            poukaBold('Pouka o pravnom lijeku: ', 'Protiv ovog rješenja može se uložiti pismeni prigovor poslodavcu, u roku 30 dana od dana dostavljanja ovog rješenja.');
            signatureRight();
            doc.save(`Rjesenje_Godisnji_Odmor_${req.employee.replace(/ /g,'_')}_${year}.pdf`);

        } else if (req.type === 'sick') {
            doc.setFontSize(10); doc.setFont('helvetica', 'bold'); doc.text('PRIMJER', 105, y, { align: 'center' }); y += 5;
            doc.setFontSize(12); doc.text('RJESENJE O PLACENOM ODSUSTVU', 105, y, { align: 'center' }); y += 8;
            doc.setFont('helvetica', 'normal'); doc.setFontSize(10); doc.text(`Broj: ${docNumber}`, 20, y); y += 5;
            doc.text(`U __________ dana ${today}`, 20, y); y += 8;
            block('Na osnovu clana 53. stav (1) i clana 81. stav (1) Zakona o radu (Sl. novine FBiH, br. 26/16 i 89/18) clana ___ Pravilnika o radu, clana ___ Ugovora o radu donosim:'); y += 6;
            doc.setFont('helvetica', 'bold'); doc.setFontSize(12); doc.text('Rješenje', 105, y, { align: 'center' }); doc.setFont('helvetica', 'normal'); doc.setFontSize(10); y += 8;
            doc.text('1. Radniku ', 20, y); doc.line(42, y, 140, y); doc.text(req.employee, 91, y - 1, { align: 'center' }); doc.text(',', 141, y); y += 4;
            doc.setFont('helvetica', 'italic'); doc.text('(ime i prezime)', 91, y, { align: 'center' }); doc.setFont('helvetica', 'normal'); y += 5;
            block(`na radnom mjestu ${req.position || '___________'} utvrđuje se pravo na odsustvo sa rada uz naknadu place (placeno odsustvo) u trajanju od ${req.days} radnih dana radi ${req.notes || '___________'}.`); y += 4;
            doc.setFont('helvetica', 'italic'); doc.text('(navesti razloge za koristenje ovog odsustva)', 105, y, { align: 'center' }); doc.setFont('helvetica', 'normal'); y += 7;
            doc.text(`2. Radnik ce placeno odsustvo koristiti od ${sd} do ${ed}.`, 20, y); y += 7;
            doc.text('3. Za vrijeme koristenja placenog odsustva imenovani-a ima pravo na naknadu place u visini ', 20, y); y += 5;
            doc.line(20, y, 120, y); y += 5;
            doc.setFont('helvetica', 'italic'); doc.text('(navesti visinu naknade place)', 70, y, { align: 'center' }); doc.setFont('helvetica', 'normal'); y += 10;
            doc.setFont('helvetica', 'bold'); doc.text('Obrazloženje', 105, y, { align: 'center' }); doc.setFont('helvetica', 'normal'); y += 8;
            doc.text(`Radnik je podnio zahtjev da mu se odobri placeno odsustvo za slucaj ${req.notes || '___________'}.`, 20, y); y += 7;
            doc.text('Uz zahtjev je priložio sljedece dokaze ', 20, y); doc.line(80, y, 180, y); y += 8;
            block('S obzirom na to da su ispunjeni uvjeti utvrđeni Zakonom, Pravilnikom o radu i Ugovorom o radu, riješeno je kao u dispozitivu.'); y += 10;
            poukaBold('Pouka o pravnom lijeku: ', 'Protiv ovog rješenja može se uložiti prigovor pismenim putem poslodavcu, u roku od 30 dana od dana dostavljanja ovog rješenja.');
            signatureRight();
            doc.save(`Rjesenje_Placeno_Odsustvo_${req.employee.replace(/ /g,'_')}_${year}.pdf`);

        } else {
            doc.setFontSize(10); doc.setFont('helvetica', 'bold'); doc.text('PRIMJER', 105, y, { align: 'center' }); y += 5;
            doc.setFontSize(12); doc.text('RJESENJE O NEPLACENOM ODSUSTVU', 105, y, { align: 'center' }); y += 8;
            doc.setFont('helvetica', 'italic'); doc.setFontSize(10); doc.text('(naziv i sjediste poslodavca)', 20, y); doc.setFont('helvetica', 'normal'); y += 5;
            doc.text(`Broj: ${docNumber}`, 20, y); y += 5;
            doc.text(`U __________ dana ${today}`, 20, y); y += 8;
            block('Na osnovu clana 54. stav (1) Zakona o radu (Sl. novine FBiH, br. 26/16 i 89/18), clana ___ Pravilnika o radu i pismenog zahtjeva radnika, donosim:'); y += 6;
            doc.setFont('helvetica', 'bold'); doc.setFontSize(12); doc.text('RJEŠENJE', 105, y, { align: 'center' }); doc.setFont('helvetica', 'normal'); doc.setFontSize(10); y += 8;
            doc.text('1. Radniku ', 20, y); doc.line(42, y, 140, y); doc.text(req.employee, 91, y - 1, { align: 'center' }); doc.text(',', 141, y); y += 4;
            doc.setFont('helvetica', 'italic'); doc.text('(ime i prezime)', 91, y, { align: 'center' }); doc.setFont('helvetica', 'normal'); y += 5;
            doc.text('u radnom odnosu kod poslodavca ', 20, y); doc.line(76, y, 180, y); y += 7;
            block(`utvrđuje se pravo na odsustvo sa rada bez naknade place (neplaceno odsustvo) u trajanju od ${req.days} dana radi ${req.notes || '___________'}.`); y += 4;
            doc.setFont('helvetica', 'italic'); doc.text('(navesti razloge za koristenje ovog odsustva)', 105, y, { align: 'center' }); doc.setFont('helvetica', 'normal'); y += 7;
            doc.text(`2. Radnik ce neplaceno odsustvo koristiti od ${sd} do ${ed}.`, 20, y); y += 7;
            block('3. Za vrijeme koristenja neplacenog odsustva prava i obaveze zaposlenika, koji se sticu na radu i po osnovu rada, miruju.'); y += 10;
            doc.setFont('helvetica', 'bold'); doc.text('Obrazloženje', 105, y, { align: 'center' }); doc.setFont('helvetica', 'normal'); y += 8;
            doc.text('Obrazložiti:', 20, y); y += 6;
            block(`da je radnik podnio zahtjev da mu se odobri placeno odsustvo za slucaj ${req.notes || '___________'}, koji je predviden u clanu ___________ (navesti propis) u trajanju ___________`); y += 5;
            doc.text('- da su ispunjeni uvjeti utvrđeni Zakonom i Pravilnikom o radu, riješeno je kao u dispozitivu.', 20, y); y += 10;
            poukaBold('Pouka o pravnom lijeku: ', 'Protiv ovog rješenja može se uložiti prigovor poslodavcu, u roku od 30 dana.');
            signatureRight();
            doc.save(`Rjesenje_Neplaceno_Odsustvo_${req.employee.replace(/ /g,'_')}_${year}.pdf`);
        }
    },

    downloadPdfRs(req, year, today, docNumber) {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        doc.setFont('helvetica');
        const sd = this.formatDate(req.startDate);
        const ed = this.formatDate(req.endDate);
        let y = 20;
        const split = (t, w = 170) => doc.splitTextToSize(t, w);
        const block = (t, indent = 20) => { const s = split(t, 170 - (indent - 20)); doc.text(s, indent, y); y += s.length * 6; };
        const poukaBold = (txt) => { doc.setFont('helvetica', 'bold'); doc.text('Pouka o pravnom leku: ', 20, y); doc.setFont('helvetica', 'normal'); const w = doc.getTextWidth('Pouka o pravnom leku: '); const s = split(txt, 170 - w); doc.text(s, 20 + w, y); y += s.length * 6 + 8; };
        const rsHeader = (clan, title) => {
            doc.setFontSize(9); doc.setFont('helvetica', 'normal');
            const hdr = `Na osnovu clana 192, a u vezi sa ${clan} Zakona o radu (Sl. glasnik RS, br. 24/2005, 61/2005, 54/2009, 32/2013 i 75/2014), a u skladu sa clanom ___. ___________ (naziv opsteg akta ili ugovora o radu) ___________ (naziv i sedište poslodavca), ___________ (nadležni organ/ovlasceno lice) dana ______ 20__ godine, donosi`;
            const s = split(hdr, 170); doc.text(s, 20, y); y += s.length * 5.5 + 6;
            doc.setFontSize(12); doc.setFont('helvetica', 'bold'); doc.text(title, 105, y, { align: 'center' }); doc.setFont('helvetica', 'normal'); doc.setFontSize(10); y += 10;
        };
        const rsFooter = () => {
            y += 4; doc.text('U ________________________', 20, y); y += 6;
            doc.text('Dana __________ 20___. godine', 20, y); y += 16;
            doc.line(120, y, 190, y); y += 4;
            doc.setFont('helvetica', 'italic');
            const s = split('(nadležni organ poslodavca/ lice utvrđeno Zakonom ili opstim aktom poslodavca)', 65);
            doc.text(s, 155, y, { align: 'center' }); y += s.length * 5 + 8;
            doc.setFont('helvetica', 'normal');
            doc.text('Dostavljeno:', 20, y); y += 5;
            ['- Zaposlenom', '- Službi za obracun zarada', '- Arhivi'].forEach(l => { doc.text(l, 20, y); y += 5; });
        };

        if (req.type === 'annual') {
            rsHeader('cl. 68. do 75.', 'Rešenje o koriscenju godišnjeg odmora');
            doc.text('1. Zaposlenom ', 28, y); doc.line(55, y, 150, y); doc.text(req.employee, 102, y - 1, { align: 'center' }); doc.text('(dalje: Zaposleni)', 152, y); y += 4;
            doc.setFont('helvetica', 'italic'); doc.text('(ime i prezime)', 102, y, { align: 'center' }); doc.setFont('helvetica', 'normal'); y += 5;
            block(`na poslovima ${req.position || '___________'} odobrava se godišnji odmor za ${year}. godinu u trajanju od ${req.days} radnih dana.`, 28); y += 5;
            doc.text(`2. Godišnji odmor koristice u celini u periodu od ${sd} do ${ed} godine.`, 28, y); y += 7;
            doc.text('3. Zaposleni je dužan da se javi na rad dana _________, _________ godine.', 28, y); y += 7;
            doc.setFont('helvetica', 'italic'); doc.text('Alternativa:', 28, y); y += 5;
            block('Prvi deo godišnjeg odmora zaposleni ce koristiti u trajanju od ___ radnih dana u periodu od ___ do ____ godine, a drugi deo u trajanju od __ radnih dana ce koristiti najkasnije do 30. juna naredne godine.', 28); y += 5;
            doc.setFont('helvetica', 'normal');
            block('3. Za vreme koriscenja godišnjeg odmora zaposlenom pripada naknada zarade u skladu sa Zakonom i opstim aktom.', 28); y += 10;
            doc.setFont('helvetica', 'bold'); doc.text('Obrazloženje', 105, y, { align: 'center' }); doc.setFont('helvetica', 'normal'); y += 8;
            block(`Zaposleni u skladu sa Zakonom i kriterijumima utvrđenim ___________ (naziv opsteg akta/ugovora o radu) ima pravo na godišnji odmor u trajanju od ${req.days} radnih dana.`, 28); y += 5;
            block('Vreme koriscenja godišnjeg odmora određeno je kao u dispozitivu ovog rešenja u skladu sa potrebama posla i uz konsultaciju sa zaposlenim.', 28); y += 10;
            poukaBold('Protiv ovog rešenja zaposleni može da pokrene spor pred nadležnim sudom u roku od 60 dana od dana dostavljanja rešenja.');
            rsFooter();
            y += 6; doc.line(20, y, 80, y); y += 4; doc.setFontSize(7);
            block('Clan 73. Zakona o radu: Ako zaposleni koristi godišnji odmor u delovima, prvi deo koristi u trajanju od najmanje dve radne nedelje neprekidno u toku kalendarske godine, a ostatak najkasnije do 30. juna naredne godine.');
            doc.save(`Resenje_Godisnji_Odmor_${req.employee.replace(/ /g,'_')}_${year}.pdf`);

        } else if (req.type === 'sick') {
            rsHeader('clanom 77.', 'Rešenje o placenom odsustvu');
            doc.text('1. Zaposlenom ', 28, y); doc.line(55, y, 130, y); doc.text(req.employee, 92, y - 1, { align: 'center' }); doc.text(', na poslovima', 131, y); y += 4;
            doc.setFont('helvetica', 'italic'); doc.text('(ime i prezime zaposlenog)', 92, y, { align: 'center' }); doc.setFont('helvetica', 'normal'); y += 5;
            doc.line(28, y, 100, y); doc.text(req.position || '', 64, y - 1, { align: 'center' }); y += 4;
            doc.setFont('helvetica', 'italic'); doc.text('(naziv poslova)', 64, y, { align: 'center' }); doc.setFont('helvetica', 'normal'); y += 5;
            block(`odobrava se koriscenje placenog odsustva u trajanju od ${req.days} radnih dana, zbog ${req.notes || '___________'}.`, 28); y += 5;
            doc.text(`2. Zaposleni ce koristiti placeno odsustvo u periodu od ${sd} do ${ed} 20__ godine.`, 28, y); y += 7;
            doc.text('3. Zaposleni je dužan da se vrati na rad dana ___________ 20___ godine.', 28, y); y += 7;
            block('4. Za vreme placenog odsustva zaposlenom pripada naknada zarade u skladu sa Zakonom i opstim aktom.', 28); y += 10;
            doc.setFont('helvetica', 'bold'); doc.text('Obrazloženje', 105, y, { align: 'center' }); doc.setFont('helvetica', 'normal'); y += 8;
            block(`Zaposleni je dana ______ godine podneo zahtev da mu se odobri placeno odsustvo zbog ${req.notes || '___________'}.`, 28); y += 5;
            block(`Zaposleni u skladu sa Zakonom i kriterijumima utvrđenim ___________ (naziv opsteg akta/ugovora o radu) ima pravo na placeno odsustvo po ovom osnovu u trajanju od ${req.days} radnih dana, pa je odluceno kao u dispozitivu rešenja.`, 28); y += 10;
            poukaBold('Protiv ovog rešenja zaposleni može da pokrene spor pred nadležnim sudom u roku od 60 dana od dana dostavljanja rešenja.');
            rsFooter();
            y += 6; doc.line(20, y, 80, y); y += 4; doc.setFontSize(7);
            block('Clan 77. st. 1. i 2. Zakona o radu: Zaposleni ima pravo na odsustvo sa rada uz naknadu zarade (placeno odsustvo) u ukupnom trajanju do pet radnih dana u toku kalendarske godine, u slucaju sklapanja braka, porodaja supruge, teže bolesti clana uže porodice i u drugim slucajevima utvrđenim opstim aktom i ugovorom o radu.');
            doc.save(`Resenje_Placeno_Odsustvo_${req.employee.replace(/ /g,'_')}_${year}.pdf`);

        } else {
            rsHeader('clanom 78.', 'Rešenje o neplacenom odsustvu');
            doc.text('1. Zaposlenom ', 28, y); doc.line(55, y, 130, y); doc.text(req.employee, 92, y - 1, { align: 'center' }); doc.text(', na poslovima', 131, y); y += 4;
            doc.setFont('helvetica', 'italic'); doc.text('(ime i prezime zaposlenog)', 92, y, { align: 'center' }); doc.setFont('helvetica', 'normal'); y += 5;
            doc.line(28, y, 100, y); doc.text(req.position || '', 64, y - 1, { align: 'center' }); y += 4;
            doc.setFont('helvetica', 'italic'); doc.text('(naziv poslova)', 64, y, { align: 'center' }); doc.setFont('helvetica', 'normal'); y += 5;
            block(`odobrava se koriscenje neplacenog odsustva u trajanju od _____ do _____ 20__ godine, zbog ${req.notes || '___________'}.`, 28); y += 5;
            doc.text(`2. Zaposleni ce koristiti neplaceno odsustvo u periodu od ${sd} do ${ed} 20__ godine.`, 28, y); y += 7;
            doc.text('3. Zaposleni je dužan da se vrati na rad dana ___________ 20___ godine.', 28, y); y += 7;
            block('4. Za vreme neplacenog odsustva zaposlenom miruju prava i obaveze iz radnog odnosa osim ', 28); doc.line(28, y, 170, y); y += 4;
            doc.setFont('helvetica', 'italic'); doc.text('(navesti prava i obaveze koje ne miruju prema opstem aktu)', 99, y, { align: 'center' }); doc.setFont('helvetica', 'normal'); y += 10;
            doc.setFont('helvetica', 'bold'); doc.text('Obrazloženje', 105, y, { align: 'center' }); doc.setFont('helvetica', 'normal'); y += 8;
            block(`Zaposleni je dana _______ 20__ godine podneo zahtev da mu se odobri neplaceno odsustvo u periodu od ${sd} do ${ed} 20__ godine, zbog ${req.notes || '___________'}.`, 28); y += 5;
            block('Pošto ne postoje razlozi da se zaposlenom ne odobri traženo neplaceno odsustvo odluceno je kao u dispozitivu.', 28); y += 10;
            poukaBold('Protiv ovog rešenja zaposleni može u roku od 60 dana od dana dostavljanja da pokrene spor pred nadležnim sudom.');
            rsFooter();
            doc.save(`Resenje_Neplaceno_Odsustvo_${req.employee.replace(/ /g,'_')}_${year}.pdf`);
        }
    },

    downloadPdfBrcko(req, year, today, empPhone) {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        doc.setFont('helvetica');
        const sd = this.formatDate(req.startDate);
        const ed = this.formatDate(req.endDate);
        let y = 20;

        const tableRow = (label, value) => {
            const labelLines = doc.splitTextToSize(label, 85);
            const valueLines = value ? doc.splitTextToSize(String(value), 82) : [];
            const rh = Math.max(labelLines.length, Math.max(valueLines.length, 1)) * 6 + 4;
            doc.rect(15, y, 92, rh); doc.rect(107, y, 88, rh);
            doc.setFont('helvetica', 'normal'); doc.setFontSize(9);
            doc.text(labelLines, 18, y + 5);
            if (value) doc.text(valueLines, 110, y + 5);
            y += rh;
        };
        const hrSection = (label) => {
            doc.rect(15, y, 180, 9);
            doc.setFont('helvetica', 'bold'); doc.setFontSize(8.5);
            doc.text(label, 105, y + 6, { align: 'center' });
            doc.setFont('helvetica', 'normal'); doc.setFontSize(9); y += 9;
        };

        if (req.type === 'annual') {
            doc.setFontSize(13); doc.setFont('helvetica', 'bold'); doc.text('ZAHTJEV ZA GODIŠNJI ODMOR', 105, y, { align: 'center' }); y += 10;
            doc.setFontSize(9); doc.setFont('helvetica', 'normal');
            tableRow('Organ javne uprave/Institucija');
            tableRow('Ime i prezime zaposlenika', req.employee);
            tableRow('Pozicija zaposlenika', req.position || '');
            tableRow('Datum podnošenja zahtjeva', today);
            tableRow('Broj dana koje bi uzeo za godišnji odmor', String(req.days));
            tableRow('Prvi dan godišnjeg odmora', sd);
            tableRow('Zadnji dan godišnjeg odmora', ed);
            tableRow('Kontakt adresa zaposlenika');
            tableRow('Kontakt telefon', empPhone);
            tableRow('Potpis zaposlenika');
            tableRow('Potpis rukovodioca');
            hrSection('POPUNjAVA PODODJELjENjE ZA OSOBLjE I PLATE');
            tableRow('Obracun za vrijeme godišnjeg odmora');
            tableRow('Potpis odgovorne osobe');
            doc.save(`Zahtjev_Godisnji_Odmor_${req.employee.replace(/ /g,'_')}_${year}.pdf`);

        } else if (req.type === 'sick') {
            doc.setFontSize(13); doc.setFont('helvetica', 'bold'); doc.text('ZAHTJEV ZA PLACENO ODSUSTVO', 105, y, { align: 'center' }); y += 10;
            doc.setFontSize(9); doc.setFont('helvetica', 'normal');
            tableRow('Organ javne uprave/Institucija');
            tableRow('Ime i prezime zaposlenika', req.employee);
            tableRow('Pozicija zaposlenika', req.position || '');
            tableRow('Datum podnošenja zahtjeva', today);
            tableRow('Broj dana koje bi uzeo za placeno odsustvo', String(req.days));
            tableRow('Prvi dan placenog odsustva', sd);
            tableRow('Zadnji dan placenog odsustva', ed);
            tableRow('Kontakt adresa zaposlenika');
            tableRow('Kontakt telefon', empPhone);
            tableRow('Potpis zaposlenika');
            tableRow('Potpis rukovodioca');
            hrSection('POPUNjAVA PODODJELjENjE ZA OSOBLjE I PLATE');
            tableRow('Obracun za vrijeme placenog odsustva');
            tableRow('Potpis odgovorne osobe');
            doc.save(`Zahtjev_Placeno_Odsustvo_${req.employee.replace(/ /g,'_')}_${year}.pdf`);

        } else {
            doc.setFontSize(13); doc.setFont('helvetica', 'bold'); doc.text('ZAHTJEV ZA NEPLACENO ODSUSTVO', 105, y, { align: 'center' }); y += 10;
            doc.setFontSize(9); doc.setFont('helvetica', 'normal');
            tableRow('Organ javne uprave/Institucija');
            tableRow('Ime i prezime zaposlenika', req.employee);
            tableRow('Pozicija zaposlenika', req.position || '');
            tableRow('Datum podnošenja zahtjeva', today);
            tableRow('Dužina neplacenog odsustva', `${req.days} dana`);
            tableRow('Razlog za uzimanje neplacenog odsustva', req.notes || '');
            tableRow('Prvi dan neplacenog odsustva', sd);
            tableRow('Zadnji dan neplacenog odsustva', ed);
            tableRow('Kontakt adresa zaposlenika');
            tableRow('Kontakt telefon', empPhone);
            tableRow('Potpis zaposlenika');
            tableRow('Potpis rukovodioca');
            hrSection('POPUNjAVA PODODJELjENjE ZA OSOBLjE I PLATE');
            tableRow('Vrijeme mirovanja prava i obaveza zaposlenika za vrijeme neplacenog odsustva');
            tableRow('Potpis odgovorne osobe');
            y += 5; doc.setFontSize(9); doc.setFont('helvetica', 'bold'); doc.text('Uz zahtjev obavezno priložiti:', 15, y); y += 6;
            doc.setFont('helvetica', 'normal');
            doc.text('- Obrazloženje o razlozima podnošenja zahtjeva;', 15, y); y += 5;
            doc.text('- Akt koji dokazuje postojanje slucaja u kojem se može odobriti neplaceno odsustvo.', 15, y);
            doc.save(`Zahtjev_Neplaceno_Odsustvo_${req.employee.replace(/ /g,'_')}_${year}.pdf`);
        }
    },

    generateLegalReport() {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        doc.setFont('helvetica');

        const year = new Date().getFullYear();
        const today = new Date().toLocaleDateString(this.lang === 'bs' ? 'bs-BA' : 'en-GB');
        const entity = this.entities[this.entity || 'fbih'];
        const requests = this.requests || [];
        const users = this.users || [];
        const bs = this.lang === 'bs';

        let y = 20;

        // Title
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text(bs ? `IZVJEŠTAJ O GODIŠNJIM ODMORIMA - ${year}` : `ANNUAL LEAVE REPORT - ${year}`, 105, y, { align: 'center' });
        y += 5;
        doc.line(20, y, 190, y);
        y += 10;

        // Meta info
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text((bs ? 'Entitet: ' : 'Entity: ') + entity.name, 20, y);
        doc.text((bs ? 'Datum: ' : 'Date: ') + today, 150, y);
        y += 6;
        doc.text((bs ? 'Ukupno zaposlenih: ' : 'Total employees: ') + users.length, 20, y);
        doc.text((bs ? 'Fond dana: ' : 'Days entitlement: ') + entity.days, 150, y);
        y += 12;

        // Stats
        const approved = requests.filter(r => r.status === 'approved');
        const pending = requests.filter(r => r.status === 'pending');
        const rejected = requests.filter(r => r.status === 'rejected');
        const totalDaysUsed = approved.reduce((sum, r) => sum + (r.days || 0), 0);

        doc.setFont('helvetica', 'bold');
        doc.text(bs ? 'Pregled zahtjeva:' : 'Request overview:', 20, y);
        y += 7;
        doc.setFont('helvetica', 'normal');
        doc.text((bs ? 'Odobreno: ' : 'Approved: ') + approved.length, 20, y);
        doc.text((bs ? 'Na čekanju: ' : 'Pending: ') + pending.length, 80, y);
        doc.text((bs ? 'Odbijeno: ' : 'Rejected: ') + rejected.length, 140, y);
        y += 6;
        doc.text((bs ? 'Ukupno iskorištenih dana: ' : 'Total days used: ') + totalDaysUsed, 20, y);
        y += 12;

        // Table header
        doc.setFont('helvetica', 'bold');
        doc.setFillColor(230, 230, 230);
        doc.rect(20, y - 5, 170, 8, 'F');
        doc.text(bs ? 'Zaposlenik' : 'Employee', 22, y);
        doc.text(bs ? 'Tip' : 'Type', 85, y);
        doc.text(bs ? 'Od' : 'From', 110, y);
        doc.text(bs ? 'Do' : 'To', 135, y);
        doc.text(bs ? 'Dana' : 'Days', 158, y);
        doc.text(bs ? 'Status' : 'Status', 170, y);
        y += 8;
        doc.line(20, y - 3, 190, y - 3);

        // Table rows
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        const statusLabel = { approved: bs ? 'Odobr.' : 'Approv.', pending: bs ? 'Čeka' : 'Pending', rejected: bs ? 'Odbij.' : 'Reject.' };

        for (const r of requests) {
            if (y > 270) {
                doc.addPage();
                y = 20;
            }
            doc.text((r.employee || '').substring(0, 22), 22, y);
            doc.text((r.type || r.leaveType || '').substring(0, 12), 85, y);
            doc.text(r.startDate ? r.startDate.toString().substring(0, 10) : '', 110, y);
            doc.text(r.endDate ? r.endDate.toString().substring(0, 10) : '', 135, y);
            doc.text(String(r.days || ''), 158, y);
            doc.text(statusLabel[r.status] || r.status || '', 170, y);
            y += 6;
            doc.line(20, y - 2, 190, y - 2);
        }

        if (requests.length === 0) {
            doc.text(bs ? 'Nema zahtjeva.' : 'No requests found.', 22, y);
        }

        doc.save(`DanOff_Report_${year}.pdf`);
        this.showToast(
            bs ? 'Izvještaj generisan' : 'Report generated',
            bs ? 'PDF izvještaj je preuzet' : 'PDF report has been downloaded',
            'success'
        );
    },

    formatDate(dateStr) {
        if (!dateStr) return '';
        const date = new Date(dateStr);
        if (this.lang === 'bs') {
            const months = ['januar','februar','mart','april','maj','juni','juli','august','septembar','oktobar','novembar','decembar'];
            return `${date.getDate()}. ${months[date.getMonth()]} ${date.getFullYear()}.`;
        }
        return date.toLocaleDateString('en-GB', { year: 'numeric', month: 'long', day: 'numeric' });
    },

    showToast(title, message, type = 'info') {
        const toast = document.getElementById('notification-toast');
        const titleEl = document.getElementById('toast-title');
        const msgEl = document.getElementById('toast-message');
        const iconContainer = toast.querySelector('.w-10.h-10');
        
        titleEl.textContent = title;
        msgEl.textContent = message;
        
        // Reset icon - replace with fresh i element since Lucide replaces it with SVG
        const iconName = type === 'success' ? 'check-circle' : type === 'error' ? 'x-circle' : 'bell';
        iconContainer.innerHTML = `<i data-lucide="${iconName}" class="w-5 h-5"></i>`;
        lucide.createIcons();
        
        toast.classList.remove('opacity-0', 'pointer-events-none');
        
        setTimeout(() => {
            toast.classList.add('opacity-0', 'pointer-events-none');
        }, 3000);
    },

    async requestNotificationPermission() {
        if (!('Notification' in window) || !('serviceWorker' in navigator)) {
            this.showToast('Error', 'Notifications not supported in this browser', 'error');
            return;
        }

        const permission = await Notification.requestPermission();
        if (permission !== 'granted') return;

        try {
            const reg = await navigator.serviceWorker.ready;
            const keyRes = await fetch('/api/push/vapidPublicKey');
            const { key } = await keyRes.json();

            const subscription = await reg.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: this.urlBase64ToUint8Array(key)
            });

            await fetch('/api/push/subscribe', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    employee_id: this.currentUser?.id,
                    subscription
                })
            });

            this.showToast(
                this.lang === 'bs' ? 'Uspješno' : 'Success',
                this.lang === 'bs' ? 'Obavještenja su omogućena!' : 'Push notifications enabled!',
                'success'
            );
        } catch (err) {
            console.error('Push subscribe error:', err);
            this.showToast('Error', 'Could not enable push notifications', 'error');
        }
    },

    urlBase64ToUint8Array(base64String) {
        const padding = '='.repeat((4 - base64String.length % 4) % 4);
        const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
        const raw = atob(base64);
        return Uint8Array.from([...raw].map(c => c.charCodeAt(0)));
    },

    saveData() {
        const data = {
            version: DATA_VERSION,
            lang: this.lang,
            theme: this.theme,
            entity: this.entity,
            entityData: this.userEntityData
        };
        localStorage.setItem('danoff_data', JSON.stringify(data));
    },

    loadData() {
        const saved = localStorage.getItem('danoff_data');
        if (saved) {
            const data = JSON.parse(saved);

            // If data version is outdated, discard old requests (clears demo data)
            if (data.version !== DATA_VERSION) {
                localStorage.removeItem('danoff_data');
                return;
            }

            this.lang = data.lang || 'bs';
            this.theme = data.theme || 'light';
            this.entity = data.entity || 'fbih';
            this.userEntityData = data.entityData || null;

            document.getElementById('lang-label').textContent = this.lang.toUpperCase();
            if (this.theme === 'dark') {
                document.documentElement.classList.add('dark');
            }
        }
    },

    async loadRequests() {
        try {
            const session = JSON.parse(localStorage.getItem('danoff_session'));
            if (!session) return;

            let url = '/api/requests';
            if (session.user.role === 'employee') {
                url = `/api/requests/employee/${session.user.id}`;
            }

            const response = await fetch(url, {
                headers: { 'x-user-id': session.user.id }
            });

            if (response.ok) {
                const requests = await response.json();
                this.requests = requests.map(r => ({
                    id: r.id,
                    employee: r.first_name + ' ' + r.last_name,
                    employee_id: r.employee_id,
                    position: r.position,
                    type: r.leave_type,
                    startDate: r.start_date?.split('T')[0],
                    endDate: r.end_date?.split('T')[0],
                    days: r.days,
                    status: r.status,
                    notes: r.notes,
                    createdAt: r.created_at
                }));
                this.updateEmployeeDashboard();
            }
        } catch (err) {
            console.error('Failed to load requests:', err);
        }
    },

    async loadUsers() {
        try {
            const session = JSON.parse(localStorage.getItem('danoff_session'));
            if (!session) return;
            const response = await fetch('/api/users', {
                headers: { 'x-user-id': session.user.id }
            });
            if (response.ok) {
                const users = await response.json();
                this.users = users.map(u => ({
                    id: u.id,
                    name: u.first_name + ' ' + u.last_name,
                    email: u.email,
                    role: u.role,
                    position: u.position,
                    entity: u.entity,
                    salary: parseFloat(u.salary) || 0,
                    phone: u.phone || ''
                }));
                this.updateAdminDashboard();
            }
        } catch (err) {
            console.error('Failed to load users:', err);
        }
    },

    renderLeaveCalendar(myRequests) {
        const cal = document.getElementById('leave-calendar');
        const label = document.getElementById('calendar-month-label');
        const headersEl = document.getElementById('calendar-day-headers');
        if (!cal) return;

        const year = this.calendarYear;
        const month = this.calendarMonth;

        const monthNames = {
            bs: ['Januar','Februar','Mart','April','Maj','Juni','Juli','August','Septembar','Oktobar','Novembar','Decembar'],
            en: ['January','February','March','April','May','June','July','August','September','October','November','December']
        };
        if (label) label.textContent = `${monthNames[this.lang][month]} ${year}`;
        if (headersEl) {
            headersEl.innerHTML = this.t('calendarDays').split(',')
                .map(d => `<div>${d}</div>`).join('');
        }

        // Build sets of leave days for this month
        const approvedDays = new Set();
        const pendingDays = new Set();
        (myRequests || []).forEach(r => {
            const set = r.status === 'approved' ? approvedDays : r.status === 'pending' ? pendingDays : null;
            if (!set) return;
            const start = new Date(r.startDate);
            const end = new Date(r.endDate);
            for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
                if (d.getFullYear() === year && d.getMonth() === month) {
                    set.add(d.getDate());
                }
            }
        });

        const today = new Date();
        const firstDayOfWeek = (new Date(year, month, 1).getDay() + 6) % 7; // Mon=0
        const daysInMonth = new Date(year, month + 1, 0).getDate();

        let html = '';
        for (let i = 0; i < firstDayOfWeek; i++) html += '<div></div>';
        for (let d = 1; d <= daysInMonth; d++) {
            const isToday = today.getFullYear() === year && today.getMonth() === month && today.getDate() === d;
            const isApproved = approvedDays.has(d);
            const isPending = pendingDays.has(d);
            let cls = 'text-center text-xs py-1.5 rounded-lg ';
            if (isApproved)      cls += 'bg-bosnianBlue text-white font-semibold';
            else if (isPending)  cls += 'bg-yellow-400 text-white font-semibold';
            else if (isToday)    cls += 'ring-2 ring-bosnianBlue text-bosnianBlue font-semibold';
            else                 cls += 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800';
            html += `<div class="${cls}">${d}</div>`;
        }
        cal.innerHTML = html;

        this.renderForecastChart(myRequests);
    },

    prevCalendarMonth() {
        if (this.calendarMonth === 0) { this.calendarMonth = 11; this.calendarYear--; }
        else this.calendarMonth--;
        const myRequests = (this.requests || []).filter(r => r.employee === this.currentUser?.name);
        this.renderLeaveCalendar(myRequests);
    },

    nextCalendarMonth() {
        if (this.calendarMonth === 11) { this.calendarMonth = 0; this.calendarYear++; }
        else this.calendarMonth++;
        const myRequests = (this.requests || []).filter(r => r.employee === this.currentUser?.name);
        this.renderLeaveCalendar(myRequests);
    },

    renderForecastChart(myRequests) {
        const chart = document.getElementById('forecast-chart');
        if (!chart) return;

        const months = Array(12).fill(0);
        (myRequests || []).filter(r => r.status === 'approved').forEach(r => {
            months[new Date(r.startDate).getMonth()] += r.days;
        });

        const shortNames = {
            bs: ['Jan','Feb','Mar','Apr','Maj','Jun','Jul','Aug','Sep','Okt','Nov','Dec'],
            en: ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
        }[this.lang];

        const todayMonth = new Date().getMonth();
        const todayYear  = new Date().getFullYear();

        chart.innerHTML = months.map((days, i) => {
            const isSelected = i === this.calendarMonth;
            const isToday    = i === todayMonth && this.calendarYear === todayYear;

            let bg, text;
            if (days === 0)      { bg = 'bg-gray-100 dark:bg-gray-800';          text = 'text-gray-400 dark:text-gray-500'; }
            else if (days <= 3)  { bg = 'bg-blue-100 dark:bg-blue-900/50';        text = 'text-blue-700 dark:text-blue-300'; }
            else if (days <= 7)  { bg = 'bg-blue-300 dark:bg-blue-700/60';        text = 'text-blue-900 dark:text-blue-100'; }
            else                 { bg = 'bg-bosnianBlue';                          text = 'text-white'; }

            const ring   = isSelected ? 'ring-2 ring-bosnianBlue ring-offset-1 dark:ring-offset-gray-900' : '';
            const todayDot = isToday ? `<div class="w-1 h-1 rounded-full bg-bosnianBlue mx-auto mt-0.5"></div>` : '<div class="w-1 h-1 mt-0.5"></div>';

            return `<button onclick="app.goToCalendarMonth(${i})"
                        class="rounded-xl py-2 text-center transition-all hover:opacity-80 active:scale-95 ${bg} ${ring}">
                        <div class="text-xs font-semibold ${text} leading-none">${shortNames[i]}</div>
                        <div class="text-xs font-bold ${text} mt-1 leading-none">${days > 0 ? days : '·'}</div>
                        ${todayDot}
                    </button>`;
        }).join('');
    },

    goToCalendarMonth(month) {
        this.calendarMonth = month;
        const myRequests = (this.requests || []).filter(r => r.employee === this.currentUser?.name);
        this.renderLeaveCalendar(myRequests);
    },

    searchArchive(query) {
        const container = document.getElementById('employee-requests');
        const myName = this.currentUser?.name || 'Amar Hodžić';
        const allRequests = this.requests?.filter(r => r.employee === myName) || [];

        if (!query) {
            this.updateEmployeeDashboard();
            return;
        }

        const q = query.toLowerCase();
        const filtered = allRequests.filter(r =>
            this.formatDate(r.startDate).toLowerCase().includes(q) ||
            this.formatDate(r.endDate).toLowerCase().includes(q) ||
            r.startDate.includes(q) ||
            r.endDate.includes(q) ||
            r.type.toLowerCase().includes(q) ||
            this.t(r.type === 'annual' ? 'annual' : 'sick').toLowerCase().includes(q) ||
            (r.notes && r.notes.toLowerCase().includes(q)) ||
            r.status.toLowerCase().includes(q) ||
            this.t(r.status === 'pending' ? 'awaitingApproval' : r.status === 'approved' ? 'approvedStatus' : 'rejectedStatus').toLowerCase().includes(q)
        );

        if (filtered.length === 0) {
            container.innerHTML = `<div class="text-center py-12 text-gray-400"><p>${this.t('noResults')}</p></div>`;
        } else {
            container.innerHTML = filtered.map(req => this.createRequestCard(req)).join('');
        }
        lucide.createIcons();
    },

    showEmergencyContact() {
        const contact = (this.users || []).find(u => u.role === 'manager' || u.role === 'admin');
        const detail = contact
            ? `${contact.name}: ${contact.phone || this.t('noPhone')}`
            : (this.lang === 'bs' ? 'Nema menadžera u sistemu' : 'No manager in system');
        this.showToast(this.t('emergencyContactToast'), detail, 'info');
    },

    showTeamHeatmap() {
        this.hideGlobalControls();
        const modal = document.getElementById('heatmap-modal');
        if (!modal) return;
        this.renderTeamHeatmap();
        modal.classList.remove('hidden');
    },

    closeTeamHeatmap() {
        this.showGlobalControls();
        document.getElementById('heatmap-modal')?.classList.add('hidden');
    },

    renderTeamHeatmap() {
        const container = document.getElementById('team-heatmap');
        if (!container) return;
        const today = new Date();
        const days = [];
        for (let i = 0; i < 28; i++) {
            const d = new Date(today.getTime() + i * 86400000);
            const dateStr = d.toISOString().split('T')[0];
            const count = (this.requests || []).filter(r =>
                r.status === 'approved' && r.startDate <= dateStr && r.endDate >= dateStr
            ).length;
            days.push({ dateStr, count, label: d.getDate() });
        }
        container.innerHTML = days.map(({ count, label }) => {
            const color = count === 0 ? 'bg-green-100' : count <= 2 ? 'bg-yellow-200' : 'bg-red-400';
            return `<div class="${color} rounded p-2 text-center text-xs font-medium">${label}</div>`;
        }).join('');
    },

    showTeamAvailability() {
        this.hideGlobalControls();
        const modal = document.getElementById('availability-modal');
        if (!modal) return;
        this.renderTeamAvailability();
        modal.classList.remove('hidden');
    },

    closeTeamAvailability() {
        this.showGlobalControls();
        document.getElementById('availability-modal')?.classList.add('hidden');
    },

    renderTeamAvailability() {
        const container = document.getElementById('availability-list');
        if (!container) return;
        const today = new Date().toISOString().split('T')[0];
        const team = this.users || [];
        container.innerHTML = team.map(member => {
            const onLeave = (this.requests || []).some(r =>
                r.employee === member.name && r.status === 'approved' &&
                r.startDate <= today && r.endDate >= today
            );
            const initials = member.name.split(' ').map(n => n[0]).join('');
            return `<div class="flex items-center justify-between py-2">
                <div class="flex items-center gap-3">
                    <div class="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-sm font-semibold">${initials}</div>
                    <div>
                        <p class="font-medium text-sm">${member.name}</p>
                        <p class="text-xs text-gray-500">${member.position}</p>
                    </div>
                </div>
                <span class="text-xs px-2 py-1 rounded-full ${onLeave ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}">
                    ${onLeave ? this.t('onLeave') : this.t('atWork')}
                </span>
            </div>`;
        }).join('');
    },

    openVacationTrade() {
        this.hideGlobalControls();
        const select = document.getElementById('trade-partner');
        if (select) {
            const currentYear = new Date().getFullYear();
            const colleagues = (this.users || []).filter(u => u.name !== this.currentUser?.name);
            select.innerHTML = `<option value="">${this.t('tradeColleaguePlaceholder')}</option>` +
                colleagues.map(u => {
                    const used = (this.requests || [])
                        .filter(r => r.employee === u.name && r.status === 'approved' && r.type === 'annual' && new Date(r.startDate).getFullYear() === currentYear)
                        .reduce((sum, r) => sum + r.days, 0);
                    const entitlement = this.entities[u.entity]?.totalDays || 20;
                    const remaining = entitlement - used;
                    const label = this.lang === 'bs'
                        ? `${u.name} (${remaining} dana preostalo)`
                        : `${u.name} (${remaining} days remaining)`;
                    return `<option value="${u.id}">${label}</option>`;
                }).join('');
        }
        document.getElementById('trade-modal')?.classList.remove('hidden');
    },

    closeVacationTrade() {
        this.showGlobalControls();
        document.getElementById('trade-modal')?.classList.add('hidden');
    },

    proposeTrade() {
        const partner = document.getElementById('trade-partner')?.value;
        const give = document.getElementById('trade-give')?.value;
        const receive = document.getElementById('trade-receive')?.value;
        if (!partner) {
            this.showToast('Error', this.t('tradeSelectError'), 'error');
            return;
        }
        this.closeVacationTrade();
        this.showToast(this.t('daySwap'), `${this.t('tradeSentMsg')}: ${give} → ${receive} ${this.t('days')}`, 'success');
    },

    calculateTeamHealth() {
        const now = new Date();
        const ninetyDaysAgo = new Date(now - 90 * 24 * 60 * 60 * 1000);
        const sixMonthsAgo = new Date(now - 180 * 24 * 60 * 60 * 1000);
        const employees = (this.users || []).filter(u => u.role === 'employee');
        const flags = [];

        employees.forEach(emp => {
            const empReqs = (this.requests || []).filter(r => r.employee === emp.name && r.status === 'approved');
            const recentSickDays = empReqs
                .filter(r => r.type === 'sick' && new Date(r.startDate) >= ninetyDaysAgo)
                .reduce((sum, r) => sum + r.days, 0);
            const recentAnnualDays = empReqs
                .filter(r => r.type === 'annual' && new Date(r.startDate) >= sixMonthsAgo)
                .reduce((sum, r) => sum + r.days, 0);
            const totalApproved = empReqs.reduce((sum, r) => sum + r.days, 0);

            if (recentSickDays > 5) {
                flags.push({ name: emp.name, level: 'red', reason: `${recentSickDays} ${this.t('sickDaysIn90')}` });
            } else if (recentSickDays >= 3) {
                flags.push({ name: emp.name, level: 'yellow', reason: `${recentSickDays} ${this.t('sickDaysIn90')}` });
            }
            if (recentAnnualDays === 0 && totalApproved >= 5) {
                flags.push({ name: emp.name, level: 'yellow', reason: this.t('noAnnualIn6m') });
            }
        });

        const redCount = flags.filter(f => f.level === 'red').length;
        const yellowCount = flags.filter(f => f.level === 'yellow').length;
        const score = Math.max(0, 100 - redCount * 20 - yellowCount * 10);

        let statusText, colorClass, gradient;
        if (score >= 85) {
            statusText = this.t('lowBurnoutRisk');
            colorClass = 'text-green-600';
            gradient = 'from-green-400/20';
        } else if (score >= 65) {
            statusText = this.t('moderateRisk');
            colorClass = 'text-yellow-600';
            gradient = 'from-yellow-400/20';
        } else {
            statusText = this.t('highBurnoutRisk');
            colorClass = 'text-red-600';
            gradient = 'from-red-400/20';
        }

        const scoreEl = document.getElementById('health-score');
        if (scoreEl) { scoreEl.textContent = `${score}%`; scoreEl.className = `text-3xl font-bold relative z-10 ${colorClass}`; }
        const subtitleEl = document.getElementById('health-subtitle');
        if (subtitleEl) subtitleEl.textContent = statusText;
        const indicator = document.getElementById('burnout-indicator');
        if (indicator) indicator.className = `absolute inset-0 bg-gradient-to-br ${gradient} to-transparent opacity-50`;

        return { score, flags, colorClass };
    },

    showBurnoutDetails() {
        const health = this.calculateTeamHealth();
        const byEmployee = {};
        health.flags.forEach(f => { if (!byEmployee[f.name]) byEmployee[f.name] = []; byEmployee[f.name].push(f); });

        const bgMap = { red: 'bg-red-50 dark:bg-red-900/20', yellow: 'bg-yellow-50 dark:bg-yellow-900/20' };
        const dotMap = { red: 'bg-red-500', yellow: 'bg-yellow-500' };

        let rowsHtml;
        if (health.flags.length === 0) {
            rowsHtml = `<p class="text-center text-gray-400 py-6 text-sm">${this.t('teamHealthMsg')}</p>`;
        } else {
            rowsHtml = Object.entries(byEmployee).map(([name, flags]) => {
                const worst = flags.some(f => f.level === 'red') ? 'red' : 'yellow';
                return `
                    <div class="flex items-start gap-3 p-3 rounded-xl ${bgMap[worst]}">
                        <div class="w-2 h-2 rounded-full ${dotMap[worst]} flex-shrink-0 mt-1.5"></div>
                        <div>
                            <p class="font-medium text-sm">${name}</p>
                            ${flags.map(f => `<p class="text-xs text-gray-500 dark:text-gray-400">${f.reason}</p>`).join('')}
                        </div>
                    </div>`;
            }).join('');
        }

        const existing = document.getElementById('health-modal');
        if (existing) existing.remove();
        const modal = document.createElement('div');
        modal.id = 'health-modal';
        modal.className = 'fixed inset-0 z-50';
        modal.innerHTML = `
            <div class="absolute inset-0 bg-black/60 backdrop-blur-sm" onclick="document.getElementById('health-modal').remove()"></div>
            <div class="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-gray-900 rounded-3xl shadow-2xl p-4 sm:p-6 max-w-sm w-full mx-4 max-h-[90vh] overflow-y-auto">
                <div class="flex items-center justify-between mb-4">
                    <h3 class="font-semibold text-lg">${this.t('teamHealth')}</h3>
                    <span class="text-2xl font-bold ${health.colorClass}">${health.score}%</span>
                </div>
                <div class="space-y-2 max-h-48 sm:max-h-64 overflow-y-auto">${rowsHtml}</div>
                <button onclick="document.getElementById('health-modal').remove()" class="w-full mt-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 font-medium ios-button">${this.t('dismiss')}</button>
            </div>`;
        document.body.appendChild(modal);
    },

    dismissAIWarning() {
        document.getElementById('ai-conflict-warning')?.classList.add('hidden');
    },

    closeDynamicIsland() {
        const island = document.getElementById('dynamic-island');
        if (island) {
            island.style.opacity = '0';
            island.style.pointerEvents = 'none';
        }
    },

    showHapticMenu(event, reqId) {
        event.preventDefault();
        const req = (this.requests || []).find(r => r.id === reqId);
        if (!req || req.status !== 'pending') return;
        this.currentHapticRequest = req;
        const menu = document.getElementById('haptic-menu');
        if (!menu) return;
        const x = Math.min(event.clientX, window.innerWidth - 220);
        const y = Math.min(event.clientY, window.innerHeight - 160);
        menu.style.left = `${x}px`;
        menu.style.top = `${y}px`;
        menu.classList.remove('hidden');
        const dismiss = () => { menu.classList.add('hidden'); document.removeEventListener('click', dismiss); };
        setTimeout(() => document.addEventListener('click', dismiss), 0);
    },

    async hapticAction(action) {
        document.getElementById('haptic-menu')?.classList.add('hidden');
        if (action === 'extend') {
            this.openRequestSheet();
        } else if (action === 'cancel') {
            if (this.currentHapticRequest) {
                await this.cancelRequest(this.currentHapticRequest.id);
            }
        } else if (action === 'pdf') {
            if (this.currentHapticRequest) {
                this.viewLegalDocument(this.currentHapticRequest);
            }
        }
    },

    simulateBiometricAuth() {
        const modal = document.getElementById('biometric-modal');
        if (modal) {
            modal.classList.add('hidden');
            modal.classList.remove('flex');
        }
        this.showToast(this.t('biometricSuccess'), this.t('biometricMsg'), 'success');
    },

    toggleFocusMode() {
        const focusMode = document.getElementById('focus-mode');
        const focusToggle = document.getElementById('focus-toggle');
        if (!focusMode) return;
        if (focusMode.classList.contains('hidden')) {
            this.hideGlobalControls();
            focusMode.classList.remove('hidden');
            focusMode.classList.add('flex');
            focusToggle?.classList.remove('hidden');
            const contact = (this.users || []).find(u => u.role === 'manager' || u.role === 'admin');
            const contactEl = document.getElementById('focus-emergency-contact');
            if (contactEl) {
                contactEl.textContent = contact
                    ? `${contact.name} (${contact.phone || this.t('noPhone')})`
                    : (this.lang === 'bs' ? 'Nema menadžera u sistemu' : 'No manager in system');
            }
        } else {
            this.showGlobalControls();
            focusMode.classList.add('hidden');
            focusMode.classList.remove('flex');
        }
    },

    exportToCalendar() {
        if (!this.currentPdfData) {
            this.showToast('Error', this.t('noDataError'), 'error');
            return;
        }
        const req = this.currentPdfData;
        const ics = [
            'BEGIN:VCALENDAR',
            'VERSION:2.0',
            'BEGIN:VEVENT',
            `DTSTART:${req.startDate.replace(/-/g, '')}`,
            `DTEND:${req.endDate.replace(/-/g, '')}`,
            `SUMMARY:${this.t('annual')} - ${req.employee}`,
            'END:VEVENT',
            'END:VCALENDAR'
        ].join('\n');
        const blob = new Blob([ics], { type: 'text/calendar' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'odmor.ics';
        a.click();
        URL.revokeObjectURL(url);
        this.showToast('iCal', this.t('calendarExported'), 'success');
    },

};

// Initialize on load
document.addEventListener('DOMContentLoaded', () => {
    app.init();
});