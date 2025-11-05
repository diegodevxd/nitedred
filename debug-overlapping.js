// Script para debuggear elementos superpuestos
function debugOverlappingElements() {
    console.log('🔍 Debugging elementos superpuestos...');
    
    const header = document.querySelector('header');
    const headerRect = header.getBoundingClientRect();
    
    console.log('📍 Header position:', headerRect);
    
    // Buscar elementos que puedan estar superpuestos
    const allElements = document.querySelectorAll('*');
    const overlappingElements = [];
    
    allElements.forEach(element => {
        const rect = element.getBoundingClientRect();
        const style = getComputedStyle(element);
        
        // Verificar si el elemento está en la zona del header
        if (rect.top < headerRect.bottom && 
            rect.bottom > headerRect.top && 
            rect.left < headerRect.right && 
            rect.right > headerRect.left &&
            element !== header &&
            !header.contains(element)) {
            
            // Verificar si tiene posición absoluta/fija o z-index alto
            if (style.position === 'absolute' || 
                style.position === 'fixed' || 
                parseInt(style.zIndex) > 50) {
                
                overlappingElements.push({
                    element: element,
                    position: style.position,
                    zIndex: style.zIndex,
                    className: element.className,
                    id: element.id,
                    rect: rect
                });
            }
        }
    });
    
    console.log('⚠️ Elementos potencialmente superpuestos:', overlappingElements);
    
    // Mostrar elementos encontrados
    overlappingElements.forEach((item, index) => {
        console.log(`${index + 1}. Elemento:`, item.element);
        console.log(`   - Clase: ${item.className}`);
        console.log(`   - ID: ${item.id}`);
        console.log(`   - Posición: ${item.position}`);
        console.log(`   - Z-index: ${item.zIndex}`);
        console.log(`   - Rectángulo:`, item.rect);
        
        // Marcar visualmente el elemento problemático
        item.element.style.border = '2px solid red';
        item.element.style.boxShadow = '0 0 10px red';
        
        setTimeout(() => {
            item.element.style.border = '';
            item.element.style.boxShadow = '';
        }, 3000);
    });
    
    return overlappingElements;
}

// Función para forzar el header al frente
function forceHeaderToFront() {
    const header = document.querySelector('header');
    const h1 = header.querySelector('h1');
    
    header.style.position = 'relative';
    header.style.zIndex = '99999';
    h1.style.position = 'relative';
    h1.style.zIndex = '100000';
    
    console.log('✅ Header forzado al frente');
}

// Función para limpiar z-indexes problemáticos
function cleanZIndexes() {
    const allElements = document.querySelectorAll('*');
    
    allElements.forEach(element => {
        const style = getComputedStyle(element);
        if (parseInt(style.zIndex) > 1000 && 
            !element.matches('header, header *')) {
            element.style.zIndex = '1';
            console.log('🧹 Z-index limpiado en:', element);
        }
    });
}

// Auto-ejecutar al cargar la página
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(() => {
        forceHeaderToFront();
        const overlapping = debugOverlappingElements();
        
        if (overlapping.length > 0) {
            console.warn('⚠️ Se encontraron elementos superpuestos. Ejecutando limpieza...');
            cleanZIndexes();
            forceHeaderToFront();
        }
    }, 1000);
});

// Exponer funciones globalmente para debugging manual
window.debugOverlapping = debugOverlappingElements;
window.forceHeader = forceHeaderToFront;
window.cleanZ = cleanZIndexes;