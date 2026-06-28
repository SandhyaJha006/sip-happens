// Initialize Lucide Icons
document.addEventListener('DOMContentLoaded', () => {
  if (window.lucide) {
    window.lucide.createIcons();
  }
});

// Animation Frame Configurations
const totalFrames = 240;
const images = [];
const imageFolder = '/frames/extracted';
const filenamePrefix = 'ezgif-frame-';
const filenamePadding = 3; // e.g. 001

// Dom Elements
const loader = document.getElementById('loader');
const loaderFill = document.getElementById('loader-fill');
const loaderPercent = document.getElementById('loader-percent');
const app = document.getElementById('app');
const canvas = document.getElementById('animation-canvas');
const ctx = canvas.getContext('2d');
const scrollSection = document.getElementById('scroll-section');

// Tracking Loading State
let loadedCount = 0;
let targetFrame = 1;
let currentFrame = 1;
const easeFactor = 0.08; // Frame smoothing lerp factor

// Helper to pad numbers (1 -> '001')
function padZero(num, size) {
  let s = num + "";
  while (s.length < size) s = "0" + s;
  return s;
}

// Preload Images
function preloadImages() {
  return new Promise((resolve) => {
    for (let i = 1; i <= totalFrames; i++) {
      const img = new Image();
      const paddedNum = padZero(i, filenamePadding);
      img.src = `${imageFolder}/${filenamePrefix}${paddedNum}.jpg`;
      
      img.onload = () => {
        loadedCount++;
        const percent = Math.floor((loadedCount / totalFrames) * 100);
        
        // Update loading progress bar and text
        loaderPercent.textContent = `${percent}%`;
        loaderFill.style.width = `${percent}%`;
        
        if (loadedCount === totalFrames) {
          onPreloadComplete();
          resolve();
        }
      };
      
      img.onerror = () => {
        console.error(`Failed to load frame ${i} at ${img.src}`);
        // Increment anyway to not block loading if a frame fails
        loadedCount++;
        if (loadedCount === totalFrames) {
          onPreloadComplete();
          resolve();
        }
      };
      
      images.push(img);
    }
  });
}

// Callback when all images are loaded
function onPreloadComplete() {
  setTimeout(() => {
    // Fade out loader
    loader.classList.add('loader-fade-out');
    
    // Show main page content
    app.classList.remove('app-hidden');
    app.classList.add('app-visible');
    
    // Setup and trigger initial render
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    window.addEventListener('scroll', handleScroll);
    
    // Start continuous rendering loop for smoothing
    requestAnimationFrame(renderLoop);
  }, 500); // Small delay for visual polish
}

// Cover-fit math: Draws image scaled and centered, covering the canvas
function drawImageCover(img) {
  if (!img) return;
  
  const canvasWidth = canvas.width;
  const canvasHeight = canvas.height;
  const imgWidth = img.width;
  const imgHeight = img.height;
  
  const imgRatio = imgWidth / imgHeight;
  const canvasRatio = canvasWidth / canvasHeight;
  
  let drawWidth, drawHeight, drawX, drawY;
  
  if (canvasRatio > imgRatio) {
    // Canvas is wider than image aspect ratio (wide screens)
    drawWidth = canvasWidth;
    drawHeight = canvasWidth / imgRatio;
    drawX = 0;
    drawY = (canvasHeight - drawHeight) / 2;
  } else {
    // Canvas is taller than image aspect ratio (portrait screens / mobile)
    drawWidth = canvasHeight * imgRatio;
    drawHeight = canvasHeight;
    drawX = (canvasWidth - drawWidth) / 2;
    drawY = 0;
  }
  
  ctx.clearRect(0, 0, canvasWidth, canvasHeight);
  ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight);
}

// Resize canvas to match display size
function resizeCanvas() {
  // Cap device pixel ratio at 2 for performance on high-DPI screens
  const scale = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = window.innerWidth * scale;
  canvas.height = window.innerHeight * scale;
  
  // Render the current frame instantly during resize
  const frameToRender = Math.round(currentFrame);
  drawImageCover(images[frameToRender - 1]);
}

// Handle scroll progress computation
function handleScroll() {
  const scrollTop = window.scrollY;
  const sectionTop = scrollSection.offsetTop;
  const sectionHeight = scrollSection.offsetHeight;
  const viewportHeight = window.innerHeight;
  
  // Compute how far we have scrolled inside the sticky section
  const distance = scrollTop - sectionTop;
  const maxDistance = sectionHeight - viewportHeight;
  
  let progress = 0;
  if (distance > 0) {
    progress = Math.min(distance / maxDistance, 1);
  }
  
  // Set the target frame index based on progress (1 to 240)
  targetFrame = Math.min(Math.floor(progress * (totalFrames - 1)) + 1, totalFrames);
  
  // Update navbar styling and active state
  updateNavbar(scrollTop);
}

// Active Nav link tracking and menu blur additions
function updateNavbar(scrollTop) {
  const nav = document.querySelector('.navbar');
  if (!nav) return;
  const sections = ['scroll-section'];
  const navLinks = document.querySelectorAll('.nav-link');
  
  // Scroll threshold to add blur background (already managed in CSS, but can add scroll class)
  if (scrollTop > 50) {
    nav.classList.add('navbar-scrolled');
  } else {
    nav.classList.remove('navbar-scrolled');
  }
  
  let currentActive = 'hero';
  
  sections.forEach((sectionId) => {
    const el = document.getElementById(sectionId);
    if (el) {
      const top = el.offsetTop - 120; // Offset for navbar height
      const height = el.offsetHeight;
      if (scrollTop >= top && scrollTop < top + height) {
        currentActive = sectionId;
      }
    }
  });
  
  navLinks.forEach((link) => {
    const href = link.getAttribute('href').substring(1);
    if (href === currentActive || (currentActive === 'scroll-section' && href === 'scroll-section')) {
      link.classList.add('active');
    } else {
      link.classList.remove('active');
    }
  });
}

// Continuous requestAnimationFrame render loop
function renderLoop() {
  // Smoothly linear-interpolate (lerp) current frame towards target frame
  const diff = targetFrame - currentFrame;
  
  if (Math.abs(diff) > 0.01) {
    currentFrame += diff * easeFactor;
    
    // Round to the nearest index for drawing
    const frameIndex = Math.round(currentFrame);
    const clampedIndex = Math.max(1, Math.min(frameIndex, totalFrames));
    
    drawImageCover(images[clampedIndex - 1]);
  }
  
  requestAnimationFrame(renderLoop);
}

// Start execution
preloadImages();
