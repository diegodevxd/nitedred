// Fix temporal para el problema del buscador
document.addEventListener('DOMContentLoaded', function() {
    console.log('🛠️ Aplicando fix del buscador...');
    
    // Buscar todos los inputs de búsqueda
    const searchInputs = [
        document.getElementById('global-search-input'),
        document.getElementById('mobile-search-input')
    ].filter(Boolean); // Filtrar los que existen
    
    searchInputs.forEach((input, index) => {
        if (!input) return;
        
        console.log(`📝 Configurando input ${index + 1}:`, input.id);
        
        // Limpiar eventos existentes
        input.oninput = null;
        input.onfocus = null;
        
        // Asegurar que el input puede recibir texto
        input.removeAttribute('readonly');
        input.removeAttribute('disabled');
        input.style.pointerEvents = 'auto';
        
        // Forzar estilos de visibilidad del texto
        input.style.color = 'white';
        input.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
        input.style.opacity = '1';
        input.style.visibility = 'visible';
        input.style.fontSize = '14px';
        input.style.fontFamily = 'inherit';
        
        // Asegurar que el placeholder no interfiera
        input.style.setProperty('color', 'white', 'important');
        
        console.log(`🎨 Estilos aplicados a ${input.id}`);
        
        // Agregar event listener para input
        input.addEventListener('input', function(e) {
            console.log('📝 Input detectado:', e.target.value);
            
            // Forzar actualización visual
            const value = e.target.value;
            setTimeout(() => {
                if (e.target.value !== value) {
                    e.target.value = value;
                }
                // Forzar repaint
                e.target.style.display = 'none';
                e.target.offsetHeight; // Trigger reflow
                e.target.style.display = '';
            }, 0);
            
            if (window.handleGlobalSearch) {
                window.handleGlobalSearch(e.target.value);
            } else {
                console.warn('⚠️ handleGlobalSearch no disponible');
            }
        });
        
        // Agregar event listener para keydown/keyup también
        input.addEventListener('keydown', function(e) {
            console.log('⌨️ Tecla presionada:', e.key);
        });
        
        input.addEventListener('keyup', function(e) {
            console.log('⌨️ Tecla liberada:', e.key, 'Valor:', e.target.value);
            // Asegurar que el valor se vea
            e.target.style.color = 'white';
        });
        
        // Agregar event listener para focus
        input.addEventListener('focus', function(e) {
            console.log('🎯 Focus detectado en input');
            if (window.showSearchResults) {
                window.showSearchResults();
            } else {
                console.warn('⚠️ showSearchResults no disponible');
            }
        });
        
        // Test inmediato
        console.log(`✅ Input ${input.id} configurado correctamente`);
    });
    
    // Verificar que las funciones estén disponibles
    setTimeout(() => {
        console.log('🔍 Verificando funciones...');
        console.log('handleGlobalSearch:', typeof window.handleGlobalSearch);
        console.log('showSearchResults:', typeof window.showSearchResults);
        
        if (typeof window.handleGlobalSearch !== 'function') {
            console.error('❌ handleGlobalSearch no está disponible');
        }
        if (typeof window.showSearchResults !== 'function') {
            console.error('❌ showSearchResults no está disponible');
        }
    }, 1000);
});

// Función de test manual
window.testSearch = function() {
    const input = document.getElementById('global-search-input');
    if (input) {
        console.log('🧪 Test manual iniciado');
        
        // Limpiar y poner valor
        input.value = '';
        input.value = 'test search';
        
        // Forzar estilos
        input.style.color = 'white';
        input.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
        
        // Disparar eventos
        input.dispatchEvent(new Event('input', { bubbles: true }));
        input.dispatchEvent(new Event('keyup', { bubbles: true }));
        
        console.log('🧪 Valor después del test:', input.value);
        console.log('🧪 Color aplicado:', input.style.color);
        console.log('🧪 Test manual completado');
        
        // Focus para verificar
        input.focus();
    }
};

// Función para verificar estilos computados
window.checkSearchStyles = function() {
    const input = document.getElementById('global-search-input');
    if (input) {
        const computed = getComputedStyle(input);
        console.log('🎨 Estilos computados:');
        console.log('Color:', computed.color);
        console.log('Background:', computed.backgroundColor);
        console.log('Font size:', computed.fontSize);
        console.log('Opacity:', computed.opacity);
        console.log('Visibility:', computed.visibility);
        console.log('Pointer events:', computed.pointerEvents);
        console.log('Position:', computed.position);
        console.log('Z-index:', computed.zIndex);
    }
};