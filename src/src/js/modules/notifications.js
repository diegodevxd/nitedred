// Notifications Functions
let notificationsVisible = false;
let unreadNotifications = 5;

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
    const dot = notificationElement.querySelector('.w-2.h-2.bg-blue-400');
    if (dot) {
        dot.remove();
        unreadNotifications = Math.max(0, unreadNotifications - 1);
        updateNotificationBadge();
        
        // Add read state styling
        notificationElement.classList.add('opacity-75');
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

function addNotification(type, message, user = null) {
    const notificationsList = document.getElementById('notifications-list');
    
    // Remove "no notifications" message if exists
    const emptyMessage = notificationsList.querySelector('p');
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
    
    const notificationDiv = document.createElement('div');
    notificationDiv.className = 'notification-item bg-white bg-opacity-10 rounded-xl p-3 cursor-pointer hover:bg-opacity-20 transition-all slide-in';
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
    
    notificationsList.insertBefore(notificationDiv, notificationsList.firstChild);
    unreadNotifications++;
    updateNotificationBadge();
}

// Close notifications when clicking outside
document.addEventListener('click', function(event) {
    const panel = document.getElementById('notifications-panel');
    const button = event.target.closest('[onclick="toggleNotifications()"]');
    
    if (!panel.contains(event.target) && !button && notificationsVisible) {
        toggleNotifications();
    }
});
