import { setupSearch } from './components/searchBox.js';
import { setupSuggestions } from './components/suggestionBox.js';
import { updateHistory } from './components/historyList.js';
import { setupFlashcard } from './components/flashcardUI.js';
import { setupFlashcardsPage } from './components/flashcardsPage.js';

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