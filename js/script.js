
// Smooth scrolling for navigation links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// Mobile menu toggle
const mobileMenu = document.querySelector('.mobile-menu');
const navMenu = document.querySelector('.nav-menu');

mobileMenu.addEventListener('click', () => {
    navMenu.classList.toggle('active');
});

// Initialize Supabase Client
const supabaseUrl = CONFIG.supabaseUrl;
const supabaseKey = CONFIG.supabaseKey;
const supabaseClient = supabase.createClient(supabaseUrl, supabaseKey);

// Custom Modal Logic
const modal = document.getElementById('custom-modal');
const modalIcon = modal.querySelector('.modal-icon i');
const modalTitle = modal.querySelector('.modal-title');
const modalMessage = modal.querySelector('.modal-message');
const closeBtn = modal.querySelector('.modal-close-btn');

function showModal(title, message, isSuccess = true) {
    modalTitle.textContent = title;
    modalMessage.textContent = message;

    // Update Icon
    if (isSuccess) {
        modalIcon.className = 'fas fa-check-circle';
        modal.querySelector('.modal-icon').classList.remove('error');
    } else {
        modalIcon.className = 'fas fa-exclamation-circle';
        modal.querySelector('.modal-icon').classList.add('error');
    }

    modal.classList.add('active');
}

if (closeBtn) {
    closeBtn.addEventListener('click', () => {
        modal.classList.remove('active');
    });
}

if (modal) {
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.classList.remove('active');
        }
    });
}

// Time Unknown Checkbox Logic
const timeInput = document.getElementById('tob');
const unknownTimeCheckbox = document.getElementById('unknown-time');

if (unknownTimeCheckbox) {
    unknownTimeCheckbox.addEventListener('change', function () {
        if (this.checked) {
            timeInput.value = '';
            timeInput.disabled = true;
            timeInput.required = false;
        } else {
            timeInput.disabled = false;
            timeInput.required = true;
        }
    });
}



// File Upload Logic
['left-palm', 'right-palm'].forEach(id => {
    const input = document.getElementById(id);
    const status = document.getElementById(`${id}-status`);

    if (input && status) {
        input.addEventListener('change', function () {
            if (this.files && this.files[0]) {
                status.textContent = this.files[0].name;
                status.classList.add('active');
                // Optional: flash the zone border/bg
                status.parentElement.style.borderColor = '#28a745';
                status.parentElement.style.backgroundColor = '#f0fff4';
            } else {
                status.textContent = 'Click to Upload';
                status.classList.remove('active');
                status.parentElement.style.borderColor = '';
                status.parentElement.style.backgroundColor = '';
            }
        });
    }
});

// Real-time Name Validation
const nameInput = document.getElementById('name');

// Helper to show/hide inline error
function setInputError(input, message) {
    const formGroup = input.parentElement;
    let errorDisplay = formGroup.querySelector('.error-message');

    if (message) {
        input.classList.add('error');
        if (!errorDisplay) {
            errorDisplay = document.createElement('span');
            errorDisplay.className = 'error-message';
            formGroup.appendChild(errorDisplay);
        }
        errorDisplay.textContent = message;
    } else {
        input.classList.remove('error');
        if (errorDisplay) {
            errorDisplay.remove();
        }
    }
}

if (nameInput) {
    nameInput.addEventListener('input', function () {
        const value = this.value.trim();
        if (value.length > 0 && value.length <= 2) {
            setInputError(this, 'Name must be greater than 2 characters');
        } else {
            setInputError(this, null);
        }
    });

    // Also validate on blur to handle empty case if needed
    nameInput.addEventListener('blur', function () {
        const value = this.value.trim();
        if (value.length > 0 && value.length <= 2) {
            setInputError(this, 'Name must be greater than 2 characters');
        }
    });
}

// Form submission
const form = document.querySelector('form');
form.addEventListener('submit', async function (e) {
    e.preventDefault();

    const nameValue = form.name.value.trim();
    if (nameValue.length <= 2) {
        setInputError(form.name, 'Name must be greater than 2 characters');
        // Shake animation or focus
        form.name.focus();
        return;
    }

    const submitBtn = form.querySelector('.submit-btn');
    const originalBtnText = submitBtn.textContent;
    submitBtn.textContent = 'Submitting...';
    submitBtn.disabled = true;

    const formData = {
        name: form.name.value,
        email: form.email.value,
        dob: form.dob.value,
        tob: form.tob.value,
        pob: form.pob.value,
        service: form.service.value,
        message: form.message.value
    };

    try {
        const { data, error } = await supabaseClient
            .from('AstroCareersDatabase')
            .insert([formData]);

        if (error) throw error;

        showModal('Success!', 'Thank you for your interest! We will contact you soon.', true);
        form.reset();

        // Reset file inputs visually
        document.querySelectorAll('.upload-status').forEach(el => {
            el.textContent = 'Click to Upload';
            el.classList.remove('active');
            el.parentElement.style.borderColor = '';
            el.parentElement.style.backgroundColor = '';
        });

    } catch (error) {
        console.error('Error submitting form:', error);
        showModal('Error', 'Something went wrong. Please try again later.\n' + error.message, false);
    } finally {
        submitBtn.textContent = originalBtnText;
        submitBtn.disabled = false;
    }
});

// Scroll animations
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('loaded');
        }
    });
}, observerOptions);

// Observe all sections for animation
document.querySelectorAll('section').forEach(section => {
    section.classList.add('loading');
    observer.observe(section);
});

// Header scroll effect
window.addEventListener('scroll', () => {
    const header = document.querySelector('header');
    if (window.scrollY > 100) {
        header.style.background = 'rgba(255, 107, 53, 0.95)';
    } else {
        header.style.background = 'linear-gradient(135deg, #ff6b35, #f7931e)';
    }
});

// Initialize animations on page load
window.addEventListener('load', () => {
    document.body.classList.add('loaded');
});
