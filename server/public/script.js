// ============================================
// 0. API & DYNAMIC CONTENT
// ============================================
const API_URL = '/api';

async function fetchContent(resource) {
    try {
        const response = await fetch(`${API_URL}/${resource}`);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        let data = await response.json();

        // Robust check: Handle cases where data is wrapped in a 'value' property (OData/PowerShell style)
        if (data && typeof data === 'object' && !Array.isArray(data) && Array.isArray(data.value)) {
            data = data.value;
        }

        return Array.isArray(data) ? data : [];
    } catch (err) {
        console.error(`❌ Failed to fetch ${resource}:`, err);
        return [];
    }
}

// Initialize all features when page loads
document.addEventListener('DOMContentLoaded', async function () {
    console.log('🚀 Initializing Creashift...');

    // Fix: Scroll to top on page load to prevent unwanted scroll to services
    window.scrollTo(0, 0);

    // Init Global Slider Data
    window.sliderData = { isTransitioning: false };

    initTheme();
    initNavigation();
    initHeroParticles();
    initLogoParticles();

    // Load dynamic sections first
    const [services, metrics, processData, heroData] = await Promise.all([
        fetchContent('services'),
        fetchContent('metrics'),
        fetchContent('process'),
        fetchContent('hero')
    ]);

    console.log(`📦 Loaded: ${services.length} services, ${metrics.length} metrics, ${processData.length} process steps`);

    initHero(heroData);
    initCurvedSlider(services);
    initStatsCounters(metrics);
    initProcessVertical(processData);

    initServiceCardsReveal();
    initContactParticles();
    initContactForm();
    initScrollProgress();
    initHeroSlider();
    initScrollPageTransition(); // Premium scroll-driven transition
    initMagneticButton();
    console.log('✅ All features initialized');
});

function initHero(data) {
    if (!data || !data.title_line1) return;

    // Update Hero Text
    const titleLines = document.querySelectorAll('.hero-title-corporate .title-line');
    if (titleLines.length >= 2) {
        titleLines[0].textContent = data.title_line1;
        titleLines[1].textContent = data.title_line2;
    }

    const subtitle = document.querySelector('.hero-subtitle');
    if (subtitle) subtitle.textContent = data.subtitle;

    // Update Highlights
    const highlightsContainer = document.querySelector('.hero-highlights');
    if (highlightsContainer && data.highlights) {
        highlightsContainer.innerHTML = data.highlights.map(h => `
            <div class="highlight-item">
                <span class="highlight-icon">◈</span>
                <div class="highlight-text">
                    <strong>${h.title}</strong>
                    <span>${h.desc}</span>
                </div>
            </div>
        `).join('');
    }
}

function initHeroSlider() {
    const slides = document.querySelectorAll('.hero-slide');
    if (slides.length === 0) return;

    let currentSlide = 0;
    setInterval(() => {
        slides[currentSlide].classList.remove('active');
        currentSlide = (currentSlide + 1) % slides.length;
        slides[currentSlide].classList.add('active');
    }, 5000);
}

// ============================================
// 1. THEME TOGGLE
// ============================================
function initTheme() {
    const themeToggle = document.getElementById('theme-toggle');
    if (!themeToggle) return;

    const body = document.body;
    const savedTheme = localStorage.getItem('theme');
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

    if (savedTheme) {
        body.setAttribute('data-theme', savedTheme);
    } else if (systemPrefersDark) {
        body.setAttribute('data-theme', 'dark');
    } else {
        body.setAttribute('data-theme', 'light');
    }

    themeToggle.addEventListener('click', () => {
        const currentTheme = body.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        body.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
    });
}

