// js/event-management.js - Main Event Management Functions

// Initialize bring items
function initializeBringData() {
    bringItems.forEach(item => {
        if (!bringData[item]) {
            bringData[item] = { assigned: false, person: null };
        }
    });
}

// Update display function
function updateDisplay() {
    updateGuestSummary();
    updateRSVPList();
    updateBringList();
    updateEventDetails();
}

// Update guest summary
function updateGuestSummary() {
    const totalGuests = Object.values(rsvpData).reduce((sum, data) => 
        data.status === 'coming' ? sum + data.guests : sum, 0) + 
        additionalGuests.reduce((sum, guest) => 
            guest.status === 'coming' ? sum + guest.guests : sum, 0);
    
    const attendingCount = Object.values(rsvpData).filter(data => data.status === 'coming').length + 
        additionalGuests.filter(guest => guest.status === 'coming').length;
    
    const pendingCount = Object.values(rsvpData).filter(data => data.status === 'pending').length + 
        additionalGuests.filter(guest => guest.status === 'pending').length;
    
    const notAttendingCount = Object.values(rsvpData).filter(data => data.status === 'not-coming').length + 
        additionalGuests.filter(guest => guest.status === 'not-coming').length;
    
    const summary = document.getElementById('guest-summary');
    if (summary) {
        summary.innerHTML = `
            <div class="summary-stats">
                <span class="stat coming">✅ ${attendingCount} Coming (${totalGuests} guests)</span>
                <span class="stat pending">⏳ ${pendingCount} Pending</span>
                <span class="stat not-coming">❌ ${notAttendingCount} Not Coming</span>
            </div>
            <div class="filter-buttons">
                <button class="filter-btn ${currentFilter === null ? 'active' : ''}" onclick="filterGuests(null)">All</button>
                <button class="filter-btn ${currentFilter === 'coming' ? 'active' : ''}" onclick="filterGuests('coming')">Coming</button>
                <button class="filter-btn ${currentFilter === 'pending' ? 'active' : ''}" onclick="filterGuests('pending')">Pending</button>
                <button class="filter-btn ${currentFilter === 'not-coming' ? 'active' : ''}" onclick="filterGuests('not-coming')">Not Coming</button>
            </div>
        `;
    }
}

// Filter guests
function filterGuests(filter) {
    currentFilter = filter;
    updateGuestSummary();
    updateRSVPList();
}

