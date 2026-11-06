const supportedLanguages = new Set(['ar', 'en']);
const panels = [...document.querySelectorAll('[data-lang-panel]')];
const switches = [...document.querySelectorAll('[data-language-switch]')];

function setLanguage(language, updateUrl = false) {
  const selected = supportedLanguages.has(language) ? language : 'ar';
  document.documentElement.lang = selected;
  document.documentElement.dir = selected === 'ar' ? 'rtl' : 'ltr';

  for (const panel of panels) panel.hidden = panel.dataset.langPanel !== selected;
  for (const control of switches) {
    control.setAttribute('aria-pressed', String(control.dataset.languageSwitch === selected));
  }

  if (updateUrl) {
    const url = new URL(window.location.href);
    if (selected === 'ar') url.searchParams.delete('lang');
    else url.searchParams.set('lang', selected);
    window.history.replaceState(null, '', url);
  }
}

for (const control of switches) {
  control.addEventListener('click', () => setLanguage(control.dataset.languageSwitch, true));
}

const requestedLanguage = new URL(window.location.href).searchParams.get('lang');
setLanguage(requestedLanguage ?? 'ar');
