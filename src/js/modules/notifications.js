// Notifications Functions
let notificationsVisible = false;
let unreadNotifications = 0;

// Helper to access Firebase from window
function getFirebase() {
    return {
        database: window.database,
        firebaseDB: window.firebaseDB,
        currentUser: window.currentUser
    };
}

function toggleNotifications() {
    const panel = document.getElementById('notifications-panel');
    notificationsVisible = !notificationsVisible;
    
    if (notificationsVisible) {
        panel.classList.remove('hidden');
        panel.classList.add('slide-in');
    } else {
        panel.classList.add('hidden');
        panel.classList.remove('slide-in');
    }
}

function markAsRead(notificationElement) {
    const { database, firebaseDB, currentUser } = getFirebase();
    const notificationId = notificationElement.dataset.notificationId;
    
    const dot = notificationElement.querySelector('.w-2.h-2.bg-blue-400');
    if (dot) {
        dot.remove();
        unreadNotifications = Math.max(0, unreadNotifications - 1);
        updateNotificationBadge();
        
        // Add read state styling
        notificationElement.classList.add('opacity-75');
        
        // Update read status in Firebase
        if (database && firebaseDB && currentUser && notificationId) {
            const userId = (currentUser.email || currentUser.uid).replace(/[.@]/g, '_');
            const notifRef = firebaseDB.ref(database, `notifications/${userId}/${notificationId}`);
            firebaseDB.update(notifRef, { read: true }).catch(err => {
                console.error('Error updating notification read status:', err);
            });
        }
    }
}

function clearAllNotifications() {
    const notificationsList = document.getElementById('notifications-list');
    notificationsList.innerHTML = '<p class="text-white text-opacity-60 text-center py-8">No hay notificaciones</p>';
    unreadNotifications = 0;
    updateNotificationBadge();
    showToast('Todas las notificaciones han sido eliminadas');
}

function updateNotificationBadge() {
    const badge = document.getElementById('notification-badge');
    const badgeText = badge.querySelector('span');
    
    if (unreadNotifications > 0) {
        badge.style.display = 'flex';
        badgeText.textContent = unreadNotifications > 9 ? '9+' : unreadNotifications;
    } else {
        badge.style.display = 'none';
    }
}

function viewAllNotifications() {
    showToast('Función "Ver todas" próximamente disponible');
    toggleNotifications();
}

function addNotification(type, message, user = null, targetUserId = null) {
    const { database, firebaseDB, currentUser } = getFirebase();
    
    const notificationsList = document.getElementById('notifications-list');
    
    // Remove "no notifications" message if exists
    const emptyMessage = notificationsList?.querySelector('p');
    if (emptyMessage) {
        emptyMessage.remove();
    }
    
    let iconClass, iconBg;
    switch(type) {
        case 'like':
            iconClass = 'fas fa-heart';
            iconBg = 'from-pink-400 to-purple-500';
            break;
        case 'comment':
            iconClass = 'fas fa-comment';
            iconBg = 'from-blue-400 to-green-500';
            break;
        case 'follow':
            iconClass = 'fas fa-user-plus';
            iconBg = 'from-green-400 to-teal-500';
            break;
        case 'share':
            iconClass = 'fas fa-share';
            iconBg = 'from-purple-400 to-pink-500';
            break;
        case 'crypto':
            iconClass = 'fab fa-bitcoin';
            iconBg = 'from-yellow-400 to-orange-500';
            break;
        default:
            iconClass = 'fas fa-bell';
            iconBg = 'from-gray-400 to-gray-600';
    }
    
    const notificationData = {
        id: Date.now().toString(),
        type: type,
        message: message,
        user: user,
        timestamp: Date.now(),
        read: false
    };
    
    // Save to Firebase if targetUserId is provided
    if (database && firebaseDB && targetUserId) {
        const userId = targetUserId.replace(/[.@]/g, '_');
        const notifRef = firebaseDB.ref(database, `notifications/${userId}/${notificationData.id}`);
        firebaseDB.set(notifRef, notificationData).catch(err => {
            console.error('Error saving notification to Firebase:', err);
        });
    }
    
    // Only render if it's for current user
    if (!targetUserId || (currentUser && (targetUserId === currentUser.uid || targetUserId === currentUser.email))) {
        const notificationDiv = document.createElement('div');
        notificationDiv.className = 'notification-item bg-white bg-opacity-10 rounded-xl p-3 cursor-pointer hover:bg-opacity-20 transition-all slide-in';
        notificationDiv.dataset.notificationId = notificationData.id;
        notificationDiv.onclick = () => markAsRead(notificationDiv);
        
        notificationDiv.innerHTML = `
            <div class="flex items-start">
                <div class="w-8 h-8 bg-gradient-to-r ${iconBg} rounded-full mr-3 flex items-center justify-center flex-shrink-0">
                    <i class="${iconClass} text-white text-sm"></i>
                </div>
                <div class="flex-1">
                    <p class="text-white text-sm">${message}</p>
                    <p class="text-white text-opacity-60 text-xs mt-1">ahora</p>
                </div>
                <div class="w-2 h-2 bg-blue-400 rounded-full flex-shrink-0"></div>
            </div>
        `;
        
        if (notificationsList) {
            notificationsList.insertBefore(notificationDiv, notificationsList.firstChild);
        }
        unreadNotifications++;
        updateNotificationBadge();
    }
}

