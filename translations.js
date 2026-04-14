// Translation System - English & Swahili Support
const translations = {
  en: {
    // Navigation & Common
    'nav.home': 'Home',
    'nav.records': 'Billing Records',
    'nav.admin': 'Admin Panel',
    'nav.logout': 'Logout',
    'nav.language': 'Language',
    
    // Admin Dashboard
    'admin.title': 'Admin Dashboard',
    'admin.statistics': 'System Statistics',
    'admin.stats.users': 'Total Users',
    'admin.stats.records': 'Billing Records',
    'admin.stats.payments': 'Total Payments',
    'admin.stats.amount': 'Total Amount (TZS)',
    'admin.btn.refresh': 'Refresh Stats',
    'admin.btn.back': 'Back to App',
    'admin.notification.title': 'Notification Title',
    'admin.notification.message': 'Notification Message',
    'admin.notification.url': 'Target URL',
    'admin.notification.send': 'Send to All',
    'admin.users.title': 'Registered Users',
    'admin.users.view': 'View All Users',
    'admin.payments.title': 'Payment Statistics',
    
    // Billing Calculator
    'billing.title': 'Water Billing Calculator',
    'billing.prev': 'Previous Reading (m³)',
    'billing.curr': 'Current Reading (m³)',
    'billing.rate': 'Rate per m³ (TZS)',
    'billing.fixed': 'Fixed Charge (TZS)',
    'billing.usage': 'Usage (m³)',
    'billing.total': 'Total Bill (TZS)',
    'billing.calculate': 'Calculate Bill',
    'billing.save': 'Save Record',
    'billing.sms': 'Send SMS',
    
    // Records
    'records.title': 'Your Billing Records',
    'records.empty': 'No billing records found',
    'records.date': 'Date',
    'records.usage': 'Usage (m³)',
    'records.total': 'Total (TZS)',
    
    // Forms & Buttons
    'form.name': 'Full Name',
    'form.email': 'Email Address',
    'form.phone': 'Phone Number',
    'form.password': 'Password',
    'form.submit': 'Submit',
    'form.login': 'Login',
    'form.signup': 'Sign Up',
    'form.required': 'This field is required',
    
    // Messages
    'msg.success': 'Success!',
    'msg.error': 'Error',
    'msg.loading': 'Loading...',
    'msg.saved': 'Saved successfully',
    'msg.deleted': 'Deleted successfully',
    'msg.noAuth': 'Please login first',
    'msg.invalidInput': 'Invalid input',
    
    // Payment
    'payment.method': 'Payment Method',
    'payment.cash': 'Cash',
    'payment.card': 'Card',
    'payment.mobile': 'Mobile Money',
    'payment.bank': 'Bank Transfer',
    'payment.save': 'Record Payment',
    'payment.amount': 'Amount (TZS)',
  },
  sw: {
    // Navigation & Common
    'nav.home': 'Nyumbani',
    'nav.records': 'Rekodi za Malipo',
    'nav.admin': 'Paneli ya Msimamizi',
    'nav.logout': 'Toka nje',
    'nav.language': 'Lugha',
    
    // Admin Dashboard
    'admin.title': 'Paneli ya Msimamizi',
    'admin.statistics': 'Takwimu za Mfumo',
    'admin.stats.users': 'Jumla ya Watumiaji',
    'admin.stats.records': 'Rekodi za Malipo',
    'admin.stats.payments': 'Jumla ya Malipo',
    'admin.stats.amount': 'Jumla ya Kiasi (TZS)',
    'admin.btn.refresh': 'Onyesha Takwimu Mpya',
    'admin.btn.back': 'Rudi Nyuma',
    'admin.notification.title': 'Kichwa cha Taarifa',
    'admin.notification.message': 'Ujumbe wa Taarifa',
    'admin.notification.url': 'URL ya Lengo',
    'admin.notification.send': 'Tuma kwa Wote',
    'admin.users.title': 'Watumiaji Walijisajili',
    'admin.users.view': 'Angalia Watumiaji Wote',
    'admin.payments.title': 'Takwimu za Malipo',
    
    // Billing Calculator
    'billing.title': 'Kikokotozi cha Malipo ya Maji',
    'billing.prev': 'Usomaji wa Awali (m³)',
    'billing.curr': 'Usomaji wa Sasa (m³)',
    'billing.rate': 'Bei kwa m³ (TZS)',
    'billing.fixed': 'Gharama Isiyobadilika (TZS)',
    'billing.usage': 'Matumizi (m³)',
    'billing.total': 'Jumla ya Bili (TZS)',
    'billing.calculate': 'Kokotoa Bili',
    'billing.save': 'Hifadhi Rekod',
    'billing.sms': 'Tuma SMS',
    
    // Records
    'records.title': 'Rekodi Zako za Malipo',
    'records.empty': 'Hakuna rekodi za malipo zilizopata',
    'records.date': 'Tarehe',
    'records.usage': 'Matumizi (m³)',
    'records.total': 'Jumla (TZS)',
    
    // Forms & Buttons
    'form.name': 'Jina Kamili',
    'form.email': 'Anwani ya Imeli',
    'form.phone': 'Nambari ya Simu',
    'form.password': 'Neno la Siri',
    'form.submit': 'Wasilisha',
    'form.login': 'Ingia',
    'form.signup': 'Jisajili',
    'form.required': 'Uwanja huu unahitajika',
    
    // Messages
    'msg.success': 'Imefanikiwa!',
    'msg.error': 'Kosa',
    'msg.loading': 'Inawasiliana...',
    'msg.saved': 'Ilihifadhiwa kwa mafanikio',
    'msg.deleted': 'Ilifutwa kwa mafanikio',
    'msg.noAuth': 'Tafadhali ingia kwanza',
    'msg.invalidInput': 'Ingizo batili',
    
    // Payment
    'payment.method': 'Njia ya Malipo',
    'payment.cash': 'Fedha Taslimu',
    'payment.card': 'Kadi',
    'payment.mobile': 'Simu ya Mwanzo',
    'payment.bank': 'Uhamisho wa Benki',
    'payment.save': 'Hifadhi Malipo',
    'payment.amount': 'Kiasi (TZS)',
  }
};

