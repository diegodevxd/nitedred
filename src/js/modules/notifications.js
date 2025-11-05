// Notifications Functions - FIXED VERSION
let notificationsVisible = false;
let unreadNotifications = 0;
let listenerConfigured = false;
let notificationStartTime = Date.now(); // Timestamp para filtrar solo notificaciones NUEVAS

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
            const userId = currentUser.uid;
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
    const badgeText = badge?.querySelector('span');
    
    if (badge && badgeText) {
        if (unreadNotifications > 0) {
            badge.style.display = 'flex';
            badgeText.textContent = unreadNotifications > 9 ? '9+' : unreadNotifications;
        } else {
            badge.style.display = 'none';
        }
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
        const notifRef = firebaseDB.ref(database, `notifications/${targetUserId}/${notificationData.id}`);
        firebaseDB.set(notifRef, notificationData).catch(err => {
            console.error('Error saving notification to Firebase:', err);
        });
        console.log('✅ Notificación guardada en Firebase para:', targetUserId);
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
        const userId = currentUser.uid;  // Usar UID directo
        console.log('📥 CARGANDO NOTIFICACIONES PARA:', userId);
        
        const notificationsRef = firebaseDB.ref(database, `notifications/${userId}`);
        const snapshot = await firebaseDB.get(notificationsRef);
        
        if (snapshot.exists()) {
            const firebaseNotifications = snapshot.val();
            const notificationsList = document.getElementById('notifications-list');
            
            if (!notificationsList) {
                console.error('❌ notifications-list NO encontrado en el DOM!');
                return;
            }
            
            console.log('✅ Encontradas', Object.keys(firebaseNotifications).length, 'notificaciones en Firebase');
            console.log('✅ Contenedor notifications-list encontrado:', notificationsList);
            
            // Clear existing notifications
            notificationsList.innerHTML = '';
            
            // Convert to array and sort by timestamp (newest first)
            const notificationsArray = Object.entries(firebaseNotifications).map(([key, val]) => ({
                ...val,
                key: key,
                id: val.id || key
            })).sort((a, b) => b.timestamp - a.timestamp);
            
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
            console.log(`✅ HTML del contenedor:`, notificationsList.children.length, 'elementos');
            
            // IMPORTANTE: Configurar listener DESPUÉS de cargar
            setupNotificationListener();
        } else {
            console.log('⚠️ No hay notificaciones en Firebase para:', userId);
            const notificationsList = document.getElementById('notifications-list');
            if (notificationsList) {
                notificationsList.innerHTML = '<p class="text-white text-opacity-60 text-center py-8">No hay notificaciones</p>';
            }
            // Configurar listener aunque no haya notificaciones
            setupNotificationListener();
        }
    } catch (error) {
        console.error('❌ Error cargando notificaciones:', error);
    }
}

// Set up real-time listener for new notifications USANDO childAdded
async function setupNotificationListener() {
    const { database, firebaseDB, currentUser } = getFirebase();
    
    if (!database || !firebaseDB || !currentUser) {
        console.log('⚠️ No se puede configurar listener - Firebase no está listo');
        return;
    }
    
    if (listenerConfigured) {
        console.log('⚠️ Listener ya configurado, saltando...');
        return;
    }
    
    const userId = currentUser.uid;
    const notificationsRef = firebaseDB.ref(database, `notifications/${userId}`);
    
    console.log('🎧🎧🎧 CONFIGURANDO LISTENER DE NOTIFICACIONES 🎧🎧🎧');
    console.log('👤 Usuario:', userId);
    console.log('📍 Ruta Firebase:', `notifications/${userId}`);
    console.log('⏰ Timestamp inicio:', new Date(notificationStartTime).toLocaleString());
    
    // Solicitar permisos de notificación si no está concedido
    requestNotificationPermission();
    
    // Importar onChildAdded desde Firebase Modular SDK
    const { onChildAdded } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js');
    
    // Listener para notificaciones NUEVAS solamente (childAdded solo dispara para NUEVOS nodos)
    onChildAdded(notificationsRef, async (snapshot) => {
        const notificationData = snapshot.val();
        const notificationKey = snapshot.key;
        
        const notification = {
            ...notificationData,
            key: notificationKey,
            id: notificationData.id || notificationKey
        };
        
        console.log('📨 childAdded disparado!');
        console.log('  Key:', notificationKey);
        console.log('  Timestamp notif:', notification.timestamp);
        console.log('  Start time:', notificationStartTime);
        console.log('  Es nueva?:', notification.timestamp > notificationStartTime);
        
        // Solo procesar si es posterior al inicio del listener Y no está leída
        if (notification.timestamp > notificationStartTime && !notification.read) {
            console.log('🔔🔔🔔 NUEVA NOTIFICACIÓN DETECTADA! 🔔🔔🔔');
            console.log('  ID:', notification.id);
            console.log('  Tipo:', notification.type);
            console.log('  Mensaje:', notification.message);
            console.log('  De:', notification.user?.displayName || 'Desconocido');
            
            // Agregar a la UI primero
            const notificationsList = document.getElementById('notifications-list');
            if (notificationsList) {
                const emptyMessage = notificationsList.querySelector('p');
                if (emptyMessage) emptyMessage.remove();
                
                renderNotification(notification);
                unreadNotifications++;
                updateNotificationBadge();
                
                console.log('✅ Notificación agregada a la UI. Total sin leer:', unreadNotifications);
            }
            
            // Mostrar notificación del navegador
            await showBrowserNotification(notification);
            
            // Reproducir sonido
            playNotificationSound();
        } else {
            console.log('⏭️ Notificación antigua o ya leída, omitiendo...');
        }
    });
    
    listenerConfigured = true;
    console.log('✅✅✅ LISTENER CONFIGURADO EXITOSAMENTE ✅✅✅');
}