// Close notifications when clicking outside
document.addEventListener('click', function(event) {
    const panel = document.getElementById('notifications-panel');
    const button = event.target.closest('[onclick="toggleNotifications()"]');
    
    if (!panel.contains(event.target) && !button && notificationsVisible) {
        toggleNotifications();
    }
});

// Load notifications from Firebase
async function loadNotificationsFromFirebase() {
    const { database, firebaseDB, currentUser } = getFirebase();
    
    if (!database || !firebaseDB || !currentUser) {
        console.log('⚠️ Firebase not initialized or no user logged in');
        return;
    }
    
    try {
        const userId = currentUser.uid;  // Usar UID directo, sin sanitizar
        console.log('📥 CARGANDO NOTIFICACIONES PARA:', userId);
        
        const notificationsRef = firebaseDB.ref(database, `notifications/${userId}`);
        const snapshot = await firebaseDB.get(notificationsRef);
        
        if (snapshot.exists()) {
            const firebaseNotifications = snapshot.val();
            const notificationsList = document.getElementById('notifications-list');
            
            console.log('✅ Encontradas', Object.keys(firebaseNotifications).length, 'notificaciones en Firebase');
            
            // Clear existing notifications
            if (notificationsList) {
                notificationsList.innerHTML = '';
            }
            
            // Convert to array and sort by timestamp (newest first)
            const notificationsArray = Object.values(firebaseNotifications).sort((a, b) => b.timestamp - a.timestamp);
            
            // Reset unread count
            unreadNotifications = 0;
            
            // Render each notification
            notificationsArray.forEach(notification => {
                renderNotification(notification);
                if (!notification.read) {
                    unreadNotifications++;
                }
            });
            
            updateNotificationBadge();
            console.log(`✅ Renderizadas ${notificationsArray.length} notificaciones (${unreadNotifications} sin leer)`);
            
            // IMPORTANTE: Configurar listener DESPUÉS de cargar
            setupNotificationListener();
        } else {
            console.log('⚠️ No hay notificaciones en Firebase para:', userId);
            // Configurar listener aunque no haya notificaciones
            setupNotificationListener();
        }
    } catch (error) {
        console.error('❌ Error cargando notificaciones:', error);
    }
}

// Set up real-time listener for new notifications
let listenerConfigured = false;

