// Variables de Estado Global
let updatesData = [];
let activeCategory = 'all';
let activeImportance = 'all';
let searchQuery = '';

// Elementos del DOM
const themeToggleBtn = document.getElementById('theme-toggle');
const themeToggleDarkIcon = document.getElementById('theme-toggle-dark-icon');
const themeToggleLightIcon = document.getElementById('theme-toggle-light-icon');
const searchInput = document.getElementById('search-input');
const importanceSelect = document.getElementById('importance-select');
const categoryPillsContainer = document.getElementById('category-pills');
const contentContainer = document.getElementById('content-container');
const filterFeedback = document.getElementById('filter-feedback');
const filterFeedbackText = document.getElementById('filter-feedback-text');
const clearFiltersBtn = document.getElementById('clear-filters');
const toolbarClearBtn = document.getElementById('toolbar-clear-btn');
const timelineMenu = document.getElementById('timeline-menu');

// Modal de Video Elements
const videoModal = document.getElementById('video-modal');
const videoModalTitle = document.getElementById('video-modal-title');
const videoIframe = document.getElementById('video-iframe');
const closeModalBtn = document.getElementById('close-modal');

// Modal de Detalles de Característica Elements
const featureModal = document.getElementById('feature-modal');
const featureModalMonthBadge = document.getElementById('feature-modal-month-badge');
const featureModalImageContainer = document.getElementById('feature-modal-image-container');
const featureModalImage = document.getElementById('feature-modal-image');
const featureModalCategory = document.getElementById('feature-modal-category');
const featureModalImportance = document.getElementById('feature-modal-importance');
const featureModalTitle = document.getElementById('feature-modal-title');
const featureModalDescription = document.getElementById('feature-modal-description');
const featureModalTags = document.getElementById('feature-modal-tags');
const featureModalVideoBtn = document.getElementById('feature-modal-video-btn');
const closeFeatureModalBtn = document.getElementById('close-feature-modal');

/**
 * Inicialización del Tema Claro/Oscuro
 */
function initTheme() {
  const savedTheme = localStorage.getItem('theme');
  const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  
  if (savedTheme === 'dark' || (!savedTheme && systemPrefersDark)) {
    document.documentElement.classList.add('dark');
    themeToggleLightIcon.classList.remove('hidden');
    themeToggleDarkIcon.classList.add('hidden');
  } else {
    document.documentElement.classList.remove('dark');
    themeToggleDarkIcon.classList.remove('hidden');
    themeToggleLightIcon.classList.add('hidden');
  }
}

// Escuchador de tema
themeToggleBtn.addEventListener('click', () => {
  if (document.documentElement.classList.contains('dark')) {
    document.documentElement.classList.remove('dark');
    localStorage.setItem('theme', 'light');
    themeToggleDarkIcon.classList.remove('hidden');
    themeToggleLightIcon.classList.add('hidden');
  } else {
    document.documentElement.classList.add('dark');
    localStorage.setItem('theme', 'dark');
    themeToggleLightIcon.classList.remove('hidden');
    themeToggleDarkIcon.classList.add('hidden');
  }
});

/**
 * Animación de Contadores
 */
function animateCounter(elementId, targetValue, duration = 1200) {
  const el = document.getElementById(elementId);
  if (!el) return;
  
  let startTimestamp = null;
  const step = (timestamp) => {
    if (!startTimestamp) startTimestamp = timestamp;
    const progress = Math.min((timestamp - startTimestamp) / duration, 1);
    const currentValue = Math.floor(progress * targetValue);
    el.textContent = currentValue;
    if (progress < 1) {
      window.requestAnimationFrame(step);
    } else {
      el.textContent = targetValue;
    }
  };
  window.requestAnimationFrame(step);
}

/**
 * Carga asíncrona de datos
 */
