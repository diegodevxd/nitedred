// Función independiente para subir stories que evita conflictos con extensiones
window.uploadStoryFixed = async function(event) {
    console.log('📤 Starting story upload (fixed version)...');
    
    // Prevent default form submission
    if (event && typeof event.preventDefault === 'function') {
        try {
            event.preventDefault();
        } catch (e) {
            console.warn('Could not prevent default:', e);
        }
    }
    
    const fileInput = document.getElementById('story-file-input');
    const uploadBtn = document.getElementById('story-upload-btn');
    
    if (!fileInput || !uploadBtn) {
        console.error('❌ Upload elements not found');
        alert('Error: Elementos de upload no encontrados');
        return;
    }
    
    if (!fileInput.files || !fileInput.files[0]) {
        console.warn('⚠️ No file selected');
        alert('Selecciona un archivo primero');
        return;
    }
    
    const file = fileInput.files[0];
    console.log('📂 File selected:', file.name);
    
    // Update UI
    uploadBtn.textContent = 'Subiendo...';
    uploadBtn.disabled = true;
    
    try {
        // Wait for Firebase to be completely ready
        console.log('⏳ Checking Firebase availability...');
        
        let firebaseDB = null;
        let attempts = 0;
        const maxAttempts = 100; // 10 seconds max wait
        
        while (!firebaseDB && attempts < maxAttempts) {
            // Check all possible Firebase sources
            if (window.firebaseDB && window.firebaseDB.database && window.firebaseDB.ref) {
                firebaseDB = window.firebaseDB;
                console.log('✅ Found firebaseDB on window');
                break;
            }
            
            // Import dynamic approach
            try {
                const firebaseModule = await import('./src/js/firebase-config.js');
                if (firebaseModule.firebaseDB) {
                    firebaseDB = firebaseModule.firebaseDB;
                    console.log('✅ Found firebaseDB via import');
                    break;
                }
            } catch (importError) {
                console.log('Import attempt failed:', importError.message);
            }
            
            // Wait and retry
            await new Promise(resolve => setTimeout(resolve, 100));
            attempts++;
            
            if (attempts % 10 === 0) {
                console.log(`⏳ Still waiting for Firebase... attempt ${attempts}`);
            }
        }
        
        if (!firebaseDB || !firebaseDB.database || !firebaseDB.ref) {
            throw new Error('Firebase no pudo ser inicializado después de 10 segundos. Recarga la página e intenta de nuevo.');
        }
        
        console.log('✅ Firebase is ready:', {
            database: !!firebaseDB.database,
            ref: typeof firebaseDB.ref,
            push: typeof firebaseDB.push,
            set: typeof firebaseDB.set
        });
        
        // Get current user
        let currentUser = null;
        
        // Try multiple sources
        if (window.currentUser && window.currentUser.uid) {
            currentUser = window.currentUser;
        } else if (window.auth && window.auth.currentUser) {
            currentUser = {
                uid: window.auth.currentUser.uid,
                displayName: window.auth.currentUser.displayName,
                email: window.auth.currentUser.email,
                photoURL: window.auth.currentUser.photoURL
            };
        } else {
            // Try localStorage
            try {
                const stored = localStorage.getItem('currentUser');
                if (stored) {
                    currentUser = JSON.parse(stored);
                }
            } catch (e) {
                console.error('Error parsing stored user:', e);
            }
        }
        
        if (!currentUser || !currentUser.uid) {
            throw new Error('No hay usuario autenticado');
        }
        
        console.log('👤 User found:', currentUser.uid);
        
        // Validate file
        if (file.size > 10 * 1024 * 1024) {
            throw new Error('El archivo es demasiado grande (máximo 10MB)');
        }
        
        console.log('☁️ Uploading to Cloudinary...');
        
        // Create FormData
        const formData = new FormData();
        formData.append('file', file);
        formData.append('upload_preset', 'nitedcrypto_posts');
        
        // Upload with basic fetch (no AbortController to avoid extension conflicts)
        const response = await fetch('https://api.cloudinary.com/v1_1/dtxn4kbpc/auto/upload', {
            method: 'POST',
            body: formData
        });
        
        if (!response.ok) {
            const errorText = await response.text().catch(() => 'Unknown error');
            console.error('❌ Cloudinary error:', errorText);
            throw new Error('Error uploading to Cloudinary: ' + response.status);
        }
        
        const data = await response.json();
        console.log('✅ Cloudinary upload successful');
        
        // Save to Firebase
        console.log('💾 Saving story to Firebase...');
        
        const storyData = {
            userId: currentUser.uid,
            userName: currentUser.displayName || currentUser.email?.split('@')[0] || 'Usuario',
            userPhoto: currentUser.photoURL || '',
            mediaURL: data.secure_url,
            mediaType: file.type.startsWith('video/') ? 'video' : 'image',
            timestamp: Date.now(),
            expiresAt: Date.now() + (24 * 60 * 60 * 1000), // 24 hours
            viewers: {}
        };
        
        const storiesRef = firebaseDB.ref(firebaseDB.database, 'stories');
        const newStoryRef = firebaseDB.push(storiesRef);
        await firebaseDB.set(newStoryRef, storyData);
        
        console.log('✅ Story saved successfully');
        
        // Close modal
        if (typeof window.hideStoryUpload === 'function') {
            window.hideStoryUpload();
        }
        
        // Show success message
        alert('¡Story publicado exitosamente!');
        
        // Reload stories
        setTimeout(() => {
            console.log('🔄 Reloading stories...');
            if (typeof window.loadStories === 'function') {
                window.loadStories();
            }
        }, 500);
        
    } catch (error) {
        console.error('❌ Story upload error:', error);
        
        let errorMessage = 'Error al subir la historia';
        if (error.message) {
            errorMessage = error.message;
        }
        
        alert(errorMessage);
    } finally {
        // Reset UI
        uploadBtn.textContent = 'Publicar Story';
        uploadBtn.disabled = false;
    }
};

// Función de diagnóstico para Firebase
window.debugFirebase = function() {
    console.log('🔍 FIREBASE DIAGNOSIS:');
    console.log('window.firebaseDB:', !!window.firebaseDB);
    
    if (window.firebaseDB) {
        console.log('firebaseDB.database:', !!window.firebaseDB.database);
        console.log('firebaseDB.ref:', typeof window.firebaseDB.ref);
        console.log('firebaseDB.push:', typeof window.firebaseDB.push);
        console.log('firebaseDB.set:', typeof window.firebaseDB.set);
        console.log('firebaseDB.get:', typeof window.firebaseDB.get);
    }
    
    console.log('window.auth:', !!window.auth);
    console.log('window.currentUser:', !!window.currentUser);
    
    // Try import approach
    import('./src/js/firebase-config.js').then(module => {
        console.log('Import firebaseDB:', !!module.firebaseDB);
        if (module.firebaseDB) {
            console.log('Import database:', !!module.firebaseDB.database);
        }
    }).catch(error => {
        console.log('Import failed:', error.message);
    });
};

console.log('✅ Fixed story upload function loaded');