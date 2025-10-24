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
    showToast('FunciÃ³n "Ver todas" prÃ³ximamente disponible');
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
        console.log('Firebase not initialized or no user logged in');
        return;
    }
    
    try {
        const userId = (currentUser.email || currentUser.uid).replace(/[.@]/g, '_');
        console.log('ðŸ“¥ Loading notifications for user:', userId);
        
        const notificationsRef = firebaseDB.ref(database, `notifications/${userId}`);
        const snapshot = await firebaseDB.get(notificationsRef);
        
        if (snapshot.exists()) {
            const firebaseNotifications = snapshot.val();
            const notificationsList = document.getElementById('notifications-list');
            
            console.log('Found notifications in Firebase:', Object.keys(firebaseNotifications).length);
            
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
            console.log(`âœ… Loaded ${notificationsArray.length} notifications (${unreadNotifications} unread)`);
            
            // Set up real-time listener for NEW notifications
            setupNotificationListener();
        } else {
            console.log('âš ï¸ No notifications found in Firebase for user:', userId);
            // Set up listener even if no notifications exist
            setupNotificationListener();
        }
    } catch (error) {
        console.error('âŒ Error loading notifications from Firebase:', error);
    }
}

// Set up real-time listener for new notifications
let lastNotificationTime = Date.now(); // Track when we started listening
let notificationListener = null; // Store listener reference

function setupNotificationListener() {
    const { database, firebaseDB, currentUser } = getFirebase();
    
    if (!database || !firebaseDB || !currentUser) {
        console.log('Cannot setup notification listener - Firebase not ready');
        return;
    }
    
    const userId = (currentUser.email || currentUser.uid).replace(/[.@]/g, '_');
    const notificationsRef = firebaseDB.ref(database, `notifications/${userId}`);
    
    // Update the timestamp to NOW
    lastNotificationTime = Date.now();
    console.log('ðŸŽ§ Notification listener started at:', new Date(lastNotificationTime).toLocaleTimeString());
    console.log('ðŸ‘‚ Listening for user:', userId);
    
    // Remove existing listener if any
    if (notificationListener) {
        firebaseDB.off(notificationsRef, 'child_added', notificationListener);
    }
    
    // Listen for new children added
    notificationListener = firebaseDB.onChildAdded(notificationsRef, (snapshot) => {
        const notification = snapshot.val();
        const notificationId = snapshot.key;
        
        console.log('ðŸ“© Child added event:', {
            id: notificationId,
            timestamp: new Date(notification.timestamp).toLocaleString(),
            listenerTime: new Date(lastNotificationTime).toLocaleString(),
            diff: notification.timestamp - lastNotificationTime
        });
        
        // Only process notifications created AFTER listener was set up
        const isNew = notification.timestamp > lastNotificationTime;
        
        if (isNew && !notification.read) {
            console.log('ðŸ”” NEW notification detected!', {
                type: notification.type,
                message: notification.message,
                from: notification.user?.displayName
            });
            
            // Show browser push notification
            if (window.sendPushNotification && Notification.permission === 'granted') {
                let title = 'CryptoSocial';
                
                switch(notification.type) {
                    case 'like':
                        title = 'ðŸ’– Nuevo Like';
                        break;
                    case 'comment':
                        title = 'ðŸ’¬ Nuevo Mensaje';
                        break;
                    case 'follow':
                        title = 'ðŸ‘¤ Nuevo Seguidor';
                        break;
                }
                
                const userName = notification.user?.displayName || 'Alguien';
                const userPhoto = notification.user?.photoURL || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(userName);
                
                console.log('ðŸ“¢ Sending push notification:', title, userName);
                
                window.sendPushNotification(title, {
                    body: notification.message,
                    icon: userPhoto,
                    data: { url: window.location.origin }
                });
            } else {
                console.log('âš ï¸ Push notification not sent. Permission:', Notification.permission);
            }
            
            // Add to UI if notifications panel exists
            const notificationsList = document.getElementById('notifications-list');
            if (notificationsList) {
                console.log('âž• Adding notification to UI');
                // Remove "no notifications" message if exists
                const emptyMessage = notificationsList.querySelector('p');
                if (emptyMessage) {
                    emptyMessage.remove();
                }
                
                // Render the notification
                renderNotification(notification);
                unreadNotifications++;
                updateNotificationBadge();
            }
        } else {
            console.log('â­ï¸ Skipping notification (old or read):', {
                isNew,
                read: notification.read,
                timestamp: notification.timestamp,
                listenerTime: lastNotificationTime
            });
        }
    });
    
    console.log('âœ… Notification listener set up successfully');
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
console.log('ðŸ“¢ Exposing notification functions to window');
window.loadNotificationsFromFirebase = loadNotificationsFromFirebase;
window.addNotification = addNotification;
console.log('âœ… Notification functions exposed:', {
    loadNotificationsFromFirebase: typeof window.loadNotificationsFromFirebase,
    addNotification: typeof window.addNotification
});
