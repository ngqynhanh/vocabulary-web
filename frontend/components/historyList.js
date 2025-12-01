//Job: Show what happened in the past.

export async function updateHistory() {
    const list = document.getElementById('history-list');
    
    try {
        // UPDATED: Port 8080
        //Logic: It calls /history. 
        //Java checks its Stack (LIFO - Last In, First Out) and sends back the list.
        const res = await fetch('http://localhost:8080/history');
        const items = await res.json();

        //UI: It clears the current list and re-draws it every time you search.
        list.innerHTML = '';
        items.forEach(word => {
            const div = document.createElement('div');
            div.className = 'history-item';
            div.innerText = `🕒 ${word}`;
            list.appendChild(div);
        });
    } catch (e) {
        console.error("History fetch failed", e);
        list.innerHTML = '<div class="history-item">...</div>';
    }
}