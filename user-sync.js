/**
 * Utility para sincronizar usuarios desde posts hacia la base de usuarios
 */

async function syncUsersFromPosts() {
    console.log('🔄 Sincronizando usuarios desde posts...');
    
    try {
        if (!firebaseDB || !database) {
            console.log('⚠️ Firebase no disponible');
            return;
        }
        
        // Obtener todos los posts
        const postsRef = firebaseDB.ref(database, 'posts');
        const postsSnapshot = await firebaseDB.get(postsRef);
        
        if (!postsSnapshot.exists()) {
            console.log('ℹ️ No hay posts para procesar');
            return;
        }
        
        // Obtener usuarios existentes
        const usersRef = firebaseDB.ref(database, 'users');
        const usersSnapshot = await firebaseDB.get(usersRef);
        const existingUsers = new Set();
        
        if (usersSnapshot.exists()) {
            usersSnapshot.forEach(child => {
                existingUsers.add(child.key);
            });
        }
        
        const usersToCreate = new Map();
        
        // Procesar posts para encontrar usuarios únicos
        postsSnapshot.forEach(child => {
            const post = child.val();
            if (post.userId && post.userName && post.userName !== 'Usuario') {
                if (!existingUsers.has(post.userId)) {
                    usersToCreate.set(post.userId, {
                        userName: post.userName,
                        email: post.userEmail || `${post.userName.toLowerCase()}@crypto.social`,
                        photoURL: post.userPhoto || null,
                        bio: `Usuario activo en NITEDRED`,
                        createdAt: Date.now(),
                        lastActive: post.timestamp || Date.now(),
                        postsCount: (usersToCreate.get(post.userId)?.postsCount || 0) + 1,
                        followers: {},
                        following: {}
                    });
                } else {
                    // Actualizar contador de posts si el usuario ya existe en el mapa
                    const existing = usersToCreate.get(post.userId);
                    if (existing) {
                        existing.postsCount = (existing.postsCount || 0) + 1;
                        existing.lastActive = Math.max(existing.lastActive, post.timestamp || 0);
                    }
                }
            }
        });
        
        console.log(`📊 Encontrados ${usersToCreate.size} usuarios únicos para crear`);
        
        // Crear usuarios en lotes
        const updates = {};
        usersToCreate.forEach((userData, userId) => {
            updates[`users/${userId}`] = userData;
        });
        
        if (Object.keys(updates).length > 0) {
            await firebaseDB.update(firebaseDB.ref(database), updates);
            console.log(`✅ ${Object.keys(updates).length} usuarios sincronizados exitosamente`);
            
            // Recargar usuarios sugeridos
            if (typeof loadSuggestedUsers === 'function') {
                setTimeout(() => {
                    loadSuggestedUsers();
                }, 1000);
            }
        } else {
            console.log('✅ Todos los usuarios ya están sincronizados');
        }
        
    } catch (error) {
        console.error('❌ Error sincronizando usuarios:', error);
    }
}

// Auto-ejecutar cuando se carga la página
document.addEventListener('DOMContentLoaded', function() {
    // Esperar un poco para que Firebase se inicialice
    setTimeout(() => {
        if (window.location.hash === '#explore' || window.currentSection === 'explore') {
            syncUsersFromPosts();
        }
    }, 3000);
});

// Función manual
window.syncUsers = syncUsersFromPosts;