async function loadData() {
  try {
    const response = await fetch('data.json');
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    updatesData = await response.json();
    
    // Iniciar estadísticas del Hero
    const totalFeaturesCount = updatesData.reduce((acc, month) => acc + month.features.length, 0);
    animateCounter('stat-months', updatesData.length);
    animateCounter('stat-updates', totalFeaturesCount);
    
    const latestMonth = updatesData[updatesData.length - 1];
    if (latestMonth) {
      const highlightEl = document.getElementById('stat-highlight');
      if (highlightEl) {
        highlightEl.textContent = `${latestMonth.month} ${latestMonth.year}`;
      }
    }
    
    // Dibujar el menú cronológico y renderizar
    buildTimelineMenu();
    render();
    setupScrollObserver();
  } catch (error) {
    console.error("Error al cargar data.json:", error);
    contentContainer.innerHTML = `
      <div class="col-span-full py-16 text-center text-red-500">
        <i class="fa-solid fa-circle-exclamation text-5xl mb-4"></i>
        <h3 class="text-xl font-bold mb-2">Error de Carga</h3>
        <p class="text-sm opacity-80 max-w-md mx-auto">No se pudo cargar la base de datos (data.json). Por favor, compruebe que se está ejecutando desde un servidor local de desarrollo.</p>
      </div>
    `;
  }
}

// Elemento que tenía el foco antes de abrir un modal, para restaurarlo al cerrar
let lastFocusedElement = null;

/**
 * Modal de Video de YouTube
 */
function openVideoModal(youtubeId, monthName) {
  lastFocusedElement = document.activeElement;
  videoModalTitle.textContent = `Actualizaciones de Power BI - ${monthName} 2026`;
  videoIframe.src = `https://www.youtube.com/embed/${youtubeId}?autoplay=1&rel=0`;

  videoModal.classList.remove('hidden');
  videoModal.classList.add('flex');
  setTimeout(() => {
    videoModal.classList.remove('opacity-0');
    videoModal.querySelector('.scale-95').classList.remove('scale-95');
    closeModalBtn.focus();
  }, 10);
}

function closeVideoModal() {
  videoModal.classList.add('opacity-0');
  videoModal.querySelector('.glassmorphism').classList.add('scale-95');

  setTimeout(() => {
    videoModal.classList.add('hidden');
    videoModal.classList.remove('flex');
    videoIframe.src = '';
  }, 300);
  if (lastFocusedElement) lastFocusedElement.focus();
}

closeModalBtn.addEventListener('click', closeVideoModal);
videoModal.addEventListener('click', (e) => {
  if (e.target === videoModal) closeVideoModal();
});

/**
 * Modal de Detalles de Característica
 */
function openFeatureModal(feature, monthData) {
  lastFocusedElement = document.activeElement;
  featureModalMonthBadge.textContent = `${monthData.month} ${monthData.year}`;

  if (feature.image) {
    featureModalImage.src = feature.image;
    featureModalImageContainer.classList.remove('hidden');
  } else {
    featureModalImage.src = '';
    featureModalImageContainer.classList.add('hidden');
  }
  
  // Categoría Badge
  featureModalCategory.className = `inline-flex items-center px-3 py-1 rounded text-xs font-bold ${getCategoryBadgeClass(feature.category)}`;
  featureModalCategory.innerHTML = `<i class="fa-solid ${getCategoryIcon(feature.category)} mr-1.5"></i> ${feature.category}`;
  
  // Importancia Badge
  featureModalImportance.className = `inline-flex items-center px-3 py-1 rounded text-xs font-bold ${getImportanceBadgeClass(feature.importance)}`;
  featureModalImportance.textContent = feature.importance;
  
  // Título e info
  featureModalTitle.textContent = feature.title;
  
  // Rellenar descripción y detalles específicos en viñetas
  let descriptionHtml = `<p class="text-sm sm:text-base text-gray-600 dark:text-zinc-300 leading-relaxed">${feature.description}</p>`;
  if (feature.details && feature.details.length > 0) {
    descriptionHtml += `
      <ul class="space-y-2.5 mt-4 pl-5 list-disc text-xs sm:text-sm text-gray-500 dark:text-zinc-400 leading-relaxed">
        ${feature.details.map(detail => `<li>${detail}</li>`).join('')}
      </ul>
    `;
  }
  featureModalDescription.innerHTML = descriptionHtml;
  
  // Tags
  featureModalTags.innerHTML = '';
  featureModalTags.innerHTML = feature.tags.map(tag => `
    <span class="px-2.5 py-1 bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-zinc-400 text-xs font-semibold rounded-full border border-gray-200/50 dark:border-zinc-850">
      #${tag}
    </span>
  `).join('');
  
  // Configurar acción del botón de video
  featureModalVideoBtn.onclick = () => {
    closeFeatureModal();
    setTimeout(() => {
      openVideoModal(monthData.youtubeId, monthData.month);
    }, 300);
  };
  
  featureModal.classList.remove('hidden');
  featureModal.classList.add('flex');
  setTimeout(() => {
    featureModal.classList.remove('opacity-0');
    featureModal.querySelector('.scale-95').classList.remove('scale-95');
    closeFeatureModalBtn.focus();
  }, 10);
}

