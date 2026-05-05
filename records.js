// records.js
// Shared billing and SMS support logic for main and records pages.

const RecordsApp = (() => {
  let currentRecord = null;
  let formInputs = [];

  function getSmsTranslation(lang, key) {
    return (translations[lang] && translations[lang][key])
      || translations.en[key]
      || key;
  }

  function createSmsBody(record, lang = 'sw') {
    const greeting = getSmsTranslation(lang, 'sms.greeting');
    const usageLabel = getSmsTranslation(lang, 'sms.usage');
    const totalLabel = getSmsTranslation(lang, 'sms.total');
    const paymentRequest = getSmsTranslation(lang, 'sms.paymentRequest');

    const name = record.name || '';
    const usage = Number(record.usage || 0).toFixed(2);
    const total = Number(record.total || 0).toLocaleString('en-TZ', { maximumFractionDigits: 0 });

    return `${greeting} ${name}, ${usageLabel}: ${usage} m³, ${totalLabel}: TZS ${total}. ${paymentRequest}`;
  }

  function showResult(message, type = 'success') {
    const box = document.getElementById('result');
    if (!box) return;
    box.innerText = message;
    box.className = 'result ' + type;
    box.style.display = 'block';
  }

  function hideSmsButton() {
    const smsBtn = document.getElementById('smsBtn');
    if (smsBtn) smsBtn.style.display = 'none';
  }

  function showSmsButton() {
    const smsBtn = document.getElementById('smsBtn');
    if (smsBtn) smsBtn.style.display = 'block';
  }

  function validateInputElement(input) {
    const errorMsg = input.parentElement.querySelector('.error-message');
    let isValid = true;
    let message = '';

    if (input.id === 'name') {
      if (input.value.trim().length < 2) {
        isValid = false;
        message = 'Name must be at least 2 characters';
      }
    } else if (input.id === 'phone') {
      if (input.value.trim().length < 6) {
        isValid = false;
        message = 'Valid phone number required';
      }
    } else if (input.id === 'curr' || input.id === 'prev') {
      const val = parseFloat(input.value);
      if (isNaN(val) || val < 0) {
        isValid = false;
        message = 'Value must be a positive number';
      }
    }

    if (isValid) {
      input.classList.remove('invalid');
      input.classList.add('valid');
      if (errorMsg) {
        errorMsg.textContent = '';
        errorMsg.classList.remove('show');
      }
    } else {
      input.classList.add('invalid');
      input.classList.remove('valid');
      if (errorMsg && message) {
        errorMsg.textContent = message;
        errorMsg.classList.add('show');
      }
    }

    return isValid;
  }

  function updateCalculation() {
    const prev = parseFloat(document.getElementById('prev').value) || 0;
    const curr = parseFloat(document.getElementById('curr').value) || 0;
    const rate = parseFloat(document.getElementById('rate').value) || 2000;
    const fixed = parseFloat(document.getElementById('fixed').value) || 0;
    const info = document.getElementById('calcInfo');

    if (!info) return;

    if (curr >= prev && curr > 0) {
      const usage = curr - prev;
      const total = (usage * rate) + fixed;
      info.innerHTML = `
        <strong>Preview:</strong><br>
        Usage: ${usage.toFixed(2)} units × ${rate.toFixed(0)} = ${(usage * rate).toLocaleString('en-TZ', { maximumFractionDigits: 0 })} TZS<br>
        Total: <strong>${total.toLocaleString('en-TZ', { maximumFractionDigits: 0 })} TZS</strong>
      `;
      info.style.display = 'block';
    } else {
      info.style.display = 'none';
      info.innerHTML = '';
    }
  }

  function getFormData() {
    return {
      name: document.getElementById('name').value.trim(),
      phone: document.getElementById('phone').value.trim(),
      prev: parseFloat(document.getElementById('prev').value) || 0,
      curr: parseFloat(document.getElementById('curr').value),
      rate: parseFloat(document.getElementById('rate').value) || 2000,
      fixed: parseFloat(document.getElementById('fixed').value) || 0,
      date: new Date().toISOString()
    };
  }

  async function handleFormSubmit(event) {
    event.preventDefault();
    let allValid = true;

    formInputs.forEach((input) => {
      if (!validateInputElement(input)) {
        allValid = false;
      }
    });

    if (!allValid) {
      showResult('❌ ' + (typeof t === 'function' ? t('msg.invalidInput') : 'Please fix all errors'), 'error');
      return;
    }

    const submitBtn = document.getElementById('submitBtn');
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<span class="loading-spinner"></span> ' + (typeof t === 'function' ? t('msg.loading') : 'Saving...');
    }

    try {
      const record = getFormData();
      if (record.curr < record.prev) {
        throw new Error('Current reading must be ≥ previous reading');
      }

      record.usage = record.curr - record.prev;
      record.total = (record.usage * record.rate) + record.fixed;
      currentRecord = record;

      const response = await fetch('/save-record', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify(record)
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to save record');
      }

      showResult(
        `✅ ${typeof t === 'function' ? t('msg.saved') : 'Bill saved successfully!'}\nTotal: ${record.total.toLocaleString('en-TZ', { maximumFractionDigits: 0 })} TZS`,
        'success'
      );

      document.getElementById('form').reset();
      formInputs.forEach((input) => input.classList.remove('valid', 'invalid'));
      document.getElementById('calcInfo').style.display = 'none';
      showSmsButton();

    } catch (error) {
      console.error(error);
      showResult('❌ ' + error.message, 'error');
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = typeof t === 'function' ? t('billing.save') : 'Save Bill';
      }
    }
  }

  function handleSmsClick() {
    if (!currentRecord) return;
    const msg = createSmsBody(currentRecord, 'sw');
    window.location.href = `sms:${encodeURIComponent(currentRecord.phone)}?body=${encodeURIComponent(msg)}`;
  }

  function attachBillingEvents() {
    formInputs = Array.from(document.querySelectorAll('#form input'));
    formInputs.forEach((input) => {
      input.addEventListener('change', () => validateInputElement(input));
      input.addEventListener('blur', () => validateInputElement(input));
    });

    const fields = ['curr', 'prev', 'rate', 'fixed'];
    fields.forEach((field) => {
      const element = document.getElementById(field);
      if (element) element.addEventListener('input', updateCalculation);
    });

    const form = document.getElementById('form');
    if (form) form.addEventListener('submit', handleFormSubmit);

    const smsBtn = document.getElementById('smsBtn');
    if (smsBtn) {
      smsBtn.addEventListener('click', handleSmsClick);
      hideSmsButton();
    }

    updateCalculation();
  }

  function init() {
    if (document.getElementById('form')) {
      attachBillingEvents();
    }
  }

  return {
    init,
    createSmsBody,
    sendSmsToPerson: (phone, name, total) => {
      const record = { phone, name, total };
      const msg = createSmsBody(record, 'sw');
      window.location.href = `sms:${encodeURIComponent(phone)}?body=${encodeURIComponent(msg)}`;
    }
  };
})();

window.RecordsApp = RecordsApp;

document.addEventListener('DOMContentLoaded', () => {
  RecordsApp.init();
  if (typeof applyTranslations === 'function') applyTranslations();
});