// Get current language from localStorage
function getCurrentLanguage() {
  return localStorage.getItem('language') || 'en';
}

// Set language in localStorage
function setLanguage(lang) {
  localStorage.setItem('language', lang);
  applyTranslations();
  window.location.reload(); // Reload to apply all translations
}

// Get translation by key
function t(key) {
  const lang = getCurrentLanguage();
  return translations[lang][key] || translations['en'][key] || key;
}

// Apply translations to all elements with data-i18n attribute
function applyTranslations() {
  const lang = getCurrentLanguage();
  const elements = document.querySelectorAll('[data-i18n]');
  
  elements.forEach(el => {
    const key = el.getAttribute('data-i18n');
    const text = translations[lang][key] || translations['en'][key] || key;
    
    if (el.tagName === 'INPUT' && el.type === 'button' || el.type === 'submit') {
      el.value = text;
    } else if (el.tagName === 'INPUT' && el.placeholder) {
      el.placeholder = text;
    } else {
      el.textContent = text;
    }
  });
}

// Create language toggle button
function createLanguageToggle() {
  const currentLang = getCurrentLanguage();
  const button = document.createElement('button');
  button.className = 'btn-language-toggle';
  button.innerHTML = `🌐 ${currentLang === 'en' ? 'English' : 'Kiswahili'} ▼`;
  button.style.cssText = `
    position: fixed;
    top: 80px;
    right: 20px;
    padding: 8px 15px;
    background: linear-gradient(135deg, #667eea, #764ba2);
    color: white;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    font-weight: 600;
    font-size: 0.9rem;
    z-index: 9999;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    transition: all 0.3s ease;
  `;

  const menu = document.createElement('div');
  menu.className = 'language-menu';
  menu.style.cssText = `
    position: fixed;
    top: 125px;
    right: 20px;
    background: white;
    border-radius: 8px;
    overflow: hidden;
    box-shadow: 0 8px 24px rgba(0,0,0,0.15);
    z-index: 9999;
    display: none;
    min-width: 140px;
  `;

  const enBtn = document.createElement('button');
  enBtn.textContent = '🇺🇸 English';
  enBtn.style.cssText = `
    width: 100%;
    padding: 12px 15px;
    border: none;
    background: ${currentLang === 'en' ? '#f0f0f0' : 'white'};
    cursor: pointer;
    text-align: left;
    font-weight: 600;
    color: #333;
    transition: background 0.2s;
  `;
  enBtn.onclick = () => {
    setLanguage('en');
    menu.style.display = 'none';
  };

  const swBtn = document.createElement('button');
  swBtn.textContent = '🇹🇿 Kiswahili';
  swBtn.style.cssText = `
    width: 100%;
    padding: 12px 15px;
    border: none;
    border-top: 1px solid #eee;
    background: ${currentLang === 'sw' ? '#f0f0f0' : 'white'};
    cursor: pointer;
    text-align: left;
    font-weight: 600;
    color: #333;
    transition: background 0.2s;
  `;
  swBtn.onclick = () => {
    setLanguage('sw');
    menu.style.display = 'none';
  };

  menu.appendChild(enBtn);
  menu.appendChild(swBtn);

  button.onmouseover = () => menu.style.display = 'block';
  button.onmouseout = () => menu.style.display = 'none';
  menu.onmouseover = () => menu.style.display = 'block';
  menu.onmouseout = () => menu.style.display = 'none';

  document.body.appendChild(button);
  document.body.appendChild(menu);
}

// Initialize translations on page load
document.addEventListener('DOMContentLoaded', () => {
  applyTranslations();
  createLanguageToggle();
});