function setupNotificationListener() {
    const { database, firebaseDB, currentUser } = getFirebase();
    
    if (!database || !firebaseDB || !currentUser) {
        console.log('⚠️ No se puede configurar listener - Firebase no está listo');
        return;
    }
    
    if (listenerConfigured) {
        console.log('⚠️ Listener ya configurado, saltando...');
        return;
    }
    
    const userId = currentUser.uid;  // Usar UID directo, sin sanitizar
    const notificationsRef = firebaseDB.ref(database, `notifications/${userId}`);
    
    console.log('🎧 CONFIGURANDO LISTENER DE NOTIFICACIONES');
    console.log('👤 Usuario:', userId);
    console.log('📍 Ruta Firebase:', `notifications/${userId}`);
    
    // Timestamp para filtrar notificaciones nuevas
    const startTime = Date.now();
    console.log('⏰ Tiempo de inicio:', new Date(startTime).toLocaleString());
    
    // Usar onValue para escuchar cambios en tiempo real
    firebaseDB.onValue(notificationsRef, (snapshot) => {
        if (snapshot.exists()) {
            const notifications = snapshot.val();
            const notificationsArray = Object.entries(notifications).map(([key, val]) => ({
                ...val,
                key: key
            }));
            
            console.log('📨 EVENTO onValue disparado! Total de notificaciones:', notificationsArray.length);
            
            // Encontrar notificaciones nuevas (posteriores al startTime)
            const newNotifications = notificationsArray.filter(n => 
                n.timestamp > startTime && !n.read
            );
            
            console.log('🆕 Notificaciones nuevas encontradas:', newNotifications.length);
            
            // Procesar cada notificación nueva
            newNotifications.forEach(async notification => {
                console.log('🔔🔔🔔 NUEVA NOTIFICACIÓN DETECTADA!');
                console.log('  ID:', notification.key);
                console.log('  Tipo:', notification.type);
                console.log('  Mensaje:', notification.message);
                console.log('  De:', notification.user?.displayName || 'Desconocido');
                
                // Mostrar notificación del navegador
                if ('Notification' in window && Notification.permission === 'granted') {
                    let title = '🔔 NITEDRED';
                    
                    switch(notification.type) {
                        case 'like':
                            title = '💖 Nuevo Like';
                            break;
                        case 'comment':
                            title = '💬 Nuevo Mensaje';
                            break;
                        case 'follow':
                            title = '👤 Nuevo Seguidor';
                            break;
                    }
                    
                    console.log('📢 Mostrando notificación del navegador:', title);
                    
                    const userName = notification.user?.displayName || 'Alguien';
                    const userPhoto = notification.user?.photoURL || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(userName);
                    
                    // Usar Service Worker si está disponible (mejor para móviles)
                    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
                        try {
                            const registration = await navigator.serviceWorker.ready;
                            await registration.showNotification(title, {
                                body: notification.message,
                                icon: userPhoto,
                                tag: 'nitedred-' + notification.key,
                                requireInteraction: false,
                                vibrate: [200, 100, 200], // Vibración en móviles
                                badge: userPhoto,
                                data: { url: '/' }
                            });
                            console.log('✅ Notificación mostrada vía Service Worker (móvil)');
                        } catch (e) {
                            console.log('⚠️ Error con Service Worker, usando API directa:', e);
                            // Fallback a Notification API directa
                            new Notification(title, {
                                body: notification.message,
                                icon: userPhoto,
                                tag: 'nitedred-' + notification.key,
                                requireInteraction: false
                            });
                        }
                    } else {
                        // PC: usar Notification API directa
                        new Notification(title, {
                            body: notification.message,
                            icon: userPhoto,
                            tag: 'nitedred-' + notification.key,
                            requireInteraction: false
                        });
                        console.log('✅ Notificación mostrada vía API directa (PC)');
                    }
                    
                    // Sonido (funciona mejor en PC que en móvil)
                    try {
                        const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvHZiTYIGGS57OihUBELTKXh8bllHgU2jdXzzn0pBSp+zPLaizsKGGC37OmjTxALTKTh8bllHwU1i9T0z4AmBSh6y/HajDwKF1247OmiTRAKSqPg8blnHwU0i9T0z4IlBSh6yvLbjTsKGF+37OmiTxEKSqLf8blmHwU0jNP0z4EmBSh5y/HajDwKGGC37OmiTxAKSqPg8bdoHgU1i9P0zoElBSh6y/HajTsLGF+37OmiTxAKSqPg8bllHwU1i9T0z4ElBSh6yvLajTwKF1+37OmiTxAKSqPg8bllHwU1i9T0z4EmBSh6yvLbjTwKF1+37OmiUBAKSqPg8bllHwU1i9T0z4EmBSh5yvLbjTwKF1247OmiUBEKSaLg8blmHwU1i9Ty0IEmBSh6yvLbjTwKGF+37OmiTxEKSaPf8bllHgU1i9T0z4EmBSh6yvLajDwKGF+37OmiTxEKSaPg8bllHgU1i9T0z4EmBSh6yvLajDwKGF+37OmiTxEKSaPg8bllHgU1i9T0z4EmBSh6yvLbjDwKGF+37OmiTxEKSaPg8bllHgU1i9T0z4EmBSh6yvLbjDwKGF+37OmiUBEKSaPg8bllHgU1i9T0z4EmBSh6yvLbjDwKGF+37OmiUBEKSaPg8bllHgU1i9T0z4EmBSh6yvLbjDwKGF+37OmiUBEKSaPg8bllHgU1i9T0z4EmBSh6yvLbjDwKGF+37OmiUBEKSaPg8bllHgU1i9T0z4EmBSh6yvLbjDwKGF+37OmiUBEKSaPg8bllHgU1i9T0z4EmBSh6yvLbjDwKGF+37OmiUBEKSaPg8bllHgU1i9T0z4EmBSh6yvLbjDwKGF+37OmiUBEKSaPg8bllHgU1i9T0z4EmBSh6yvLbjDwKGF+37OmiUBEKSaPg8bllHgU1i9T0z4EmBSh6yvLbjDwKGF+37OmiUBEKSaPg8bllHgU1i9T0z4EmBSh6yvLbjDwKGF+37OmiUBEKSaPg8bllHgU1i9T0z4EmBSh6yvLbjDwKGF+37OmiUBEKSaPg8bllHgU1i9T0z4EmBSh6yvLbjDwKGF+37OmiUBEKSaPg8bllHgU1i9T0z4EmBSh6yvLbjDwKGF+37OmiUBEKSaPg8bllHgU1i9T0z4EmBSh6yvLbjDwKGF+37OmiUBEKSaPg8bllHgU1i9T0z4EmBSh6yvLbjDwKGF+37OmiUBEKSaPg8bllHgU1i9T0z4EmBSh6yvLbjDwKGF+37OmiUBEKSaPg8bllHgU1i9T0z4EmBSh6yvLbjDwKGF+37OmiUBEKSaPg8bllHgU1i9T0z4EmBSh6yvLbjDwKGF+37OmiUBEKSaPg8Q==');
                        audio.volume = 0.3;
                        audio.play().catch(e => console.log('🔇 No se pudo reproducir sonido (normal en móviles)'));
                    } catch(e) {
                        console.log('Error sonido:', e);
                    }
                } else {
                    console.log('⚠️ Notificación navegador NO disponible. Permiso:', Notification.permission);
                }
                
                // Agregar a la UI
                const notificationsList = document.getElementById('notifications-list');
                if (notificationsList) {
                    const emptyMessage = notificationsList.querySelector('p');
                    if (emptyMessage) emptyMessage.remove();
                    
                    renderNotification(notification);
                    unreadNotifications++;
                    updateNotificationBadge();
                    
                    console.log('✅ Notificación agregada a la UI. Total sin leer:', unreadNotifications);
                }
            });
        } else {
            console.log('📭 No hay notificaciones en Firebase');
        }
    });
    
    listenerConfigured = true;
    console.log('✅✅✅ LISTENER CONFIGURADO EXITOSAMENTE ✅✅✅');
}

