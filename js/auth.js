// js/auth.js - Authentication Functions (Shared between pages)

/**
 * Update authentication UI based on user state
 */
function updateAuthUI(user) {
    const authButtons = document.getElementById('auth-buttons');
    const userDropdown = document.getElementById('user-dropdown');
    
    if (user) {
        currentUser = user;
        if (authButtons) authButtons.style.display = 'none';
        if (userDropdown) {
            userDropdown.style.display = 'block';
            document.getElementById('user-email').textContent = user.email;
            document.getElementById('user-initial').textContent = user.email.charAt(0).toUpperCase();
        }
    } else {
        currentUser = null;
        if (authButtons) authButtons.style.display = 'flex';
        if (userDropdown) userDropdown.style.display = 'none';
    }
}

/**
 * Update event page authentication UI
 */
function updateEventPageAuthUI(user) {
    const userProfileSection = document.getElementById('user-profile-section');
    const newEventBtn = document.getElementById('new-event-btn');
    
    if (user) {
        currentUser = user;
        console.log('User authenticated:', user.uid);
        
        if (userProfileSection) {
            userProfileSection.style.display = 'block';
            document.getElementById('event-user-email').textContent = user.email;
            document.getElementById('event-user-initial').textContent = user.email.charAt(0).toUpperCase();
        }
        if (newEventBtn) newEventBtn.style.display = 'none';
        
    } else {
        currentUser = null;
        console.log('User not authenticated - anonymous mode');
        
        if (userProfileSection) userProfileSection.style.display = 'none';
        if (newEventBtn) newEventBtn.style.display = 'block';
    }
    
    // Update ownership UI after auth state changes
    if (currentEventId && eventOwner !== null) {
        if (typeof updateOwnershipUI === 'function') updateOwnershipUI();
        if (typeof updatePermissionBasedUI === 'function') updatePermissionBasedUI();
    }
}

/**
 * Show authentication modal
 */
function showAuthModal(mode) {
    authMode = mode;
    document.getElementById('auth-modal-title').textContent = mode === 'signup' ? 'Sign Up' : 'Sign In';
    document.getElementById('auth-submit-btn').textContent = mode === 'signup' ? 'Sign Up' : 'Sign In';
    document.getElementById('auth-switch-text').innerHTML = mode === 'signup' 
        ? 'Already have an account? <a href="#" onclick="switchAuthMode()">Sign in</a>'
        : 'Don\'t have an account? <a href="#" onclick="switchAuthMode()">Sign up</a>';
    
    const confirmSection = document.getElementById('auth-confirm-section');
    if (confirmSection) {
        confirmSection.style.display = mode === 'signup' ? 'block' : 'none';
    }
    
    clearAuthForm();
    document.getElementById('auth-modal').style.display = 'flex';
    document.getElementById('auth-email').focus();
}

/**
 * Close authentication modal
 */
function closeAuthModal() {
    document.getElementById('auth-modal').style.display = 'none';
    clearAuthForm();
}

/**
 * Switch between sign in and sign up modes
 */
function switchAuthMode() {
    authMode = authMode === 'signin' ? 'signup' : 'signin';
    showAuthModal(authMode);
}

/**
 * Clear authentication form
 */
function clearAuthForm() {
    document.getElementById('auth-email').value = '';
    document.getElementById('auth-password').value = '';
    const confirmPassword = document.getElementById('auth-confirm-password');
    if (confirmPassword) confirmPassword.value = '';
    hideAuthError();
}

/**
 * Show authentication error
 */
function showAuthError(message) {
    const errorEl = document.getElementById('auth-error');
    if (errorEl) {
        errorEl.textContent = message;
        errorEl.style.display = 'block';
    }
}

/**
 * Hide authentication error
 */
function hideAuthError() {
    const errorEl = document.getElementById('auth-error');
    if (errorEl) {
        errorEl.style.display = 'none';
    }
}

/**
 * Handle authentication (sign in or sign up)
 */
