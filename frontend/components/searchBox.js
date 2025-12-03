//Job: It watches the Input field and the "Search" button.

export function setupSearch(onSearch) {
    const input = document.getElementById('search-input');
    const btn = document.getElementById('search-btn');

    //The "Callback": Notice it takes a parameter called onSearch. 
    // When the user types "apple" and hits Enter, this file doesn't actually search. 
    // It just calls onSearch("apple"). 
    // It passes the ball back to app.js.
    const triggerSearch = () => {
        const word = input.value.trim();
        if(word) onSearch(word);
    };

    //Logic: It listens for a click or the Enter key.
    btn.addEventListener('click', triggerSearch);
    
    // Allow pressing "Enter"
    input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') triggerSearch();
    });
}