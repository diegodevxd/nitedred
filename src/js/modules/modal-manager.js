// Modal Improvements JavaScript
// Enhanced modal functionality with better animations and UX

class ModalManager {
    constructor() {
        this.activeModal = null;
        this.initializeModalHandlers();
    }

    initializeModalHandlers() {
        // Add enhanced classes to all modals on page load
        this.enhanceExistingModals();
        
        // Add keyboard event handlers
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.activeModal) {
                this.closeActiveModal();
            }
        });

        // Add click outside to close
        document.addEventListener('click', (e) => {
            if (this.activeModal && e.target === this.activeModal) {
                this.closeActiveModal();
            }
        });
    }

    enhanceExistingModals() {
        const modals = document.querySelectorAll('[id$="-modal"]');
        modals.forEach(modal => {
            // Add enhanced backdrop class
            if (modal.classList.contains('bg-black')) {
                modal.classList.add('modal-backdrop-enhanced');
            }

            // Find and enhance modal content
            const content = modal.querySelector('.glass-effect');
            if (content) {
                content.classList.add('modal-enhanced', 'modal-scrollbar');
            }

            // Enhance inputs
            const inputs = modal.querySelectorAll('input, textarea');
            inputs.forEach(input => {
                input.classList.add('modal-input-enhanced');
            });

            // Enhance close buttons
            const closeButtons = modal.querySelectorAll('button[onclick*="hide"], .fa-times');
            closeButtons.forEach(btn => {
                if (btn.parentElement.tagName === 'BUTTON') {
                    btn.parentElement.classList.add('modal-close-enhanced');
                } else if (btn.tagName === 'BUTTON') {
                    btn.classList.add('modal-close-enhanced');
                }
            });

            // Enhance form groups
            const formGroups = modal.querySelectorAll('.mb-4');
            formGroups.forEach(group => {
                if (group.querySelector('label') || group.querySelector('input') || group.querySelector('textarea')) {
                    group.classList.add('modal-form-group');
                }
            });

            // Enhance headers
            const headers = modal.querySelectorAll('.flex.justify-between.items-center');
            headers.forEach(header => {
                if (header.querySelector('h3')) {
                    header.classList.add('modal-header-enhanced');
                }
            });
        });
    }

    showModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            this.activeModal = modal;
            modal.classList.remove('hidden');
            
            // Add fade in animation
            const content = modal.querySelector('.glass-effect');
            if (content) {
                content.classList.add('modal-fade-in');
                setTimeout(() => {
                    content.classList.remove('modal-fade-in');
                }, 300);
            }

            // Focus first input if exists
            setTimeout(() => {
                const firstInput = modal.querySelector('input, textarea');
                if (firstInput) {
                    firstInput.focus();
                }
            }, 100);
        }
    }

    hideModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            const content = modal.querySelector('.glass-effect');
            if (content) {
                content.classList.add('modal-fade-out');
                setTimeout(() => {
                    modal.classList.add('hidden');
                    content.classList.remove('modal-fade-out');
                    if (this.activeModal === modal) {
                        this.activeModal = null;
                    }
                }, 300);
            } else {
                modal.classList.add('hidden');
                if (this.activeModal === modal) {
                    this.activeModal = null;
                }
            }
        }
    }

    closeActiveModal() {
        if (this.activeModal) {
            const modalId = this.activeModal.id;
            this.hideModal(modalId);
        }
    }

    enhanceSearchResults(containerId) {
        const container = document.getElementById(containerId);
        if (container) {
            container.classList.add('search-results-enhanced');
            
            // Add loading state
            if (container.innerHTML.trim() === '') {
                container.innerHTML = '<div class="search-loading">Buscando...</div>';
            }

            // Enhance existing items
            const items = container.querySelectorAll('.cursor-pointer, .hover\\:bg-white');
            items.forEach(item => {
                item.classList.add('search-result-item');
            });
        }
    }

    showSearchLoading(containerId) {
        const container = document.getElementById(containerId);
        if (container) {
            container.innerHTML = '<div class="search-loading">Buscando...</div>';
        }
    }

    showSearchEmpty(containerId, message = 'No se encontraron resultados') {
        const container = document.getElementById(containerId);
        if (container) {
            container.innerHTML = `<div class="search-empty">${message}</div>`;
        }
    }

    addFormValidation(formId) {
        const form = document.getElementById(formId);
        if (form) {
            const inputs = form.querySelectorAll('input[required], textarea[required]');
            inputs.forEach(input => {
                input.addEventListener('blur', () => {
                    this.validateInput(input);
                });
                
                input.addEventListener('input', () => {
                    this.clearValidationError(input);
                });
            });
        }
    }

    validateInput(input) {
        if (input.hasAttribute('required') && !input.value.trim()) {
            this.showValidationError(input, 'Este campo es obligatorio');
            return false;
        }
        
        if (input.type === 'email' && input.value && !this.isValidEmail(input.value)) {
            this.showValidationError(input, 'Email no válido');
            return false;
        }
        
        this.clearValidationError(input);
        return true;
    }

    showValidationError(input, message) {
        this.clearValidationError(input);
        
        input.style.borderColor = '#ef4444';
        input.style.backgroundColor = 'rgba(239, 68, 68, 0.1)';
        
        const errorDiv = document.createElement('div');
        errorDiv.className = 'validation-error text-red-400 text-sm mt-1';
        errorDiv.textContent = message;
        
        input.parentNode.appendChild(errorDiv);
    }

    clearValidationError(input) {
        input.style.borderColor = '';
        input.style.backgroundColor = '';
        
        const errorDiv = input.parentNode.querySelector('.validation-error');
        if (errorDiv) {
            errorDiv.remove();
        }
    }

    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }
}

