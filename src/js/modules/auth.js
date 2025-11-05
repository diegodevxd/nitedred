// Firebase Authentication Module
import { auth, googleProvider, signInWithPopup, signOut, onAuthStateChanged } from '../firebase-config.js';

// Auth state observer
export function initializeAuth() {
    onAuthStateChanged(auth, (user) => {
        if (user) {
            // User is signed in
            const userData = {
                uid: user.uid,
                name: user.displayName || 'Usuario',
                email: user.email,
                photoURL: user.photoURL,
                provider: 'google'
            };
            
            console.log('Usuario autenticado:', userData);
            try { localStorage.setItem('currentUser', JSON.stringify({ uid: user.uid, displayName: user.displayName || 'Usuario', email: user.email || null, photoURL: user.photoURL || null })); } catch {}
            
            // Update UI if needed
            updateUserUI(userData);
            
            // Call global callback if exists
            if (window.onFirebaseAuthStateChanged) {
                window.onFirebaseAuthStateChanged(userData);
            }
        } else {
            // User is signed out
            console.log('Usuario no autenticado');
            try { localStorage.removeItem('currentUser'); } catch {}
            
            if (window.onFirebaseAuthStateChanged) {
                window.onFirebaseAuthStateChanged(null);
            }
        }
    });
}

// Google Sign In
export async function signInWithGoogle() {
    try {
        const result = await signInWithPopup(auth, googleProvider);
        const user = result.user;
        
        const userData = {
            uid: user.uid,
            name: user.displayName || 'Usuario',
            email: user.email,
            photoURL: user.photoURL,
            provider: 'google'
        };
        
        console.log('Login exitoso:', userData);
        try { localStorage.setItem('currentUser', JSON.stringify({ uid: user.uid, displayName: user.displayName || 'Usuario', email: user.email || null, photoURL: user.photoURL || null })); } catch {}
        
        // Call global callbacks if they exist
        if (window.showSection) {
            window.showSection('home');
        }
        if (window.showToast) {
            window.showToast(`¡Bienvenido ${userData.name}! 🎉`);
        }
        
        return userData;
    } catch (error) {
        console.error('Error en login con Google:', error);
        if (window.showToast) {
            window.showToast('Error al iniciar sesión con Google ❌');
        }
        throw error;
    }
}

// Sign Out
export async function signOutUser() {
    try {
        await signOut(auth);
        
        console.log('Sesión cerrada');
        
        if (window.showSection) {
            window.showSection('login');
        }
        if (window.showToast) {
            window.showToast('Sesión cerrada correctamente ✅');
        }
    } catch (error) {
        console.error('Error al cerrar sesión:', error);
        if (window.showToast) {
            window.showToast('Error al cerrar sesión ❌');
        }
        throw error;
    }
}

// Update user UI (profile picture, name, etc.)
function updateUserUI(userData) {
    if (userData) {
        // Update profile section
        const profileName = document.getElementById('profile-name');
        if (profileName) {
            profileName.textContent = userData.name;
        }
        
        // Update header avatar if user has photo
        if (userData.photoURL) {
            const avatarButtons = document.querySelectorAll('[onclick="showSection(\'profile\')"]');
            avatarButtons.forEach(btn => {
                if (btn.classList.contains('rounded-full')) {
                    btn.style.backgroundImage = `url(${userData.photoURL})`;
                    btn.style.backgroundSize = 'cover';
                    btn.style.backgroundPosition = 'center';
                }
            });
        }
        
        // Update edit profile form
        const editName = document.getElementById('edit-name');
        if (editName) {
            editName.value = userData.name;
        }
    }
}

// Get current user
export function getCurrentUser() {
    return auth.currentUser;
}

// Check if user is authenticated
export function isAuthenticated() {
    return auth.currentUser !== null;
}
