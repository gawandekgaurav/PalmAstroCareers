document.addEventListener("DOMContentLoaded", function () {
    // Smooth scrolling for navigation links
    document.querySelectorAll('a[href^="#"]:not([href="#"])').forEach(anchor => {
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

    if (mobileMenu) {
        mobileMenu.addEventListener('click', () => {
            navMenu.classList.toggle('active');
        });
    }

    // Use Global Supabase Client
    const supabase = window.supabaseClient;

    // Custom Modal Logic
    const modal = document.getElementById('custom-modal');
    let modalIcon, modalTitle, modalMessage, closeBtn;

    if (modal) {
        modalIcon = modal.querySelector('.modal-icon i');
        modalTitle = modal.querySelector('.modal-title');
        modalMessage = modal.querySelector('.modal-message');
        closeBtn = modal.querySelector('.modal-close-btn');

        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                modal.classList.remove('active');
            });
        }

        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.remove('active');
            }
        });
    }

    function showModal(title, message, isSuccess = true) {
        if (!modal) return;
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

    // Time Unknown Checkbox Logic
    const timeInput = document.getElementById('tob');
    const unknownTimeCheckbox = document.getElementById('unknown-time');

    if (unknownTimeCheckbox && timeInput) {
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
    ['leftPalm', 'rightPalm'].forEach(id => {
        const input = document.getElementById(id);
        const status = document.getElementById(`${id}-status`);

        if (input && status) {
            input.addEventListener('change', function () {
                if (this.files && this.files[0]) {
                    const file = this.files[0];

                    // Validate Size (2MB)
                    if (file.size > 2 * 1024 * 1024) {
                        setInputError(this, 'Image size must be less than 2MB');
                        this.value = ''; // Clear selection
                        status.textContent = 'Click to Upload';
                        status.classList.remove('active');
                        status.parentElement.style.borderColor = '';
                        status.parentElement.style.backgroundColor = '';
                        return;
                    }

                    // Validate Type
                    if (!file.type.startsWith('image/')) {
                        setInputError(this, 'Please select a valid image file');
                        this.value = ''; // Clear selection
                        status.textContent = 'Click to Upload';
                        status.classList.remove('active');
                        status.parentElement.style.borderColor = '';
                        status.parentElement.style.backgroundColor = '';
                        return;
                    }

                    // If valid, clear error and show filename
                    setInputError(this, null);
                    status.textContent = file.name;
                    status.classList.add('active');
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

        // Handle special case for hidden file inputs
        const targetGroup = input.type === 'file' ? input.closest('.upload-group') : formGroup;

        if (message) {
            input.classList.add('error');
            if (!errorDisplay) {
                errorDisplay = document.createElement('span');
                errorDisplay.className = 'error-message';
                if (input.type === 'file') {
                    errorDisplay.style.fontSize = '0.8rem';
                    errorDisplay.style.marginTop = '0.5rem';
                    errorDisplay.style.display = 'block';
                }
                targetGroup.appendChild(errorDisplay);
            }
            errorDisplay.textContent = message;
        } else {
            input.classList.remove('error');
            const existingError = targetGroup.querySelector('.error-message');
            if (existingError) {
                existingError.remove();
            }
        }
    }

    if (nameInput) {
        nameInput.addEventListener('input', function () {
            const value = this.value.trim();
            if (value.length > 0 && value.length < 2) {
                setInputError(this, 'Name must be at least 2 characters');
            } else {
                setInputError(this, null);
            }
        });

        // Also validate on blur to handle empty case if needed
        nameInput.addEventListener('blur', function () {
            const value = this.value.trim();
            if (value.length > 0 && value.length < 2) {
                setInputError(this, 'Name must be at least 2 characters');
            }
        });
    }

    // Real-time Email Validation
    const emailInput = document.getElementById('email');
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (emailInput) {
        emailInput.addEventListener('input', function () {
            const value = this.value.trim();
            if (value.length > 0 && !emailRegex.test(value)) {
                setInputError(this, 'Please enter a valid email address');
            } else {
                setInputError(this, null);
            }
        });

        emailInput.addEventListener('blur', function () {
            const value = this.value.trim();
            if (value.length > 0 && !emailRegex.test(value)) {
                setInputError(this, 'Please enter a valid email address');
            }
        });
    }

    // Helper to convert file to Base64
    function fileToBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result);
            reader.onerror = error => reject(error);
        });
    }

    // Form submission - Payment-first flow
    const form = document.getElementById('consultationForm');
    if (form) {
        form.addEventListener('submit', async function (e) {
            e.preventDefault();

            // Access form elements reliably
            const elements = form.elements;
            const nameInp = elements['name'];
            const emailInp = elements['email'];
            const dobInput = elements['dob'];
            const tobInput = elements['tob'];
            const pobInput = elements['pob'];
            const serviceInput = elements['service'];
            const messageInput = elements['message'];
            const leftPalmInput = document.getElementById('leftPalm');
            const rightPalmInput = document.getElementById('rightPalm');

            // Validate name
            const nameValue = nameInp.value.trim();
            if (nameValue.length < 2) {
                setInputError(nameInp, 'Name must be at least 2 characters');
                nameInp.focus();
                return;
            }

            // Validate email
            const emailValue = emailInp.value.trim();
            if (!emailRegex.test(emailValue)) {
                setInputError(emailInp, 'Please enter a valid email address');
                emailInp.focus();
                return;
            }

            // Validate required fields
            if (!dobInput.value || !tobInput.value || !pobInput.value || !serviceInput.value || !leftPalmInput.files[0] || !rightPalmInput.files[0]) {
                showModal('Error', 'Please fill in all required fields and upload palm images.', false);
                return;
            }

            const submitBtn = form.querySelector('.submit-btn');
            const originalBtnText = submitBtn.textContent;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
            submitBtn.disabled = true;

            try {
                // Convert images to Base64 for persistent storage
                const leftPalmBase64 = await fileToBase64(leftPalmInput.files[0]);
                const rightPalmBase64 = await fileToBase64(rightPalmInput.files[0]);

                // Prepare form data
                const formData = {
                    name: nameValue,
                    email: emailValue,
                    dob: dobInput.value,
                    tob: tobInput.value,
                    pob: pobInput.value.trim(),
                    service: serviceInput.value,
                    message: messageInput.value.trim(),
                    leftPalm: leftPalmBase64,
                    rightPalm: rightPalmBase64
                };

                // Store form data in localStorage
                localStorage.setItem('pendingFormData', JSON.stringify(formData));

                // Redirect to payment page
                window.location.href = 'payment.html';

            } catch (error) {
                console.error('Error processing form:', error);
                showModal('Error', 'Something went wrong. Please try again.', false);
                submitBtn.textContent = originalBtnText;
                submitBtn.disabled = false;
            }
        });
    }

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
        if (header) {
            if (window.scrollY > 100) {
                header.style.background = 'rgba(255, 107, 53, 0.95)';
            } else {
                header.style.background = 'linear-gradient(135deg, #ff6b35, #f7931e)';
            }
        }
    });

    // Initialize animations on page load
    window.addEventListener('load', () => {
        document.body.classList.add('loaded');

        // Check for payment success parameter
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('payment') === 'success') {
            // Show success modal
            showModal(
                'Success!',
                'Thank you for submitting your details. You will receive detailed results within 2 days.',
                true
            );

            // Clean up URL by removing the parameter
            window.history.replaceState({}, document.title, window.location.pathname);
        }
    });
});

