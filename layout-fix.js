// Error handler mejorado para Firebase y elementos superpuestos
document.addEventListener('DOMContentLoaded', function() {
    
    // Error handler global para Firebase
    window.addEventListener('error', function(e) {
        if (e.message && e.message.includes('_checkNotDeleted')) {
            console.warn('⚠️ Error de Firebase detectado - intentando reconectar...');
            e.preventDefault();
            
            // Intentar reconectar Firebase
            setTimeout(() => {
                if (window.initializeFirebase) {
                    window.initializeFirebase();
                }
            }, 1000);
            
            return false;
        }
    });
    
    // Función para forzar z-indexes correctos
    function enforceZIndexes() {
        // Header siempre al frente
        const header = document.querySelector('header');
        if (header) {
            header.style.zIndex = '10000';
            header.style.position = 'relative';
        }
        
        // Panels de búsqueda y notificaciones
        const searchPanel = document.getElementById('search-results-panel');
        if (searchPanel) {
            searchPanel.style.zIndex = '9500';
            searchPanel.style.position = 'fixed';
        }
        
        const notificationsPanel = document.getElementById('notifications-panel');
        if (notificationsPanel) {
            notificationsPanel.style.zIndex = '9400';
            notificationsPanel.style.position = 'fixed';
        }
        
        // Contenido principal más bajo
        const main = document.querySelector('main');
        if (main) {
            main.style.zIndex = '1';
            main.style.position = 'relative';
        }
        
        // Posts y contenido
        const posts = document.querySelectorAll('.glass-effect:not(header)');
        posts.forEach(post => {
            if (!post.closest('#search-results-panel') && 
                !post.closest('#notifications-panel')) {
                post.style.zIndex = '10';
                post.style.position = 'relative';
            }
        });
    }
    
    // Función para detectar y arreglar overlaps
    function fixOverlappingElements() {
        const header = document.querySelector('header');
        if (!header) return;
        
        const headerRect = header.getBoundingClientRect();
        const allElements = document.querySelectorAll('*');
        
        allElements.forEach(element => {
            const rect = element.getBoundingClientRect();
            const computedStyle = getComputedStyle(element);
            
            // Si el elemento está superpuesto al header y no es parte del header
            if (rect.top < headerRect.bottom && 
                rect.bottom > headerRect.top && 
                !header.contains(element) &&
                element !== header &&
                computedStyle.position !== 'fixed' &&
                computedStyle.position !== 'absolute') {
                
                // Reducir su z-index
                if (parseInt(computedStyle.zIndex) > 100) {
                    element.style.zIndex = '10';
                }
            }
        });
    }
    
    // Ejecutar inmediatamente
    setTimeout(() => {
        enforceZIndexes();
        fixOverlappingElements();
    }, 500);
    
    // Ejecutar cada vez que el DOM cambie
    const observer = new MutationObserver(() => {
        enforceZIndexes();
    });
    
    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
    
    // Re-aplicar cada 2 segundos para asegurar consistencia
    setInterval(() => {
        enforceZIndexes();
    }, 2000);
    
    console.log('✅ Sistema de z-index y error handling activado');
});

// Función manual para limpiar todo
window.fixLayout = function() {
    const header = document.querySelector('header');
    const searchPanel = document.getElementById('search-results-panel');
    const notificationsPanel = document.getElementById('notifications-panel');
    
    if (header) {
        header.style.zIndex = '10000';
        header.style.position = 'relative';
    }
    
    if (searchPanel) {
        searchPanel.style.zIndex = '9500';
        searchPanel.style.position = 'fixed';
    }
    
    if (notificationsPanel) {
        notificationsPanel.style.zIndex = '9400';
        notificationsPanel.style.position = 'fixed';
    }
    
    // Limpiar z-indexes altos de otros elementos
    document.querySelectorAll('*').forEach(el => {
        const style = getComputedStyle(el);
        if (parseInt(style.zIndex) > 1000 && 
            !el.matches('header, header *, #search-results-panel, #search-results-panel *, #notifications-panel, #notifications-panel *')) {
            el.style.zIndex = '10';
        }
    });
    
    console.log('🔧 Layout forzado correctamente');
};