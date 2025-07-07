// js/guest-management.js - Guest and RSVP Management

/**
 * Privacy-aware guest search
 */
function searchGuests() {
    const searchTerm = document.getElementById('guest-search-input').value.toLowerCase();
    const resultsContainer = document.getElementById('guest-search-results');
    
    // Get all guest names
    const allGuests = [
        ...guestList.map(name => ({ name, type: 'existing' })),
        ...additionalGuests.map(guest => ({ name: guest.name, type: 'additional' }))
    ];
    
    if (searchTerm.length === 0) {
        // When no search term and guest view is restricted, show message
        if (!eventPermissions.allowGuestView && !isEventOwner()) {
            resultsContainer.innerHTML = '<p style="text-align: center; color: #718096; padding: 20px;">Start typing your name to search...</p>';
        } else {
            // Show all guests for owners or when guest view is allowed
            renderGuestSearchResults(allGuests);
        }
        return;
    }
    
    // Filter by search term with fuzzy matching
    const filtered = allGuests.filter(guest => {
        const guestName = guest.name.toLowerCase();
        const searchLower = searchTerm.toLowerCase();
        
        // Exact match
        if (guestName.includes(searchLower)) return true;
        
        // Fuzzy match for common misspellings
        const cleanGuest = guestName.replace(/[^a-z]/g, '');
        const cleanSearch = searchLower.replace(/[^a-z]/g, '');
        
        // Check if cleaned names match
        if (cleanGuest.includes(cleanSearch)) return true;
        
        // Check if first few characters match (for typos at the end)
        if (cleanSearch.length >= 3 && cleanGuest.startsWith(cleanSearch.substring(0, 3))) return true;
        
        return false;
    }).sort((a, b) => {
        // Sort by relevance
        const aName = a.name.toLowerCase();
        const bName = b.name.toLowerCase();
        const searchLower = searchTerm.toLowerCase();
        
        // Exact matches first
        const aExact = aName === searchLower;
        const bExact = bName === searchLower;
        if (aExact !== bExact) return bExact - aExact;
        
        // Then by how early the match appears
        const aIndex = aName.indexOf(searchLower);
        const bIndex = bName.indexOf(searchLower);
        if (aIndex !== bIndex) return aIndex - bIndex;
        
        // Finally alphabetically
        return aName.localeCompare(bName);
    });
    
    renderGuestSearchResults(filtered);
}

/**
 * Render guest search results
 */
function renderGuestSearchResults(guests) {
    const container = document.getElementById('guest-search-results');
    
    if (guests.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #718096; padding: 20px;">No matching names found</p>';
        return;
    }
    
    container.innerHTML = guests.map(guest => `
        <button class="person-btn" onclick="selectGuest('${guest.name.replace(/'/g, "\\'")}', '${guest.type}')" 
                style="display: block; width: 100%; text-align: left; margin: 3px 0; padding: 12px; background: #f7fafc; border: 1px solid #e2e8f0; border-radius: 8px; cursor: pointer; transition: all 0.2s;">
            ${guest.name}
        </button>
    `).join('');
}

/**
 * Select guest from search results
 */
function selectGuest(guestName, guestType) {
    selectedGuestName = guestName;
    selectedGuestType = guestType;
    
    // Close search modal
    document.getElementById('guest-name-modal').style.display = 'none';
    
    // Show RSVP modal
    document.getElementById('rsvp-guest-name').textContent = `Hello, ${guestName}!`;
    document.getElementById('guest-rsvp-modal').style.display = 'flex';
}

/**
 * Add new guest from search
 */
function addNewGuest() {
    const searchInput = document.getElementById('guest-search-input');
    const name = searchInput.value.trim();
    
    if (!name) {
        alert('Please enter your name first.');
        return;
    }
    
    selectedGuestName = name;
    selectedGuestType = 'new';
    
    // Close search modal
    document.getElementById('guest-name-modal').style.display = 'none';
    
    // Show RSVP modal
    document.getElementById('rsvp-guest-name').textContent = `Hello, ${name}!`;
    document.getElementById('guest-rsvp-modal').style.display = 'flex';
}

/**
 * Submit guest RSVP
 */
function submitGuestRSVP(status) {
    if (!selectedGuestName) return;
    
    console.log('Submitting RSVP:', { selectedGuestName, status, selectedGuestType });
    
    currentGuestName = selectedGuestName;
    localStorage.setItem(`guest_name_${currentEventId}`, selectedGuestName);
    
    const guestCount = status === 'coming' ? 
        parseInt(document.getElementById('guest-count-input').value) || 1 : 0;
    
    try {
        if (selectedGuestType === 'existing') {
            // Update existing guest in main list
            if (!rsvpData[selectedGuestName]) {
                rsvpData[selectedGuestName] = { status: 'pending', guests: 1, previousGuests: 1 };
            }
            rsvpData[selectedGuestName].status = status;
            rsvpData[selectedGuestName].guests = guestCount;
            if (status === 'coming') {
                rsvpData[selectedGuestName].previousGuests = guestCount;
            }
        } else if (selectedGuestType === 'additional') {
            // Update existing additional guest
            const additionalGuest = additionalGuests.find(g => g.name === selectedGuestName);
            if (additionalGuest) {
                additionalGuest.status = status;
                additionalGuest.guests = guestCount;
                if (status === 'coming') {
                    additionalGuest.previousGuests = guestCount;
                }
            }
        } else {
            // Add new guest
            additionalGuests.push({
                name: selectedGuestName,
                status: status,
                guests: guestCount,
                previousGuests: guestCount
            });
        }
        
        // Close RSVP modal
        document.getElementById('guest-rsvp-modal').style.display = 'none';
        
        // Update display and save
        if (typeof updateDisplay === 'function') updateDisplay();
        saveStateToFirebase();
        
        // Show restricted view
        if (typeof showGuestRestrictedView === 'function') {
            showGuestRestrictedView();
        }
        
    } catch (error) {
        console.error('Error submitting RSVP:', error);
        alert('There was an error saving your RSVP. Please try again.');
    }
}

