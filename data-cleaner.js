/**
 * Script para limpiar datos corruptos y arreglar problemas de NaN
 */

function cleanCorruptedData() {
    console.log('🧹 Limpiando datos corruptos...');
    
    try {
        const savedPosts = localStorage.getItem('nitedcrypto_posts');
        if (!savedPosts) {
            console.log('✅ No hay datos para limpiar');
            return;
        }
        
        const posts = JSON.parse(savedPosts);
        let cleanedCount = 0;
        
        posts.forEach((post, index) => {
            let needsCleaning = false;
            
            // Fix likes
            if (!post.likes || isNaN(post.likes)) {
                post.likes = post.likedBy ? post.likedBy.length : 0;
                needsCleaning = true;
            }
            
            // Fix likedBy array
            if (!Array.isArray(post.likedBy)) {
                post.likedBy = [];
                needsCleaning = true;
            }
            
            // Fix comments
            if (!Array.isArray(post.comments)) {
                post.comments = [];
                needsCleaning = true;
            }
            
            // Initialize reactions data
            if (!post.reactions) {
                post.reactions = {
                    like: post.likes || 0,
                    love: 0,
                    haha: 0,
                    wow: 0,
                    sad: 0,
                    angry: 0
                };
                needsCleaning = true;
            }
            
            // Fix reaction values
            Object.keys(post.reactions).forEach(reaction => {
                if (isNaN(post.reactions[reaction])) {
                    post.reactions[reaction] = 0;
                    needsCleaning = true;
                }
            });
            
            // Initialize reaction users
            if (!post.reactionUsers) {
                post.reactionUsers = {};
                // Migrate existing likes
                if (post.likedBy && post.likedBy.length > 0) {
                    post.likedBy.forEach(userId => {
                        post.reactionUsers[userId] = 'like';
                    });
                }
                needsCleaning = true;
            }
            
            if (needsCleaning) {
                cleanedCount++;
                console.log(`🔧 Post ${post.id} limpiado`);
            }
        });
        
        if (cleanedCount > 0) {
            localStorage.setItem('nitedcrypto_posts', JSON.stringify(posts));
            console.log(`✅ ${cleanedCount} posts limpiados y guardados`);
            
            // Reload posts if we're on the main page
            if (typeof loadPosts === 'function') {
                loadPosts();
            }
        } else {
            console.log('✅ Todos los datos están limpios');
        }
        
    } catch (error) {
        console.error('❌ Error limpiando datos:', error);
    }
}

// Auto-ejecutar cuando se carga la página
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(() => {
        cleanCorruptedData();
    }, 2000); // Esperar a que todo se cargue
});

// Función manual para limpiar
window.cleanData = cleanCorruptedData;