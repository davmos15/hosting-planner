// js/firebase-utils.js - Firebase Database Operations

/**
 * Save event state to Firebase with enhanced error handling
 */
async function saveStateToFirebase() {
    try {
        const state = {
            rsvpData,
            bringData,
            currentHost,
            currentDate,
            currentEventName,
            currentAddress,
            bringItems,
            additionalGuests,
            guestList,
            password: currentEventPassword,
            lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
        };
        
        // Preserve ownership and permissions
        // Only set ownerId if we have a valid owner (not null/undefined)
        if (eventOwner) {
            state.ownerId = eventOwner;
        } else if (eventOwner === null) {
            // Explicitly set null for anonymous events
            state.ownerId = null;
        }
        // If eventOwner is undefined, don't include ownerId in the update
        if (eventPermissions) {
            state.permissions = eventPermissions;
        }
        
        if (currentEventId) {
            await db.collection('events').doc(currentEventId).set(state, { merge: true });
            console.log('✅ State saved to Firebase');
        } else {
            console.error('No event ID available for saving');
        }
    } catch (error) {
        console.error('❌ Failed to save to Firebase:', error);
        
        // Handle specific error types gracefully
        if (error.code === 'permission-denied') {
            console.warn('Permission denied - continuing with local state');
        } else {
            console.error('Unexpected error:', error);
        }
    }
}

/**
 * Load event state from Firebase
 */
async function loadStateFromFirebase() {
    try {
        if (!currentEventId) {
            console.error('No event ID provided');
            return false;
        }

        console.log('Loading event:', currentEventId);
        const doc = await db.collection('events').doc(currentEventId).get();
        
        if (doc.exists) {
            const data = doc.data();
            console.log('Event data loaded:', data);
            
            // Load ownership data
            eventOwner = data.ownerId !== undefined ? data.ownerId : null;
            
            // Load permission data with defaults
            if (data.permissions) {
                eventPermissions = {
                    allowGuestView: data.permissions.allowGuestView !== false,
                    allowGuestEdits: data.permissions.allowGuestEdits !== false,
                    allowItemView: data.permissions.allowItemView !== false,
                    allowItemEdits: data.permissions.allowItemEdits !== false
                };
            } else {
                eventPermissions = {
                    allowGuestView: true,
                    allowGuestEdits: true,
                    allowItemView: true,
                    allowItemEdits: true
                };
            }
            
            // Load event data
            if (data.rsvpData) rsvpData = data.rsvpData;
            if (data.bringData) bringData = data.bringData;
            if (data.currentHost) currentHost = data.currentHost;
            if (data.currentDate) currentDate = data.currentDate;
            if (data.currentEventName) currentEventName = data.currentEventName;
            if (data.eventName) currentEventName = data.eventName;
            if (data.currentAddress) currentAddress = data.currentAddress;
            if (data.password) currentEventPassword = data.password;
            if (data.bringItems) bringItems = data.bringItems;
            if (data.additionalGuests) additionalGuests = data.additionalGuests;
            if (data.guestList) guestList = data.guestList;
            
            // Ensure all guests have proper RSVP data
            guestList.forEach(guest => {
                if (!rsvpData[guest]) {
                    rsvpData[guest] = { status: 'pending', guests: 1, previousGuests: 1 };
                } else {
                    if (rsvpData[guest].previousGuests === undefined) {
                        rsvpData[guest].previousGuests = rsvpData[guest].guests || 1;
                    }
                }
            });
            
            return true;
        } else {
            console.log('Event does not exist, creating new one...');
            await saveStateToFirebase();
            return true;
        }
    } catch (error) {
        console.error('❌ Failed to load from Firebase:', error);
        
        if (error.code === 'permission-denied') {
            alert('This event is private or you do not have permission to view it.');
            window.location.href = 'index.html';
        } else if (error.code === 'not-found') {
            alert('Event not found. It may have been deleted or the link is incorrect.');
            window.location.href = 'index.html';
        } else {
            alert('Failed to load event. Please check your internet connection and try again.');
        }
        return false;
    }
}

/**
 * Set up real-time synchronization
 */
