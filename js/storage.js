const Storage = {
    KEYS: {
        RESERVATIONS: 'reservas_data',
        NEWS: 'reservas_news',
        BLOCKED_DATES: 'reservas_blocked',
        USER: 'reservas_user',
        TIME_SLOTS: 'reservas_time_slots',
        PRICE: 'reservas_price',
        FREE_PLAY_TABLES: 'reservas_free_play_tables'
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

        if (!localStorage.getItem(this.KEYS.TIME_SLOTS)) {
            const defaultTimeSlots = [
                { id: 'slot1', label: '17:00 - 19:00', active: true },
                { id: 'slot2', label: '19:00 - 21:00', active: true },
                { id: 'slot3', label: '21:00 - 23:00', active: true }
            ];
            localStorage.setItem(this.KEYS.TIME_SLOTS, JSON.stringify(defaultTimeSlots));
        }

        if (!localStorage.getItem(this.KEYS.PRICE)) {
            localStorage.setItem(this.KEYS.PRICE, '5000');
        }

        if (!localStorage.getItem(this.KEYS.FREE_PLAY_TABLES)) {
            const defaultTables = [
                {
                    id: 'table_1',
                    number: 1,
                    game: 'Catan',
                    capacity: 4,
                    date: null,
                    timeRange: null,
                    players: []
                },
                {
                    id: 'table_2',
                    number: 2,
                    game: 'Dixit',
                    capacity: 6,
                    date: null,
                    timeRange: null,
                    players: []
                },
                {
                    id: 'table_3',
                    number: 3,
                    game: 'A decidir en el local',
                    capacity: 4,
                    date: null,
                    timeRange: null,
                    players: []
                }
            ];
            localStorage.setItem(this.KEYS.FREE_PLAY_TABLES, JSON.stringify(defaultTables));
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
        
        // Check if the time slot is available
        const availability = this.checkSlotAvailability(reservation.date, reservation.time);
        if (!availability.available) {
            throw new Error('No hay mesas disponibles para este horario. Por favor, elegí otro horario.');
        }
        
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

    // Time Slots
    getTimeSlots() {
        return JSON.parse(localStorage.getItem(this.KEYS.TIME_SLOTS) || '[]');
    },

    saveTimeSlots(timeSlots) {
        localStorage.setItem(this.KEYS.TIME_SLOTS, JSON.stringify(timeSlots));
    },

    toggleTimeSlotActive(id) {
        const timeSlots = this.getTimeSlots();
        const index = timeSlots.findIndex(t => t.id === id);
        if (index !== -1) {
            timeSlots[index].active = !timeSlots[index].active;
            this.saveTimeSlots(timeSlots);
        }
        return timeSlots;
    },

    // Price
    getPrice() {
        const raw = localStorage.getItem(this.KEYS.PRICE);
        const value = parseInt(raw || '5000', 10);
        return isNaN(value) ? 5000 : value;
    },

    setPrice(value) {
        const num = parseInt(value, 10);
        if (!isNaN(num) && num > 0) {
            localStorage.setItem(this.KEYS.PRICE, String(num));
        }
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
    },

    // Free Play Tables
    getFreePlayTables() {
        return JSON.parse(localStorage.getItem(this.KEYS.FREE_PLAY_TABLES) || '[]');
    },

    saveFreePlayTables(tables) {
        localStorage.setItem(this.KEYS.FREE_PLAY_TABLES, JSON.stringify(tables));
    },

    addFreePlayTable(table) {
        const tables = this.getFreePlayTables();
        const newTable = {
            id: 'table_' + Date.now().toString(),
            number: table.number,
            game: table.game,
            capacity: table.capacity,
            date: table.date || null,
            timeRange: table.timeRange || null,
            players: []
        };
        tables.push(newTable);
        this.saveFreePlayTables(tables);
        return newTable;
    },

    updateFreePlayTable(id, updates) {
        const tables = this.getFreePlayTables();
        const index = tables.findIndex(t => t.id === id);
        if (index !== -1) {
            tables[index] = { ...tables[index], ...updates };
            this.saveFreePlayTables(tables);
            return true;
        }
        return false;
    },

    deleteFreePlayTable(id) {
        const tables = this.getFreePlayTables();
        const filtered = tables.filter(t => t.id !== id);
        this.saveFreePlayTables(filtered);
    },

    addPlayerToFreePlayTable(tableId, user) {
        const tables = this.getFreePlayTables();
        const table = tables.find(t => t.id === tableId);
        if (!table) return { success: false, error: 'Mesa no encontrada' };

        const alreadyJoined = table.players.some(p => p.userId === user.email);
        if (alreadyJoined) {
            return { success: false, error: 'Ya estás anotado en esta mesa' };
        }

        if (table.players.length >= table.capacity) {
            return { success: false, error: 'La mesa ya está completa' };
        }

        table.players.push({ userId: user.email, userName: user.name });
        this.saveFreePlayTables(tables);
        return { success: true };
    },

    removePlayerFromFreePlayTable(tableId, userId) {
        const tables = this.getFreePlayTables();
        const table = tables.find(t => t.id === tableId);
        if (!table) return false;

        table.players = table.players.filter(p => p.userId !== userId);
        this.saveFreePlayTables(tables);
        return true;
    },

    // Table Availability
    getSlotOccupancy(dateString, timeSlot) {
        const reservations = this.getReservations();
        // Normalize the input date to date-only format (YYYY-MM-DD) for comparison
        const normalizedDate = dateString.split('T')[0];
        
        return reservations.filter(res => {
            // Handle both full ISO dates and date-only strings
            const resDate = typeof res.date === 'string' ? res.date.split('T')[0] : '';
            return resDate === normalizedDate && res.time === timeSlot;
        }).length;
    },

    checkSlotAvailability(dateString, timeSlot) {
        const occupied = this.getSlotOccupancy(dateString, timeSlot);
        const MAX_TABLES = 4;
        return {
            available: occupied < MAX_TABLES,
            spotsLeft: Math.max(0, MAX_TABLES - occupied),
            total: MAX_TABLES
        };
    },

    // Get all reservations for a specific date
    getReservationsByDate(dateString) {
        const reservations = this.getReservations();
        return reservations.filter(res => res.date === dateString);
    }
};

Storage.init();
