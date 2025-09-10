// JavaScript para la presentación de sustentación

document.addEventListener('DOMContentLoaded', function() {
    // Inicializar todas las funcionalidades
    initScrollEffects();
    initNavbarEffects();
    initAnimations();
    initParticles();
    initSmoothScrolling();
    initLoadingEffects();
});

// Efectos de scroll
function initScrollEffects() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('loaded');
            }
        });
    }, observerOptions);

    // Observar todos los elementos con clase 'loading'
    document.querySelectorAll('.card, .feature-item, .result-item, .impact-stat').forEach(el => {
        el.classList.add('loading');
        observer.observe(el);
    });
}

// Efectos de navbar
function initNavbarEffects() {
    const navbar = document.querySelector('.navbar');
    let lastScrollTop = 0;

    window.addEventListener('scroll', () => {
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        
        if (scrollTop > lastScrollTop && scrollTop > 100) {
            // Scrolling down
            navbar.style.transform = 'translateY(-100%)';
        } else {
            // Scrolling up
            navbar.style.transform = 'translateY(0)';
        }
        
        lastScrollTop = scrollTop;
    });
}

// Animaciones personalizadas
function initAnimations() {
    // Animación de números
    const statNumbers = document.querySelectorAll('.stat-number');
    statNumbers.forEach(stat => {
        const finalValue = stat.textContent;
        if (!isNaN(finalValue)) {
            animateNumber(stat, 0, parseInt(finalValue), 2000);
        }
    });

    // Animación de iconos
    const icons = document.querySelectorAll('.fa-3x');
    icons.forEach(icon => {
        icon.addEventListener('mouseenter', function() {
            this.style.transform = 'scale(1.2) rotate(10deg)';
        });
        
        icon.addEventListener('mouseleave', function() {
            this.style.transform = 'scale(1) rotate(0deg)';
        });
    });
}

// Función para animar números
function animateNumber(element, start, end, duration) {
    const startTime = performance.now();
    const isPercentage = element.textContent.includes('%');
    
    function updateNumber(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        const currentValue = Math.floor(progress * (end - start) + start);
        element.textContent = currentValue + (isPercentage ? '%' : '');
        
        if (progress < 1) {
            requestAnimationFrame(updateNumber);
        }
    }
    
    requestAnimationFrame(updateNumber);
}

// Efectos de partículas
function initParticles() {
    const heroSection = document.querySelector('.hero-section');
    if (!heroSection) return;

    const particlesContainer = document.createElement('div');
    particlesContainer.className = 'particles';
    heroSection.appendChild(particlesContainer);

    // Crear partículas
    for (let i = 0; i < 50; i++) {
        createParticle(particlesContainer);
    }
}

function createParticle(container) {
    const particle = document.createElement('div');
    particle.className = 'particle';
    
    const size = Math.random() * 4 + 2;
    const x = Math.random() * window.innerWidth;
    const y = Math.random() * window.innerHeight;
    const delay = Math.random() * 6;
    
    particle.style.width = size + 'px';
    particle.style.height = size + 'px';
    particle.style.left = x + 'px';
    particle.style.top = y + 'px';
    particle.style.animationDelay = delay + 's';
    
    container.appendChild(particle);
}

// Scroll suave
function initSmoothScrolling() {
    const links = document.querySelectorAll('a[href^="#"]');
    
    links.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            const targetId = this.getAttribute('href');
            const targetElement = document.querySelector(targetId);
            
            if (targetElement) {
                const offsetTop = targetElement.offsetTop - 80; // Ajustar para navbar fijo
                
                window.scrollTo({
                    top: offsetTop,
                    behavior: 'smooth'
                });
            }
        });
    });
}

// Efectos de carga
function initLoadingEffects() {
    // Simular carga de imágenes
    const images = document.querySelectorAll('img');
    images.forEach(img => {
        img.addEventListener('load', function() {
            this.style.opacity = '1';
            this.style.transform = 'scale(1)';
        });
        
        // Establecer estilos iniciales
        img.style.opacity = '0';
        img.style.transform = 'scale(0.8)';
        img.style.transition = 'all 0.6s ease';
    });
}

// Efectos de hover para cards
document.addEventListener('DOMContentLoaded', function() {
    const cards = document.querySelectorAll('.card');
    
    cards.forEach(card => {
        card.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-10px) scale(1.02)';
        });
        
        card.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0) scale(1)';
        });
    });
});

// Efectos de typing para títulos
function typeWriter(element, text, speed = 100) {
    let i = 0;
    element.innerHTML = '';
    
    function type() {
        if (i < text.length) {
            element.innerHTML += text.charAt(i);
            i++;
            setTimeout(type, speed);
        }
    }
    
    type();
}