// ============================================
// 2. NAVIGATION WITH SMOOTH SCROLL
// ============================================
function initNavigation() {
    const navLinks = document.querySelectorAll('.pill-link, .mobile-link');
    const mobileToggle = document.getElementById('mobile-toggle');
    const mobileMenu = document.getElementById('mobile-menu');

    // Mobile menu toggle
    if (mobileToggle && mobileMenu) {
        mobileToggle.addEventListener('click', () => {
            mobileToggle.classList.toggle('active');
            mobileMenu.classList.toggle('active');
        });
    }

    navLinks.forEach(link => {
        const href = link.getAttribute('href');

        if (href && href.startsWith('#')) {
            link.addEventListener('click', (e) => {
                e.preventDefault();

                // Special handling for home/hero
                if (href === '#home' || href === '#' || href === '#hero') {
                    window.scrollTo({
                        top: 0,
                        behavior: 'smooth'
                    });
                } else if (href === '#services') {
                    // Scroll to trigger the page transition
                    window.scrollTo({
                        top: window.innerHeight,
                        behavior: 'smooth'
                    });
                } else {
                    const targetSection = document.querySelector(href);
                    if (targetSection) {
                        targetSection.scrollIntoView({
                            behavior: 'smooth',
                            block: 'start'
                        });
                    }
                }

                // Update active state
                navLinks.forEach(l => l.classList.remove('active'));
                // Find matching links in both desktop and mobile
                document.querySelectorAll(`[href="${href}"]`).forEach(l => {
                    if (l.classList.contains('pill-link') || l.classList.contains('mobile-link')) {
                        l.classList.add('active');
                    }
                });

                // Close mobile menu after click
                if (mobileToggle && mobileMenu) {
                    mobileToggle.classList.remove('active');
                    mobileMenu.classList.remove('active');
                }
            });
        }
    });

    // Update active on scroll
    window.addEventListener('scroll', () => {
        const scrollY = window.scrollY;
        let current = '';

        // Handle scroll-based section detection
        if (scrollY < window.innerHeight * 0.5) {
            current = 'hero';
        } else if (scrollY < window.innerHeight * 1.5) {
            current = 'services';
        } else {
            // For other sections, use position-based detection
            const sections = document.querySelectorAll('section[id]');
            sections.forEach(section => {
                if (section.id === 'hero' || section.id === 'services') return;
                const rect = section.getBoundingClientRect();
                if (rect.top <= 100 && rect.bottom >= 100) {
                    current = section.getAttribute('id');
                }
            });
        }

        navLinks.forEach(link => {
            link.classList.remove('active');
            const href = link.getAttribute('href');
            if (href === '#' + current || (current === 'hero' && href === '#hero')) {
                link.classList.add('active');
            }
        });
    });
}

// ============================================
// 3. HERO PARTICLE ANIMATION
// ============================================
function initHeroParticles() {
    const canvas = document.getElementById('hero-grid');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const particles = [];
    const particleCount = 80;

    function resizeCanvas() {
        canvas.width = canvas.offsetWidth;
        canvas.height = canvas.offsetHeight;
    }
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    class Particle {
        constructor() {
            this.x = Math.random() * canvas.width;
            this.y = Math.random() * canvas.height;
            this.vx = (Math.random() - 0.5) * 0.5;
            this.vy = (Math.random() - 0.5) * 0.5;
            this.radius = Math.random() * 2 + 1;
            this.opacity = Math.random() * 0.5 + 0.3;
        }

        update() {
            this.x += this.vx;
            this.y += this.vy;

            if (this.x < 0 || this.x > canvas.width) this.vx *= -1;
            if (this.y < 0 || this.y > canvas.height) this.vy *= -1;
        }

        draw() {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
            const colors = ['rgba(126, 34, 206, 0.8)', 'rgba(79, 70, 229, 0.8)', 'rgba(30, 27, 75, 0.8)'];
            const colorIndex = Math.floor(Math.random() * colors.length);
            ctx.fillStyle = colors[colorIndex].replace('0.8', this.opacity);
            ctx.fill();
        }
    }

    for (let i = 0; i < particleCount; i++) {
        particles.push(new Particle());
    }

    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        particles.forEach(particle => {
            particle.update();
            particle.draw();
        });

        // Draw connections
        for (let i = 0; i < particles.length; i++) {
            for (let j = i + 1; j < particles.length; j++) {
                const dx = particles[i].x - particles[j].x;
                const dy = particles[i].y - particles[j].y;
                const distance = Math.sqrt(dx * dx + dy * dy);

                if (distance < 120) {
                    ctx.beginPath();
                    ctx.moveTo(particles[i].x, particles[i].y);
                    ctx.lineTo(particles[j].x, particles[j].y);
                    ctx.strokeStyle = `rgba(79, 70, 229, ${0.2 * (1 - distance / 120)})`;
                    ctx.lineWidth = 1;
                    ctx.stroke();
                }
            }
        }

        requestAnimationFrame(animate);
    }

    animate();
}

