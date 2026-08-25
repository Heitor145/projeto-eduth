// Mobile Menu Toggle
const hamburger = document.getElementById('hamburger');
const navLinks = document.getElementById('navLinks');

hamburger.addEventListener('click', () => {
    navLinks.classList.toggle('active');
    hamburger.innerHTML = navLinks.classList.contains('active') 
        ? '<i class="fas fa-times"></i>' 
        : '<i class="fas fa-bars"></i>';
});

// Close mobile menu when clicking a link
document.querySelectorAll('.nav-links a').forEach(link => {
    link.addEventListener('click', () => {
        navLinks.classList.remove('active');
        hamburger.innerHTML = '<i class="fas fa-bars"></i>';
    });
});

// FAQ Accordion
document.querySelectorAll('.faq-question').forEach(button => {
    button.addEventListener('click', () => {
        const faqItem = button.parentElement;
        const isActive = faqItem.classList.contains('active');
        
        // Close all other items
        document.querySelectorAll('.faq-item').forEach(item => {
            item.classList.remove('active');
        });
        
        // Toggle current item
        if (!isActive) {
            faqItem.classList.add('active');
        }
    });
});

// Carousel Functionality
const carouselInner = document.getElementById('carouselInner');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const indicatorsContainer = document.getElementById('indicators');

const slides = document.querySelectorAll('.carousel-item');
let currentIndex = 0;
const slideCount = slides.length;
let autoSlideInterval;

// Create indicators
slides.forEach((_, index) => {
    const indicator = document.createElement('div');
    indicator.classList.add('indicator');
    if (index === 0) indicator.classList.add('active');
    indicator.addEventListener('click', () => goToSlide(index));
    indicatorsContainer.appendChild(indicator);
});

const indicators = document.querySelectorAll('.indicator');

// Go to specific slide
function goToSlide(index) {
    currentIndex = index;
    const offset = -currentIndex * 100;
    carouselInner.style.transform = `translateX(${offset}%)`;
    
    // Update indicators
    indicators.forEach((ind, i) => {
        ind.classList.toggle('active', i === currentIndex);
    });
    
    resetAutoSlide();
}

// Next slide
function nextSlide() {
    currentIndex = (currentIndex + 1) % slideCount;
    goToSlide(currentIndex);
}

// Previous slide
function prevSlide() {
    currentIndex = (currentIndex - 1 + slideCount) % slideCount;
    goToSlide(currentIndex);
}

// Auto slide with pause on hover
function startAutoSlide() {
    autoSlideInterval = setInterval(nextSlide, 5000);
}

function resetAutoSlide() {
    clearInterval(autoSlideInterval);
    startAutoSlide();
}

// Event listeners
nextBtn.addEventListener('click', () => {
    nextSlide();
    resetAutoSlide();
});

prevBtn.addEventListener('click', () => {
    prevSlide();
    resetAutoSlide();
});

// Pause auto slide on hover
carouselInner.addEventListener('mouseenter', () => {
    clearInterval(autoSlideInterval);
});

carouselInner.addEventListener('mouseleave', () => {
    resetAutoSlide();
});

// Initialize carousel
startAutoSlide();

// Smooth scrolling for anchor links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
        e.preventDefault();
        
        const targetId = this.getAttribute('href');
        if(targetId === '#') return;
        
        const targetElement = document.querySelector(targetId);
        if(targetElement) {
            window.scrollTo({
                top: targetElement.offsetTop - 80,
                behavior: 'smooth'
            });
        }
    });
});

// Form submission
const form = document.querySelector('.form');
if(form) {
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        
        // Get form values
        const nome = document.getElementById('nome').value;
        const email = document.getElementById('email').value;
        const mensagem = document.getElementById('mensagem').value;
        
        // In a real application, you would send this data to a server
        console.log('Form submitted:', { nome, email, mensagem });
        
        // Show success message
        alert('Mensagem enviada com sucesso! Entraremos em contato em breve.');
        
        // Reset form
        form.reset();
    });
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    // Check if we have a hash in the URL and scroll to that section
    if(window.location.hash) {
        const targetElement = document.querySelector(window.location.hash);
        if(targetElement) {
            setTimeout(() => {
                window.scrollTo({
                    top: targetElement.offsetTop - 80,
                    behavior: 'smooth'
                });
            }, 100);
        }
    }
});