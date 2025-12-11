import { setupSearch } from './components/searchBox.js';
import { setupSuggestions } from './components/suggestionBox.js';
import { updateHistory } from './components/historyList.js';
import { setupFlashcard } from './components/flashcardUI.js';
import { setupFlashcardsPage } from './components/flashcardsPage.js';

// --- Shared Logic ---
const resultBox = document.getElementById('result-box');

async function handleSearch(word) {
    if (!resultBox) return; 
    const term = (word || '').trim();
    if (!term) {
        resultBox.innerHTML = '<p>Please enter a word to search.</p>';
        return;
    }

    resultBox.innerHTML = '<p>Searching...</p>';
    
    try {
        const res = await fetch(`http://localhost:8080/search?word=${encodeURIComponent(term)}`);
        const data = await res.json();

        if (data.found) {
            const definition = data.definition || 'No definition available';
            resultBox.innerHTML = `
                <h2 style="text-transform: capitalize;">${data.word}</h2>
                <p>${definition}</p>
                <div style="margin-top:12px; display:flex; gap:10px; align-items:center;">
                    <button id="fav-btn" class="btn-primary" style="padding:8px 14px;">★ Save favorite</button>
                    <span id="fav-status" style="color:#586380; font-size:0.9rem;"></span>
                </div>
            `;
            attachFavoriteHandlers(data.word, definition, 'search');
        } else {
            let msg = `<p style="color:red;">Word not found in dictionary.</p>`;
            if (data.correction) {
                msg += `<p>Did you mean: <b>${data.correction}</b>?</p>`;
            }
            // Add button to navigate to translate page (only if term is non-empty)
            msg += `
                <div style="margin-top: 15px;">
                    <button 
                        onclick="window.location.href='translate.html?text=${encodeURIComponent(term)}'" 
                        style="padding: 10px 20px; background: #4285f4; color: white; border: none; 
                               border-radius: 6px; font-weight: 600; cursor: pointer; font-size: 0.95rem;
                               transition: all 0.2s;"
                        onmouseover="this.style.background='#3367d6'"
                        onmouseout="this.style.background='#4285f4'">
                        📝 Translate "${term}"
                    </button>
                </div>
            `;
            // Try external dictionary API via backend proxy
            let externalDefinition = null;
            try {
                const extRes = await fetch(`http://localhost:8080/external/definitions?word=${encodeURIComponent(term)}`);
                const ext = await extRes.json();
                if (ext.status === 'ok' && Array.isArray(ext.data) && ext.data.length > 0) {
                    const entry = ext.data[0];
                    const meanings = (entry.meanings || []).slice(0, 3);
                    const defsHtml = meanings.map(m => {
                        const defs = (m.definitions || []).slice(0, 2).map(d => `• ${d.definition}`).join('<br/>');
                        return `<div><b>${m.partOfSpeech || ''}</b><br/>${defs}</div>`;
                    }).join('<hr/>' );
                    msg += `<div style="margin-top:8px;">External definitions:<br/>${defsHtml}</div>`;
                    
                    // Extract first definition for favorites
                    if (entry.meanings && entry.meanings.length > 0) {
                        const firstDef = entry.meanings[0].definitions && entry.meanings[0].definitions[0];
                        if (firstDef) {
                            externalDefinition = firstDef.definition;
                        }
                    }
                } else {
                    msg += `<div style="margin-top:8px; color:#586380;">No external definitions found.</div>`;
                }
            } catch {}
            
            // Add "Add to favorites" button if word not in dictionary
            msg += `
                <div style="margin-top:15px;">
                    <button id="add-unknown-fav-btn" class="btn-primary" style="padding:8px 14px;">
                        ★ Add to favorites
                    </button>
                    <span id="add-unknown-fav-status" style="margin-left:8px; color:#586380; font-size:0.9rem;"></span>
                </div>
            `;
            
            resultBox.innerHTML = msg;
            
            // Attach handler for unknown word favorite button
            attachFavoriteForUnknownWord(term, externalDefinition);
        }
    } catch (err) {
        console.error(err);
        resultBox.innerHTML = `<p>Error connecting to backend.</p>`;
    }
}