function closeFeatureModal() {
  featureModal.classList.add('opacity-0');
  featureModal.querySelector('.glassmorphism').classList.add('scale-95');

  setTimeout(() => {
    featureModal.classList.add('hidden');
    featureModal.classList.remove('flex');
  }, 300);
  if (lastFocusedElement) lastFocusedElement.focus();
}

closeFeatureModalBtn.addEventListener('click', closeFeatureModal);
featureModal.addEventListener('click', (e) => {
  if (e.target === featureModal) closeFeatureModal();
});

// Cerrar cualquier modal abierto con la tecla Escape
document.addEventListener('keydown', (e) => {
  if (e.key !== 'Escape') return;
  if (!videoModal.classList.contains('hidden')) closeVideoModal();
  if (!featureModal.classList.contains('hidden')) closeFeatureModal();
});

/**
 * Métodos auxiliares para categorías e importancia
 */
function getCategoryBadgeClass(category) {
  const cat = category.toLowerCase();
  if (cat.includes('reporting')) return 'badge-reporting';
  if (cat.includes('modeling')) return 'badge-modeling';
  if (cat.includes('service') || cat.includes('fabric')) return 'badge-service';
  if (cat.includes('ai') || cat.includes('copilot')) return 'badge-ai';
  if (cat.includes('mobile') || cat.includes('embed')) return 'badge-mobile';
  return 'badge-platform';
}

function getCategoryIcon(category) {
  const cat = category.toLowerCase();
  if (cat.includes('reporting')) return 'fa-chart-line';
  if (cat.includes('modeling')) return 'fa-database';
  if (cat.includes('service') || cat.includes('fabric')) return 'fa-cloud';
  if (cat.includes('ai') || cat.includes('copilot')) return 'fa-brain';
  if (cat.includes('mobile') || cat.includes('embed')) return 'fa-mobile-screen-button';
  return 'fa-desktop';
}

function getImportanceBadgeClass(importance) {
  const imp = importance.toLowerCase();
  if (imp === 'alta') return 'bg-red-100 text-red-700 dark:bg-red-950/30 dark:text-red-400 border border-red-200/50 dark:border-red-900/30';
  if (imp === 'media') return 'bg-orange-100 text-orange-700 dark:bg-orange-950/30 dark:text-orange-400 border border-orange-200/50 dark:border-orange-900/30';
  return 'bg-blue-100 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400 border border-blue-200/50 dark:border-blue-900/30';
}

/**
 * Resaltador de búsqueda en texto
 */
function highlightText(text, query) {
  if (!query) return text;
  const escapedQuery = query.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
  const regex = new RegExp(`(${escapedQuery})`, 'gi');
  return text.replace(regex, '<mark class="search-highlight">$1</mark>');
}

/**
 * Construir el menú de navegación lateral (Timeline)
 */
