export function setupFlashcard() {
    const cardArea = document.getElementById('flashcard-area');
    const contentDiv = document.getElementById('flashcard-content');
    const labelDiv = document.getElementById('card-label');
    const nextBtn = document.getElementById('next-card-btn');

    // State
    let currentCard = null;
    let isShowingDefinition = false;

    // 1. Fetch Data from Java Backend
    const loadNext = async () => {
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
            }
            contentDiv.style.opacity = "1";
        } catch (e) {
            console.error("Flashcard fetch failed", e);
            contentDiv.innerText = "Error loading card.";
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
        loadNext();
    });

    // Load first card immediately
    loadNext();
}