// Solicitar permiso de notificaciones
async function requestNotificationPermission() {
    if (!('Notification' in window)) {
        console.log('⚠️ Notificaciones del navegador no soportadas');
        return false;
    }
    
    if (Notification.permission === 'granted') {
        console.log('✅ Permisos de notificación ya concedidos');
        return true;
    }
    
    if (Notification.permission === 'default') {
        console.log('📱 Solicitando permiso de notificaciones...');
        const permission = await Notification.requestPermission();
        console.log('📱 Respuesta:', permission);
        return permission === 'granted';
    }
    
    console.log('⚠️ Permiso de notificación denegado previamente');
    return false;
}

// Función para mostrar notificación del navegador
async function showBrowserNotification(notification) {
    if (!('Notification' in window)) {
        console.log('⚠️ Notificaciones del navegador no soportadas');
        return;
    }
    
    if (Notification.permission !== 'granted') {
        console.log('⚠️ Permiso de notificación NO concedido. Estado:', Notification.permission);
        return;
    }
    
    let title = '🔔 NITEDRED';
    let icon = 'image/logo.jpeg';
    
    switch(notification.type) {
        case 'like':
            title = '💖 Nuevo Like';
            break;
        case 'comment':
            title = '💬 Nuevo Comentario';
            break;
        case 'follow':
            title = '👤 Nuevo Seguidor';
            break;
        case 'share':
            title = '🔄 Compartieron tu post';
            break;
    }
    
    console.log('📢 Mostrando notificación del navegador:', title);
    
    const userName = notification.user?.displayName || 'Alguien';
    const userPhoto = notification.user?.photoURL || 'image/logo.jpeg';
    
    try {
        // Intentar con Service Worker primero (mejor para móviles y segundo plano)
        if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
            const registration = await navigator.serviceWorker.ready;
            await registration.showNotification(title, {
                body: notification.message,
                icon: userPhoto,
                badge: icon,
                tag: 'nitedred-' + notification.id,
                requireInteraction: false,
                vibrate: [200, 100, 200], // Vibración en móviles
                silent: false, // NO silenciar
                data: { 
                    url: window.location.origin,
                    notificationId: notification.id
                }
            });
            console.log('✅ Notificación mostrada vía Service Worker (mejor para móvil)');
        } else {
            // Fallback a Notification API directa (PC)
            const browserNotif = new Notification(title, {
                body: notification.message,
                icon: userPhoto,
                tag: 'nitedred-' + notification.id,
                requireInteraction: false,
                silent: false
            });
            
            // Auto-cerrar después de 5 segundos
            setTimeout(() => browserNotif.close(), 5000);
            
            // Click handler
            browserNotif.onclick = function() {
                window.focus();
                this.close();
            };
            
            console.log('✅ Notificación mostrada vía API directa (PC)');
        }
    } catch (error) {
        console.error('❌ Error mostrando notificación:', error);
    }
}

