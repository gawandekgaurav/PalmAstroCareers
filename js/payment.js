// Load form data from localStorage
let formData = null;

function showError(message) {
    const errorContainer = document.getElementById('error-container');
    if (errorContainer) {
        errorContainer.innerHTML = `<div class="error-message"><i class="fas fa-exclamation-circle"></i> ${message}</div>`;
    }
}



function loadFormData() {
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
        if (!formData) {
            showError('No form data available. Please go back and fill the form.');
            return;
        }

        const button = this;
        const originalContent = button.innerHTML;

        // Disable button and show loading state
        button.disabled = true;
        button.innerHTML = '<span class="loading-spinner"></span> Uploading Images...';

        try {
            const orderDataStr = localStorage.getItem('orderData');
            if (!orderDataStr) {
                throw new Error("Order creation failed or data missing. Please fill the form again.");
            }
            
            const data = JSON.parse(orderDataStr);
            const { order_id, record_id } = data;

            // 3. Open Razorpay Checkout
            button.innerHTML = '<span class="loading-spinner"></span> Waiting for Payment...';

            var options = {
                key: "YOUR_KEY", // Important: Set your Razorpay Key ID here
                amount: 49900,
                currency: "INR",
                name: "Palm Astro",
                description: "Palmistry Consultation",
                order_id: order_id,
                handler: async function (rzpResponse) {
                    button.innerHTML = '<span class="loading-spinner"></span> Verifying Payment...';
                    try {
                        const verifyResponse = await fetch(VERIFY_PAYMENT_URL, {
                            method: "POST",
                            headers: {
                                "Content-Type": "application/json"
                            },
                            body: JSON.stringify({
                                razorpay_order_id: rzpResponse.razorpay_order_id,
                                razorpay_payment_id: rzpResponse.razorpay_payment_id,
                                razorpay_signature: rzpResponse.razorpay_signature,
                                record_id: record_id
                            })
                        });

                        if (!verifyResponse.ok) {
                            throw new Error("Payment verification failed.");
                        }

                        // Clear localStorage and redirect back to homepage
                        localStorage.removeItem('pendingFormData');
                        window.location.href = 'index.html?payment=success';

                    } catch (err) {
                        showError('Verification failed: ' + err.message);
                        button.disabled = false;
                        button.innerHTML = originalContent;
                    }
                },
                modal: {
                    ondismiss: function () {
                        button.disabled = false;
                        button.innerHTML = originalContent;
                    }
                },
                prefill: {
                    name: formData.name,
                    email: formData.email,
                    contact: formData.phone
                },
                theme: {
                    color: "#ff6b35"
                }
            };

            var rzp = new Razorpay(options);
            rzp.on('payment.failed', function (response) {
                showError('Payment failed: ' + response.error.description);
                button.disabled = false;
                button.innerHTML = originalContent;
            });
            rzp.open();

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