async function handleTranslate(text) {
    const resultEl = document.getElementById('translate-result');
    if (!resultEl) return;
    resultEl.innerHTML = 'Translating...';
    try {
        const res = await fetch(`http://localhost:8080/translate?text=${encodeURIComponent(text)}`, {
            method: 'POST'
        });
        const data = await res.json();
        if (data.status === 'ok') {
            resultEl.innerHTML = `<b>${text}</b><br/>→ ${data.translation}`;
            attachFavoriteButtonForTranslate(text, data.translation);
        } else {
            resultEl.innerHTML = `<p style="color:red;">Translation failed.</p><p style="color:#586380; font-size:0.85rem;">${data.error || 'Unknown error'}</p>`;
            console.error('Translation API error:', data);
        }
    } catch (err) {
        console.error(err);
        resultEl.innerHTML = 'Error calling translate API. Backend may be down.';
    }
}

// --- Main Initializer ---
// --- Favorites helpers ---
async function attachFavoriteHandlers(word, definition, category) {
    const btn = document.getElementById('fav-btn');
    const status = document.getElementById('fav-status');
    if (!btn || !status) return;

    const updateLabel = (isFav) => {
        btn.textContent = isFav ? '★ Remove favorite' : '★ Save favorite';
        status.textContent = isFav ? 'Saved to favorites' : '';
    };

    try {
        const check = await fetch(`http://localhost:8080/favorites/${encodeURIComponent(word)}`);
        const checkData = await check.json();
        updateLabel(checkData.found === true);
    } catch {}

    btn.onclick = async () => {
        try {
            const check = await fetch(`http://localhost:8080/favorites/${encodeURIComponent(word)}`);
            const checkData = await check.json();
            const isFav = checkData.found === true;
            if (isFav) {
                await fetch(`http://localhost:8080/favorites/${encodeURIComponent(word)}`, { method: 'DELETE' });
                updateLabel(false);
            } else {
                await fetch(`http://localhost:8080/favorites/${encodeURIComponent(word)}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ definition, category })
                });
                updateLabel(true);
                // Add to flashcard rotation stack
                try {
                    await fetch('http://localhost:8080/flashcard/add-favorite', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ word: word.toLowerCase(), definition })
                    });
                } catch (err) {
                    console.error('Failed to add favorite to flashcard stack:', err);
                }
                // Refresh flashcard favorites if page is open
                if (window.flashcardsApp && typeof window.flashcardsApp.refreshFavorites === 'function') {
                    window.flashcardsApp.refreshFavorites();
                }
            }
        } catch (err) {
            console.error('Favorite toggle failed', err);
        }
    };
}

function attachFavoriteForUnknownWord(word, externalDefinition) {
    const btn = document.getElementById('add-unknown-fav-btn');
    const status = document.getElementById('add-unknown-fav-status');
    if (!btn || !status) return;

    const showToastMsg = (msg, type) => {
        const toast = document.createElement('div');
        toast.textContent = msg;
        toast.style.cssText = `
            position: fixed; top: 20px; right: 20px; padding: 15px 20px;
            background: ${type === 'success' ? '#4caf50' : '#ff9800'};
            color: white; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.2);
            z-index: 10001; font-weight: 600; font-size: 0.95rem;
            animation: slideIn 0.3s ease-out;
        `;
        document.body.appendChild(toast);
        setTimeout(() => {
            toast.style.animation = 'slideOut 0.3s ease-out';
            setTimeout(() => toast.remove(), 300);
        }, 2500);
    };

    const updateLabel = (isFav) => {
        btn.textContent = isFav ? '★ Remove favorite' : '★ Add to favorites';
        status.textContent = isFav ? 'Added to favorites' : '';
        btn.disabled = false;
    };

    btn.disabled = true;
    status.textContent = '';

    const checkAndWire = async () => {
        try {
            const check = await fetch(`http://localhost:8080/favorites/${encodeURIComponent(word)}`);
            const checkData = await check.json();
            updateLabel(checkData.found === true);
        } catch (err) {
            console.error('Favorite check failed:', err);
            btn.disabled = false;
        }

        btn.onclick = async () => {
            btn.disabled = true;
            try {
                const check = await fetch(`http://localhost:8080/favorites/${encodeURIComponent(word)}`);
                const checkData = await check.json();
                const isFav = checkData.found === true;
                if (isFav) {
                    const delRes = await fetch(`http://localhost:8080/favorites/${encodeURIComponent(word)}`, { method: 'DELETE' });
                    if (delRes.ok) {
                        updateLabel(false);
                        showToastMsg('Removed from favorites', 'warning');
                    } else {
                        btn.disabled = false;
                    }
                } else {
                    // Use external definition if available, otherwise use default
                    const definition = externalDefinition || `Word from search (no dictionary definition available)`;
                    const addRes = await fetch(`http://localhost:8080/favorites/${encodeURIComponent(word)}`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ definition, category: 'unknown' })
                    });
                    if (addRes.ok) {
                        updateLabel(true);
                        showToastMsg('✓ Added to favorites', 'success');
                        // Add to flashcard rotation stack
                        try {
                            await fetch('http://localhost:8080/flashcard/add-favorite', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ word: word.toLowerCase(), definition })
                            });
                        } catch (err) {
                            console.error('Failed to add to flashcard stack:', err);
                        }
                        // Refresh flashcard favorites if page is open
                        if (window.flashcardsApp && typeof window.flashcardsApp.refreshFavorites === 'function') {
                            window.flashcardsApp.refreshFavorites();
                        }
                    } else {
                        btn.disabled = false;
                    }
                }
            } catch (err) {
                console.error('Favorite toggle failed', err);
                btn.disabled = false;
            }
        };
    };

    checkAndWire();
}

