/**
 * Sistema de Reacciones Mejorado - Estilo Facebook
 */

// Tipos de reacciones disponibles
const REACTIONS = {
    like: { emoji: '👍', name: 'Me gusta', color: 'text-blue-400' },
    love: { emoji: '❤️', name: 'Me encanta', color: 'text-red-400' },
    haha: { emoji: '😆', name: 'Me divierte', color: 'text-yellow-400' },
    wow: { emoji: '😮', name: 'Me asombra', color: 'text-orange-400' },
    sad: { emoji: '😢', name: 'Me entristece', color: 'text-blue-300' },
    angry: { emoji: '😡', name: 'Me enoja', color: 'text-red-600' }
};

let reactionTimeout = null;

/**
 * Toggle de reacción mejorado que evita valores NaN
 */
async function toggleReaction(button, reactionType = 'like') {
    if (!currentUser) {
        showToast('⚠️ Debes iniciar sesión para reaccionar');
        return;
    }
    
    const postElement = button.closest('.glass-effect');
    const postId = postElement?.dataset.postId;
    
    if (!postId) {
        console.error('No post ID found');
        return;
    }
    
    const currentUserId = currentUser.uid || currentUser.email?.replace(/[.@]/g, '_');
    
    try {
        // Get current posts data
        const savedPosts = localStorage.getItem('nitedcrypto_posts');
        if (!savedPosts) {
            console.error('No posts data found');
            return;
        }
        
        const posts = JSON.parse(savedPosts);
        const postIndex = posts.findIndex(p => p.id === postId);
        
        if (postIndex === -1) {
            console.error('Post not found in posts array');
            return;
        }
        
        // Initialize reaction data if it doesn't exist
        if (!posts[postIndex].reactions) {
            posts[postIndex].reactions = {};
        }
        
        if (!posts[postIndex].reactionUsers) {
            posts[postIndex].reactionUsers = {};
        }

        if (!Array.isArray(posts[postIndex].likedBy)) {
            posts[postIndex].likedBy = [];
        }
        
        // Ensure numbers are valid
        Object.keys(REACTIONS).forEach(reaction => {
            if (!posts[postIndex].reactions[reaction] || isNaN(posts[postIndex].reactions[reaction])) {
                posts[postIndex].reactions[reaction] = 0;
            }
        });
        
        // Check if user already reacted
        const userCurrentReaction = posts[postIndex].reactionUsers[currentUserId];
        
        if (userCurrentReaction === reactionType) {
            // Remove reaction
            posts[postIndex].reactions[reactionType] = Math.max(0, posts[postIndex].reactions[reactionType] - 1);
            delete posts[postIndex].reactionUsers[currentUserId];

            if (userCurrentReaction === 'like') {
                posts[postIndex].likedBy = posts[postIndex].likedBy.filter(id => id !== currentUserId);
            }
        } else {
            // Remove previous reaction if exists
            if (userCurrentReaction && posts[postIndex].reactions[userCurrentReaction]) {
                posts[postIndex].reactions[userCurrentReaction] = Math.max(0, posts[postIndex].reactions[userCurrentReaction] - 1);

                if (userCurrentReaction === 'like') {
                    posts[postIndex].likedBy = posts[postIndex].likedBy.filter(id => id !== currentUserId);
                }
            }
            
            // Add new reaction
            posts[postIndex].reactions[reactionType] = (posts[postIndex].reactions[reactionType] || 0) + 1;
            posts[postIndex].reactionUsers[currentUserId] = reactionType;

            if (reactionType === 'like') {
                if (!posts[postIndex].likedBy.includes(currentUserId)) {
                    posts[postIndex].likedBy.push(currentUserId);
                }
            } else {
                posts[postIndex].likedBy = posts[postIndex].likedBy.filter(id => id !== currentUserId);
            }
        }
        
        // Calculate total likes (for backward compatibility)
        const totalReactions = Object.values(posts[postIndex].reactions).reduce((sum, count) => {
            const num = parseInt(count) || 0;
            return sum + num;
        }, 0);
        
        posts[postIndex].likes = totalReactions;
        
        // Update UI
        updateReactionUI(postElement, posts[postIndex], currentUserId);
        
        // Save to localStorage
        localStorage.setItem('nitedcrypto_posts', JSON.stringify(posts));
        
        // Save to Firebase
        if (database && firebaseDB) {
            const postRef = firebaseDB.ref(database, `posts/${postId}`);
            const updateData = {
                reactions: posts[postIndex].reactions,
                reactionUsers: posts[postIndex].reactionUsers,
                likedBy: posts[postIndex].likedBy,
                likes: totalReactions, // For compatibility
                lastUpdated: Date.now()
            };
            
            // Ensure no NaN values
            Object.keys(updateData.reactions).forEach(key => {
                if (isNaN(updateData.reactions[key])) {
                    updateData.reactions[key] = 0;
                }
            });
            
            await firebaseDB.update(postRef, updateData).catch(err => {
                console.error('Error updating reaction in Firebase:', err);
            });
            
            // Create notification for post owner
            if (posts[postIndex].reactionUsers[currentUserId] && 
                posts[postIndex].userId && 
                posts[postIndex].userId !== currentUserId) {
                
                const userName = currentUser.displayName || currentUser.email?.split('@')[0] || 'Alguien';
                const reaction = REACTIONS[reactionType];
                
                const notificationData = {
                    id: Date.now().toString(),
                    type: 'reaction',
                    message: `${userName} reaccionó ${reaction.emoji} a tu publicación`,
                    user: {
                        displayName: userName,
                        photoURL: currentUser.photoURL || null
                    },
                    timestamp: Date.now(),
                    read: false
                };
                
                const receiverUserId = posts[postIndex].userId.replace(/[.@]/g, '_');
                const notifRef = firebaseDB.ref(database, `notifications/${receiverUserId}/${notificationData.id}`);
                firebaseDB.set(notifRef, notificationData).catch(err => {
                    console.error('Error saving reaction notification:', err);
                });
            }
        }
        
    } catch (error) {
        console.error('Error toggling reaction:', error);
        showToast('❌ Error al reaccionar');
    }
}

