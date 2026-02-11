// Load form data from localStorage
let formData = null;

function showError(message) {
    const errorContainer = document.getElementById('error-container');
    if (errorContainer) {
        errorContainer.innerHTML = `<div class="error-message"><i class="fas fa-exclamation-circle"></i> ${message}</div>`;
    }
}

// Helper to convert Base64 to Blob
function base64ToBlob(base64) {
    const parts = base64.split(';base64,');
    const contentType = parts[0].split(':')[1];
    const byteCharacters = atob(parts[1]);
    const byteArrays = [];

    for (let offset = 0; offset < byteCharacters.length; offset += 512) {
        const slice = byteCharacters.slice(offset, offset + 512);
        const byteNumbers = new Array(slice.length);
        for (let i = 0; i < slice.length; i++) {
            byteNumbers[i] = slice.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        byteArrays.push(byteArray);
    }

    return new Blob(byteArrays, { type: contentType });
}

function loadFormData() {
    const supabase = window.supabaseClient;
    const savedData = localStorage.getItem('pendingFormData');

    if (!savedData) {
        showError('No form data found. Please fill out the form first.');
        const payBtn = document.getElementById('pay-button');
        if (payBtn) payBtn.disabled = true;
        return false;
    }

    try {
        formData = JSON.parse(savedData);

        // Display order summary
        const serviceName = document.getElementById('service-name');
        const customerName = document.getElementById('customer-name');
        const customerEmail = document.getElementById('customer-email');

        if (serviceName) serviceName.textContent = formData.service || 'N/A';
        if (customerName) customerName.textContent = formData.name || 'N/A';
        if (customerEmail) customerEmail.textContent = formData.email || 'N/A';

        return true;
    } catch (error) {
        console.error('Error parsing form data:', error);
        showError('Invalid form data. Please try again.');
        const payBtn = document.getElementById('pay-button');
        if (payBtn) payBtn.disabled = true;
        return false;
    }
}

// Handle payment button click
const payButton = document.getElementById('pay-button');
if (payButton) {
    payButton.addEventListener('click', async function () {
        const supabase = window.supabaseClient;
        if (!formData) {
            showError('No form data available. Please go back and fill the form.');
            return;
        }

        const button = this;
        const originalContent = button.innerHTML;

        // Disable button and show loading state
        button.disabled = true;
        button.innerHTML = '<span class="loading-spinner"></span> Processing Payment...';

        try {
            // 1. Simulate payment processing
            await new Promise(resolve => setTimeout(resolve, 1500));

            button.innerHTML = '<span class="loading-spinner"></span> Uploading Images...';

            // 2. Upload images to Cloudinary
            const leftPalmBlob = base64ToBlob(formData.leftPalm);
            const rightPalmBlob = base64ToBlob(formData.rightPalm);

            const [leftImageUrl, rightImageUrl] = await Promise.all([
                uploadToCloudinary(leftPalmBlob),
                uploadToCloudinary(rightPalmBlob)
            ]);

            button.innerHTML = '<span class="loading-spinner"></span> Saving Details...';

            // 3. Submit to Supabase table AstroCareersDataTable
            const submissionData = {
                name: formData.name,
                email: formData.email,
                phone: formData.phone,
                dob: formData.dob,
                tob: formData.tob,
                pob: formData.pob,
                service: formData.service,
                message: formData.message,
                palm_left_url: leftImageUrl,
                palm_right_url: rightImageUrl
            };

            const { data, error } = await supabase
                .from('AstroCareersDataTable')
                .insert([submissionData]);

            if (error) throw error;

            // 4. Clear localStorage after successful submission
            localStorage.removeItem('pendingFormData');

            // 5. Redirect back to homepage with success parameter
            window.location.href = 'index.html?payment=success';

        } catch (error) {
            console.error('Error finalising submission:', error);
            showError('Submission failed. Please try again. Error: ' + error.message);

            // Re-enable button
            button.disabled = false;
            button.innerHTML = originalContent;
        }
    });
}

// Load form data on page load
window.addEventListener('load', () => {
    loadFormData();
});