function buildTimelineMenu() {
  timelineMenu.innerHTML = '';
  updatesData.forEach(month => {
    const li = document.createElement('li');
    li.id = `nav-item-${month.id}`;
    li.className = 'timeline-nav-item text-xs font-semibold px-2 py-1 transition-all';
    li.textContent = month.month;
    li.dataset.target = `section-${month.id}`;
    
    li.addEventListener('click', () => {
      const section = document.getElementById(`section-${month.id}`);
      if (section) {
        section.scrollIntoView({ behavior: 'smooth' });
      }
    });
    
    timelineMenu.appendChild(li);
  });
}

/**
 * Renderizado de Secciones de Mes y Características
 */
function render() {
  contentContainer.innerHTML = '';
  
  let totalVisibleFeatures = 0;
  
  // Filtrado de Datos
  const filteredData = updatesData.map(month => {
    const matchedFeatures = month.features.filter(feature => {
      // Categoría
      const matchesCategory = activeCategory === 'all' || 
        feature.category.toLowerCase().includes(activeCategory.toLowerCase()) ||
        (activeCategory === 'Mobile' && feature.category.toLowerCase().includes('embedded'));

      // Importancia
      const matchesImportance = activeImportance === 'all' || feature.importance === activeImportance;

      // Buscador
      const query = searchQuery.toLowerCase().trim();
      const matchesSearch = !query ||
        feature.title.toLowerCase().includes(query) ||
        feature.description.toLowerCase().includes(query) ||
        feature.tags.some(tag => tag.toLowerCase().includes(query)) ||
        (feature.details || []).some(detail => detail.toLowerCase().includes(query));

      return matchesCategory && matchesImportance && matchesSearch;
    });

    totalVisibleFeatures += matchedFeatures.length;
    return {
      ...month,
      features: matchedFeatures
    };
  });

  // Actualizar Menú Lateral (Timeline) según visibilidad de los meses
  updatesData.forEach(month => {
    const navItem = document.getElementById(`nav-item-${month.id}`);
    if (navItem) {
      const monthData = filteredData.find(m => m.id === month.id);
      if (monthData && monthData.features.length > 0) {
        navItem.classList.remove('opacity-30', 'pointer-events-none');
      } else {
        navItem.classList.add('opacity-30', 'pointer-events-none');
      }
    }
  });

  // Feedback de Filtros
  const hasActiveFilters = activeCategory !== 'all' || activeImportance !== 'all' || searchQuery !== '';
  if (hasActiveFilters) {
    filterFeedback.classList.remove('hidden');
    filterFeedback.classList.add('flex');
    filterFeedbackText.textContent = `Resultados: Se encontraron ${totalVisibleFeatures} características en base a tus criterios de búsqueda.`;
  } else {
    filterFeedback.classList.add('hidden');
    filterFeedback.classList.remove('flex');
  }

  // Filtrar meses que tienen características
  const finalMonthsToShow = filteredData.filter(m => m.features.length > 0);

  if (finalMonthsToShow.length === 0) {
    contentContainer.innerHTML = `
      <div class="py-20 text-center glassmorphism rounded-2xl p-8">
        <i class="fa-solid fa-folder-open text-5xl text-gray-300 dark:text-zinc-700 mb-4"></i>
        <h3 class="text-xl font-bold text-gray-700 dark:text-zinc-300 mb-2">Sin resultados</h3>
        <p class="text-gray-500 dark:text-zinc-500 max-w-md mx-auto mb-6">No se encontraron características que coincidan con la búsqueda actual.</p>
        <button id="no-results-reset" class="px-5 py-2.5 rounded-xl bg-pbi-yellow text-pbi-gray font-bold shadow-lg hover:bg-pbi-darkyellow transition-colors duration-300">
          Limpiar Filtros
        </button>
      </div>
    `;
    document.getElementById('no-results-reset')?.addEventListener('click', clearFilters);
    return;
  }

  // Dibujar Secciones Mensuales
  finalMonthsToShow.forEach((month, index) => {
    const section = document.createElement('section');
    section.id = `section-${month.id}`;
    section.className = `monthly-section animate-fade-in-up`;
    section.style.animationDelay = `${index * 100}ms`;

    section.innerHTML = `
      <!-- Encabezado de Sección de Mes -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 border-b border-gray-200 dark:border-zinc-800 pb-4">
        <div>
          <div class="flex items-center space-x-3">
            <h2 class="font-display font-extrabold text-3xl sm:text-4xl tracking-tight">${month.month}</h2>
            <span class="px-2.5 py-1 text-xs font-bold bg-pbi-yellow/10 text-pbi-yellow rounded-full border border-pbi-yellow/20">
              ${month.features.length} Novedades
            </span>
          </div>
          <p class="text-xs font-bold text-gray-400 dark:text-zinc-500 tracking-wider uppercase mt-1">Actualización de ${month.year}</p>
        </div>

        <button class="play-btn-section px-4 py-2.5 rounded-xl bg-pbi-yellow hover:bg-pbi-darkyellow text-pbi-gray font-extrabold text-xs flex items-center space-x-2 shadow-md transition-all duration-300 cursor-pointer" data-id="${month.youtubeId}" data-month="${month.month}">
          <i class="fa-solid fa-circle-play text-sm"></i>
          <span>Ver Video Oficial</span>
        </button>
      </div>

      <!-- Resumen Mensual -->
      <p class="text-sm text-gray-600 dark:text-zinc-400 leading-relaxed mb-8 max-w-4xl">
        ${month.summary}
      </p>

      <!-- Cuadrícula de Características Detalladas -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        ${month.features.map((feat, featIdx) => {
          const hasImage = !!feat.image;
          const query = searchQuery.trim();
          
          return `
            <div class="premium-card rounded-2xl cursor-pointer hover:scale-[1.01] active:scale-[0.99] transition-all duration-200" data-month-id="${month.id}" data-feat-idx="${featIdx}" role="button" tabindex="0" aria-label="Ver detalles de la novedad: ${feat.title.replace(/"/g, '&quot;')}">
              ${hasImage ? `
                <div class="img-zoom-container border-b border-gray-100 dark:border-zinc-800">
                  <img src="${feat.image}" alt="${feat.title}">
                  <div class="absolute top-3 left-3 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded text-[10px] text-white font-bold tracking-wider uppercase border border-white/10">
                    Novedad Destacada
                  </div>
                </div>
              ` : ''}
              
              <!-- Detalles de la Novedad -->
              <div class="p-5 flex-grow flex flex-col justify-between">
                <div>
                  <div class="flex flex-wrap items-center gap-1.5 mb-3">
                    <span class="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold ${getCategoryBadgeClass(feat.category)}">
                      <i class="fa-solid ${getCategoryIcon(feat.category)} mr-1"></i> ${feat.category}
                    </span>
                    <span class="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold ${getImportanceBadgeClass(feat.importance)}">
                      ${feat.importance}
                    </span>
                  </div>
                  <h3 class="text-base font-extrabold text-gray-900 dark:text-white leading-snug mb-2">
                    ${highlightText(feat.title, query)}
                  </h3>
                  <p class="text-xs text-gray-500 dark:text-zinc-400 leading-relaxed mb-4">
                    ${highlightText(feat.description, query)}
                  </p>
                </div>
                
                <div class="flex flex-wrap gap-1 border-t border-gray-100 dark:border-zinc-800/40 pt-3">
                  ${feat.tags.map(tag => `
                    <span class="text-[10px] text-gray-400 dark:text-zinc-500">#${highlightText(tag, query)}</span>
                  `).join(' ')}
                </div>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;

    // Escuchador de video
    section.querySelector('.play-btn-section').addEventListener('click', (e) => {
      const btn = e.currentTarget;
      openVideoModal(btn.dataset.id, btn.dataset.month);
    });

    contentContainer.appendChild(section);
  });
}

