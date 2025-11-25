const Storage = {
    KEYS: {
        RESERVATIONS: 'reservas_data',
        NEWS: 'reservas_news',
        BLOCKED_DATES: 'reservas_blocked',
        USER: 'reservas_user'
    },

    init() {
        // Always update news to fix broken images
        const initialNews = [
            {
                id: 1,
                title: '¡Nuevos juegos llegaron!',
                description: 'Acabamos de recibir Catan y Carcassonne. ¡Vení a probarlos!',
                image: 'https://images.unsplash.com/photo-1632501641765-e568d28b0015?q=80&w=1000&auto=format&fit=crop'
            },
            {
                id: 2,
                title: 'Torneo de fin de mes',
                description: 'Inscribite al torneo de Ticket to Ride este sábado.',
                image: 'https://images.unsplash.com/photo-1632501641765-e568d28b0015?q=80&w=1000&auto=format&fit=crop'
            },
            {
                id: 3,
                title: 'Noche de Rol',
                description: 'Todos los jueves noche de D&D. ¡Sumate a una mesa!',
                image: 'https://images.unsplash.com/photo-1632501641765-e568d28b0015?q=80&w=1000&auto=format&fit=crop'
            }
        ];
        localStorage.setItem(this.KEYS.NEWS, JSON.stringify(initialNews));

        if (!localStorage.getItem(this.KEYS.RESERVATIONS)) {
            localStorage.setItem(this.KEYS.RESERVATIONS, JSON.stringify([]));
        }

        if (!localStorage.getItem(this.KEYS.BLOCKED_DATES)) {
            localStorage.setItem(this.KEYS.BLOCKED_DATES, JSON.stringify([]));
        }
    },

    // User / Auth
    login() {
        const user = {
            name: 'Juan',
            email: 'juan@example.com',
            avatar: 'J',
            isAdmin: false
        };
        localStorage.setItem(this.KEYS.USER, JSON.stringify(user));
        return user;
    },

    logout() {
        localStorage.removeItem(this.KEYS.USER);
        localStorage.removeItem('adminAuth');
    },

    getUser() {
        return JSON.parse(localStorage.getItem(this.KEYS.USER));
    },

    // Admin Auth
    adminLogin(username, password) {
        // Hardcoded admin credentials
        const ADMIN_USERNAME = 'Resistencia';
        const ADMIN_PASSWORD = 'Resistencia2025';

        if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
            const adminUser = {
                name: 'Admin',
                email: 'admin@resistencia.com',
                avatar: 'A',
                isAdmin: true
            };
            localStorage.setItem('adminAuth', JSON.stringify(adminUser));
            return { success: true, user: adminUser };
        }
        return { success: false, error: 'Credenciales incorrectas' };
    },

    isAdminLoggedIn() {
        const adminAuth = localStorage.getItem('adminAuth');
        return adminAuth !== null;
    },

    getAdminUser() {
        return JSON.parse(localStorage.getItem('adminAuth'));
    },

    adminLogout() {
        localStorage.removeItem('adminAuth');
    },

    // Reservations
    getReservations() {
        return JSON.parse(localStorage.getItem(this.KEYS.RESERVATIONS) || '[]');
    },

    addReservation(reservation) {
        const reservations = this.getReservations();
        const newReservation = {
            ...reservation,
            id: Date.now().toString(),
            status: 'pending_payment',
            createdAt: new Date().toISOString()
        };
        reservations.push(newReservation);
        localStorage.setItem(this.KEYS.RESERVATIONS, JSON.stringify(reservations));
        return newReservation;
    },

    updateReservation(id, updates) {
        const reservations = this.getReservations();
        const index = reservations.findIndex(r => r.id === id);
        if (index !== -1) {
            reservations[index] = { ...reservations[index], ...updates };
            localStorage.setItem(this.KEYS.RESERVATIONS, JSON.stringify(reservations));
            return true;
        }
        return false;
    },

    deleteReservation(id) {
        const reservations = this.getReservations();
        const filtered = reservations.filter(r => r.id !== id);
        localStorage.setItem(this.KEYS.RESERVATIONS, JSON.stringify(filtered));
    },

    // News
    getNews() {
        return JSON.parse(localStorage.getItem(this.KEYS.NEWS) || '[]');
    },

    addNews(newsItem) {
        const news = this.getNews();
        const newItem = { ...newsItem, id: Date.now().toString() };
        news.push(newItem);
        localStorage.setItem(this.KEYS.NEWS, JSON.stringify(news));
        return newItem;
    },

    deleteNews(id) {
        const news = this.getNews();
        const filtered = news.filter(n => n.id != id);
        localStorage.setItem(this.KEYS.NEWS, JSON.stringify(filtered));
    },

    // Calendar
    getBlockedDates() {
        return JSON.parse(localStorage.getItem(this.KEYS.BLOCKED_DATES) || '[]');
    },

    toggleBlockDate(dateString) {
        let blocked = this.getBlockedDates();
        if (blocked.includes(dateString)) {
            blocked = blocked.filter(d => d !== dateString);
        } else {
            blocked.push(dateString);
        }
        localStorage.setItem(this.KEYS.BLOCKED_DATES, JSON.stringify(blocked));
        return blocked;
    },

    // Special Dates
    getSpecialDates() {
        return JSON.parse(localStorage.getItem('reservas_special_dates') || '{}');
    },

    saveSpecialDate(dateString, name) {
        const specialDates = this.getSpecialDates();
        specialDates[dateString] = name;
        localStorage.setItem('reservas_special_dates', JSON.stringify(specialDates));
    },

    deleteSpecialDate(dateString) {
        const specialDates = this.getSpecialDates();
        delete specialDates[dateString];
        localStorage.setItem('reservas_special_dates', JSON.stringify(specialDates));
    }
};

Storage.init();
