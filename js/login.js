document.addEventListener('DOMContentLoaded', () => {
    const loginBtn = document.getElementById('googleLoginBtn');

    // Check if already logged in
    const user = Storage.getUser();
    if (user) {
        window.location.href = 'index.html';
        return;
    }

    loginBtn.addEventListener('click', () => {
        // Simulate Google Login
        const user = Storage.login();

        // Show loading or transition?
        loginBtn.textContent = 'Iniciando sesión...';
        loginBtn.disabled = true;

        setTimeout(() => {
            window.location.href = 'index.html';
        }, 800);
    });
});
