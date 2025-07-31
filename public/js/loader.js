
  document.addEventListener('DOMContentLoaded', () => {
  // Show loading overlay initially
  const loadingOverlay = document.querySelector('.loading-overlay');  
  // Simulate content loading (replace with actual loading logic like AJAX or fetch)
  setTimeout(() => {
    // Hide the loading overlay
    loadingOverlay.style.display = 'none';
    // Show the content
  }, 2000); // Simulate 3 seconds of loading time
});
