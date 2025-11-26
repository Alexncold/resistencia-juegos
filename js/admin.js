document.addEventListener('DOMContentLoaded', () => {
    // Admin Auth Check
    if (!Storage.isAdminLoggedIn()) {
        window.location.href = 'admin-login.html';
        return;
    }

    // Navigation
    const tabs = document.querySelectorAll('.nav-item[data-tab]');
    const contents = document.querySelectorAll('.tab-content');

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            // Remove active class
            tabs.forEach(t => t.classList.remove('active'));
            contents.forEach(c => c.classList.remove('active'));

            // Add active class
            tab.classList.add('active');
            document.getElementById(tab.dataset.tab).classList.add('active');

            // Refresh data
            if (tab.dataset.tab === 'reservations') renderReservations();
            if (tab.dataset.tab === 'calendar') renderAdminCalendar();
            if (tab.dataset.tab === 'news') renderAdminNews();
            if (tab.dataset.tab === 'times') renderTimeSlots();
            if (tab.dataset.tab === 'price') renderPrice();
        });
    });

    document.getElementById('logoutBtn').addEventListener('click', () => {
        Storage.adminLogout();
        window.location.href = 'admin-login.html';
    });

    // --- Reservations Logic ---
    const reservationsTable = document.querySelector('#reservationsTable tbody');
    const searchInput = document.getElementById('searchReservations');
    const searchDateStart = document.getElementById('searchDateStart');
    const searchDateEnd = document.getElementById('searchDateEnd');

    function renderReservations() {
        const reservations = Storage.getReservations();
        const filter = searchInput.value.toLowerCase();
        const startDate = searchDateStart.value;
        const endDate = searchDateEnd.value;

        const filtered = reservations.filter(r => {
            const matchesText = r.userName.toLowerCase().includes(filter) ||
                r.game.toLowerCase().includes(filter);

            // r.date is ISO string (YYYY-MM-DDTHH:mm:ss.sssZ)
            const resDate = r.date.split('T')[0]; // YYYY-MM-DD

            let matchesDate = true;
            if (startDate) matchesDate = matchesDate && resDate >= startDate;
            if (endDate) matchesDate = matchesDate && resDate <= endDate;

            return matchesText && matchesDate;
        });

        reservationsTable.innerHTML = filtered.map(r => `
            <tr>
                <td>${new Date(r.date).toLocaleDateString()}</td>
                <td>${r.time}</td>
                <td>${r.userName}</td>
                <td>${r.game}</td>
                <td>${r.people}</td>
                <td><span class="status-badge status-${r.status === 'confirmed' ? 'confirmed' : 'pending'}">${r.status}</span></td>
                <td>
                    <button class="btn btn-edit-blue" onclick="editRes('${r.id}')" style="margin-right: 0.5rem;"><span class="material-symbols-outlined" style="font-size: 16px;">edit_square</span> Editar</button>
                    <button class="btn btn-delete-red" onclick="deleteRes('${r.id}')"><span class="material-symbols-outlined" style="font-size: 16px;">delete</span> Eliminar</button>
                </td>
            </tr>
        `).join('');
    }

    searchInput.addEventListener('input', renderReservations);
    searchDateStart.addEventListener('change', renderReservations);
    searchDateEnd.addEventListener('change', renderReservations);

    // Global scope for onclick
    window.deleteRes = (id) => {
        if (confirm('¿Estás seguro de eliminar esta reserva?')) {
            Storage.deleteReservation(id);
            renderReservations();
        }
    };

    window.editRes = (id) => {
        const reservations = Storage.getReservations();
        const reservation = reservations.find(r => r.id === id);

        if (!reservation) {
            alert('Reserva no encontrada');
            return;
        }

        // Store the ID for later use
        window.currentEditId = id;

        // Populate modal fields
        document.getElementById('editDate').value = reservation.date;

        const editTimeSelect = document.getElementById('editTime');
        const timeSlots = Storage.getTimeSlots();
        editTimeSelect.innerHTML = '';
        timeSlots.forEach(slot => {
            const opt = document.createElement('option');
            opt.value = slot.label;
            opt.textContent = slot.label;
            editTimeSelect.appendChild(opt);
        });
        editTimeSelect.value = reservation.time;
        document.getElementById('editClient').value = reservation.userName;
        document.getElementById('editGame').value = reservation.game;
        document.getElementById('editPeople').value = reservation.people;
        document.getElementById('editStatus').value = reservation.status;

        // Show modal
        document.getElementById('editModal').classList.add('open');
    };

    window.closeEditModal = () => {
        document.getElementById('editModal').classList.remove('open');
        window.currentEditId = null;
    };

    window.saveEditReservation = () => {
        if (!window.currentEditId) return;

        const updates = {
            date: document.getElementById('editDate').value,
            time: document.getElementById('editTime').value,
            userName: document.getElementById('editClient').value,
            game: document.getElementById('editGame').value,
            people: parseInt(document.getElementById('editPeople').value),
            status: document.getElementById('editStatus').value
        };

        // Validate
        if (!updates.date || !updates.time || !updates.userName || !updates.game || !updates.people) {
            alert('Por favor, completá todos los campos');
            return;
        }

        // Update reservation
        const success = Storage.updateReservation(window.currentEditId, updates);

        if (success) {
            closeEditModal();
            renderReservations();
            alert('Reserva actualizada correctamente');
        } else {
            alert('Error al actualizar la reserva');
        }
    };

    // --- Calendar Logic ---
    let adminDate = new Date();
    const adminCalendarGrid = document.getElementById('adminCalendarGrid');
    const adminMonthDisplay = document.getElementById('adminMonthDisplay');

    // Panel Elements
    const dateManagementPanel = document.getElementById('dateManagementPanel');
    const selectedDateDisplay = document.getElementById('selectedDateDisplay');
    const toggleBlockBtn = document.getElementById('toggleBlockBtn');
    const specialDateName = document.getElementById('specialDateName');
    const saveSpecialDateBtn = document.getElementById('saveSpecialDateBtn');
    const deleteSpecialDateBtn = document.getElementById('deleteSpecialDateBtn');

    let selectedDateString = null;

    document.getElementById('adminPrevMonth').addEventListener('click', () => {
        adminDate.setMonth(adminDate.getMonth() - 1);
        renderAdminCalendar();
    });

    document.getElementById('adminNextMonth').addEventListener('click', () => {
        adminDate.setMonth(adminDate.getMonth() + 1);
        renderAdminCalendar();
    });

    function renderAdminCalendar() {
        const year = adminDate.getFullYear();
        const month = adminDate.getMonth();
        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const blockedDates = Storage.getBlockedDates();
        const specialDates = Storage.getSpecialDates();

        adminMonthDisplay.textContent = new Intl.DateTimeFormat('es-ES', { month: 'long', year: 'numeric' }).format(adminDate);
        adminCalendarGrid.innerHTML = '';

        for (let i = 0; i < firstDay; i++) adminCalendarGrid.appendChild(document.createElement('div'));

        for (let i = 1; i <= daysInMonth; i++) {
            const date = new Date(year, month, i);
            const dateString = date.toISOString().split('T')[0];
            const div = document.createElement('div');
            div.className = 'calendar-day';
            div.textContent = i;

            // Apply styles
            if (blockedDates.includes(dateString)) {
                div.classList.add('disabled');
                div.style.backgroundColor = '#fee2e2';
                div.style.color = '#ef4444';
            } else if (specialDates[dateString]) {
                div.style.backgroundColor = '#dbeafe'; // Blue tint
                div.style.color = '#1e40af';
                div.style.fontWeight = 'bold';
                div.title = specialDates[dateString];
                const indicator = document.createElement('div');
                indicator.style.fontSize = '0.6rem';
                indicator.textContent = '★';
                div.appendChild(indicator);
            }

            // Highlight selected
            if (selectedDateString === dateString) {
                div.style.border = '2px solid var(--primary)';
            }

            div.addEventListener('click', () => {
                selectDate(dateString, date);
            });

            adminCalendarGrid.appendChild(div);
        }
    }

    function selectDate(dateString, dateObj) {
        selectedDateString = dateString;

        // Update Panel UI
        dateManagementPanel.style.opacity = '1';
        dateManagementPanel.style.pointerEvents = 'auto';

        selectedDateDisplay.textContent = dateObj.toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

        const specialDates = Storage.getSpecialDates();
        specialDateName.value = specialDates[dateString] || '';

        // Re-render to show selection border
        renderAdminCalendar();
    }

    toggleBlockBtn.addEventListener('click', () => {
        if (selectedDateString) {
            Storage.toggleBlockDate(selectedDateString);
            renderAdminCalendar();
        }
    });

    saveSpecialDateBtn.addEventListener('click', () => {
        if (selectedDateString && specialDateName.value.trim()) {
            Storage.saveSpecialDate(selectedDateString, specialDateName.value.trim());
            renderAdminCalendar();
        }
    });

    deleteSpecialDateBtn.addEventListener('click', () => {
        if (selectedDateString) {
            Storage.deleteSpecialDate(selectedDateString);
            specialDateName.value = ''; // Clear input
            renderAdminCalendar();
        }
    });

    // --- News Logic ---
    const newsTitle = document.getElementById('newsTitle');
    const newsDesc = document.getElementById('newsDesc');
    const newsImg = document.getElementById('newsImg');
    const adminNewsList = document.getElementById('adminNewsList');

    document.getElementById('addNewsBtn').addEventListener('click', () => {
        if (!newsTitle.value || !newsDesc.value) return alert('Completá los campos');

        Storage.addNews({
            title: newsTitle.value,
            description: newsDesc.value,
            image: newsImg.value || 'https://via.placeholder.com/300'
        });

        newsTitle.value = '';
        newsDesc.value = '';
        newsImg.value = '';
        renderAdminNews();
    });

    function renderAdminNews() {
        const news = Storage.getNews();
        adminNewsList.innerHTML = news.map(n => `
            <div class="card flex gap-4 p-4 items-center">
                <img src="${n.image}" style="width: 60px; height: 60px; object-fit: cover; border-radius: 4px;">
                <div style="flex: 1;">
                    <h4 class="font-bold">${n.title}</h4>
                    <p class="text-sm text-muted">${n.description.substring(0, 50)}...</p>
                </div>
                <button class="btn btn-destructive" style="padding: 0.25rem 0.5rem;" onclick="deleteNews('${n.id}')">X</button>
            </div>
        `).join('');
    }

    window.deleteNews = (id) => {
        if (confirm('¿Borrar novedad?')) {
            Storage.deleteNews(id);
            renderAdminNews();
        }
    };

    // --- Price Logic ---
    const priceInput = document.getElementById('priceInput');

    function renderPrice() {
        if (!priceInput) return;
        const currentPrice = Storage.getPrice();
        priceInput.value = currentPrice;
    }

    const savePriceBtn = document.getElementById('savePriceBtn');
    if (savePriceBtn) {
        savePriceBtn.addEventListener('click', () => {
            const value = parseInt(priceInput.value, 10);
            if (isNaN(value) || value <= 0) {
                alert('Ingresá un precio válido mayor a 0');
                return;
            }
            Storage.setPrice(value);
            alert('Precio actualizado correctamente');
        });
    }

    // --- Time Slots Logic ---
    const timeSlotLabel = document.getElementById('timeSlotLabel');
    const timeSlotActive = document.getElementById('timeSlotActive');
    const adminTimeSlotsList = document.getElementById('adminTimeSlotsList');

    document.getElementById('addTimeSlotBtn').addEventListener('click', () => {
        const label = (timeSlotLabel.value || '').trim();
        const active = timeSlotActive.checked;
        if (!label) {
            alert('Ingresá un horario válido, por ejemplo 17:00 - 19:00');
            return;
        }

        const timeSlots = Storage.getTimeSlots();
        const newSlot = {
            id: 'slot_' + Date.now().toString(),
            label,
            active
        };
        timeSlots.push(newSlot);
        Storage.saveTimeSlots(timeSlots);

        timeSlotLabel.value = '';
        timeSlotActive.checked = true;
        renderTimeSlots();
    });

    function renderTimeSlots() {
        const timeSlots = Storage.getTimeSlots();
        if (!adminTimeSlotsList) return;

        if (timeSlots.length === 0) {
            adminTimeSlotsList.innerHTML = '<p class="text-sm text-muted">No hay horarios configurados.</p>';
            return;
        }

        adminTimeSlotsList.innerHTML = timeSlots.map(slot => `
            <div class="card flex items-center justify-between p-4">
                <div>
                    <p class="font-bold">${slot.label}</p>
                    <p class="text-sm ${slot.active ? 'text-green-600' : 'text-muted'}">${slot.active ? 'Activo' : 'Bloqueado'}</p>
                </div>
                <div class="flex gap-2">
                    <button class="btn btn-outline" onclick="toggleTimeSlot('${slot.id}')">${slot.active ? 'Bloquear' : 'Activar'}</button>
                    <button class="btn btn-destructive" onclick="deleteTimeSlot('${slot.id}')">Eliminar</button>
                </div>
            </div>
        `).join('');
    }

    window.toggleTimeSlot = (id) => {
        Storage.toggleTimeSlotActive(id);
        renderTimeSlots();
    };

    window.deleteTimeSlot = (id) => {
        const timeSlots = Storage.getTimeSlots().filter(slot => slot.id !== id);
        Storage.saveTimeSlots(timeSlots);
        renderTimeSlots();
    };

    // Initial render
    renderReservations();
});