// Update RSVP list
function updateRSVPList() {
    const rsvpList = document.getElementById('rsvp-list');
    if (!rsvpList) return;
    
    // Check if guest view is restricted
    if (!eventPermissions.allowGuestView && !isEventOwner()) {
        rsvpList.innerHTML = '<p style="text-align: center; color: #718096; padding: 20px;">Guest list is private</p>';
        return;
    }
    
    const allGuests = [
        ...guestList.map(name => ({ name, type: 'main', data: rsvpData[name] || { status: 'pending', guests: 1 } })),
        ...additionalGuests.map((guest, index) => ({ ...guest, type: 'additional', index }))
    ];
    
    // Apply filter
    const filteredGuests = currentFilter ? 
        allGuests.filter(guest => guest.status === currentFilter || guest.data?.status === currentFilter) : 
        allGuests;
    
    if (filteredGuests.length === 0) {
        rsvpList.innerHTML = '<p style="text-align: center; color: #718096; padding: 20px;">No guests match the current filter</p>';
        return;
    }
    
    rsvpList.innerHTML = filteredGuests.map(guest => {
        const guestData = guest.data || guest;
        const status = guestData.status;
        const guestCount = guestData.guests || 1;
        
        let statusClass = 'status-pending';
        let statusIcon = '⏳';
        if (status === 'coming') {
            statusClass = 'status-coming';
            statusIcon = '✅';
        } else if (status === 'not-coming') {
            statusClass = 'status-not-coming';
            statusIcon = '❌';
        }
        
        const isOwner = isEventOwner();
        const canEdit = isOwner || eventPermissions.allowGuestEdits;
        
        return `
            <div class="rsvp-item ${statusClass}">
                <div class="guest-info">
                    <span class="guest-name">${guest.name}</span>
                    <span class="guest-status">${statusIcon} ${status === 'coming' ? `${guestCount} guest${guestCount > 1 ? 's' : ''}` : status.replace('-', ' ')}</span>
                </div>
                ${canEdit ? `
                    <div class="rsvp-controls">
                        ${guest.type === 'main' ? `
                            <button class="status-btn ${status === 'coming' ? 'active' : ''}" onclick="setRSVPStatus('${guest.name}', 'coming')">✅</button>
                            <button class="status-btn ${status === 'not-coming' ? 'active' : ''}" onclick="setRSVPStatus('${guest.name}', 'not-coming')">❌</button>
                            ${status === 'coming' ? `<input type="number" value="${guestCount}" min="1" onchange="updateGuestCount('${guest.name}', this.value)" style="width: 50px; margin-left: 10px;">` : ''}
                        ` : `
                            <button class="status-btn ${status === 'coming' ? 'active' : ''}" onclick="setAdditionalGuestStatus(${guest.index}, 'coming')">✅</button>
                            <button class="status-btn ${status === 'not-coming' ? 'active' : ''}" onclick="setAdditionalGuestStatus(${guest.index}, 'not-coming')">❌</button>
                            ${status === 'coming' ? `<input type="number" value="${guestCount}" min="1" onchange="updateAdditionalGuestCount(${guest.index}, this.value)" style="width: 50px; margin-left: 10px;">` : ''}
                        `}
                    </div>
                ` : ''}
            </div>
        `;
    }).join('');
}

// Update bring list
function updateBringList() {
    const bringList = document.getElementById('bring-list');
    if (!bringList) return;
    
    // Check if item view is restricted
    if (!eventPermissions.allowItemView && !isEventOwner()) {
        bringList.innerHTML = '<p style="text-align: center; color: #718096; padding: 20px;">Item list is private</p>';
        return;
    }
    
    if (bringItems.length === 0) {
        bringList.innerHTML = '<p style="text-align: center; color: #718096; padding: 20px;">No items added yet</p>';
        return;
    }
    
    const isOwner = isEventOwner();
    const canEdit = isOwner || eventPermissions.allowItemEdits;
    
    bringList.innerHTML = bringItems.map(item => {
        const itemData = bringData[item] || { assigned: false, person: null };
        const isAssigned = itemData.assigned && itemData.person;
        
        return `
            <div class="bring-item ${isAssigned ? 'assigned' : 'unassigned'}">
                <span class="item-name">${item}</span>
                ${isAssigned ? 
                    `<span class="assignee">${itemData.person}</span>` : 
                    `<span class="unassigned-label">Available</span>`
                }
                ${canEdit ? `
                    <button class="assign-btn" onclick="toggleAssignment('${item}')">
                        ${isAssigned ? 'Unassign' : 'Assign'}
                    </button>
                ` : ''}
            </div>
        `;
    }).join('');
}

// Update event details
function updateEventDetails() {
    // Update title
    const titleElement = document.getElementById('event-name');
    if (titleElement) {
        titleElement.value = currentEventName;
        document.getElementById('page-title').textContent = currentEventName;
    }
    
    // Update date
    const dateElement = document.getElementById('current-date');
    if (dateElement) {
        dateElement.textContent = currentDate || 'Click to set date';
    }
    
    // Update host
    const hostElement = document.getElementById('current-host');
    if (hostElement) {
        hostElement.value = currentHost;
    }
    
    // Update address
    const addressElement = document.getElementById('current-address');
    if (addressElement) {
        addressElement.value = currentAddress;
    }
}

// Event management functions
function updateEventName(name) {
    currentEventName = name;
    document.getElementById('page-title').textContent = name;
    saveStateToFirebase();
}

