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

        // Summary
        summaryDate: document.getElementById('summaryDate'),
        summaryTime: document.getElementById('summaryTime'),
        summaryPeople: document.getElementById('summaryPeople'),
        summaryGame: document.getElementById('summaryGame'),
        payBtn: document.getElementById('payBtn'),
        errorMsg: document.getElementById('errorMsg'),

        // News
        newsContainer: document.getElementById('newsContainer')
    };

    // State
    let state = {
        currentDate: new Date(),
        selectedDate: null,
        selectedTime: null,
        people: 2,
        gameType: 'decide_later',
        gameName: '',
        blockedDates: Storage.getBlockedDates(),
        specialDates: Storage.getSpecialDates()
    };

    // Init
    els.userName.textContent = user.name;
    els.userAvatar.textContent = user.avatar;
    renderCalendar();
    renderNews();

    // Event Listeners
    els.logoutBtn.addEventListener('click', () => {
        Storage.logout();
        window.location.href = 'login.html';
    });

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

    // Pay Button
    els.payBtn.addEventListener('click', () => {
        if (!validate()) return;

        const reservation = {
            userId: user.email,
            userName: user.name,
            date: state.selectedDate.toISOString(),
            time: state.selectedTime,
            people: state.people,
            game: state.gameType === 'specific' ? state.gameName : 'A decidir en el local',
            total: 5000
        };

        Storage.addReservation(reservation);
        alert('¡Reserva creada con éxito! Redirigiendo a MercadoPago...');
        // Reset or redirect
        window.location.reload();
    });

    // Functions
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
        }

        els.payBtn.disabled = !isValid;

        if (!silent && !isValid) {
            els.errorMsg.textContent = error;
            els.errorMsg.classList.remove('hidden');
        } else {
            els.errorMsg.classList.add('hidden');
        }

        return isValid;
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
});
