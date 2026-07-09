/* =========================================================================
   TITAN FITNESS — Lógica de la página (JavaScript vanilla, sin librerías)
   -------------------------------------------------------------------------
   Funcionalidades:
   1. Menú hamburguesa (abrir/cerrar en móvil, con accesibilidad y teclado)
   2. Resaltado de la sección activa mientras se hace scroll (scrollspy)
   3. Toggle de precios Mensual / Anual
   4. Validación del formulario de inscripción
   ========================================================================= */

// Espera a que el DOM esté listo antes de enganchar eventos.
document.addEventListener('DOMContentLoaded', () => {
  initMenu();
  initScrollSpy();
  initBillingToggle();
  initForm();
});


/* ============ 1. MENÚ HAMBURGUESA ============ */
function initMenu() {
  const toggle = document.getElementById('navToggle');
  const menu = document.getElementById('navMobile');
  if (!toggle || !menu) return;

  // Abre o cierra el menú y sincroniza los atributos de accesibilidad.
  function setOpen(open) {
    menu.classList.toggle('is-open', open);
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú');
  }

  // Clic en la hamburguesa: alterna el estado.
  toggle.addEventListener('click', () => {
    const isOpen = toggle.getAttribute('aria-expanded') === 'true';
    setOpen(!isOpen);
  });

  // Al tocar cualquier enlace del menú, se cierra (navegación de una página).
  menu.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => setOpen(false));
  });

  // Tecla Escape cierra el menú y devuelve el foco al botón.
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') {
      setOpen(false);
      toggle.focus();
    }
  });

  // Si la ventana se agranda a escritorio, aseguramos que el menú quede cerrado.
  window.addEventListener('resize', () => {
    if (window.innerWidth > 920) setOpen(false);
  });
}


/* ============ 2. SCROLLSPY (SECCIÓN ACTIVA) ============ */
function initScrollSpy() {
  // Todos los enlaces de navegación que apuntan a una sección (#id).
  const navLinks = document.querySelectorAll('.nav-desktop a[href^="#"], .nav-mobile a[href^="#"]');
  // Secciones correspondientes que existen en la página.
  const sections = [];
  navLinks.forEach((link) => {
    const id = link.getAttribute('href').slice(1);
    const section = document.getElementById(id);
    if (section && !sections.includes(section)) sections.push(section);
  });
  if (sections.length === 0) return;

  // Marca como activo el enlace de la sección indicada (en escritorio y móvil).
  function setActive(id) {
    navLinks.forEach((link) => {
      const isActive = link.getAttribute('href') === '#' + id;
      link.classList.toggle('is-active', isActive);
      // aria-current comunica la ubicación actual a lectores de pantalla.
      if (isActive) {
        link.setAttribute('aria-current', 'true');
      } else {
        link.removeAttribute('aria-current');
      }
    });
  }

  // IntersectionObserver detecta qué sección está visible sin escuchar el scroll
  // constantemente (más eficiente). rootMargin centra la "zona de detección".
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) setActive(entry.target.id);
    });
  }, {
    rootMargin: '-45% 0px -50% 0px',  // se activa cuando la sección cruza el centro
    threshold: 0
  });

  sections.forEach((section) => observer.observe(section));
}


/* ============ 3. TOGGLE DE PRECIOS MENSUAL / ANUAL ============ */
function initBillingToggle() {
  const buttons = document.querySelectorAll('.billing-toggle__btn');
  const amounts = document.querySelectorAll('.plan__amount');
  const notes = document.querySelectorAll('.plan__note');
  if (buttons.length === 0) return;

  // Aplica el modo de facturación ('monthly' o 'yearly') a todos los planes.
  function applyBilling(mode) {
    // Actualiza los precios leyendo los data-* de cada plan.
    amounts.forEach((el) => {
      const price = mode === 'yearly' ? el.dataset.yearly : el.dataset.monthly;
      el.textContent = 'S/ ' + price;
    });
    // Actualiza la nota bajo cada precio (horario vs. "facturado anual").
    notes.forEach((el) => {
      el.textContent = mode === 'yearly' ? el.dataset.noteYearly : el.dataset.noteMonthly;
    });
    // Actualiza el estado visual y de accesibilidad de los botones.
    buttons.forEach((btn) => {
      const isActive = btn.dataset.billing === mode;
      btn.classList.toggle('is-active', isActive);
      btn.setAttribute('aria-pressed', String(isActive));
    });
  }

  buttons.forEach((btn) => {
    btn.addEventListener('click', () => applyBilling(btn.dataset.billing));
  });

  // Estado inicial: mensual.
  applyBilling('monthly');
}


/* ============ 4. VALIDACIÓN DEL FORMULARIO ============ */
function initForm() {
  const form = document.getElementById('signupForm');
  const success = document.getElementById('formSuccess');
  if (!form) return;

  // Expresión regular sencilla para validar el formato de correo.
  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  // Muestra u oculta el mensaje de error de un campo concreto.
  function setError(field, message) {
    const errorEl = document.getElementById('error-' + field.name);
    field.setAttribute('aria-invalid', message ? 'true' : 'false');
    if (errorEl) errorEl.textContent = message || '';
    return !message; // devuelve true si el campo es válido
  }

  // Valida un campo individual y devuelve true/false.
  function validateField(field) {
    const value = field.value.trim();

    // Regla 1: ningún campo puede estar vacío.
    if (!value) {
      return setError(field, 'Este campo es obligatorio.');
    }

    // Regla 2: validaciones específicas por tipo de campo.
    if (field.name === 'correo' && !EMAIL_RE.test(value)) {
      return setError(field, 'Ingresa un correo válido (ej. nombre@correo.com).');
    }
    if (field.name === 'nombre' && value.length < 3) {
      return setError(field, 'Escribe tu nombre completo.');
    }
    if (field.name === 'telefono') {
      // Acepta números, espacios, guiones, paréntesis y el signo +. Mínimo 6 dígitos.
      const digits = value.replace(/\D/g, '');
      if (digits.length < 6) {
        return setError(field, 'Ingresa un teléfono válido.');
      }
    }

    // Campo válido: limpia cualquier error previo.
    return setError(field, '');
  }

  // Todos los campos que deben validarse.
  const fields = form.querySelectorAll('input, select');

  // Al perder el foco, valida el campo (feedback temprano al usuario).
  fields.forEach((field) => {
    field.addEventListener('blur', () => validateField(field));
    // Si el campo ya estaba marcado como inválido, revalida mientras escribe.
    field.addEventListener('input', () => {
      if (field.getAttribute('aria-invalid') === 'true') validateField(field);
    });
  });

  // Al enviar: valida todo. Si hay errores, no "envía" y enfoca el primero.
  form.addEventListener('submit', (e) => {
    e.preventDefault();

    let firstInvalid = null;
    fields.forEach((field) => {
      const ok = validateField(field);
      if (!ok && !firstInvalid) firstInvalid = field;
    });

    if (firstInvalid) {
      firstInvalid.focus();
      return;
    }

    // "Envío" simulado: en un proyecto real aquí iría fetch() al servidor.
    // Ocultamos el formulario y mostramos el mensaje de éxito.
    form.classList.add('is-hidden');
    if (success) {
      success.classList.remove('is-hidden');
      success.focus(); // lleva el foco al mensaje para lectores de pantalla
    }
  });
}