function setupRealtimeSync() {
    if (!currentEventId) return;
    
    db.collection('events').doc(currentEventId).onSnapshot((doc) => {
        if (doc.exists) {
            const data = doc.data();
            
            // Update state with Firebase data
            if (data.rsvpData) rsvpData = data.rsvpData;
            if (data.bringData) bringData = data.bringData;
            if (data.currentHost) currentHost = data.currentHost;
            if (data.currentDate) currentDate = data.currentDate;
            if (data.currentEventName) currentEventName = data.currentEventName;
            if (data.eventName) currentEventName = data.eventName;
            if (data.currentAddress) currentAddress = data.currentAddress;
            if (data.password) currentEventPassword = data.password;
            if (data.bringItems) bringItems = data.bringItems;
            if (data.additionalGuests) additionalGuests = data.additionalGuests;
            if (data.guestList) guestList = data.guestList;
            
            // Update ownership and permissions
            if (data.ownerId !== undefined) eventOwner = data.ownerId;
            if (data.permissions) {
                eventPermissions = {
                    allowGuestView: data.permissions.allowGuestView !== false,
                    allowGuestEdits: data.permissions.allowGuestEdits !== false,
                    allowItemView: data.permissions.allowItemView !== false,
                    allowItemEdits: data.permissions.allowItemEdits !== false
                };
                
                // Apply permission changes immediately
                if (typeof updatePermissionBasedUI === 'function') {
                    updatePermissionBasedUI();
                }
            }
            
            // Ensure all guests have proper RSVP data
            guestList.forEach(guest => {
                if (!rsvpData[guest]) {
                    rsvpData[guest] = { status: 'pending', guests: 1, previousGuests: 1 };
                } else {
                    if (rsvpData[guest].previousGuests === undefined) {
                        rsvpData[guest].previousGuests = rsvpData[guest].guests || 1;
                    }
                }
            });
            
            // Update UI if functions are available
            if (typeof initializeBringData === 'function') initializeBringData();
            if (typeof updateDisplay === 'function') updateDisplay();
            if (typeof updateOwnershipUI === 'function') updateOwnershipUI();
            
            console.log('🔄 Real-time update received');
        }
    }, (error) => {
        console.error('❌ Real-time sync error:', error);
    });
}

/**
 * Create new event
 */
async function createEvent(eventData) {
    try {
        const eventId = generateEventId(eventData.eventName);
        
        const fullEventData = {
            ...eventData,
            eventId,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            lastUpdated: firebase.firestore.FieldValue.serverTimestamp(),
            ownerId: currentUser ? currentUser.uid : null,
            ownerEmail: currentUser ? currentUser.email : null,
            permissions: {
                allowGuestView: true,
                allowGuestEdits: true,
                allowItemView: true,
                allowItemEdits: true
            }
        };
        
        await db.collection('events').doc(eventId).set(fullEventData);
        
        // Update user event count if authenticated
        if (currentUser) {
            try {
                await db.collection('users').doc(currentUser.uid).set({
                    email: currentUser.email,
                    displayName: currentUser.displayName || currentUser.email.split('@')[0],
                    eventCount: firebase.firestore.FieldValue.increment(1),
                    createdAt: firebase.firestore.FieldValue.serverTimestamp()
                }, { merge: true });
            } catch (error) {
                console.error('Error updating user event count:', error);
            }
        }
        
        return eventId;
    } catch (error) {
        console.error('Error creating event:', error);
        throw error;
    }
}

/**
 * Generate unique event ID
 */
function generateEventId(eventName) {
    const slug = eventName.toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .substring(0, 30);
    
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    
    return `${slug}-${code}`;
}

/**
 * Check event access permissions
 */
async function checkEventAccess() {
    if (!currentEventId) {
        alert('Invalid event URL');
        window.location.href = 'index.html';
        return false;
    }
    
    try {
        const doc = await db.collection('events').doc(currentEventId).get();
        
        if (!doc.exists) {
            alert('Event not found');
            window.location.href = 'index.html';
            return false;
        }
        
        const eventData = doc.data();
        currentEventPassword = eventData.password;
        
        if (currentEventPassword) {
            const storedPassword = sessionStorage.getItem(`eventPassword_${currentEventId}`);
            if (storedPassword !== currentEventPassword) {
                if (typeof showPasswordModal === 'function') {
                    showPasswordModal();
                }
                return false;
            }
        }
        
        return true;
    } catch (error) {
        console.error('Error checking event access:', error);
        alert('Failed to load event');
        window.location.href = 'index.html';
        return false;
    }
}