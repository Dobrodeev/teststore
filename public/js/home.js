/* Главная: слайдер баннеров */
let currentSlideIdx = 0;
let autoplayTimer = null;
const slideIntervalMs = 5000;

function showSlide(index) {
  const slider = document.getElementById('promo-slider');
  if (!slider) return;
  const slides = slider.querySelectorAll('.slide');
  const dots = slider.querySelectorAll('.dot');

  if (index >= slides.length) currentSlideIdx = 0;
  else if (index < 0) currentSlideIdx = slides.length - 1;
  else currentSlideIdx = index;

  slides.forEach((slide, i) => slide.classList.toggle('active', i === currentSlideIdx));
  dots.forEach((dot, i) => dot.classList.toggle('active', i === currentSlideIdx));
}

function stopAutoplay() {
  if (autoplayTimer) {
    clearInterval(autoplayTimer);
    autoplayTimer = null;
  }
}

function startAutoplay() {
  stopAutoplay();
  // Автопрокрутку не включаем, если пользователь просил уменьшить анимацию
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  autoplayTimer = setInterval(() => showSlide(currentSlideIdx + 1), slideIntervalMs);
}

function moveSlide(direction) {
  showSlide(currentSlideIdx + direction);
  startAutoplay();
}

function setSlide(index) {
  showSlide(index);
  startAutoplay();
}

(function initSlider() {
  const slider = document.getElementById('promo-slider');
  if (!slider) return;
  slider.addEventListener('mouseenter', stopAutoplay);
  slider.addEventListener('mouseleave', startAutoplay);
  startAutoplay();
})();
