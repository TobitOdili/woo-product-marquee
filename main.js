const InfiniteScroll = {
  speed: 1.5, // Pixels per frame

  init() {
    this.gallery = document.querySelector('.elementor-widget-image-gallery');
    if (!this.gallery) return;

    // Get all images from the original gallery
    const originalImages = Array.from(this.gallery.querySelectorAll('img'));
    if (!originalImages.length) return;

    // Create a container for our infinite scroll
    this.scrollContainer = document.createElement('div');
    this.scrollContainer.style.cssText = `
      display: flex;
      gap: 20px;
      padding: 20px;
      position: relative;
      transform: translateX(0);
      will-change: transform;
    `;

    // Clone images and set up the scroll content
    this.setupImages(originalImages);
    
    // Replace original content with our scroll container
    this.gallery.innerHTML = '';
    this.gallery.style.cssText = `
      overflow: hidden;
      width: 100%;
      mask-image: linear-gradient(to right, transparent 0%, black 5%, black 95%, transparent 100%);
      -webkit-mask-image: -webkit-linear-gradient(left, transparent 0%, black 5%, black 95%, transparent 100%);
    `;
    this.gallery.appendChild(this.scrollContainer);

    // Start animation
    this.animate();
    
    // Handle visibility and interaction
    this.handleVisibility();
    this.handleInteraction();
  },

  setupImages(originalImages) {
    // Function to create an image element with loading state
    const createImage = (src) => {
      const wrapper = document.createElement('div');
      wrapper.style.cssText = `
        flex: 0 0 auto;
        width: 300px;
        height: 200px;
        position: relative;
        overflow: hidden;
        border-radius: 8px;
        background: linear-gradient(110deg, 
          #101010 0%,
          #101010 20%,
          rgba(67, 140, 202, 0.3) 30%,
          rgba(67, 140, 202, 0.2) 35%,
          #101010 45%,
          #101010 100%
        );
        background-size: 200% 100%;
        animation: shimmer 2s linear infinite;
      `;

      const img = new Image();
      img.src = src;
      img.style.cssText = `
        width: 100%;
        height: 100%;
        object-fit: cover;
        opacity: 0;
        transition: opacity 0.5s ease, transform 0.3s ease;
      `;

      img.onload = () => {
        img.style.opacity = '1';
      };

      wrapper.appendChild(img);
      return wrapper;
    };

    // Create enough copies to fill the screen multiple times
    const imageSets = Math.ceil((window.innerWidth * 3) / (originalImages.length * 320));
    
    for (let i = 0; i < imageSets; i++) {
      originalImages.forEach(img => {
        this.scrollContainer.appendChild(createImage(img.src));
      });
    }
  },

  animate() {
    let position = 0;
    const animate = () => {
      if (this.paused) {
        requestAnimationFrame(animate);
        return;
      }

      position -= this.speed;
      
      // Reset position when a full set has scrolled
      const firstImageWidth = this.scrollContainer.firstElementChild.offsetWidth;
      const gap = 20; // matches gap in CSS
      const resetPoint = -(firstImageWidth + gap);
      
      if (position <= resetPoint) {
        // Move first image to the end
        const firstImage = this.scrollContainer.firstElementChild;
        this.scrollContainer.appendChild(firstImage);
        position += firstImageWidth + gap;
      }

      this.scrollContainer.style.transform = `translateX(${position}px)`;
      requestAnimationFrame(animate);
    };

    requestAnimationFrame(animate);
  },

  handleVisibility() {
    // Pause when not visible
    const observer = new IntersectionObserver(
      (entries) => {
        this.paused = !entries[0].isIntersecting;
      },
      { threshold: 0.1 }
    );
    observer.observe(this.gallery);

    // Pause when tab is not visible
    document.addEventListener('visibilitychange', () => {
      this.paused = document.hidden;
    });
  },

  handleInteraction() {
    // Pause on hover
    this.scrollContainer.addEventListener('mouseenter', () => {
      this.paused = true;
    });
    
    this.scrollContainer.addEventListener('mouseleave', () => {
      this.paused = false;
    });

    // Touch handling
    let touchStart = 0;
    let lastTouch = 0;
    let velocity = 0;
    
    this.scrollContainer.addEventListener('touchstart', (e) => {
      touchStart = e.touches[0].clientX;
      lastTouch = touchStart;
      this.paused = true;
    }, { passive: true });

    this.scrollContainer.addEventListener('touchmove', (e) => {
      const touch = e.touches[0].clientX;
      const delta = touch - lastTouch;
      lastTouch = touch;
      velocity = delta;
      
      const currentTransform = new WebKitCSSMatrix(
        window.getComputedStyle(this.scrollContainer).transform
      );
      this.scrollContainer.style.transform = `translateX(${currentTransform.e + delta}px)`;
    }, { passive: true });

    this.scrollContainer.addEventListener('touchend', () => {
      this.paused = false;
      // Optional: Add momentum scrolling based on final velocity
    }, { passive: true });
  }
};

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => InfiniteScroll.init());
} else {
  InfiniteScroll.init();
}

// Handle Elementor frontend initialization
if (window.elementorFrontend) {
  window.elementorFrontend.hooks.addAction('frontend/element_ready/widget', () => {
    InfiniteScroll.init();
  });
}