/* Контакты: отправка заявки в /api/orders (вместе с содержимым корзины) */
(function () {
  'use strict';
  const form = document.getElementById('order-form-el');
  if (!form) return;

  const status = document.getElementById('form-status');
  const submit = document.getElementById('order-submit');
  const cartNote = document.getElementById('form-cart-note');
  const phoneHint = form.dataset.phone || '';

  function showCartNote() {
    const n = Cart.count();
    cartNote.hidden = n === 0;
    if (n > 0) {
      cartNote.textContent = `К заявке будут приложены товары из корзины: ${n} шт. на ${Cart.total().toLocaleString('ru')} грн.`;
    }
  }
  showCartNote();
  document.addEventListener('cart:change', showCartNote);

  function setStatus(text, kind) {
    status.textContent = text;
    status.className = 'form-status' + (kind ? ' form-status-' + kind : '');
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('f-name').value.trim();
    const phone = document.getElementById('f-phone').value.trim();
    if (!name) {
      setStatus('Укажите ваше имя.', 'error');
      document.getElementById('f-name').focus();
      return;
    }
    if (phone.replace(/\D/g, '').length < 9) {
      setStatus('Укажите номер телефона, чтобы мы могли перезвонить.', 'error');
      document.getElementById('f-phone').focus();
      return;
    }

    submit.disabled = true;
    setStatus('Отправляем заявку…');
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          phone,
          email: document.getElementById('f-email').value.trim(),
          type: document.getElementById('f-type').value,
          message: document.getElementById('f-msg').value.trim(),
          items: Cart.items.map((i) => ({ id: i.id, qty: i.qty })),
        }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data || !data.ok) {
        throw new Error((data && data.error) || '');
      }
      form.reset();
      Cart.clear();
      setStatus(`Заявка №${data.id} принята. Мы свяжемся с вами в рабочее время.`, 'ok');
      toast('Заявка отправлена!');
    } catch (err) {
      setStatus(
        (err.message || 'Не удалось отправить заявку.') + (phoneHint ? ` Позвоните нам: ${phoneHint}.` : ''),
        'error',
      );
    } finally {
      submit.disabled = false;
    }
  });
})();
