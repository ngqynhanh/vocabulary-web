import { setupSearch } from './components/searchBox.js';
import { setupSuggestions } from './components/suggestionBox.js';
import { updateHistory } from './components/historyList.js';
import { setupFlashcard } from './components/flashcardUI.js';

// --- Shared Logic ---
const resultBox = document.getElementById('result-box');

async function handleSearch(word) {
    if (!resultBox) return; 
    resultBox.innerHTML = '<p>Searching...</p>';
    
    try {
        const res = await fetch(`http://localhost:8080/search?word=${word}`);
        const data = await res.json();

        if (data.found) {
            resultBox.innerHTML = `
                <h2 style="text-transform: capitalize;">${data.word}</h2>
                <p>${data.definition}</p>
            `;
        } else {
            let msg = `<p style="color:red;">Not found.</p>`;
            if (data.correction) {
                msg += `<p>Did you mean: <b>${data.correction}</b>?</p>`;
            }
            // Try external dictionary API via backend proxy
            try {
                const extRes = await fetch(`http://localhost:8080/external/definitions?word=${encodeURIComponent(word)}`);
                const ext = await extRes.json();
                if (ext.status === 'ok' && Array.isArray(ext.data) && ext.data.length > 0) {
                    const entry = ext.data[0];
                    const meanings = (entry.meanings || []).slice(0, 3);
                    const defsHtml = meanings.map(m => {
                        const defs = (m.definitions || []).slice(0, 2).map(d => `• ${d.definition}`).join('<br/>');
                        return `<div><b>${m.partOfSpeech || ''}</b><br/>${defs}</div>`;
                    }).join('<hr/>' );
                    msg += `<div style="margin-top:8px;">External definitions:<br/>${defsHtml}</div>`;
                } else {
                    msg += `<div style="margin-top:8px; color:#586380;">No external definitions found.</div>`;
                }
            } catch {}
            resultBox.innerHTML = msg;
        }
    } catch (err) {
        console.error(err);
        resultBox.innerHTML = `<p>Error connecting to backend.</p>`;
    }
}

// --- Main Initializer ---
document.addEventListener('DOMContentLoaded', () => {
    console.log("App Initializing...");

    // 1. Check if we are on the SEARCH page
    if (document.getElementById('search-input')) {
        console.log("Loading Search Module...");
        setupSearch(handleSearch);
        setupSuggestions(handleSearch);
    }

    // 2. Check if we are on the FLASHCARD page (UPDATED ID)
    if (document.getElementById('flashcard-content')) {
        console.log("Loading Flashcard Module...");
        setupFlashcard();
    }

    // 3. Check if we are on the HISTORY page
    if (document.getElementById('history-list')) {
        console.log("Loading History Module...");
        updateHistory();
    }
});