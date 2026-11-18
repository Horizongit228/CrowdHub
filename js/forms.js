function fieldWrapper(control) {
  return control.closest('.form-field, .field') || control.parentElement;
}

function removeFieldError(control) {
  const wrap = fieldWrapper(control);
  if (!wrap) return;
  wrap.classList.remove('is-invalid');
  wrap.querySelector('.field-error')?.remove();
}

function showFieldError(control) {
  const wrap = fieldWrapper(control);
  if (!wrap) return;
  removeFieldError(control);
  wrap.classList.add('is-invalid');
  const message = document.createElement('small');
  message.className = 'field-error';
  message.textContent = control.validity.valueMissing
    ? tr('Заполни это поле.', 'Please fill in this field.')
    : control.validity.typeMismatch
      ? tr('Проверь формат значения.', 'Check the value format.')
      : control.validity.tooShort
        ? tr(`Минимум ${control.minLength} символа.`, `At least ${control.minLength} characters.`)
        : tr('Проверь введённое значение.', 'Check this value.');
  wrap.appendChild(message);
}

function enhanceForms() {
  document.querySelectorAll('form').forEach(form => {
    form.setAttribute('novalidate', '');
    form.querySelectorAll('input, textarea, select').forEach(control => {
      control.addEventListener('input', () => {
        if (control.checkValidity()) removeFieldError(control);
      });
      control.addEventListener('change', () => {
        if (control.checkValidity()) removeFieldError(control);
      });
    });

    form.addEventListener('submit', event => {
      const invalid = [...form.querySelectorAll('input, textarea, select')]
        .filter(control => !control.checkValidity() && !control.disabled && control.type !== 'hidden');
      if (!invalid.length) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      invalid.forEach(showFieldError);
      invalid[0]?.focus({ preventScroll: true });
      invalid[0]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      toast(tr('Проверь обязательные поля', 'Check the required fields'));
    }, true);
  });
}

function enableButtonFeedback() {
  document.addEventListener('pointerdown', event => {
    const button = event.target.closest('.btn, .icon-action, .header-icon-button, .island-item');
    if (!button || button.disabled) return;
    button.classList.add('is-pressed');
  });
  document.addEventListener('pointerup', () => document.querySelectorAll('.is-pressed').forEach(el => el.classList.remove('is-pressed')));
  document.addEventListener('pointercancel', () => document.querySelectorAll('.is-pressed').forEach(el => el.classList.remove('is-pressed')));
}
