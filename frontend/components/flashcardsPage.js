// Prevent multiple initializations
let isInitialized = false;
let isActive = false; // Track if we're still on the flashcards page


// Helper function to check if we're still on the flashcards page
function isOnFlashcardsPage() {
    try {
        // First check: URL must contain flashcards.html
        const currentPath = window.location.pathname || window.location.href;
        if (!currentPath.includes('flashcards.html')) {
            return false;
        }
        
        const flashcardArea = document.getElementById('flashcard-area');
        const flashcardLayout = document.querySelector('.flashcard-layout');
        const cardCounter = document.getElementById('card-counter');
        
        // All elements must exist AND be in the document
        if (!flashcardArea || !flashcardLayout || !cardCounter) {
            return false;
        }
        
        // Verify they're actually in the DOM
        if (!document.contains(flashcardArea) || 
            !document.contains(flashcardLayout) || 
            !document.contains(cardCounter)) {
            return false;
        }
        
        // Verify flashcard-area is inside the layout
        return flashcardArea.closest('.flashcard-layout') === flashcardLayout;
    } catch (e) {
        // If any error occurs, assume we're not on the page
        return false;
    }
}

export function setupFlashcardsPage() {
    // Always check if we're actually on the flashcards page first
    if (!isOnFlashcardsPage()) {
        // Reset flags if we're not on the page
        isInitialized = false;
        isActive = false;
        return;
    }

    // Prevent multiple initializations on the same page
    if (isInitialized && isActive) {
        console.warn('Flashcards page already initialized');
        return;
    }

    // Early exit if required elements don't exist
    const cardArea = document.getElementById('flashcard-area');
    const counter = document.getElementById('card-counter');
    if (!cardArea || !counter) {
        console.warn('Flashcards page elements not found');
        isInitialized = false;
        isActive = false;
        return;
    }

    // Mark as initialized and active
    isInitialized = true;
    isActive = true;

    // Toast notifications (shared with flashcards page)
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

    // Reset flags when page unloads
    const handleBeforeUnload = () => {
        isActive = false;
        isInitialized = false;
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    
    // Also check visibility API and page state
    const handleVisibilityChange = () => {
        if (document.hidden || !isOnFlashcardsPage()) {
            isActive = false;
        } else if (isOnFlashcardsPage()) {
            isActive = true;
        }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Temporary cache for history
    const historyCache = {
        words: null,        // Cached word list from backend
        cards: null,        // Cached flashcard data
        timestamp: null     // When cache was created
    };
    const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes cache duration

    // Flashcard data
    const data = {
        history: [],
        favorites: [],
        'not-remembered': [],
        animals: [],
        coding: []
    };

    // State
    const state = {
        currentSet: 'history',
        currentIndex: 0,
        isFlipped: false,
        lastCounterValue: null // Track last counter value to prevent unnecessary updates
    };

    // DOM Elements - query them fresh to ensure they exist
    function getElements() {
        return {
            cardArea: document.getElementById('flashcard-area'),
            content: document.getElementById('flashcard-content'),
            label: document.getElementById('card-label'),
            titleText: document.getElementById('set-title-text'),
            titleIcon: document.getElementById('set-title-icon'),
            counter: document.getElementById('card-counter'),
            prevBtn: document.getElementById('prev-btn'),
            nextBtn: document.getElementById('next-btn'),
            setBtns: document.querySelectorAll('.set-btn'),
            favoriteBtn: document.getElementById('favorite-btn'),
            notRememberBtn: document.getElementById('not-remember-btn'),
            rememberBtn: document.getElementById('remember-btn')
        };
    }
    
    let elements = getElements();

    // Check if cache is still valid
    function isCacheValid() {
        if (!historyCache.timestamp || !historyCache.cards) {
            return false;
        }
        const age = Date.now() - historyCache.timestamp;
        return age < CACHE_DURATION;
    }

    // Clear the history cache
    function clearHistoryCache() {
        historyCache.words = null;
        historyCache.cards = null;
        historyCache.timestamp = null;
    }

    // Fetch favorites from backend
    async function fetchFavoritesSet() {
        if (!isOnFlashcardsPage() || !isActive) {
            return [];
        }
        
        try {
            const res = await fetch('http://localhost:8080/flashcard/favorites');
            if (!isOnFlashcardsPage() || !isActive) {
                return [];
            }
            
            const cards = await res.json();
            if (!Array.isArray(cards)) return [];
            
            // Convert to our format
            return cards.map(card => ({
                term: card.word,
                def: card.definition
            }));
        } catch (err) {
            console.error('Failed to load favorites set', err);
            return [];
        }
    }

    // Fetch not-remembered from backend
    async function fetchNotRememberedSet() {
        if (!isOnFlashcardsPage() || !isActive) {
            return [];
        }
        
        try {
            const res = await fetch('http://localhost:8080/flashcard/not-remembered');
            if (!isOnFlashcardsPage() || !isActive) {
                return [];
            }
            
            const cards = await res.json();
            if (!Array.isArray(cards)) return [];
            
            // Convert to our format
            return cards.map(card => ({
                term: card.word,
                def: card.definition
            }));
        } catch (err) {
            console.error('Failed to load not-remembered set', err);
            return [];
        }
    }

    // Fetch sample sets (animals, coding) from backend static resources
    async function fetchSampleSet(setName) {
        if (!isOnFlashcardsPage() || !isActive) {
            return [];
        }

        try {
            const res = await fetch(`http://localhost:8080/flashcard/sample/${encodeURIComponent(setName)}`);
            if (!isOnFlashcardsPage() || !isActive) {
                return [];
            }

            const cards = await res.json();
            if (!Array.isArray(cards)) return [];

            return cards.map(card => ({
                term: card.word,
                def: card.definition
            }));
        } catch (err) {
            console.error(`Failed to load ${setName} set`, err);
            return [];
        }
    }

    // Load a flashcard set
    async function fetchHistorySet(forceRefresh = false) {
        // Check before starting
        if (!isOnFlashcardsPage() || !isActive) {
            return [];
        }

        // Return cached data if available and valid (unless forcing refresh)
        if (!forceRefresh && isCacheValid() && historyCache.cards) {
            return historyCache.cards;
        }
        
        try {
            const res = await fetch('http://localhost:8080/history');
            // Check after first fetch
            if (!isOnFlashcardsPage() || !isActive) {
                return historyCache.cards || [];
            }
            
            const words = await res.json();
            if (!Array.isArray(words) || words.length === 0) {
                // Cache empty result
                historyCache.words = [];
                historyCache.cards = [];
                historyCache.timestamp = Date.now();
                return [];
            }

            // Check if words list has changed
            const wordsChanged = !historyCache.words || 
                JSON.stringify(historyCache.words) !== JSON.stringify(words);

            // Only fetch definitions if words changed or cache is invalid
            let cards;
            if (wordsChanged || !historyCache.cards) {
                cards = await Promise.all(words.map(async (word) => {
                    // Check before each word fetch
                    if (!isOnFlashcardsPage() || !isActive) {
                        return null;
                    }
                    
                    try {
                        const searchRes = await fetch(`http://localhost:8080/search?word=${encodeURIComponent(word)}`);
                        const searchData = await searchRes.json();
                        const def = searchData?.definition || searchData?.meaning || searchData?.def || 'No definition available.';
                        return { term: word, def };
                    } catch {
                        return { term: word, def: 'No definition available.' };
                    }
                }));
                
                // Filter out nulls (from cancelled fetches)
                cards = cards.filter(card => card !== null);
            } else {
                // Use cached cards if words haven't changed
                cards = historyCache.cards;
            }
            
            // Update cache
            historyCache.words = words;
            historyCache.cards = cards;
            historyCache.timestamp = Date.now();
            
            return cards;
        } catch (err) {
            console.error('Failed to load history set', err);
            // Return cached data if available, even if expired
            return historyCache.cards || [];
        }
    }

    async function loadSet(setName) {
        // Check if we're still on the flashcards page
        if (!isActive || !isOnFlashcardsPage()) {
            return;
        }

        // Safety check: ensure elements still exist
        if (!elements.content || !elements.cardArea || !elements.label || !elements.counter) {
            return;
        }

        // Don't reload if already on this set (unless it's a dynamic set that can change)
        // Dynamic sets: history, favorites, not-remembered (can change)
        // Static sets: animals, coding (don't change)
        const dynamicSets = ['history', 'favorites', 'not-remembered'];
        const isDynamicSet = dynamicSets.includes(setName);
        
        if (!isDynamicSet && state.currentSet === setName && data[setName] && data[setName].length > 0) {
            return;
        }

        // Show loading state
        elements.content.textContent = 'Loading...';
        elements.cardArea.style.backgroundColor = "#152238";
        elements.label.textContent = 'TERM';
        elements.counter.textContent = '...';
        state.lastCounterValue = null; // Reset counter tracking
        state.currentSet = setName;
        state.currentIndex = 0;
        state.isFlipped = false;

        // Update Sidebar Active State
        if (elements.setBtns && elements.setBtns.length > 0) {
            elements.setBtns.forEach(btn => btn.classList.remove('active'));
            const activeBtn = document.getElementById(`btn-${setName}`);
            if (activeBtn) activeBtn.classList.add('active');
        }

        // Update Header
        const icons = { 
            history: 'icon/history-icon.png', 
            favorites: 'icon/star-symbol-icon.png', 
            'not-remembered': 'icon/cross-icon.png',
            animals: 'icon/paw-icon.png', 
            coding: 'icon/computer-laptop-icon.png' 
        };
        const titles = { 
            history: 'Search History', 
            favorites: 'Favorites',
            'not-remembered': 'Not Remembered',
            animals: 'Animals', 
            coding: 'Programming' 
        };
        if (elements.titleIcon) {
            elements.titleIcon.innerHTML = '';
            const img = document.createElement('img');
            img.src = icons[setName] || 'icon/history-icon.png';
            img.alt = titles[setName] || setName;
            img.className = 'icon-img';
            elements.titleIcon.appendChild(img);
        }
        if (elements.titleText) elements.titleText.textContent = titles[setName] || setName;

        // Load set-specific data from backend
        if (setName === 'history') {
            data.history = await fetchHistorySet();
        } else if (setName === 'favorites') {
            data.favorites = await fetchFavoritesSet();
        } else if (setName === 'not-remembered') {
            data['not-remembered'] = await fetchNotRememberedSet();
        } else if (setName === 'animals' || setName === 'coding') {
            data[setName] = await fetchSampleSet(setName);
        }

        // CRITICAL: Double-check we're still on the page after async operation
        if (!isOnFlashcardsPage()) {
            isActive = false;
            return;
        }
        if (!isActive) {
            return;
        }
        // Verify elements still exist after async
        if (!elements.counter || !document.contains(elements.counter)) {
            isActive = false;
            return;
        }

        // Update UI based on current set
        updateActionButtons();
        
        // Re-setup event listeners to ensure buttons are properly initialized
        // This is important for sample sets to ensure buttons work
        setupEventListeners();
        
        // Update favorite button status after loading set
        updateFavoriteButton();

        renderCard();
    }

    // Update action buttons visibility based on current set
    function updateActionButtons() {
        const isNotRememberedSet = state.currentSet === 'not-remembered';
        const isFavoritesSet = state.currentSet === 'favorites';
        
        // Show/hide remember button (only for not-remembered set)
        if (elements.rememberBtn) {
            elements.rememberBtn.style.display = isNotRememberedSet ? 'block' : 'none';
        }
        
        // Show/hide not-remember button (hide for not-remembered set)
        if (elements.notRememberBtn) {
            elements.notRememberBtn.style.display = isNotRememberedSet ? 'none' : 'block';
        }
        
        // Update favorite button visibility
        if (elements.favoriteBtn) {
            elements.favoriteBtn.style.display = 'block';
        }
    }

    // Toggle favorite status
    async function toggleFavorite() {
        console.log('toggleFavorite called');
        const set = data[state.currentSet];
        if (!set || set.length === 0) {
            console.log('No set or empty set');
            return;
        }
        
        const card = set[state.currentIndex];
        if (!card || !card.term) {
            console.log('No card or card.term');
            return;
        }

        console.log('Toggling favorite for:', card.term);
        try {
            // Check if already favorite
            const checkRes = await fetch(`http://localhost:8080/favorites/${encodeURIComponent(card.term)}`);
            if (!checkRes.ok) {
                console.error('Failed to check favorite status');
                return;
            }
            const check = await checkRes.json();
            
            if (check.found) {
                // Remove from favorites
                const deleteRes = await fetch(`http://localhost:8080/favorites/${encodeURIComponent(card.term)}`, { method: 'DELETE' });
                if (deleteRes.ok) {
                    updateFavoriteButton(false);
                    
                    // If we're on favorites set, reload it
                    if (state.currentSet === 'favorites') {
                        data.favorites = await fetchFavoritesSet();
                        // Adjust index if needed
                        if (state.currentIndex >= data.favorites.length && data.favorites.length > 0) {
                            state.currentIndex = data.favorites.length - 1;
                        }
                        renderCard();
                    }
                }
            } else {
                // Add to favorites - include definition for sample sets
                const addRes = await fetch(`http://localhost:8080/favorites/${encodeURIComponent(card.term)}`, { 
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        definition: card.def || ''
                    })
                });
                if (addRes.ok) {
                    updateFavoriteButton(true);
                }
            }
        } catch (err) {
            console.error('Failed to toggle favorite', err);
        }
    }

    // Mark card as not remembered
    async function markAsNotRemembered() {
        console.log('markAsNotRemembered called');
        const set = data[state.currentSet];
        if (!set || set.length === 0) {
            console.log('No set or empty set');
            return;
        }
        
        const card = set[state.currentIndex];
        if (!card || !card.term) {
            console.log('No card or card.term');
            return;
        }

        console.log('Marking as not remembered:', card.term);
        try {
            // Check if card already pending
            let alreadyExists = false;
            try {
                const pendingRes = await fetch('http://localhost:8080/flashcard/pending');
                const pendingWords = await pendingRes.json();
                alreadyExists = Array.isArray(pendingWords) && pendingWords.includes(card.term);
            } catch (checkErr) {
                console.warn('Pending check failed; proceeding anyway', checkErr);
            }

            // Include definition in body for sample sets
            const res = await fetch(`http://localhost:8080/flashcard/not-remembered/${encodeURIComponent(card.term)}`, { 
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    definition: card.def || ''
                })
            });
            if (!res.ok) {
                console.error('Failed to mark as not remembered, status:', res.status);
                const errorData = await res.json().catch(() => ({}));
                console.error('Error details:', errorData);
                showNotification('Could not add card to review stack. Please try again.', 'warning');
                return;
            }
            const result = await res.json();
            console.log('Mark as not remembered result:', result);
            console.log('Card term:', card.term, 'Already exists:', alreadyExists);

            if (alreadyExists) {
                showNotification('⚠️ Card already in review stack!', 'warning');
            } else {
                showNotification('✓ Card added to review stack', 'success');
            }
            
            // Reload not-remembered set if we're viewing it
            if (state.currentSet === 'not-remembered') {
                data['not-remembered'] = await fetchNotRememberedSet();
                renderCard();
            } else {
                // Auto-advance to next card on sample sets
                nextCard();
            }
        } catch (err) {
            console.error('Failed to mark as not remembered', err);
        }
    }

    // Mark card as remembered (remove from not-remembered)
    async function markAsRemembered() {
        const set = data[state.currentSet];
        if (!set || set.length === 0) return;
        
        const card = set[state.currentIndex];
        if (!card) return;

        try {
            await fetch(`http://localhost:8080/flashcard/not-remembered/${encodeURIComponent(card.term)}/remember`, { method: 'POST' });
            
            // Remove from current set and reload
            if (state.currentSet === 'not-remembered') {
                data['not-remembered'] = await fetchNotRememberedSet();
                
                // Adjust index if needed
                if (state.currentIndex >= data['not-remembered'].length) {
                    if (data['not-remembered'].length > 0) {
                        state.currentIndex = data['not-remembered'].length - 1;
                    } else {
                        state.currentIndex = 0;
                    }
                }
                renderCard();
            }
        } catch (err) {
            console.error('Failed to mark as remembered', err);
        }
    }

    // Update favorite button appearance
    async function updateFavoriteButton(isFavorite) {
        if (!elements.favoriteBtn) return;
        
        if (isFavorite === undefined) {
            // Check current status
            const set = data[state.currentSet];
            if (!set || set.length === 0) {
                elements.favoriteBtn.innerHTML = '<img src="icon/star-black-icon.png" alt="Not favorite" class="icon-img">';
                elements.favoriteBtn.style.filter = '';
                return;
            }
            
            const card = set[state.currentIndex];
            if (!card) return;
            
            try {
                const res = await fetch(`http://localhost:8080/favorites/${encodeURIComponent(card.term)}`);
                const favoriteData = await res.json();
                isFavorite = favoriteData.found === true;
            } catch {
                isFavorite = false;
            }
        }
        
        elements.favoriteBtn.innerHTML = isFavorite
            ? '<img src="icon/star-symbol-icon.png" alt="Favorite" class="icon-img">'
            : '<img src="icon/star-black-icon.png" alt="Not favorite" class="icon-img">';
        elements.favoriteBtn.style.filter = '';
    }

    // Render the current card
    function renderCard() {
        // CRITICAL: Check if we're still on the flashcards page FIRST
        // This prevents updates when navigating away
        if (!isOnFlashcardsPage()) {
            isActive = false;
            return;
        }

        if (!isActive) {
            return;
        }

        // Safety check: ensure elements still exist and are in the document
        if (!elements.counter || !elements.content || !elements.label) {
            return;
        }

        // Verify elements are still in the DOM and belong to current document
        if (!document.contains(elements.counter) || 
            !document.contains(elements.content) ||
            !document.contains(elements.label)) {
            isActive = false;
            return;
        }

        // Double-check the counter element is actually the one from flashcards page
        const currentCounter = document.getElementById('card-counter');
        if (currentCounter !== elements.counter) {
            isActive = false;
            return;
        }

        const set = data[state.currentSet];
        if (!set || set.length === 0) {
            // Final check before updating empty state
            if (!isOnFlashcardsPage() || !isActive || !document.contains(elements.counter)) {
                isActive = false;
                return;
            }
            elements.content.textContent = 'No cards in this set';
            elements.label.textContent = 'TERM';
            elements.counter.textContent = '0 / 0';
            return;
        }

        // Ensure currentIndex is within bounds (only adjust if truly out of bounds)
        const total = set.length;
        if (state.currentIndex < 0 || state.currentIndex >= total) {
            state.currentIndex = 0;
        }

        const card = set[state.currentIndex];
        
        // Update Counter - only update if value actually changed AND we're still on the page
        // CRITICAL: Final check right before DOM update to prevent any updates after navigation
        if (!isOnFlashcardsPage() || !isActive || !document.contains(elements.counter)) {
            isActive = false;
            return;
        }
        
        const counterValue = card && total > 0 ? `${state.currentIndex + 1} / ${total}` : '0 / 0';
        if (state.lastCounterValue !== counterValue) {
            // One more check right before updating - this is the final gate
            if (isOnFlashcardsPage() && isActive && document.contains(elements.counter)) {
                // Verify the counter element is still the same
                const verifyCounter = document.getElementById('card-counter');
                if (verifyCounter === elements.counter) {
                    elements.counter.textContent = counterValue;
                    state.lastCounterValue = counterValue;
                } else {
                    isActive = false;
                    return;
                }
            }
        }
        
        if (!card || total === 0) {
            return;
        }

        // Update Visuals based on Flip State
        if (state.isFlipped) {
            elements.content.textContent = card.def;
            elements.content.style.fontSize = "1.5rem";
            elements.label.textContent = "DEFINITION";
            elements.cardArea.style.backgroundColor = "#0B162A";
        } else {
            elements.content.textContent = card.term;
            elements.content.style.fontSize = "3rem";
            elements.label.textContent = "TERM";
            elements.cardArea.style.backgroundColor = "#152238";
        }

        // Update favorite button status
        updateFavoriteButton();
    }

    // Flip the card
    function flipCard() {
        const set = data[state.currentSet];
        if (!set || set.length === 0) return; // Don't flip if no cards
        
        state.isFlipped = !state.isFlipped;
        renderCard();
    }

    // Navigate to next card (loops back to first card)
    function nextCard() {
        const set = data[state.currentSet];
        const setLength = set ? set.length : 0;
        if (setLength === 0) return;
        
        const oldIndex = state.currentIndex;
        // Loop back to first card if at the end
        state.currentIndex = (state.currentIndex + 1) % setLength;
        console.log(`nextCard: ${oldIndex} -> ${state.currentIndex} (set: ${state.currentSet}, length: ${setLength})`);
        state.isFlipped = false;
        renderCard();
    }

    // Navigate to previous card (loops back to last card)
    function prevCard() {
        const set = data[state.currentSet];
        const setLength = set ? set.length : 0;
        if (setLength === 0) return;
        
        const oldIndex = state.currentIndex;
        // Loop back to last card if at the beginning
        state.currentIndex = (state.currentIndex - 1 + setLength) % setLength;
        console.log(`prevCard: ${oldIndex} -> ${state.currentIndex} (set: ${state.currentSet}, length: ${setLength})`);
        state.isFlipped = false;
        renderCard();
    }

    // Store handler references to prevent duplicates
    let cardAreaClickHandler = null;
    let prevBtnClickHandler = null;
    let nextBtnClickHandler = null;

    // Setup event listeners
    function setupEventListeners() {
        // Refresh elements
        elements = getElements();
        
        // Remove old listeners if they exist to prevent duplicates
        if (elements.cardArea && cardAreaClickHandler) {
            elements.cardArea.removeEventListener('click', cardAreaClickHandler);
        }
        if (elements.prevBtn && prevBtnClickHandler) {
            elements.prevBtn.removeEventListener('click', prevBtnClickHandler);
        }
        if (elements.nextBtn && nextBtnClickHandler) {
            elements.nextBtn.removeEventListener('click', nextBtnClickHandler);
        }
        
        // Create new handlers
        cardAreaClickHandler = (e) => {
            // Don't flip if clicking on buttons
            if (e.target.closest('.card-icons') || e.target.closest('.card-actions')) {
                return;
            }
            flipCard();
        };
        
        prevBtnClickHandler = (e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log('Prev button clicked, current index:', state.currentIndex);
            prevCard();
        };
        
        nextBtnClickHandler = (e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log('Next button clicked, current index:', state.currentIndex);
            nextCard();
        };
        
        // Add new listeners
        if (elements.cardArea) {
            elements.cardArea.addEventListener('click', cardAreaClickHandler);
        }

        if (elements.prevBtn) {
            // Verify it's the correct button
            if (elements.prevBtn.id !== 'prev-btn') {
                console.error('Prev button ID mismatch!', elements.prevBtn.id);
            }
            elements.prevBtn.addEventListener('click', prevBtnClickHandler);
        } else {
            console.warn('Prev button not found!');
        }

        if (elements.nextBtn) {
            // Verify it's the correct button
            if (elements.nextBtn.id !== 'next-btn') {
                console.error('Next button ID mismatch!', elements.nextBtn.id);
            }
            elements.nextBtn.addEventListener('click', nextBtnClickHandler);
        } else {
            console.warn('Next button not found!');
        }

        // Favorite button - use onclick to replace any existing handler
        if (elements.favoriteBtn) {
            elements.favoriteBtn.onclick = async (e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('Favorite button clicked for:', data[state.currentSet]?.[state.currentIndex]?.term);
                await toggleFavorite();
            };
        }

        // Not Remember button
        if (elements.notRememberBtn) {
            elements.notRememberBtn.onclick = async (e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('Not remember button clicked for:', data[state.currentSet]?.[state.currentIndex]?.term);
                await markAsNotRemembered();
            };
        }

        // Remember button (for not-remembered set)
        if (elements.rememberBtn) {
            elements.rememberBtn.onclick = async (e) => {
                e.preventDefault();
                e.stopPropagation();
                await markAsRemembered();
            };
        }
    }
    
    // Initialize event listeners
    setupEventListeners();

    // Set up set buttons
    if (elements.setBtns && elements.setBtns.length > 0) {
        elements.setBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const setName = btn.id.replace('btn-', '');
                loadSet(setName);
            });
        });
    }

    // Expose loadSet, nextCard, prevCard, and cache functions to window
    window.flashcardsApp = {
        loadSet,
        nextCard,
        prevCard,
        refreshHistory: () => {
            clearHistoryCache();
            if (state.currentSet === 'history') {
                loadSet('history');
            }
        },
        refreshFavorites: () => {
            if (state.currentSet === 'favorites') {
                loadSet('favorites');
            }
        },
        clearHistoryCache,
        getHistoryCache: () => ({ ...historyCache })
    };

    // Load initial set only if we're on the flashcards page
    if (document.getElementById('flashcard-area') && document.querySelector('.flashcard-layout')) {
        loadSet('history');
    }
}