/**
 * Scroll Observer para resaltar barra lateral (Timeline Navigation)
 */
function setupScrollObserver() {
  const sections = document.querySelectorAll('.monthly-section');
  const navItems = document.querySelectorAll('.timeline-nav-item');
  
  if (sections.length === 0 || navItems.length === 0) return;

  const observerOptions = {
    root: null,
    rootMargin: '-20% 0px -60% 0px', // Activa el cambio de estado cuando la sección cruza el centro de la pantalla
    threshold: 0
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const id = entry.target.id;
        navItems.forEach(item => {
          if (item.dataset.target === id) {
            item.classList.add('active');
          } else {
            item.classList.remove('active');
          }
        });
      }
    });
  }, observerOptions);

  sections.forEach(section => observer.observe(section));
}

/**
 * Limpieza de Filtros
 */
function clearFilters() {
  searchInput.value = '';
  searchQuery = '';
  
  importanceSelect.value = 'all';
  activeImportance = 'all';
  
  activeCategory = 'all';
  document.querySelectorAll('.category-pill').forEach(pill => {
    pill.classList.remove('active', 'bg-pbi-yellow', 'text-pbi-gray', 'border-pbi-yellow');
    pill.classList.add('border-gray-200', 'dark:border-zinc-800', 'bg-white', 'dark:bg-zinc-900', 'text-gray-600', 'dark:text-zinc-400');
  });
  
  const defaultPill = document.querySelector('.category-pill[data-category="all"]');
  if (defaultPill) {
    defaultPill.classList.add('active', 'bg-pbi-yellow', 'text-pbi-gray', 'border-pbi-yellow');
    defaultPill.classList.remove('border-gray-200', 'dark:border-zinc-800', 'bg-white', 'dark:bg-zinc-900', 'text-gray-600', 'dark:text-zinc-400');
  }

  render();
  setupScrollObserver();
}

