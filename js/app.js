// js/app.js

window.onload = function() {
    // 1. Laad opgeslagen data
    loadStateFromStorage();
    
    // 2. Zet standaardwachtwoord als het nog niet bestaat
    if (!localStorage.getItem('biljartAdminPassword')) {
        setAdminPassword(DEFAULT_PASSWORD);
    }
    
    // 3. Initialiseer datumvelden
    const dateInput = document.getElementById('dateSelect');
    if (dateInput) {
        dateInput.value = state.selectedDate;
        dateInput.addEventListener('change', function() { state.selectedDate = this.value; });
        dateInput.addEventListener('input', function() { state.selectedDate = this.value; });
    }
    
    // 4. Start swipe-blokkade voor scoring pagina
    initSwipeProtection();
    
    // 5. Luister naar 'Enter' in wachtwoordveld
    const passwordField = document.getElementById('adminPassword');
    if (passwordField) {
        passwordField.addEventListener('keypress', function(event) {
            if (event.key === 'Enter') checkPassword();
        });
    }
    
    // 6. Initialiseer score display
    updateCurrentScoreDisplay();
};
