export function setupFlashcard() {
    const cardArea = document.getElementById('flashcard-area');
    const contentDiv = document.getElementById('flashcard-content');
    const labelDiv = document.getElementById('card-label');
    const nextBtn = document.getElementById('next-card-btn');
    const rememberBtn = document.getElementById('remember-btn');
    const notRememberBtn = document.getElementById('notremember-btn');
    const favoriteStar = document.getElementById('favorite-star');
    const externalBtn = document.getElementById('load-external-btn');
    const externalDefsDiv = document.getElementById('external-defs');

    // State
    let currentCard = null;
    let isShowingDefinition = false;

    // 1. Fetch Data from Java Backend
    const loadCurrent = async () => {
        try {
            contentDiv.style.opacity = "0.5"; // Visual feedback
            
            // Connect to Spring Boot on Port 8080
            const res = await fetch('http://localhost:8080/flashcard');
            if (!res.ok) throw new Error("No content");
            const data = await res.json();
            
            if(data) {
                currentCard = data;
                isShowingDefinition = false; // Always start with Front
                updateDisplay();
                await updateFavoriteStar();
            }
            contentDiv.style.opacity = "1";
        } catch (e) {
            console.error("Flashcard fetch failed", e);
            contentDiv.innerText = "Error loading card.";
            contentDiv.style.opacity = "1";
        }
    };

    const advanceNext = async () => {
        try {
            contentDiv.style.opacity = "0.5";
            const res = await fetch('http://localhost:8080/flashcard/next', { method: 'POST' });
            if (!res.ok) throw new Error("Next failed");
            const data = await res.json();
            if (data) {
                currentCard = data;
                isShowingDefinition = false;
                updateDisplay();
                await updateFavoriteStar();
            }
            contentDiv.style.opacity = "1";
        } catch (e) {
            console.error("Advance next failed", e);
            contentDiv.innerText = "Error advancing.";
            contentDiv.style.opacity = "1";
        }
    };

    // 2. Update the Text (Front vs Back)
    const updateDisplay = () => {
        if (!currentCard) return;

        if (isShowingDefinition) {
            contentDiv.innerText = currentCard.definition;
            labelDiv.innerText = "Definition";
            contentDiv.style.fontSize = "1.8rem"; // Smaller font for long definitions
            // UPDATED: Use Deep Navy for Back
            cardArea.style.backgroundColor = "#0B162A"; 
        } else {
            contentDiv.innerText = currentCard.word;
            labelDiv.innerText = "Term";
            contentDiv.style.fontSize = "3.5rem"; // Big font for word
            // UPDATED: Use Lighter Navy for Front
            cardArea.style.backgroundColor = "#152238"; 
        }
    };

    // 3. Click to Flip
    cardArea.addEventListener('click', () => {
        if (!currentCard) return;
        isShowingDefinition = !isShowingDefinition;
        updateDisplay();
    });

    // 4. Click Arrow for Next
    nextBtn.addEventListener('click', (e) => {
        e.stopPropagation(); // Stop the click from also triggering a flip
        advanceNext();
    });

    // 5. Remember / Not Remember actions
    rememberBtn?.addEventListener('click', async (e) => {
        e.stopPropagation();
        try {
            await fetch('http://localhost:8080/flashcard/remember', { method: 'POST' });
            await loadCurrent();
        } catch (err) { console.error(err); }
    });

    notRememberBtn?.addEventListener('click', async (e) => {
        e.stopPropagation();
        try {
            await fetch('http://localhost:8080/flashcard/not-remember', { method: 'POST' });
            await loadCurrent();
        } catch (err) { console.error(err); }
    });

    // 6. Favorites toggle
    const updateFavoriteStar = async () => {
        if (!favoriteStar || !currentCard) return;
        try {
            const res = await fetch(`http://localhost:8080/favorites/${encodeURIComponent(currentCard.word)}`);
            const data = await res.json();
            const isFav = data.found === true;
            favoriteStar.style.color = isFav ? '#ffd700' : '#ffffff';
            favoriteStar.title = isFav ? 'Unfavorite' : 'Favorite';
        } catch {}
    };

    favoriteStar?.addEventListener('click', async (e) => {
        e.stopPropagation();
        if (!currentCard) return;
        try {
            const checkRes = await fetch(`http://localhost:8080/favorites/${encodeURIComponent(currentCard.word)}`);
            const check = await checkRes.json();
            if (check.found) {
                await fetch(`http://localhost:8080/favorites/${encodeURIComponent(currentCard.word)}`, { method: 'DELETE' });
            } else {
                await fetch(`http://localhost:8080/favorites/${encodeURIComponent(currentCard.word)}`, { method: 'POST' });
            }
            await updateFavoriteStar();
        } catch (err) { console.error(err); }
    });

    // 7. External definitions for current card
    externalBtn?.addEventListener('click', async (e) => {
        e.stopPropagation();
        if (!currentCard) return;
        externalDefsDiv.innerHTML = 'Loading external definitions...';
        try {
            const res = await fetch(`http://localhost:8080/external/definitions?word=${encodeURIComponent(currentCard.word)}`);
            const data = await res.json();
            if (data.status === 'ok' && Array.isArray(data.data) && data.data.length > 0) {
                const entry = data.data[0];
                const meanings = (entry.meanings || []).slice(0, 3);
                const html = meanings.map(m => {
                    const defs = (m.definitions || []).slice(0, 2).map(d => `• ${d.definition}`).join('<br/>');
                    return `<div><b>${m.partOfSpeech || ''}</b><br/>${defs}</div>`;
                }).join('<hr style="border-color:#586380;"/>');
                externalDefsDiv.innerHTML = html || 'No definitions available.';
            } else {
                externalDefsDiv.innerHTML = 'No external data found.';
            }
        } catch (err) {
            console.error(err);
            externalDefsDiv.innerHTML = 'Error loading external definitions.';
        }
    });

    // Load first card immediately
    loadCurrent();
}