/**
 * Actualizar la UI de reacciones
 */
function updateReactionUI(postElement, postData, currentUserId) {
    const reactionsContainer = postElement.querySelector('.reactions-container');
    if (!reactionsContainer) return;
    
    const mainButton = reactionsContainer.querySelector('.main-reaction-btn');
    const countSpan = reactionsContainer.querySelector('.reaction-count');
    
    if (!mainButton || !countSpan) return;
    
    // Get user's current reaction
    const userReaction = postData.reactionUsers?.[currentUserId];
    const totalReactions = Object.values(postData.reactions || {}).reduce((sum, count) => {
        return sum + (parseInt(count) || 0);
    }, 0);
    
    // Update main button
    if (userReaction) {
        const reaction = REACTIONS[userReaction];
        mainButton.innerHTML = `
            <span style="font-size: 16px;">${reaction.emoji}</span>
            <span>${reaction.name}</span>
        `;
        mainButton.className = `main-reaction-btn ${reaction.color}`;
    } else {
        mainButton.innerHTML = `
            <i class="far fa-thumbs-up"></i>
            <span>Me gusta</span>
        `;
        mainButton.className = 'main-reaction-btn text-white hover:text-blue-400';
    }
    
    // Update count
    countSpan.textContent = totalReactions;
    
    // Update reactions summary
    updateReactionsSummary(postElement, postData.reactions || {});
}

/**
 * Mostrar resumen de reacciones
 */
function updateReactionsSummary(postElement, reactions) {
    let summaryContainer = postElement.querySelector('.reactions-summary');
    
    // Get top reactions
    const topReactions = Object.entries(reactions)
        .filter(([_, count]) => (parseInt(count) || 0) > 0)
        .sort((a, b) => (parseInt(b[1]) || 0) - (parseInt(a[1]) || 0))
        .slice(0, 3);
    
    if (topReactions.length === 0) {
        if (summaryContainer) {
            summaryContainer.classList.add('hidden');
        }
        return;
    }
    
    if (!summaryContainer) {
        summaryContainer = document.createElement('div');
        summaryContainer.className = 'reactions-summary';
        
        // Insert before the reactions container
        const reactionsContainer = postElement.querySelector('.reactions-container');
        const parentContainer = reactionsContainer.parentElement;
        parentContainer.insertBefore(summaryContainer, reactionsContainer);
    }
    
    summaryContainer.classList.remove('hidden');
    
    const totalCount = topReactions.reduce((sum, [_, count]) => sum + (parseInt(count) || 0), 0);
    
    summaryContainer.innerHTML = `
        <div class="reactions-display">
            ${topReactions.map(([type, count]) => `
                <span class="reaction-emoji">${REACTIONS[type].emoji}</span>
            `).join('')}
            <span class="reaction-total">${totalCount}</span>
        </div>
    `;
}

/**
 * Mostrar selector de reacciones
 */
function showReactionPicker(button) {
    // Remove any existing picker
    const existingPicker = document.querySelector('.reaction-picker');
    if (existingPicker) {
        existingPicker.remove();
    }
    
    const picker = document.createElement('div');
    picker.className = 'reaction-picker absolute bottom-full left-0 mb-2 bg-black bg-opacity-90 rounded-full p-2 flex space-x-2 z-50 border border-white border-opacity-20';
    
    Object.entries(REACTIONS).forEach(([type, reaction]) => {
        const btn = document.createElement('button');
        btn.className = 'hover:scale-125 transition-transform duration-200 text-2xl p-1 rounded-full hover:bg-white hover:bg-opacity-20';
        btn.innerHTML = reaction.emoji;
        btn.title = reaction.name;
        btn.onclick = (e) => {
            e.stopPropagation();
            toggleReaction(button, type);
            picker.remove();
        };
        picker.appendChild(btn);
    });
    
    button.style.position = 'relative';
    button.appendChild(picker);
    
    // Remove picker after 3 seconds
    setTimeout(() => {
        if (picker.parentNode) {
            picker.remove();
        }
    }, 3000);
}

// Expose functions globally
window.toggleReaction = toggleReaction;
window.showReactionPicker = showReactionPicker;
