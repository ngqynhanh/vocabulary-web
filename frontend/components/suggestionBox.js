//Job: Real-time feedback.
export function setupSuggestions(onSelect) {
    const input = document.getElementById('search-input');
    const box = document.getElementById('suggestion-box');

    //Logic: It uses the input event (triggers every time you type a letter).
    input.addEventListener('input', async () => {
        const prefix = input.value;
        if (prefix.length < 1) {
            box.style.display = 'none';
            return;
        }

        try {
            // UPDATED: Port 8080
            //Talking to Java: It calls /suggest?q=app. 
            //Java uses the Trie data structure to return ["apple", "application", "apricot"] instantly.
            const res = await fetch(`http://localhost:8080/suggest?q=${prefix}`);
            const words = await res.json();

            //Render UI: It creates a small list of divs. 
            //If you click one, it puts that word into the input box and runs the search.
            box.innerHTML = '';
            if (words.length > 0) {
                box.style.display = 'block';
                words.forEach(word => {
                    const div = document.createElement('div');
                    div.innerText = word;
                    div.onclick = () => {
                        input.value = word;
                        box.style.display = 'none';
                        onSelect(word);
                    };
                    box.appendChild(div);
                });
            } else {
                box.style.display = 'none';
            }
        } catch (e) {
            console.error("Suggestion fetch failed", e);
        }
    });
}