/**
 * Set RSVP status for existing guest
 */
function setRSVPStatus(member, status) {
    if (!rsvpData[member]) {
        rsvpData[member] = { status: 'pending', guests: 1, previousGuests: 1 };
    }
    
    if (status === 'coming') {
        if (rsvpData[member].status === 'coming') {
            rsvpData[member].previousGuests = rsvpData[member].guests;
        }
        rsvpData[member].status = 'coming';
        rsvpData[member].guests = rsvpData[member].previousGuests || 1;
    } else if (status === 'not-coming') {
        if (rsvpData[member].status === 'coming') {
            rsvpData[member].previousGuests = rsvpData[member].guests;
        }
        rsvpData[member].status = 'not-coming';
        rsvpData[member].guests = 0;
    }
    
    // Update display immediately
    if (typeof updateDisplay === 'function') updateDisplay();
    
    // Save to Firebase
    saveStateToFirebase();
}

/**
 * Set RSVP status for additional guest
 */
function setAdditionalGuestStatus(index, status) {
    if (additionalGuests[index]) {
        if (status === 'coming') {
            if (additionalGuests[index].status === 'coming') {
                additionalGuests[index].previousGuests = additionalGuests[index].guests || 1;
            }
            additionalGuests[index].status = 'coming';
            additionalGuests[index].guests = additionalGuests[index].previousGuests || 1;
        } else if (status === 'not-coming') {
            if (additionalGuests[index].status === 'coming') {
                additionalGuests[index].previousGuests = additionalGuests[index].guests || 1;
            }
            additionalGuests[index].status = 'not-coming';
            additionalGuests[index].guests = 0;
        }
        
        if (typeof updateDisplay === 'function') updateDisplay();
        saveStateToFirebase();
    }
}

/**
 * Toggle RSVP status (for owners)
 */
function toggleRSVP(member) {
    if (!rsvpData[member]) {
        rsvpData[member] = { status: 'pending', guests: 1, previousGuests: 1 };
    }
    
    const current = rsvpData[member].status;
    
    if (current === 'pending') {
        rsvpData[member].status = 'coming';
        rsvpData[member].guests = rsvpData[member].previousGuests || 1;
    } else if (current === 'coming') {
        rsvpData[member].previousGuests = rsvpData[member].guests;
        rsvpData[member].status = 'not-coming';
        rsvpData[member].guests = 0;
    } else if (current === 'not-coming') {
        rsvpData[member].status = 'pending';
        rsvpData[member].guests = 0;
    }
    
    if (typeof updateDisplay === 'function') updateDisplay();
    saveStateToFirebase();
}

/**
 * Update guest count
 */
function updateGuestCount(member, count) {
    const newCount = parseInt(count) || 1;
    rsvpData[member].guests = newCount;
    
    // Store as previous count for when they switch status
    if (rsvpData[member].status === 'coming') {
        rsvpData[member].previousGuests = newCount;
    }
    
    if (typeof updateGuestSummary === 'function') updateGuestSummary();
    saveStateToFirebase();
}

/**
 * Update additional guest count
 */
function updateAdditionalGuestCount(index, count) {
    const newCount = parseInt(count) || 1;
    additionalGuests[index].guests = newCount;
    
    // Store as previous count for when they switch status
    if (additionalGuests[index].status === 'coming') {
        additionalGuests[index].previousGuests = newCount;
    }
    
    if (typeof updateGuestSummary === 'function') updateGuestSummary();
    saveStateToFirebase();
}

/**
 * Show guest name prompt
 */
function showGuestNamePrompt() {
    // Don't show prompt for event owners
    if (isEventOwner()) {
        return;
    }
    
    // Check if guest name is already stored
    const storedName = localStorage.getItem(`guest_name_${currentEventId}`);
    if (storedName) {
        currentGuestName = storedName;
        console.log('Found stored guest name:', storedName);
        
        // Apply appropriate UI restrictions
        if (typeof showGuestRestrictedView === 'function') {
            showGuestRestrictedView();
        }
        return;
    }
    
    console.log('Showing guest name prompt with permissions:', eventPermissions);
    
    // Show the modal
    document.getElementById('guest-name-modal').style.display = 'flex';
    document.getElementById('guest-search-input').focus();
    
    // Initialize search results based on permissions
    searchGuests();
}

/**
 * Show guest count section for RSVP
 */
function showGuestCountForRSVP() {
    document.getElementById('guest-count-section').style.display = 'block';
}

/**
 * First match selection
 */
function selectFirstMatch() {
    const firstButton = document.querySelector('#guest-search-results .person-btn');
    if (firstButton) {
        firstButton.click();
    }
}