// Función para reproducir sonido de notificación
function playNotificationSound() {
    try {
        // Sonido de notificación corto y agradable
        const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvHZiTYIGGS57OihUBELTKXh8bllHgU2jdXzzn0pBSp+zPLaizsKGGC37OmjTxALTKTh8bllHwU1i9T0z4AmBSh6y/HajDwKF1247OmiTRAKSqPg8blnHwU0i9T0z4IlBSh6yvLbjTsKGF+37OmiTxEKSqLf8blmHwU0jNP0z4EmBSh5y/HajDwKGGC37OmiTxAKSqPg8bdoHgU1i9P0zoElBSh6y/HajTsLGF+37OmiTxAKSqPg8bllHwU1i9T0z4ElBSh6yvLajTwKF1+37OmiTxAKSqPg8bllHwU1i9T0z4EmBSh6yvLbjTwKF1+37OmiUBAKSqPg8bllHwU1i9T0z4EmBSh5yvLbjTwKF1247OmiUBEKSaLg8blmHwU1i9Ty0IEmBSh6yvLbjTwKGF+37OmiTxEKSaPf8bllHgU1i9T0z4EmBSh6yvLajDwKGF+37OmiTxEKSaPg8bllHgU1i9T0z4EmBSh6yvLajDwKGF+37OmiTxEKSaPg8bllHgU1i9T0z4EmBSh6yvLbjDwKGF+37OmiTxEKSaPg8bllHgU1i9T0z4EmBSh6yvLbjDwKGF+37OmiUBEKSaPg8bllHgU1i9T0z4EmBSh6yvLbjDwKGF+37OmiUBEKSaPg8bllHgU1i9T0z4EmBSh6yvLbjDwKGF+37OmiUBEKSaPg8bllHgU1i9T0z4EmBSh6yvLbjDwKGF+37OmiUBEKSaPg8bllHgU1i9T0z4EmBSh6yvLbjDwKGF+37OmiUBEKSaPg8bllHgU1i9T0z4EmBSh6yvLbjDwKGF+37OmiUBEKSaPg8bllHgU1i9T0z4EmBSh6yvLbjDwKGF+37OmiUBEKSaPg8bllHgU1i9T0z4EmBSh6yvLbjDwKGF+37OmiUBEKSaPg8bllHgU1i9T0z4EmBSh6yvLbjDwKGF+37OmiUBEKSaPg8bllHgU1i9T0z4EmBSh6yvLbjDwKGF+37OmiUBEKSaPg8bllHgU1i9T0z4EmBSh6yvLbjDwKGF+37OmiUBEKSaPg8bllHgU1i9T0z4EmBSh6yvLbjDwKGF+37OmiUBEKSaPg8bllHgU1i9T0z4EmBSh6yvLbjDwKGF+37OmiUBEKSaPg8bllHgU1i9T0z4EmBSh6yvLbjDwKGF+37OmiUBEKSaPg8Q==');
        audio.volume = 0.5;
        audio.play().catch(e => {
            console.log('🔇 No se pudo reproducir sonido (normal si usuario no interactuó):', e.message);
        });
        console.log('🔊 Sonido de notificación reproducido');
    } catch(e) {
        console.log('❌ Error reproduciendo sonido:', e);
    }
}

// Helper function to render a notification
function renderNotification(notificationData) {
    const notificationsList = document.getElementById('notifications-list');
    
    if (!notificationsList) {
        console.error('❌ notifications-list element not found!');
        return;
    }
    
    const { type, message, timestamp, read, id, key } = notificationData;
    const notifId = id || key;
    
    console.log('🎨 Renderizando notificación:', notifId, type, message.substring(0, 30) + '...');
    
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
    notificationDiv.className = 'notification-item bg-white bg-opacity-10 rounded-xl p-3 cursor-pointer hover:bg-opacity-20 transition-all mb-2';
    notificationDiv.dataset.notificationId = notifId;
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
    console.log('✅ Notificación agregada al DOM. Total elementos:', notificationsList.children.length);
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
window.requestNotificationPermission = requestNotificationPermission;
window.resetNotificationListener = function() {
    console.log('🔄 Reseteando listener de notificaciones');
    listenerConfigured = false;
    notificationStartTime = Date.now();
};
console.log('✅ Notification functions exposed:', {
    loadNotificationsFromFirebase: typeof window.loadNotificationsFromFirebase,
    addNotification: typeof window.addNotification,
    toggleNotifications: typeof window.toggleNotifications,
    requestNotificationPermission: typeof window.requestNotificationPermission,
    resetNotificationListener: typeof window.resetNotificationListener
});
