export class PaymentProcessor {
    constructor() {
        this.apiKey = import.meta.env.VITE_STRIPE_API_KEY || 'pk_test_51234567890'; // Demo Stripe key
        this.plans = {
            starter: { id: 'price_starter', amount: 3770 },
            professional: { id: 'price_professional', amount: 10270 }
        };
        // USD to INR conversion rate (approximate)
        this.usdToInrRate = 83.5;
        this.selectedCurrency = 'USD'; // Default currency
    }

    // Currency conversion methods
    usdToInr(amount) {
        return Math.round(amount * this.usdToInrRate);
    }

    inrToUsd(amount) {
        return Math.round(amount / this.usdToInrRate);
    }

    setCurrency(currency) {
        this.selectedCurrency = currency;
    }

    getConvertedAmount(usdAmount) {
        if (this.selectedCurrency === 'INR') {
            return this.usdToInr(usdAmount);
        }
        return usdAmount;
    }

    getCurrencySymbol() {
        return this.selectedCurrency === 'INR' ? '₹' : '$';
    }

    async processPayment(paymentData) {
        // Simulate payment processing
        return new Promise((resolve) => {
            setTimeout(() => {
                // Simulate successful payment (90% success rate)
                const success = Math.random() > 0.1;
                resolve(success);
            }, 2000);
        });
    }

    validateCardNumber(cardNumber) {
        const cleaned = cardNumber.replace(/\s/g, '');

        // Basic Luhn algorithm check
        let sum = 0;
        let isEven = false;

        for (let i = cleaned.length - 1; i >= 0; i--) {
            let digit = parseInt(cleaned.charAt(i));

            if (isEven) {
                digit *= 2;
                if (digit > 9) {
                    digit -= 9;
                }
            }

            sum += digit;
            isEven = !isEven;
        }

        return sum % 10 === 0;
    }

    validateExpiryDate(expiryDate) {
        const [month, year] = expiryDate.split('/');
        const now = new Date();
        const currentYear = now.getFullYear() % 100;
        const currentMonth = now.getMonth() + 1;

        const expMonth = parseInt(month);
        const expYear = parseInt(year);

        if (expMonth < 1 || expMonth > 12) return false;
        if (expYear < currentYear) return false;
        if (expYear === currentYear && expMonth < currentMonth) return false;

        return true;
    }

    validateCVV(cvv) {
        return /^\d{3,4}$/.test(cvv);
    }

    formatCardNumber(cardNumber) {
        return cardNumber.replace(/\s/g, '').replace(/(.{4})/g, '$1 ').trim();
    }

    getCardType(cardNumber) {
        const cleaned = cardNumber.replace(/\s/g, '');

        if (/^4/.test(cleaned)) return 'visa';
        if (/^5[1-5]/.test(cleaned)) return 'mastercard';
        if (/^3[47]/.test(cleaned)) return 'amex';
        if (/^6/.test(cleaned)) return 'discover';

        return 'unknown';
    }

    async createSubscription(planId, paymentMethodId) {
        // This would integrate with Stripe's API in production
        try {
            const response = await fetch('/api/create-subscription', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    planId: planId,
                    paymentMethodId: paymentMethodId
                })
            });

            return await response.json();
        } catch (error) {
            console.error('Subscription creation error:', error);
            throw error;
        }
    }

    async cancelSubscription(subscriptionId) {
        try {
            const response = await fetch('/api/cancel-subscription', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    subscriptionId: subscriptionId
                })
            });

            return await response.json();
        } catch (error) {
            console.error('Subscription cancellation error:', error);
            throw error;
        }
    }

    async getPaymentHistory() {
        try {
            const response = await fetch('/api/payment-history');
            return await response.json();
        } catch (error) {
            console.error('Payment history error:', error);
            return [];
        }
    }

    showQRPayment(planDetails) {
        const qrSection = document.getElementById('qrPaymentSection');
        const qrAmount = document.getElementById('qrAmount');
        const qrAmountInr = document.getElementById('qrAmountInr');
        const paymentForm = document.querySelector('.payment-form');

        if (qrSection && qrAmount) {
            const usdAmount = planDetails.price;
            const inrAmount = this.usdToInr(usdAmount);

            qrAmount.textContent = `$${usdAmount}`;
            if (qrAmountInr) {
                qrAmountInr.textContent = `₹${inrAmount}`;
            }

            qrSection.style.display = 'block';
            if (paymentForm) {
                paymentForm.style.display = 'none';
            }
        }
    }

    hideQRPayment() {
        const qrSection = document.getElementById('qrPaymentSection');
        const paymentForm = document.querySelector('.payment-form');

        if (qrSection) {
            qrSection.style.display = 'none';
        }
        if (paymentForm) {
            paymentForm.style.display = 'block';
        }
    }
}