function updateHost(host) {
    currentHost = host;
    saveStateToFirebase();
}

function updateAddress(address) {
    currentAddress = address;
    saveStateToFirebase();
}

function editDate() {
    const dateInput = prompt('Enter event date:', currentDate);
    if (dateInput !== null) {
        currentDate = dateInput;
        updateDisplay();
        saveStateToFirebase();
    }
}

// Toggle assignment
function toggleAssignment(item) {
    const itemData = bringData[item];
    if (itemData.assigned) {
        // Unassign
        itemData.assigned = false;
        itemData.person = null;
    } else {
        // Assign - show person selection modal
        showPersonSelectionModal(item);
    }
    updateBringList();
    saveStateToFirebase();
}

// Show person selection modal
function showPersonSelectionModal(item) {
    const modal = document.getElementById('selection-modal');
    const titleElement = document.getElementById('modal-title');
    const personList = document.getElementById('person-list');
    
    titleElement.textContent = `Who's bringing ${item}?`;
    
    // Get all people who are coming
    const attendingPeople = [
        ...guestList.filter(name => rsvpData[name]?.status === 'coming'),
        ...additionalGuests.filter(guest => guest.status === 'coming').map(guest => guest.name)
    ];
    
    personList.innerHTML = attendingPeople.map(person => `
        <button class="person-btn" onclick="assignItem('${item}', '${person}')">${person}</button>
    `).join('');
    
    modal.style.display = 'flex';
}

// Assign item to person
function assignItem(item, person) {
    bringData[item] = { assigned: true, person: person };
    closeModal();
    updateBringList();
    saveStateToFirebase();
}

// Close modal
function closeModal() {
    document.getElementById('selection-modal').style.display = 'none';
}

// Edit items
function editItems() {
    const modal = document.getElementById('edit-modal');
    const editList = document.getElementById('edit-list');
    
    editList.innerHTML = bringItems.map((item, index) => `
        <div class="edit-item">
            <input type="text" value="${item}" onchange="updateItemName(${index}, this.value)">
            <button onclick="removeItem(${index})">🗑️</button>
        </div>
    `).join('');
    
    modal.style.display = 'flex';
}

// Update item name
function updateItemName(index, newName) {
    const oldName = bringItems[index];
    bringItems[index] = newName;
    
    // Update bring data
    if (bringData[oldName]) {
        bringData[newName] = bringData[oldName];
        delete bringData[oldName];
    }
    
    saveStateToFirebase();
}

// Remove item
function removeItem(index) {
    const item = bringItems[index];
    bringItems.splice(index, 1);
    delete bringData[item];
    
    // Refresh edit list
    editItems();
    saveStateToFirebase();
}

// Add new item
function addNewItem() {
    const input = document.getElementById('new-item-input');
    const item = input.value.trim();
    
    if (item && !bringItems.includes(item)) {
        bringItems.push(item);
        bringData[item] = { assigned: false, person: null };
        input.value = '';
        
        // Refresh edit list
        editItems();
        saveStateToFirebase();
    }
}

// Close edit modal
function closeEditModal() {
    document.getElementById('edit-modal').style.display = 'none';
    updateBringList();
}

// Share summary
function shareSummary() {
    const url = window.location.href;
    const title = currentEventName || 'Event';
    const text = `Join me for ${title}!`;
    
    if (navigator.share) {
        navigator.share({
            title: title,
            text: text,
            url: url
        });
    } else {
        // Fallback - copy to clipboard
        navigator.clipboard.writeText(url).then(() => {
            alert('Link copied to clipboard!');
        });
    }
}

// Toggle sections
function toggleSection(sectionId) {
    const section = document.getElementById(sectionId);
    const indicator = document.getElementById(sectionId.replace('-section', '-indicator'));
    
    if (section.style.display === 'none') {
        section.style.display = 'block';
        indicator.textContent = '▼';
    } else {
        section.style.display = 'none';
        indicator.textContent = '▶';
    }
}