// ============================================
// 3.5 LOGO PARTICLE SYSTEM (PHYSICS-DRIVEN)
// ============================================
// ============================================
// 3.5 HOME BACKGROUND PARTICLES (DOTTED)
// ============================================
function initLogoParticles() {
    const canvas = document.getElementById('hero-logo-particles');
    if (!canvas) return;

    // Check for reduced motion preference
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
        console.log('⏸️ Background particles disabled (reduced motion preference)');
        return;
    }

    const ctx = canvas.getContext('2d');
    const particles = [];

    // Physics constants
    // REDUCED DENSITY (Dotted Style)
    const isMobile = window.innerWidth <= 768;
    const DENSITY_MULTIPLIER = isMobile ? 0.3 : 0.6; // Further reduced for mobile performance
    const BASE_PARTICLE_COUNT = isMobile ? 40 : 120;
    const PARTICLE_COUNT = Math.floor(BASE_PARTICLE_COUNT * DENSITY_MULTIPLIER);

    const REPULSION_RADIUS = 250;
    const REPULSION_STRENGTH = 0.6;
    const SPRING_STRENGTH = 0.02;
    const DAMPING = 0.92;

    // DOT SETTINGS
    const DOT_SIZE_MIN = 2; // Small dots
    const DOT_SIZE_MAX = 4;
    const OPACITY_MIN = 0.3; // Higher opacity for visibility
    const OPACITY_MAX = 0.6;

    // Click ripple settings
    const CLICK_RIPPLE_RADIUS = 300;
    const CLICK_RIPPLE_STRENGTH = 2.0;

    // Ambient drift
    const DRIFT_SPEED_X = 0.15;
    const DRIFT_SPEED_Y = 0.08;

    // Mouse state
    let mouseX = -999;
    let mouseY = -999;
    let isAnimating = false;
    let clickRipples = [];

    function resizeCanvas() {
        canvas.width = canvas.offsetWidth;
        canvas.height = canvas.offsetHeight;
    }
    resizeCanvas();
    window.addEventListener('resize', () => {
        resizeCanvas();
        if (particles.length > 0) {
            initParticles();
        }
    });

    class DotParticle {
        constructor(homeX, homeY, depth) {
            this.homeX = homeX;
            this.homeY = homeY;
            this.x = homeX;
            this.y = homeY;
            this.vx = 0;
            this.vy = 0;
            this.depth = depth;
            this.size = DOT_SIZE_MIN + Math.random() * (DOT_SIZE_MAX - DOT_SIZE_MIN);
            this.opacity = OPACITY_MIN + Math.random() * (OPACITY_MAX - OPACITY_MIN);
            this.opacity *= depth;
        }

        update() {
            // Ambient drift
            this.homeX += DRIFT_SPEED_X;
            this.homeY += DRIFT_SPEED_Y;

            // Wrap logic
            if (this.homeX > canvas.width + 50) {
                const wrapAmount = canvas.width + 100;
                this.homeX -= wrapAmount;
                this.x -= wrapAmount;
            }
            if (this.homeX < -50) {
                const wrapAmount = canvas.width + 100;
                this.homeX += wrapAmount;
                this.x += wrapAmount;
            }
            if (this.homeY > canvas.height + 50) {
                const wrapAmount = canvas.height + 100;
                this.homeY -= wrapAmount;
                this.y -= wrapAmount;
            }
            if (this.homeY < -50) {
                const wrapAmount = canvas.height + 100;
                this.homeY += wrapAmount;
                this.y += wrapAmount;
            }

            // Mouse interaction
            const dx = this.x - mouseX;
            const dy = this.y - mouseY;
            const distSq = dx * dx + dy * dy;
            const dist = Math.sqrt(distSq);

            let fx = 0;
            let fy = 0;

            if (dist < REPULSION_RADIUS && dist > 0) {
                const repulsion = (REPULSION_STRENGTH * this.depth) / (distSq / 10000);
                fx += (dx / dist) * repulsion;
                fy += (dy / dist) * repulsion;
            }

            // Ripples
            clickRipples.forEach(ripple => {
                const rdx = this.x - ripple.x;
                const rdy = this.y - ripple.y;
                const rdistSq = rdx * rdx + rdy * rdy;
                const rdist = Math.sqrt(rdistSq);

                if (rdist < ripple.radius && rdist > 0) {
                    const rippleForce = (ripple.strength * this.depth) / (rdistSq / 10000);
                    fx += (rdx / rdist) * rippleForce;
                    fy += (rdy / rdist) * rippleForce;
                }
            });

            // Spring home
            const homeForceX = (this.homeX - this.x) * SPRING_STRENGTH;
            const homeForceY = (this.homeY - this.y) * SPRING_STRENGTH;
            fx += homeForceX;
            fy += homeForceY;

            this.vx += fx;
            this.vy += fy;
            this.vx *= DAMPING;
            this.vy *= DAMPING;

            this.x += this.vx;
            this.y += this.vy;
        }

        draw(r, g, b) {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${this.opacity})`;
            ctx.fill();
        }
    }

    function initParticles() {
        particles.length = 0;

        // Grid distribution
        const cols = Math.ceil(Math.sqrt(PARTICLE_COUNT * (canvas.width / canvas.height)));
        const rows = Math.ceil(PARTICLE_COUNT / cols);
        const spacingX = canvas.width / cols;
        const spacingY = canvas.height / rows;

        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                if (particles.length >= PARTICLE_COUNT) break;

                const x = spacingX * col + (Math.random() - 0.5) * spacingX * 0.8;
                const y = spacingY * row + (Math.random() - 0.5) * spacingY * 0.8;

                const depthRand = Math.random();
                let depth = depthRand < 0.33 ? 0.6 : (depthRand < 0.66 ? 0.8 : 1.0);

                particles.push(new DotParticle(x, y, depth));
            }
        }

        // Extra border particles
        const borderCount = Math.floor(PARTICLE_COUNT * 0.2); // 20% extra
        for (let i = 0; i < borderCount; i++) {
            const side = Math.floor(Math.random() * 4);
            let x, y;
            if (side === 0) { x = Math.random() * canvas.width; y = Math.random() * -50; } // Top
            else if (side === 1) { x = Math.random() * canvas.width; y = canvas.height + Math.random() * 50; } // Bottom
            else if (side === 2) { x = Math.random() * -50; y = Math.random() * canvas.height; } // Left
            else { x = canvas.width + Math.random() * 50; y = Math.random() * canvas.height; } // Right

            particles.push(new DotParticle(x, y, 0.6 + Math.random() * 0.4));
        }
    }

    function animate() {
        if (!isAnimating) return;
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Check theme for visibility
        const isLight = document.body.getAttribute('data-theme') === 'light';
        const r = isLight ? 0 : 255;
        const g = isLight ? 0 : 255;
        const b = isLight ? 0 : 255;

        clickRipples = clickRipples.filter(ripple => {
            ripple.radius += ripple.speed;
            ripple.strength *= 0.92;
            return ripple.strength > 0.01;
        });

        particles.forEach(p => {
            p.update();
            p.draw(r, g, b);
        });

        requestAnimationFrame(animate);
    }

    function startAnimation() {
        if (isAnimating) return;
        isAnimating = true;
        animate();
    }

    function stopAnimation() {
        isAnimating = false;
    }

    // Input handling
    function updateMousePosition(e) {
        const rect = canvas.getBoundingClientRect();
        mouseX = e.clientX - rect.left;
        mouseY = e.clientY - rect.top;
    }

    // Mouse Listeners
    canvas.parentElement.addEventListener('mousemove', (e) => updateMousePosition(e));
    canvas.parentElement.addEventListener('mouseleave', () => { mouseX = -999; mouseY = -999; });

    // Click Listener
    canvas.parentElement.addEventListener('click', (e) => {
        const rect = canvas.getBoundingClientRect();
        clickRipples.push({
            x: e.clientX - rect.left,
            y: e.clientY - rect.top,
            radius: 0,
            speed: 8,
            strength: CLICK_RIPPLE_STRENGTH
        });
    });

    // Touch Listener
    canvas.parentElement.addEventListener('touchstart', (e) => {
        if (e.touches.length > 0) {
            const rect = canvas.getBoundingClientRect();
            clickRipples.push({
                x: e.touches[0].clientX - rect.left,
                y: e.touches[0].clientY - rect.top,
                radius: 0,
                speed: 8,
                strength: CLICK_RIPPLE_STRENGTH
            });
        }
    }, { passive: true });

    // Init Logic (Immediate - No Image Load)
    initParticles();
    startAnimation();

    // Visibility Control
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) stopAnimation();
        else startAnimation();
    });
}

// Redundant legacy initFloatingServices removed.

// ============================================
// 5. SERVICE CARDS SCROLL REVEAL
// ============================================
function initServiceCardsReveal() {
    const serviceCards = document.querySelectorAll('.service-card-new');

    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry, index) => {
            if (entry.isIntersecting) {
                setTimeout(() => {
                    entry.target.classList.add('revealed');
                }, index * 100);
            }
        });
    }, { threshold: 0.2 });

    serviceCards.forEach(card => observer.observe(card));
}

// ============================================
function initStatsCounters(metrics) {
    const grid = document.getElementById('stats-grid');
    if (!grid) return;

    // Safety: Ensure metrics is an array
    if (metrics && typeof metrics === 'object' && !Array.isArray(metrics) && Array.isArray(metrics.value)) {
        metrics = metrics.value;
    }

    // Clear and wait for dynamic content
    grid.innerHTML = '';
    if (!metrics || !Array.isArray(metrics) || metrics.length === 0) {
        return; // No fallback hardcoded data
    }

    metrics.forEach(m => {
        const card = document.createElement('div');
        card.className = 'stat-card';
        card.innerHTML = `
            <div class="stat-number" data-target="${m.target}">0</div>
            ${m.suffix ? `<div class="stat-suffix">${m.suffix}</div>` : ''}
            <div class="stat-label">${m.label}</div>
            <div class="stat-progress"><div class="stat-progress-bar"></div></div>
        `;
        grid.appendChild(card);
    });

    const statCards = document.querySelectorAll('.stat-card');
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting && !entry.target.classList.contains('animated')) {
                entry.target.classList.add('animated');
                const numberElement = entry.target.querySelector('.stat-number');
                if (numberElement) {
                    const target = parseInt(numberElement.getAttribute('data-target'));
                    animateCounter(numberElement, target, entry.target.querySelector('.stat-suffix')?.textContent || '');
                }
            }
        });
    }, { threshold: 0.5 });

    statCards.forEach(card => observer.observe(card));
}

function animateCounter(element, target, suffix) {
    let current = 0;
    const increment = target / 60;
    const timer = setInterval(() => {
        current += increment;
        if (current >= target) {
            element.textContent = target;
            clearInterval(timer);
        } else {
            element.textContent = Math.floor(current);
        }
    }, 30);
}

// ============================================
// 7. VERTICAL PROCESS TIMELINE
// ============================================
function initProcessVertical(processData) {
    const container = document.getElementById('process-vertical');
    if (!container) return;

    // Safety: Ensure processData is an array
    if (processData && typeof processData === 'object' && !Array.isArray(processData) && Array.isArray(processData.value)) {
        processData = processData.value;
    }

    container.innerHTML = '';
    if (!processData || !Array.isArray(processData) || processData.length === 0) {
        return; // No fallback hardcoded data
    }

    // Sort by step number
    processData.sort((a, b) => a.step - b.step);

    processData.forEach((p, index) => {
        const item = document.createElement('div');
        item.className = 'process-checkpoint';
        item.innerHTML = `
            <div class="checkpoint-dot"></div>
            <div class="checkpoint-content">
                <span class="checkpoint-number">Phase ${String(p.step).padStart(2, '0')}</span>
                <h3>${p.title}</h3>
                <p>${p.desc}</p>
            </div>
        `;
        container.appendChild(item);
    });

    // Intersection Observer for Reveal Animations
    const observerOptions = {
        threshold: 0.2,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, observerOptions);

    document.querySelectorAll('.process-checkpoint').forEach(el => observer.observe(el));
}



// ============================================
// 8. CONTACT PARTICLES
// ============================================
function initContactParticles() {
    const canvas = document.querySelector('.contact-particles');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    const particles = [];
    for (let i = 0; i < 30; i++) {
        particles.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            vx: (Math.random() - 0.5) * 0.3,
            vy: (Math.random() - 0.5) * 0.3,
            size: Math.random() * 2 + 1
        });
    }

    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        particles.forEach(p => {
            p.x += p.vx;
            p.y += p.vy;

            if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
            if (p.y < 0 || p.y > canvas.height) p.vy *= -1;

            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(138, 43, 226, 0.3)';
            ctx.fill();
        });

        requestAnimationFrame(animate);
    }

    animate();
}

// ============================================
// 9. CONTACT FORM (Server-Side Email)
// ============================================
function initContactForm() {
    const form = document.getElementById('contact-form');
    if (!form) return;

    // Add focus animations to form inputs
    const formGroups = form.querySelectorAll('.form-group-corporate');
    formGroups.forEach(group => {
        const input = group.querySelector('input, textarea');
        if (input) {
            input.addEventListener('focus', () => {
                group.classList.add('focused');
            });
            input.addEventListener('blur', () => {
                if (!input.value) {
                    group.classList.remove('focused');
                }
            });
            // Handle pre-filled inputs
            if (input.value) {
                group.classList.add('focused');
            }
        }
    });

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const submitButton = form.querySelector('button[type="submit"]');
        const originalText = submitButton.innerHTML;
        const formData = new FormData(form);

        // Disable button and show loading state
        submitButton.disabled = true;
        submitButton.classList.add('sending');
        submitButton.innerHTML = '<span class="spinner"></span><span>Sending...</span>';

        try {
            const response = await fetch('/api/contact', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: formData.get('name'),
                    phone: formData.get('phone'),
                    email: formData.get('email'),
                    company: formData.get('company'),
                    message: formData.get('message')
                })
            });

            const result = await response.json();

            if (response.ok && result.success) {
                // Success animation
                submitButton.classList.remove('sending');
                submitButton.classList.add('success');
                submitButton.innerHTML = '<span>✓ Message Sent!</span>';

                const overlay = document.querySelector('.success-overlay');
                if (overlay) {
                    overlay.classList.add('active');
                    setTimeout(() => {
                        overlay.classList.remove('active');
                    }, 3000);
                }

                form.reset();
                formGroups.forEach(group => group.classList.remove('focused'));

                // Reset button after delay
                setTimeout(() => {
                    submitButton.classList.remove('success');
                    submitButton.innerHTML = originalText;
                    submitButton.disabled = false;
                }, 3000);
            } else {
                throw new Error(result.message || 'Failed to send message');
            }
        } catch (err) {
            // Error animation
            submitButton.classList.remove('sending');
            submitButton.classList.add('error');
            submitButton.innerHTML = '<span>⚠️ Failed - Try Again</span>';
            console.error('Contact form error:', err);

            setTimeout(() => {
                submitButton.classList.remove('error');
                submitButton.innerHTML = originalText;
                submitButton.disabled = false;
            }, 3000);
        }
    });
}

// ============================================
// 10. SCROLL PROGRESS
// ============================================
function initScrollProgress() {
    const progressBar = document.getElementById('progress-bar');
    if (!progressBar) return;

    window.addEventListener('scroll', () => {
        const windowHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
        const scrolled = (window.scrollY / windowHeight) * 100;
        progressBar.style.width = scrolled + '%';
    });
}

// ============================================
// CTA BUTTON INTERACTIONS
// ============================================
const ctaPrimary = document.getElementById('hero-cta-primary');
const ctaSecondary = document.getElementById('hero-cta-secondary');

if (ctaPrimary) {
    ctaPrimary.addEventListener('click', () => {
        document.querySelector('#contact').scrollIntoView({
            behavior: 'smooth'
        });
    });
}

if (ctaSecondary) {
    ctaSecondary.addEventListener('click', () => {
        document.querySelector('#services').scrollIntoView({
            behavior: 'smooth'
        });
    });
}

// ============================================
// HERO RIGHT BOX - DIGITAL MARKETING VISUALIZATION
// ============================================
// Hero visualization removed in favor of a cleaner, centered layout.
// Legacy Honeycomb Grid removed in favor of Floating Interactive Services.

// ============================================
// 11. FLOATING INTERACTIVE SERVICES
// ============================================
// ============================================
// ============================================
function initCurvedSlider(services) {
    const container = document.getElementById('curved-slider-container');
    const viewport = document.getElementById('curved-slider-viewport');
    if (!container || !viewport) return;

    // Clear viewport and wait for dynamic content
    viewport.innerHTML = '';

    if (!services || !Array.isArray(services) || services.length === 0) {
        return; // No fallback hardcoded data
    }

    const cards = [];
    const cardCount = services.length;
    const isMobile = window.innerWidth <= 768;
    const RADIUS = isMobile ? 300 : 700; // Slightly smaller radius for mobile to bring cards closer
    const DRAG_SENSITIVITY = isMobile ? -0.008 : -0.003; // More sensitive for touch
    const FRICTION = 0.94;
    const SNAP_STRENGTH = 0.08;
    const SPACING = isMobile ? 0.45 : 0.28; // Increased spacing for mobile wide cards

    let scrollPos = 0;
    let velocity = 0;
    let isDragging = false;
    let lastInteractTime = Date.now();
    let isUpdating = true; // Always enable updates to allow slider on mobile
    let lastMouseX = 0;

    services.forEach((service, i) => {
        const card = document.createElement('div');
        card.className = 'service-card-curved';
        // Wrap card in a link to detailed section
        card.innerHTML = `
            <a href="services.html#service-${service.id}" style="text-decoration: none; color: inherit; display: block; height: 100%;">
                <div class="service-card-number">Service ${i + 1}</div>
                <div class="card-icon-gradient">${service.icon}</div>
                <h3 class="card-title-metrics">${service.title}</h3>
                <p class="card-desc-metrics">${service.desc}</p>
            </a>
        `;
        viewport.appendChild(card);
        cards.push(card);
    });

    // Mobile slider is now enabled via JS logic below

    function update() {
        // Autoplay Logic (Mobile Only)
        if (isMobile && !isDragging) {
            const now = Date.now();
            if (now - lastInteractTime > 2000) {
                // Subtle velocity nudge to trigger smooth transition to next card
                velocity = 0.04;
                lastInteractTime = now;
                isUpdating = true;
            }
        }

        if (!isUpdating) {
            // On mobile, keep the loop alive to check the autoplay timer
            if (isMobile) requestAnimationFrame(update);
            return;
        }

        if (!isDragging) {
            scrollPos += velocity;
            velocity *= FRICTION;
            if (Math.abs(velocity) < 0.005) {
                const target = Math.round(scrollPos);
                scrollPos += (target - scrollPos) * SNAP_STRENGTH;
                if (Math.abs(target - scrollPos) < 0.001) {
                    scrollPos = target;
                    velocity = 0;
                    isUpdating = false;
                }
            }
        }
        render();
        if (isUpdating || isDragging || isMobile) requestAnimationFrame(update);
    }

    function render() {
        // Enable JS transforms for BOTH mobile and desktop
        cards.forEach((card, i) => {
            const totalWidth = cardCount * SPACING;
            const diff = (i * SPACING - (scrollPos * SPACING) % totalWidth + totalWidth) % totalWidth;
            const wrappedDiff = diff > totalWidth / 2 ? diff - totalWidth : diff;
            const angle = Math.PI - wrappedDiff;
            const x = Math.sin(angle) * RADIUS;
            const z = -Math.cos(angle) * RADIUS;
            const distanceFromCenter = Math.abs(angle - Math.PI);

            // Adjust scale and opacity curves for mobile
            const scaleBound = isMobile ? 0.7 : 0.4;
            const scale = Math.max(0.3, (1 - (distanceFromCenter / (Math.PI * scaleBound)) * 0.8)) * (isMobile ? 0.85 : 0.666);
            const opacity = Math.max(0, 1 - (distanceFromCenter / (Math.PI * 0.35)));

            card.style.transform = `translateX(${x}px) translateZ(${z}px) scale(${scale})`;
            card.style.opacity = opacity;
            card.style.zIndex = Math.round(z + 10000);

            if (distanceFromCenter < 0.4) card.classList.add('active');
            else card.classList.remove('active');
        });
    }

    function handleStart(x) {
        isDragging = true;
        velocity = 0;
        lastMouseX = x;
        lastInteractTime = Date.now(); // Reset timer on interaction
        isUpdating = true;
        update();
    }

    function handleMove(x) {
        if (!isDragging) return;
        lastInteractTime = Date.now(); // Postpone autoplay during active drag
        velocity = (x - lastMouseX) * DRAG_SENSITIVITY;
        scrollPos += velocity;
        lastMouseX = x;
    }

    container.addEventListener('mousedown', e => handleStart(e.clientX));
    window.addEventListener('mousemove', e => handleMove(e.clientX));
    window.addEventListener('mouseup', () => isDragging = false);

    // Touch Support
    container.addEventListener('touchstart', e => handleStart(e.touches[0].clientX), { passive: true });
    window.addEventListener('touchmove', e => handleMove(e.touches[0].clientX), { passive: false });
    window.addEventListener('touchend', () => isDragging = false);

    isUpdating = true;
    update();
}

function initScrollPageTransition() {
    gsap.registerPlugin(ScrollTrigger);
    const services = document.querySelector('.services-floating');
    const scrollScene = document.querySelector('.services-scroll-scene');
    if (!services || !scrollScene) return;

    let mm = gsap.matchMedia();

    // Only apply the complex scale/clip-path animation on Desktop (min-width: 769px)
    mm.add("(min-width: 769px)", () => {
        gsap.fromTo(services,
            { scale: 0.55, clipPath: "inset(30% 35% 30% 35% round 32px)" },
            {
                scale: 1,
                clipPath: "inset(2% 3.5% 2% 3.5% round 32px)",
                scrollTrigger: {
                    trigger: scrollScene,
                    start: "top bottom",
                    end: "top top",
                    scrub: 0.5
                }
            }
        );
    });

    // Mobile/Tablet (max-width: 768px): Keep it clean and static
    mm.add("(max-width: 768px)", () => {
        gsap.set(services, {
            scale: 1,
            clipPath: "none",
            borderRadius: "32px",
            width: "100%",
            margin: "0"
        });
    });
}

function initMagneticButton() {
    const btn = document.querySelector('.btn-services-static');
    if (!btn) return;

    btn.addEventListener('mousemove', (e) => {
        const rect = btn.getBoundingClientRect();
        const x = e.clientX - rect.left - rect.width / 2;
        const y = e.clientY - rect.top - rect.height / 2;

        btn.style.transform = `translate(${x * 0.3}px, ${y * 0.3}px)`;
    });

    btn.addEventListener('mouseleave', () => {
        btn.style.transform = `translate(0px, 0px)`;
    });
}


