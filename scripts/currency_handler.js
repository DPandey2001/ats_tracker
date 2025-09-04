// Currency Handler for QR Payment
class CurrencyHandler {
    constructor() {
        this.currentCurrency = 'USD';
        this.exchangeRate = 83.5; // USD to INR
        this.init();
    }

    init() {
        document.addEventListener('DOMContentLoaded', () => {
            this.setupCurrencyButtons();
        });
    }

    setupCurrencyButtons() {
        const currencyButtons = document.querySelectorAll('.currency-btn');

        currencyButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                this.handleCurrencyChange(e.target);
            });
        });
    }

    handleCurrencyChange(button) {
        const selectedCurrency = button.dataset.currency;

        // Update button states
        document.querySelectorAll('.currency-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        button.classList.add('active');

        // Update current currency
        this.currentCurrency = selectedCurrency;

        // Update QR display if visible
        this.updateQRDisplay();

        console.log(`Currency changed to: ${selectedCurrency}`);
    }

    updateQRDisplay() {
        const qrSection = document.getElementById('qrPaymentSection');
        const qrAmount = document.getElementById('qrAmount');
        const qrAmountInr = document.getElementById('qrAmountInr');

        if (qrSection && qrSection.style.display !== 'none' && qrAmount && qrAmountInr) {
            const usdAmount = parseFloat(qrAmount.textContent.replace('$', ''));

            if (!isNaN(usdAmount)) {
                const inrAmount = Math.round(usdAmount * this.exchangeRate);
                qrAmountInr.textContent = `₹${inrAmount}`;
            }
        }
    }

    setQRAmount(usdAmount) {
        const qrAmount = document.getElementById('qrAmount');
        const qrAmountInr = document.getElementById('qrAmountInr');

        if (qrAmount && qrAmountInr) {
            qrAmount.textContent = `$${usdAmount}`;
            const inrAmount = Math.round(usdAmount * this.exchangeRate);
            qrAmountInr.textContent = `₹${inrAmount}`;
        }
    }

    getCurrentCurrency() {
        return this.currentCurrency;
    }

    convertToINR(usdAmount) {
        return Math.round(usdAmount * this.exchangeRate);
    }

    convertToUSD(inrAmount) {
        return Math.round(inrAmount / this.exchangeRate);
    }
}

// Initialize currency handler
const currencyHandler = new CurrencyHandler();

// Export for use in other modules
window.currencyHandler = currencyHandler;