// Permission and ownership UI updates
function updateOwnershipUI() {
    const ownerControls = document.getElementById('owner-controls');
    if (!ownerControls) return;
    
    if (isEventOwner()) {
        ownerControls.style.display = 'block';
        console.log('Showing owner controls');
    } else {
        ownerControls.style.display = 'none';
        console.log('Hiding owner controls - not owner');
    }
}

function updatePermissionBasedUI() {
    // Update guest list visibility
    const guestSection = document.getElementById('guests-section');
    if (guestSection) {
        if (!eventPermissions.allowGuestView && !isEventOwner()) {
            guestSection.style.display = 'none';
        } else {
            guestSection.style.display = 'block';
        }
    }
    
    // Update item list visibility
    const bringSection = document.getElementById('bring-section');
    if (bringSection) {
        if (!eventPermissions.allowItemView && !isEventOwner()) {
            bringSection.style.display = 'none';
        } else {
            bringSection.style.display = 'block';
        }
    }
    
    // Update edit buttons
    const editBtn = document.querySelector('.edit-btn');
    if (editBtn) {
        if (!eventPermissions.allowItemEdits && !isEventOwner()) {
            editBtn.style.display = 'none';
        } else {
            editBtn.style.display = 'inline-block';
        }
    }
}

// Event settings
function showEventSettings() {
    // Implementation for event settings modal
    alert('Event settings modal - implement as needed');
}

// User dashboard
function showUserDashboard() {
    window.location.href = 'index.html';
}

// Create new event
function createNewEvent() {
    window.location.href = 'index.html';
}

// Guest restricted view
function showGuestRestrictedView() {
    if (!currentGuestName || isEventOwner()) return;
    
    console.log('Showing guest restricted view for:', currentGuestName);
    
    // Hide sections based on permissions
    updatePermissionBasedUI();
    
    // Show guest name in title or header
    const headerElement = document.querySelector('.header');
    if (headerElement && !document.getElementById('guest-welcome')) {
        const welcomeDiv = document.createElement('div');
        welcomeDiv.id = 'guest-welcome';
        welcomeDiv.innerHTML = `<p style="text-align: center; color: #4a5568; margin-bottom: 10px;">Welcome, ${currentGuestName}!</p>`;
        headerElement.appendChild(welcomeDiv);
    }
}

// Password modal functions
function showPasswordModal() {
    document.getElementById('password-modal').style.display = 'flex';
    document.getElementById('password-input').focus();
}

function closePasswordModal() {
    document.getElementById('password-modal').style.display = 'none';
}

function checkPassword() {
    const input = document.getElementById('password-input');
    const password = input.value;
    
    if (password === currentEventPassword) {
        sessionStorage.setItem(`eventPassword_${currentEventId}`, password);
        closePasswordModal();
        initializeEventPage();
    } else {
        alert('Incorrect password');
        input.value = '';
    }
}

// Initialize event page
async function initializeEventPage() {
    console.log('Initializing event page...');
    
    // Get event ID from URL
    const urlParams = new URLSearchParams(window.location.search);
    currentEventId = urlParams.get('id');
    
    if (!currentEventId) {
        alert('No event ID provided');
        window.location.href = 'index.html';
        return;
    }
    
    // Check access and load data
    const hasAccess = await checkEventAccess();
    if (!hasAccess) return;
    
    const loaded = await loadStateFromFirebase();
    if (!loaded) return;
    
    // Set up real-time sync
    setupRealtimeSync();
    
    // Show guest name prompt for non-owners
    if (!isEventOwner()) {
        showGuestNamePrompt();
    }
    
    console.log('Event page initialized');
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', function() {
    initializeEventPage();
});

// Close dropdown when clicking outside
document.addEventListener('click', function(e) {
    const dropdown = document.getElementById('event-dropdown-menu');
    const avatar = document.getElementById('event-user-avatar');
    if (dropdown && avatar && !avatar.contains(e.target)) {
        dropdown.style.display = 'none';
    }
});