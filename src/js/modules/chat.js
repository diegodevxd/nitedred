// Chat Functions
let currentChatUser = null;
let currentChatTab = 'chats';

function showChatTab(tab) {
    currentChatTab = tab;
    
    // Update tab buttons
    document.querySelectorAll('.chat-tab-btn').forEach(btn => {
        btn.className = 'chat-tab-btn flex-1 py-2 px-4 rounded-md text-white text-sm font-medium hover:bg-white hover:bg-opacity-10 transition-all';
    });
    
    event.target.className = 'chat-tab-btn flex-1 py-2 px-4 rounded-md text-white text-sm font-medium bg-white bg-opacity-20 transition-all';
    
    // Show/hide lists
    document.getElementById('chats-list').classList.add('hidden');
    document.getElementById('requests-list').classList.add('hidden');
    document.getElementById('archived-list').classList.add('hidden');
    
    document.getElementById(tab + '-list').classList.remove('hidden');
}

function showSearchUsers() {
    document.getElementById('search-users-modal').classList.remove('hidden');
    document.getElementById('user-search-input').focus();
    populateSearchResults('');
}

function hideSearchUsers() {
    document.getElementById('search-users-modal').classList.add('hidden');
    document.getElementById('user-search-input').value = '';
}

function showNewChat() {
    document.getElementById('new-chat-modal').classList.remove('hidden');
    document.getElementById('following-search-input').focus();
    populateFollowingResults('');
}

function hideNewChat() {
    document.getElementById('new-chat-modal').classList.add('hidden');
    document.getElementById('following-search-input').value = '';
}

function searchUsers() {
    const query = document.getElementById('user-search-input').value.toLowerCase();
    populateSearchResults(query);
}

function searchFollowing() {
    const query = document.getElementById('following-search-input').value.toLowerCase();
    populateFollowingResults(query);
}

function populateSearchResults(query) {
    const container = document.getElementById('search-results');
    // TODO: Implementar búsqueda de usuarios reales desde Firebase
    container.innerHTML = '<p class="text-white text-opacity-60 text-center py-4">Función en desarrollo - Usa el botón de seguir en posts</p>';
}

function populateFollowingResults(query) {
    const container = document.getElementById('following-results');
    // TODO: Implementar lista de usuarios seguidos desde Firebase
    container.innerHTML = '<p class="text-white text-opacity-60 text-center py-4">Función en desarrollo - Usa el botón de seguir en posts</p>';
}

function sendMessageRequest(userId, userName) {
    hideSearchUsers();
    showToast(`Solicitud de mensaje enviada a ${userName} 📩`);
}

function startNewChat(userId, userName) {
    hideNewChat();
    openChat(userName, userId);
}

function acceptMessageRequest(userName, userId) {
    // Remove from requests and add to chats
    showToast(`¡Ahora puedes chatear con ${userName}! 💬`);
    
    // Update requests badge
    const badge = document.getElementById('requests-badge');
    const currentCount = parseInt(badge.textContent);
    if (currentCount > 1) {
        badge.textContent = currentCount - 1;
    } else {
        badge.style.display = 'none';
    }
    
    // Remove the request from UI
    event.target.closest('.glass-effect').remove();
}

function declineMessageRequest(userId) {
    showToast('Solicitud rechazada');
    
    // Update requests badge
    const badge = document.getElementById('requests-badge');
    const currentCount = parseInt(badge.textContent);
    if (currentCount > 1) {
        badge.textContent = currentCount - 1;
    } else {
        badge.style.display = 'none';
    }
    
    // Remove the request from UI
    event.target.closest('.glass-effect').remove();
}

// Esta función ya no se usa - openChat ahora está en app.js
// Mantenemos la firma para evitar errores
function openChat(contactName, userId) {
    console.log('Esta función ha sido migrada a app.js - Usa startChatWithUser()');
}

function backToChats() {
    document.getElementById('individual-chat').classList.add('hidden');
    document.getElementById('individual-chat').classList.remove('flex');
    document.getElementById('chat-section').classList.remove('hidden');
    hideChatOptions();
}

function showChatOptions() {
    const menu = document.getElementById('chat-options-menu');
    menu.classList.toggle('hidden');
}

function hideChatOptions() {
    document.getElementById('chat-options-menu').classList.add('hidden');
}

function archiveCurrentChat() {
    hideChatOptions();
    showToast('Chat archivado 📁');
    backToChats();
}

function blockUser() {
    hideChatOptions();
    showToast('Usuario bloqueado 🚫');
    backToChats();
}

function unarchiveChat(userId) {
    showToast('Chat desarchivado ✅');
    event.target.closest('.glass-effect').remove();
}

// sendMessage() ha sido COMPLETAMENTE migrado a app.js con Firebase
// NO definimos la función aquí para evitar conflictos

// Close chat options when clicking outside
document.addEventListener('click', function(event) {
    const menu = document.getElementById('chat-options-menu');
    const button = event.target.closest('[onclick="showChatOptions()"]');
    
    if (!menu.contains(event.target) && !button) {
        hideChatOptions();
    }
});