// Aplicar efecto de typing al título principal
document.addEventListener('DOMContentLoaded', function() {
    const mainTitle = document.querySelector('.hero-section h1');
    if (mainTitle) {
        const originalText = mainTitle.textContent;
        typeWriter(mainTitle, originalText, 150);
    }
});

// Efectos de parallax
function initParallax() {
    window.addEventListener('scroll', () => {
        const scrolled = window.pageYOffset;
        const parallaxElements = document.querySelectorAll('.hero-image');
        
        parallaxElements.forEach(element => {
            const speed = 0.5;
            element.style.transform = `translateY(${scrolled * speed}px)`;
        });
    });
}

// Inicializar parallax
initParallax();

// Efectos de contador para estadísticas
function initCounters() {
    const counters = document.querySelectorAll('.stat-number');
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const counter = entry.target;
                const target = parseInt(counter.textContent);
                
                if (!isNaN(target)) {
                    animateCounter(counter, 0, target, 2000);
                }
                
                observer.unobserve(counter);
            }
        });
    });
    
    counters.forEach(counter => {
        observer.observe(counter);
    });
}

function animateCounter(element, start, end, duration) {
    const startTime = performance.now();
    
    function updateCounter(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        const currentValue = Math.floor(progress * (end - start) + start);
        element.textContent = currentValue;
        
        if (progress < 1) {
            requestAnimationFrame(updateCounter);
        }
    }
    
    requestAnimationFrame(updateCounter);
}

// Inicializar contadores
initCounters();

// Efectos de resaltado para navegación
function initNavigationHighlight() {
    const sections = document.querySelectorAll('section[id]');
    const navLinks = document.querySelectorAll('.nav-link');
    
    window.addEventListener('scroll', () => {
        let current = '';
        
        sections.forEach(section => {
            const sectionTop = section.offsetTop - 100;
            const sectionHeight = section.offsetHeight;
            
            if (window.pageYOffset >= sectionTop && window.pageYOffset < sectionTop + sectionHeight) {
                current = section.getAttribute('id');
            }
        });
        
        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === `#${current}`) {
                link.classList.add('active');
            }
        });
    });
}

// Inicializar resaltado de navegación
initNavigationHighlight();

// Efectos de sonido (opcional)
function initSoundEffects() {
    const buttons = document.querySelectorAll('.btn');
    
    buttons.forEach(button => {
        button.addEventListener('click', function() {
            // Crear un sonido de click sutil
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(400, audioContext.currentTime + 0.1);
            
            gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
            
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.1);
        });
    });
}

// Inicializar efectos de sonido
initSoundEffects();

// Efectos de resplandor para elementos importantes
function initGlowEffects() {
    const importantElements = document.querySelectorAll('.card-header, .btn-primary');
    
    importantElements.forEach(element => {
        element.addEventListener('mouseenter', function() {
            this.style.boxShadow = '0 0 20px rgba(13, 110, 253, 0.5)';
        });
        
        element.addEventListener('mouseleave', function() {
            this.style.boxShadow = '';
        });
    });
}

// Inicializar efectos de resplandor
initGlowEffects();

// Efectos de rotación para iconos
function initIconRotation() {
    const icons = document.querySelectorAll('.fa-3x');
    
    icons.forEach(icon => {
        icon.addEventListener('mouseenter', function() {
            this.style.animation = 'spin 1s linear infinite';
        });
        
        icon.addEventListener('mouseleave', function() {
            this.style.animation = '';
        });
    });
}

// CSS para la animación de rotación
const style = document.createElement('style');
style.textContent = `
    @keyframes spin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
    }
`;
document.head.appendChild(style);

// Inicializar rotación de iconos
initIconRotation();

// Efectos de zoom para imágenes
function initImageZoom() {
    const images = document.querySelectorAll('img');
    
    images.forEach(img => {
        img.addEventListener('click', function() {
            this.style.transform = 'scale(1.5)';
            this.style.zIndex = '1000';
            this.style.position = 'relative';
            this.style.transition = 'all 0.3s ease';
            
            setTimeout(() => {
                this.style.transform = 'scale(1)';
                this.style.zIndex = 'auto';
                this.style.position = 'static';
            }, 2000);
        });
    });
}

// Inicializar zoom de imágenes
initImageZoom();

// Efectos de escritura para párrafos
function initTypewriterEffect() {
    const paragraphs = document.querySelectorAll('.lead');
    
    paragraphs.forEach(paragraph => {
        const originalText = paragraph.textContent;
        paragraph.textContent = '';
        
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    typeWriter(paragraph, originalText, 50);
                    observer.unobserve(paragraph);
                }
            });
        });
        
        observer.observe(paragraph);
    });
}

// Inicializar efecto de escritura
initTypewriterEffect();
