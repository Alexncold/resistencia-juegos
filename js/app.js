document.addEventListener('DOMContentLoaded', () => {
    // Auth Check
    const user = Storage.getUser();
    if (!user) {
        window.location.href = 'login.html';
        return;
    }

    // UI Elements
    const els = {
        userName: document.getElementById('userName'),
        userAvatar: document.getElementById('userAvatar'),
        logoutBtn: document.getElementById('logoutBtn'),
        historyBtn: document.getElementById('historyBtn'),
        notificationsBtn: document.getElementById('notificationsBtn'),
        notificationsIcon: document.getElementById('notificationsIcon'),
        playFreeBtn: document.getElementById('playFreeBtn'),

        // Calendar
        currentMonthDisplay: document.getElementById('currentMonthDisplay'),
        prevMonthBtn: document.getElementById('prevMonth'),
        nextMonthBtn: document.getElementById('nextMonth'),
        calendarGrid: document.getElementById('calendarGrid'),

        // Time
        timeSlotsContainer: document.getElementById('timeSlotsContainer'),

        // People
        decreasePeople: document.getElementById('decreasePeople'),
        increasePeople: document.getElementById('increasePeople'),
        peopleCount: document.getElementById('peopleCount'),

        // Game
        gameRadios: document.getElementsByName('gameSelection'),
        gameInputContainer: document.getElementById('gameInputContainer'),
        gameNameInput: document.getElementById('gameNameInput'),
        
        // WhatsApp
        whatsappInput: document.getElementById('whatsappNumber'),

        // Summary
        summaryDate: document.getElementById('summaryDate'),
        summaryTime: document.getElementById('summaryTime'),
        summaryPeople: document.getElementById('summaryPeople'),
        summaryGame: document.getElementById('summaryGame'),
        summaryTotal: document.getElementById('summaryTotal'),
        payBtn: document.getElementById('payBtn'),
        errorMsg: document.getElementById('errorMsg'),

        // News
        newsContainer: document.getElementById('newsContainer'),
        
        // Reservation modal
        reservationModal: document.getElementById('reservationModal'),
        closeReservationModal: document.getElementById('closeReservationModal'),
        cancelReservationBtn: document.getElementById('cancelReservationBtn'),
        confirmReservationBtn: document.getElementById('confirmReservationBtn'),
        copyAliasBtn: document.getElementById('copyAliasBtn'),
        aliasText: document.getElementById('aliasText'),
        modalDate: document.getElementById('modalDate'),
        modalTime: document.getElementById('modalTime'),
        modalPeople: document.getElementById('modalPeople'),
        modalGame: document.getElementById('modalGame'),
        modalTotal: document.getElementById('modalTotal'),

        // Free play modal
        freePlayModal: document.getElementById('freePlayModal'),
        freePlayTablesContainer: document.getElementById('freePlayTablesContainer'),
        freePlayEmptyState: document.getElementById('freePlayEmptyState'),
        closeFreePlayModal: document.getElementById('closeFreePlayModal')
    };

    // State
    let state = {
        currentDate: new Date(),
        selectedDate: null,
        selectedTime: null,
        people: 1,
        gameType: 'decide_later',
        gameName: '',
        phoneNumber: '',
        blockedDates: Storage.getBlockedDates(),
        specialDates: Storage.getSpecialDates()
    };

    // Init
    els.userName.textContent = user.name;
    els.userAvatar.textContent = user.avatar;
    const price = Storage.getPrice(); // precio por persona (base 5000)
    updateNotificationsIcon();
    renderCalendar();
    renderTimeSlots();
    renderNews();

    // Event Listeners
    els.logoutBtn.addEventListener('click', () => {
        Storage.logout();
        window.location.href = 'login.html';
    });

    if (els.historyBtn) {
        els.historyBtn.addEventListener('click', () => {
            window.location.href = 'history.html';
        });
    }

    if (els.playFreeBtn && els.freePlayModal) {
        els.playFreeBtn.addEventListener('click', () => {
            renderFreePlayTables();
            els.freePlayModal.classList.add('active');
            document.body.style.overflow = 'hidden';
        });

        els.closeFreePlayModal.addEventListener('click', () => {
            els.freePlayModal.classList.remove('active');
            document.body.style.overflow = '';
        });

        els.freePlayModal.addEventListener('click', (e) => {
            if (e.target === els.freePlayModal) {
                els.freePlayModal.classList.remove('active');
                document.body.style.overflow = '';
            }
        });
    }

    if (els.notificationsBtn) {
        els.notificationsBtn.addEventListener('click', (e) => {
            if (!hasConfirmedReservation()) return;

            const dropdown = document.getElementById('notificationsDropdown');
            if (!dropdown) return;

            e.stopPropagation();
            dropdown.classList.toggle('hidden');
        });
    }

    // Cerrar dropdown al hacer click fuera
    document.addEventListener('click', (e) => {
        const dropdown = document.getElementById('notificationsDropdown');
        if (!dropdown) return;

        // Si está oculto, no hacemos nada
        if (dropdown.classList.contains('hidden')) return;

        const clickInsideDropdown = dropdown.contains(e.target);
        const clickOnButton = els.notificationsBtn && els.notificationsBtn.contains(e.target);

        if (!clickInsideDropdown && !clickOnButton) {
            dropdown.classList.add('hidden');
        }
    });

    const notificationCheckIcon = document.getElementById('notificationCheckIcon');
    if (notificationCheckIcon) {
        notificationCheckIcon.addEventListener('click', (e) => {
            e.stopPropagation();
            const container = document.querySelector('#notificationsDropdown .notification-empty-title');
            const cardContent = document.querySelector('#notificationsDropdown .card-content');

            if (container) {
                container.textContent = 'No tenés notificaciones nuevas';
                container.style.fontWeight = '400';
            }

            if (cardContent) {
                cardContent.style.backgroundColor = '#ffffff';
            }

            // Volver el ícono de la campana al estado normal (sin notificación)
            if (els.notificationsIcon) {
                els.notificationsIcon.textContent = 'notifications';
            }
        });
    }

    els.prevMonthBtn.addEventListener('click', () => {
        const today = new Date();
        // Prevent going back before current month
        if (state.currentDate.getMonth() === today.getMonth() && state.currentDate.getFullYear() === today.getFullYear()) {
            return;
        }
        state.currentDate.setMonth(state.currentDate.getMonth() - 1);
        renderCalendar();
    });

    els.nextMonthBtn.addEventListener('click', () => {
        state.currentDate.setMonth(state.currentDate.getMonth() + 1);
        renderCalendar();
    });

    // Time Selection
    els.timeSlotsContainer.addEventListener('click', (e) => {
        if (e.target.classList.contains('time-slot')) {
            document.querySelectorAll('.time-slot').forEach(el => el.classList.remove('selected'));
            e.target.classList.add('selected');
            state.selectedTime = e.target.dataset.time;
            updateSummary();
        }
    });

    // People Selection
    els.decreasePeople.addEventListener('click', () => {
        if (state.people > 1) {
            state.people--;
            els.peopleCount.textContent = state.people;
            updateSummary();
        }
    });

    els.increasePeople.addEventListener('click', () => {
        if (state.people < 6) {
            state.people++;
            els.peopleCount.textContent = state.people;
            updateSummary();
        }
    });

    // Game Selection
    els.gameRadios.forEach(radio => {
        radio.addEventListener('change', (e) => {
            state.gameType = e.target.value;
            if (state.gameType === 'specific') {
                els.gameInputContainer.classList.remove('hidden');
            } else {
                els.gameInputContainer.classList.add('hidden');
                state.gameName = '';
                els.gameNameInput.value = '';
            }
            updateSummary();
        });
    });

    els.gameNameInput.addEventListener('input', (e) => {
        state.gameName = e.target.value;
        updateSummary();
    });

    // WhatsApp Input
    if (els.whatsappInput) {
        els.whatsappInput.addEventListener('input', (e) => {
            // Eliminar caracteres no numéricos excepto el signo + al principio
            let value = e.target.value;
            if (value.startsWith('+')) {
                // Si empieza con +, lo mantenemos y limpiamos el resto
                const rest = value.substring(1).replace(/[^0-9]/g, '');
                value = '+' + rest;
            } else {
                // Si no empieza con +, eliminamos todo lo que no sea número
                value = value.replace(/[^0-9]/g, '');
            }
            
            // Actualizar el valor en el input
            e.target.value = value;
            
            // Actualizar el estado
            state.phoneNumber = value;
            updateSummary();
        });
    }

    // Pay Button - Muestra el modal de confirmación
    els.payBtn.addEventListener('click', () => {
        if (!validate()) {
            alert('Por favor completá todos los pasos de la reserva: fecha, horario y juego (si elegiste "Tengo un juego en mente").');
            return;
        }
        
        // Mostrar el modal de confirmación
        showReservationModal();
    });
    
    // Mostrar el modal de confirmación con los datos de la reserva
    function showReservationModal() {
        const pricePerPerson = Storage.getPrice();
        const total = pricePerPerson * state.people;
        const gameName = state.gameType === 'specific' ? state.gameName : 'A decidir en el local';
        
        // Formatear la fecha
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        const formattedDate = state.selectedDate.toLocaleDateString('es-AR', options);
        
        // Actualizar el modal con los datos
        els.modalDate.textContent = formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1);
        els.modalTime.textContent = state.selectedTime;
        els.modalPeople.textContent = state.people;
        els.modalGame.textContent = gameName;
        
        // Actualizar totales
        const formattedTotal = total.toLocaleString('es-AR');
        els.modalTotal.textContent = `$${formattedTotal}`;
        
        // Actualizar el monto de transferencia
        const transferAmountEl = document.getElementById('modalTransferAmount');
        if (transferAmountEl) {
            transferAmountEl.textContent = `$${formattedTotal}`;
        }
        
        // Mostrar el modal
        els.reservationModal.style.display = 'flex';
        setTimeout(() => {
            els.reservationModal.classList.add('active');
        }, 10);
    }
    
    // Cerrar el modal de confirmación
    function closeReservationModal() {
        els.reservationModal.classList.remove('active');
        setTimeout(() => {
            els.reservationModal.style.display = 'none';
        }, 300);
    }
    
    // Función para copiar el alias al portapapeles
    function copyAliasToClipboard() {
        const aliasText = els.aliasText.textContent;
        navigator.clipboard.writeText(aliasText).then(() => {
            // Cambiar temporalmente el ícono a "check" para indicar que se copió
            const icon = els.copyAliasBtn.querySelector('.material-symbols-outlined');
            if (icon) {
                const originalText = icon.textContent;
                icon.textContent = 'check';
                els.copyAliasBtn.setAttribute('title', '¡Copiado!');
                
                // Restaurar el ícono después de 2 segundos
                setTimeout(() => {
                    icon.textContent = originalText;
                    els.copyAliasBtn.setAttribute('title', 'Copiar alias');
                }, 2000);
            }
        }).catch(err => {
            console.error('Error al copiar el alias:', err);
            alert('No se pudo copiar el alias. Por favor, cópialo manualmente.');
        });
    }

    // Event listeners para los botones del modal
    if (els.closeReservationModal) {
        els.closeReservationModal.addEventListener('click', closeReservationModal);
    }
    
    if (els.cancelReservationBtn) {
        els.cancelReservationBtn.addEventListener('click', closeReservationModal);
    }
    
    // Event listener para el botón de copiar alias
    if (els.copyAliasBtn) {
        els.copyAliasBtn.addEventListener('click', copyAliasToClipboard);
    }
    
    // Confirmar la reserva
    if (els.confirmReservationBtn) {
        els.confirmReservationBtn.addEventListener('click', () => {
            const pricePerPerson = Storage.getPrice();
            const total = pricePerPerson * state.people;
            const gameName = state.gameType === 'specific' ? state.gameName : 'A decidir en el local';
            
            const reservation = {
                id: Date.now().toString(),
                userId: user.email,
                userName: user.name,
                phoneNumber: state.phoneNumber, // Añadir el número de teléfono
                date: state.selectedDate.toISOString(),
                time: state.selectedTime,
                people: state.people,
                game: gameName,
                total: total,
                status: 'pending_payment',
                createdAt: new Date().toISOString()
            };

            Storage.addReservation(reservation);
            
            // Cerrar el modal
            closeReservationModal();
            
            // Mostrar mensaje de éxito y redirigir
            alert('¡Reserva creada con éxito! Pronto nos pondremos en contacto para confirmar el pago.');
            window.location.href = 'history.html';
        });
    }
    
    // Cerrar el modal al hacer clic fuera del contenido
    els.reservationModal.addEventListener('click', (e) => {
        if (e.target === els.reservationModal) {
            closeReservationModal();
        }
    });
    
    // Cerrar el modal con la tecla Escape
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && els.reservationModal.style.display === 'flex') {
            closeReservationModal();
        }
    });

    // Functions
    function renderTimeSlots() {
        const timeSlots = Storage.getTimeSlots().filter(slot => slot.active);
        if (!timeSlots.length) {
            els.timeSlotsContainer.innerHTML = '<p class="text-sm text-muted">No hay horarios disponibles. Consultá con el local.</p>';
            return;
        }

        els.timeSlotsContainer.innerHTML = '';
        timeSlots.forEach(slot => {
            const div = document.createElement('div');
            div.className = 'time-slot';
            div.dataset.time = slot.label;
            div.textContent = slot.label;
            els.timeSlotsContainer.appendChild(div);
        });
    }

    function renderCalendar() {
        const year = state.currentDate.getFullYear();
        const month = state.currentDate.getMonth();

        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const daysInMonth = lastDay.getDate();
        const startingDay = firstDay.getDay(); // 0 = Sun

        els.currentMonthDisplay.textContent = new Intl.DateTimeFormat('es-ES', { month: 'long', year: 'numeric' }).format(state.currentDate);

        els.calendarGrid.innerHTML = '';

        // Empty slots for previous month
        for (let i = 0; i < startingDay; i++) {
            const div = document.createElement('div');
            els.calendarGrid.appendChild(div);
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        for (let i = 1; i <= daysInMonth; i++) {
            const date = new Date(year, month, i);
            const dayOfWeek = date.getDay();
            const dateString = date.toISOString().split('T')[0];

            const div = document.createElement('div');
            div.className = 'calendar-day';
            div.textContent = i;

            // Logic: Thu(4), Fri(5), Sat(6), Sun(0) are allowed
            const isWeekend = [0, 4, 5, 6].includes(dayOfWeek);
            const isPast = date < today;
            const isBlocked = state.blockedDates.includes(dateString);
            const specialDateName = state.specialDates[dateString];

            if (!isWeekend || isPast || isBlocked) {
                div.classList.add('disabled');
            } else {
                if (specialDateName) {
                    div.style.backgroundColor = '#dbeafe';
                    div.style.color = '#1e40af';
                    div.style.fontWeight = 'bold';
                    div.title = specialDateName;

                    const indicator = document.createElement('div');
                    indicator.style.fontSize = '0.6rem';
                    indicator.textContent = '★';
                    div.appendChild(indicator);
                }

                div.addEventListener('click', () => {
                    document.querySelectorAll('.calendar-day').forEach(el => el.classList.remove('selected'));
                    div.classList.add('selected');
                    state.selectedDate = date;

                    // Show special date info if exists
                    const specialDateInfoEl = document.getElementById('specialDateInfo');
                    if (specialDateName) {
                        specialDateInfoEl.textContent = `★ ${specialDateName}`;
                        specialDateInfoEl.style.display = 'block';
                    } else {
                        specialDateInfoEl.style.display = 'none';
                    }

                    updateSummary();
                });
            }

            if (state.selectedDate && date.getTime() === state.selectedDate.getTime()) {
                div.classList.add('selected');
            }

            els.calendarGrid.appendChild(div);
        }
    }

    function updateSummary() {
        if (state.selectedDate) {
            els.summaryDate.textContent = state.selectedDate.toLocaleDateString('es-ES');
        } else {
            els.summaryDate.textContent = '--/--/----';
        }

        els.summaryTime.textContent = state.selectedTime || '--:--';
        els.summaryPeople.textContent = state.people;

        if (state.gameType === 'specific' && state.gameName) {
            els.summaryGame.textContent = state.gameName;
        } else if (state.gameType === 'specific') {
            els.summaryGame.textContent = '...';
        } else {
            els.summaryGame.textContent = 'A decidir en el local';
        }

        // Total = precio por persona * cantidad de personas
        const pricePerPerson = Storage.getPrice();
        const total = pricePerPerson * state.people;
        if (els.summaryTotal) {
            els.summaryTotal.textContent = `$${total}`;
        }

        validate(true);
    }

    function validate(silent = false) {
        let isValid = true;
        let error = '';

        if (!state.selectedDate) {
            isValid = false;
            error = 'Seleccioná una fecha';
        } else if (!state.selectedTime) {
            isValid = false;
            error = 'Seleccioná un horario';
        } else if (state.gameType === 'specific' && !state.gameName.trim()) {
            isValid = false;
            error = 'Ingresá el nombre del juego';
        } else if (!state.phoneNumber || !/^\+?[0-9\s-]+$/.test(state.phoneNumber)) {
            isValid = false;
            error = 'Ingresá un número de teléfono válido';
        }

        if (!silent && !isValid) {
            els.errorMsg.textContent = error;
            els.errorMsg.classList.remove('hidden');
        } else {
            els.errorMsg.classList.add('hidden');
        }

        return isValid;
    }

    function hasConfirmedReservation() {
        const reservations = Storage.getReservations ? Storage.getReservations() : [];
        return reservations.some(r => r.userId === user.email && r.status === 'confirmed');
    }

    function updateNotificationsIcon() {
        if (!els.notificationsIcon) return;

        const hasConfirmed = hasConfirmedReservation();
        els.notificationsIcon.textContent = hasConfirmed ? 'notifications_unread' : 'notifications';

        const dropdown = document.getElementById('notificationsDropdown');
        if (dropdown) {
            // Si no hay confirmadas, aseguramos que el dropdown esté oculto
            if (!hasConfirmed && !dropdown.classList.contains('hidden')) {
                dropdown.classList.add('hidden');
            }
        }
    }

    function renderNews() {
        const news = Storage.getNews();
        if (news.length === 0) {
            els.newsContainer.innerHTML = '<p class="text-muted">No hay novedades.</p>';
            return;
        }

        // Inject Modal HTML if not exists
        if (!document.getElementById('newsModal')) {
            const modalHtml = `
                <div id="newsModal" class="modal-overlay">
                    <div class="modal-content">
                        <button class="modal-close">&times;</button>
                        <h3 id="modalTitle" class="font-bold text-xl mb-4"></h3>
                        <img id="modalImage" src="" style="width:100%; height:200px; object-fit:cover; border-radius: 0.5rem; margin-bottom: 1rem;">
                        <p id="modalDesc" class="text-muted"></p>
                    </div>
                </div>
            `;
            document.body.insertAdjacentHTML('beforeend', modalHtml);

            // Modal Close Logic
            const modal = document.getElementById('newsModal');
            modal.querySelector('.modal-close').addEventListener('click', () => {
                modal.classList.remove('open');
            });
            modal.addEventListener('click', (e) => {
                if (e.target === modal) modal.classList.remove('open');
            });
        }

        let currentIndex = 0;
        let intervalId;

        function showNews(index) {
            const item = news[index];

            // Generate Dots
            const dotsHtml = news.map((_, i) =>
                `<div class="carousel-dot ${i === index ? 'active' : ''}" data-index="${i}"></div>`
            ).join('');

            const isLong = item.description.length > 100;
            const descHtml = isLong
                ? `<p class="text-muted text-sm news-desc-clamp">${item.description}</p>
                   <span class="read-more-link" data-index="${index}">Leer más</span>`
                : `<p class="text-muted text-sm">${item.description}</p>`;

            els.newsContainer.innerHTML = `
                <div class="carousel-container">
                    <div class="card news-card fade-in">
                        <img src="${item.image}" alt="${item.title}">
                        <div class="card-content mt-4">
                            <h3 class="font-bold text-lg mb-2">${item.title}</h3>
                            ${descHtml}
                        </div>
                    </div>
                </div>
                <div class="carousel-controls">
                    <button class="carousel-btn" id="prevNews">&lt;</button>
                    <div class="carousel-dots">
                        ${dotsHtml}
                    </div>
                    <button class="carousel-btn" id="nextNews">&gt;</button>
                </div>
            `;

            // Listeners
            document.getElementById('prevNews').addEventListener('click', () => {
                stopAutoPlay();
                currentIndex = (currentIndex - 1 + news.length) % news.length;
                showNews(currentIndex);
            });

            document.getElementById('nextNews').addEventListener('click', () => {
                stopAutoPlay();
                currentIndex = (currentIndex + 1) % news.length;
                showNews(currentIndex);
            });

            document.querySelectorAll('.carousel-dot').forEach(dot => {
                dot.addEventListener('click', (e) => {
                    stopAutoPlay();
                    currentIndex = parseInt(e.target.dataset.index);
                    showNews(currentIndex);
                });
            });

            // Read More Listener
            const readMoreBtn = els.newsContainer.querySelector('.read-more-link');
            if (readMoreBtn) {
                readMoreBtn.addEventListener('click', () => {
                    stopAutoPlay();
                    openModal(news[index]);
                });
            }
        }

        function openModal(item) {
            const modal = document.getElementById('newsModal');
            document.getElementById('modalTitle').textContent = item.title;
            document.getElementById('modalImage').src = item.image;
            document.getElementById('modalDesc').textContent = item.description;
            modal.classList.add('open');
        }

        function startAutoPlay() {
            intervalId = setInterval(() => {
                currentIndex = (currentIndex + 1) % news.length;
                showNews(currentIndex);
            }, 5000);
        }

        function stopAutoPlay() {
            if (intervalId) {
                clearInterval(intervalId);
                intervalId = null;
            }
        }

        // Initial render
        showNews(currentIndex);
        startAutoPlay();
    }

    function renderFreePlayTables() {
        if (!els.freePlayTablesContainer) return;

        const tables = Storage.getFreePlayTables();
        els.freePlayTablesContainer.innerHTML = '';

        if (!tables.length) {
            if (els.freePlayEmptyState) els.freePlayEmptyState.style.display = 'block';
            return;
        }

        if (els.freePlayEmptyState) els.freePlayEmptyState.style.display = 'none';

        tables.forEach(table => {
            const currentPlayers = table.players || [];
            const isFull = currentPlayers.length >= table.capacity;
            const alreadyJoined = currentPlayers.some(p => p.userId === user.email);
            const dateLabel = table.date ? new Date(table.date).toLocaleDateString('es-ES') : 'Fecha a definir';
            const timeLabel = table.timeRange || 'Horario a definir';

            const card = document.createElement('div');
            card.className = 'card';
            card.style.marginBottom = '1rem';

            const content = document.createElement('div');
            content.className = 'card-content';
            content.style.paddingTop = '1rem';
            content.style.paddingBottom = '1rem';

            const header = document.createElement('div');
            header.className = 'flex justify-between items-center mb-2';
            header.innerHTML = `
                <div>
                    <div class="text-sm text-muted">Mesa N° ${table.number} · ${dateLabel} · ${timeLabel}</div>
                    <div class="font-bold">
                        ${table.game}${alreadyJoined ? ' - <span style="font-weight: 400;">Ya estás anotado en esta mesa</span>' : ''}
                    </div>
                </div>
                <div class="text-sm text-muted">${currentPlayers.length}/${table.capacity} cupos</div>
            `;

            const actionRow = document.createElement('div');
            actionRow.className = 'mt-2 flex justify-end';

            const btn = document.createElement('button');

            if (alreadyJoined) {
                btn.className = 'btn btn-outline';
                btn.style.backgroundColor = '#F6F7F9';
                btn.textContent = 'Cancelar';
                btn.addEventListener('click', () => {
                    const success = Storage.removePlayerFromFreePlayTable(table.id, user.email);
                    if (!success) {
                        alert('No se pudo cancelar tu inscripción en la mesa');
                        return;
                    }
                    alert('Se canceló tu inscripción en esta mesa.');
                    renderFreePlayTables();
                });
            } else if (isFull) {
                btn.className = 'btn btn-primary';
                btn.textContent = 'Mesa completa';
                btn.disabled = true;
            } else {
                btn.className = 'btn btn-primary';
                btn.textContent = 'Anotarme';
                btn.addEventListener('click', () => {
                    const result = Storage.addPlayerToFreePlayTable(table.id, user);
                    if (!result.success) {
                        alert(result.error || 'No se pudo anotar en la mesa');
                        return;
                    }
                    alert('¡Te anotaste en la mesa!');
                    renderFreePlayTables();
                });
            }

            actionRow.appendChild(btn);
            content.appendChild(header);

            // En la página de reservas ya no mostramos el listado de participantes

            content.appendChild(actionRow);
            card.appendChild(content);
            els.freePlayTablesContainer.appendChild(card);
        });
    }
});