// Escuchadores de eventos para filtros
searchInput.addEventListener('input', (e) => {
  searchQuery = e.target.value;
  render();
  setupScrollObserver();
});

importanceSelect.addEventListener('change', (e) => {
  activeImportance = e.target.value;
  render();
  setupScrollObserver();
});

clearFiltersBtn.addEventListener('click', clearFilters);
toolbarClearBtn.addEventListener('click', clearFilters);

// Selección de categorías
categoryPillsContainer.addEventListener('click', (e) => {
  const button = e.target.closest('.category-pill');
  if (!button) return;
  
  document.querySelectorAll('.category-pill').forEach(pill => {
    pill.classList.remove('active', 'bg-pbi-yellow', 'text-pbi-gray', 'border-pbi-yellow');
    pill.classList.add('border-gray-200', 'dark:border-zinc-800', 'bg-white', 'dark:bg-zinc-900', 'text-gray-600', 'dark:text-zinc-400');
  });

  button.classList.add('active', 'bg-pbi-yellow', 'text-pbi-gray', 'border-pbi-yellow');
  button.classList.remove('border-gray-200', 'dark:border-zinc-800', 'bg-white', 'dark:bg-zinc-900', 'text-gray-600', 'dark:text-zinc-400');
  
  activeCategory = button.dataset.category;
  render();
  setupScrollObserver();
});

// Delegación de eventos para clics en tarjetas de características
function openFeatureFromCard(card) {
  const monthId = card.dataset.monthId;
  const featIdx = parseInt(card.dataset.featIdx, 10);

  const monthData = updatesData.find(m => m.id === monthId);
  if (monthData && monthData.features[featIdx]) {
    openFeatureModal(monthData.features[featIdx], monthData);
  }
}

contentContainer.addEventListener('click', (e) => {
  const card = e.target.closest('.premium-card');
  if (card) openFeatureFromCard(card);
});

// Accesibilidad: abrir la tarjeta enfocada con Enter o Espacio
contentContainer.addEventListener('keydown', (e) => {
  if (e.key !== 'Enter' && e.key !== ' ' && e.key !== 'Spacebar') return;
  const card = e.target.closest('.premium-card');
  if (!card) return;
  e.preventDefault();
  openFeatureFromCard(card);
});

// Inicializar al cargar el DOM
document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  loadData();
});