// Initialize modal manager
const modalManager = new ModalManager();

// Override existing modal functions with enhanced versions
// Guard against double-loading this file (PWA or repeated script tags)
if (!window.__modalManagerPatched) {
  window.__modalManagerPatched = true;

const originalToggleMobileSearch = window.toggleMobileSearch;
window.toggleMobileSearch = function() {
    const modal = document.getElementById('mobile-search-modal');
    if (modal.classList.contains('hidden')) {
        modalManager.showModal('mobile-search-modal');
    } else {
        modalManager.hideModal('mobile-search-modal');
    }
};

const originalShowSearchUsers = window.showSearchUsers;
window.showSearchUsers = function() {
    modalManager.showModal('search-users-modal');
};

const originalHideSearchUsers = window.hideSearchUsers;
window.hideSearchUsers = function() {
    modalManager.hideModal('search-users-modal');
};

const originalShowNewChat = window.showNewChat;
window.showNewChat = function() {
    modalManager.showModal('new-chat-modal');
};

const originalHideNewChat = window.hideNewChat;
window.hideNewChat = function() {
    modalManager.hideModal('new-chat-modal');
};

const originalShowEditProfile = window.showEditProfile;
window.showEditProfile = function() {
    modalManager.showModal('edit-profile-modal');
};

const originalHideEditProfile = window.hideEditProfile;
window.hideEditProfile = function() {
    modalManager.hideModal('edit-profile-modal');
};

// Enhance search functions
const originalSearchUsers = window.searchUsers;
window.searchUsers = function() {
    modalManager.showSearchLoading('search-results');
    if (originalSearchUsers) {
        originalSearchUsers();
    }
    setTimeout(() => {
        modalManager.enhanceSearchResults('search-results');
    }, 500);
};

const originalSearchFollowing = window.searchFollowing;
window.searchFollowing = function() {
    modalManager.showSearchLoading('following-results');
    if (originalSearchFollowing) {
        originalSearchFollowing();
    }
    setTimeout(() => {
        modalManager.enhanceSearchResults('following-results');
    }, 500);
};

const originalHandleGlobalSearch = window.handleGlobalSearch;
window.handleGlobalSearch = function(query) {
    if (query.trim()) {
        modalManager.showSearchLoading('mobile-search-results');
    }
    if (originalHandleGlobalSearch) {
        originalHandleGlobalSearch(query);
    }
    setTimeout(() => {
        modalManager.enhanceSearchResults('mobile-search-results');
    }, 500);
};

} // end guard __modalManagerPatched

// Add validation to profile form
document.addEventListener('DOMContentLoaded', () => {
    modalManager.addFormValidation('edit-profile-modal');
    
    // Add smooth scrolling to modal content
    const modalContents = document.querySelectorAll('.glass-effect');
    modalContents.forEach(content => {
        content.style.scrollBehavior = 'smooth';
    });
});

// Export for global use
window.modalManager = modalManager;