// Toast animation styles
if (!document.getElementById('toast-styles')) {
    const style = document.createElement('style');
    style.id = 'toast-styles';
    style.textContent = `
        @keyframes slideIn { from { transform: translateX(400px); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
        @keyframes slideOut { from { transform: translateX(0); opacity: 1; } to { transform: translateX(400px); opacity: 0; } }
    `;
    document.head.appendChild(style);
}

document.addEventListener('DOMContentLoaded', () => {
    console.log("App Initializing...");

    // 1. Check if we are on the SEARCH page
    if (document.getElementById('search-input')) {
        console.log("Loading Search Module...");
        setupSearch(handleSearch);
        setupSuggestions(handleSearch);
    }

    // 2. Check if we are on the FLASHCARD page (with sidebar layout)
    // Only initialize if we're actually on the flashcards page
    const flashcardArea = document.getElementById('flashcard-area');
    const flashcardLayout = document.querySelector('.flashcard-layout');
    const flashcardContent = document.getElementById('flashcard-content');
    const cardCounter = document.getElementById('card-counter');
    
    // Only initialize if ALL required elements exist (prevents false positives)
    if (flashcardArea && flashcardLayout && cardCounter && 
        flashcardArea.closest('.flashcard-layout') === flashcardLayout) {
        console.log("Loading Flashcards Page Module...");
        setupFlashcardsPage();
    }
    // 2b. Check if we are on the simple FLASHCARD page (backend-driven)
    else if (flashcardContent && !flashcardLayout) {
        console.log("Loading Flashcard Module...");
        setupFlashcard();
    }

    // 3. Check if we are on the HISTORY page
    if (document.getElementById('history-list')) {
        console.log("Loading History Module...");
        updateHistory();
    }
});