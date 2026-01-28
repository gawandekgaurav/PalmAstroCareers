
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

// Form submission
const form = document.querySelector('form');
form.addEventListener('submit', async function (e) {
    e.preventDefault();

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
            .from('consultations')
            .insert([formData]);

        if (error) throw error;

        alert('Thank you for your interest! We will contact you soon.');
        form.reset();
    } catch (error) {
        console.error('Error submitting form:', error);
        alert('Error: ' + error.message + '\nDetails: ' + (error.details || 'No details'));
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