async function handleAuth() {
    const email = document.getElementById('auth-email').value.trim();
    const password = document.getElementById('auth-password').value;
    const confirmPasswordEl = document.getElementById('auth-confirm-password');
    const confirmPassword = confirmPasswordEl ? confirmPasswordEl.value : '';
    
    if (!email || !password) {
        showAuthError('Please fill in all fields');
        return;
    }
    
    if (authMode === 'signup' && password !== confirmPassword) {
        showAuthError('Passwords do not match');
        return;
    }
    
    if (password.length < 6) {
        showAuthError('Password must be at least 6 characters');
        return;
    }
    
    try {
        let userCredential;
        if (authMode === 'signup') {
            userCredential = await auth.createUserWithEmailAndPassword(email, password);
            // Create user document
            await createUserDocument(userCredential.user);
        } else {
            userCredential = await auth.signInWithEmailAndPassword(email, password);
        }
        
        closeAuthModal();
    } catch (error) {
        console.error('Auth error:', error);
        showAuthError(getAuthErrorMessage(error.code));
    }
}

/**
 * Create user document in Firestore
 */
async function createUserDocument(user) {
    try {
        await db.collection('users').doc(user.uid).set({
            email: user.email,
            displayName: user.displayName || user.email.split('@')[0],
            eventCount: 0,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });
    } catch (error) {
        console.error('Error creating user document:', error);
    }
}

/**
 * Get user-friendly error message
 */
function getAuthErrorMessage(errorCode) {
    switch (errorCode) {
        case 'auth/user-not-found':
        case 'auth/wrong-password':
            return 'Invalid email or password';
        case 'auth/email-already-in-use':
            return 'Email is already in use';
        case 'auth/invalid-email':
            return 'Invalid email address';
        case 'auth/weak-password':
            return 'Password is too weak';
        case 'auth/too-many-requests':
            return 'Too many failed attempts. Please try again later';
        default:
            return 'Authentication failed. Please try again';
    }
}

/**
 * Toggle user menu
 */
function toggleUserMenu() {
    const menu = document.getElementById('dropdown-menu');
    if (menu) {
        menu.style.display = menu.style.display === 'block' ? 'none' : 'block';
    }
}

/**
 * Toggle event user menu
 */
function toggleEventUserMenu() {
    const menu = document.getElementById('event-dropdown-menu');
    if (menu) {
        menu.style.display = menu.style.display === 'block' ? 'none' : 'block';
    }
}

/**
 * Sign out user
 */
async function signOut() {
    try {
        await auth.signOut();
        const dropdown = document.getElementById('dropdown-menu');
        const eventDropdown = document.getElementById('event-dropdown-menu');
        if (dropdown) dropdown.style.display = 'none';
        if (eventDropdown) eventDropdown.style.display = 'none';
    } catch (error) {
        console.error('Sign out error:', error);
    }
}

/**
 * Check if current user is event owner
 */
function isEventOwner() {
    return currentUser && eventOwner && currentUser.uid === eventOwner;
}

/**
 * Toggle password visibility
 */
function togglePasswordVisibility(inputId) {
    const input = document.getElementById(inputId);
    const button = input.nextElementSibling;
    
    if (input.type === 'password') {
        input.type = 'text';
        button.textContent = '🙈';
    } else {
        input.type = 'password';
        button.textContent = '👁️';
    }
}

// Set up authentication state listener
auth.onAuthStateChanged((user) => {
    // Update UI based on which page we're on
    if (document.getElementById('auth-buttons')) {
        // Landing page
        updateAuthUI(user);
    } else if (document.getElementById('user-profile-section')) {
        // Event page
        updateEventPageAuthUI(user);
    }
});

// Close dropdowns when clicking outside
document.addEventListener('click', function(e) {
    const dropdown = document.getElementById('dropdown-menu');
    const avatar = document.getElementById('user-avatar');
    const eventDropdown = document.getElementById('event-dropdown-menu');
    const eventAvatar = document.getElementById('event-user-avatar');
    
    if (dropdown && avatar && !avatar.contains(e.target)) {
        dropdown.style.display = 'none';
    }
    
    if (eventDropdown && eventAvatar && !eventAvatar.contains(e.target)) {
        eventDropdown.style.display = 'none';
    }
});