// Helper function to render a notification
function renderNotification(notificationData) {
    const notificationsList = document.getElementById('notifications-list');
    if (!notificationsList) return;
    
    const { type, message, timestamp, read, id } = notificationData;
    
    let iconClass, iconBg;
    switch(type) {
        case 'like':
            iconClass = 'fas fa-heart';
            iconBg = 'from-pink-400 to-purple-500';
            break;
        case 'comment':
            iconClass = 'fas fa-comment';
            iconBg = 'from-blue-400 to-green-500';
            break;
        case 'follow':
            iconClass = 'fas fa-user-plus';
            iconBg = 'from-green-400 to-teal-500';
            break;
        case 'share':
            iconClass = 'fas fa-share';
            iconBg = 'from-purple-400 to-pink-500';
            break;
        case 'crypto':
            iconClass = 'fab fa-bitcoin';
            iconBg = 'from-yellow-400 to-orange-500';
            break;
        default:
            iconClass = 'fas fa-bell';
            iconBg = 'from-gray-400 to-gray-600';
    }
    
    // Calculate time ago
    const timeAgo = getTimeAgo(timestamp);
    
    const notificationDiv = document.createElement('div');
    notificationDiv.className = 'notification-item bg-white bg-opacity-10 rounded-xl p-3 cursor-pointer hover:bg-opacity-20 transition-all';
    notificationDiv.dataset.notificationId = id;
    notificationDiv.onclick = () => markAsRead(notificationDiv);
    
    notificationDiv.innerHTML = `
        <div class="flex items-start">
            <div class="w-8 h-8 bg-gradient-to-r ${iconBg} rounded-full mr-3 flex items-center justify-center flex-shrink-0">
                <i class="${iconClass} text-white text-sm"></i>
            </div>
            <div class="flex-1">
                <p class="text-white text-sm">${message}</p>
                <p class="text-white text-opacity-60 text-xs mt-1">${timeAgo}</p>
            </div>
            ${!read ? '<div class="w-2 h-2 bg-blue-400 rounded-full flex-shrink-0"></div>' : ''}
        </div>
    `;
    
    notificationsList.appendChild(notificationDiv);
}

// Helper function to calculate time ago
function getTimeAgo(timestamp) {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (minutes < 1) return 'ahora';
    if (minutes < 60) return `hace ${minutes}m`;
    if (hours < 24) return `hace ${hours}h`;
    return `hace ${days}d`;
}

// Expose to window
console.log('📢 Exposing notification functions to window');
window.loadNotificationsFromFirebase = loadNotificationsFromFirebase;
window.addNotification = addNotification;
window.toggleNotifications = toggleNotifications;
console.log('✅ Notification functions exposed:', {
    loadNotificationsFromFirebase: typeof window.loadNotificationsFromFirebase,
    addNotification: typeof window.addNotification,
    toggleNotifications: typeof window.toggleNotifications
});
