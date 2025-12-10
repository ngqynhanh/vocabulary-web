export function setupFlashcard() {
    // Helper function to show toast notifications
    const showNotification = (message, type = 'info') => {
        const notification = document.createElement('div');
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 20px;
            background: ${type === 'success' ? '#4caf50' : type === 'warning' ? '#ff9800' : '#2196f3'};
            color: white;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.2);
            z-index: 10000;
            font-weight: 600;
            font-size: 0.95rem;
            animation: slideIn 0.3s ease-out;
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease-out';
            setTimeout(() => notification.remove(), 300);
        }, 2500);
    };
    
    // Add CSS animations for notification
    if (!document.getElementById('notification-styles')) {
        const style = document.createElement('style');
        style.id = 'notification-styles';
        style.textContent = `
            @keyframes slideIn {
                from { transform: translateX(400px); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
            @keyframes slideOut {
                from { transform: translateX(0); opacity: 1; }
                to { transform: translateX(400px); opacity: 0; }
            }
        `;
        document.head.appendChild(style);
    }

    const cardArea = document.getElementById('flashcard-area');
    const contentDiv = document.getElementById('flashcard-content');
    const labelDiv = document.getElementById('card-label');
    const nextBtn = document.getElementById('next-card-btn');
    const rememberBtn = document.getElementById('remember-btn');
    const notRememberBtn = document.getElementById('not-remember-btn');
    const favoriteStar = document.getElementById('favorite-btn');
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
            contentDiv.style.fontSize = "1.5rem"; // Smaller font for long definitions
            // UPDATED: Use Deep Navy for Back
            cardArea.style.backgroundColor = "#0B162A"; 
        } else {
            contentDiv.innerText = currentCard.word;
            labelDiv.innerText = "Term";
            contentDiv.style.fontSize = "2.5rem"; // Big font for word
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
            if (!currentCard) return;
            
            // Check if word already in pending stack
            const pendingRes = await fetch('http://localhost:8080/flashcard/pending');
            const pendingWords = await pendingRes.json();
            const alreadyExists = pendingWords.includes(currentCard.word);
            
            // Add to not-remembered stack
            await fetch('http://localhost:8080/flashcard/not-remember', { method: 'POST' });
            
            // Show notification
            if (alreadyExists) {
                showNotification('⚠️ Card already in review stack!', 'warning');
            } else {
                showNotification('✓ Card added to review stack', 'success');
            }
            
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