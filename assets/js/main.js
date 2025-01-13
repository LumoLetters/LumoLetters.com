// main.js
document.addEventListener('DOMContentLoaded', () => {
    console.log("Main script loaded.");
  
    // Initialize any global components or features here
    // Example: Show a loading spinner until the page fully loads
    const loader = document.querySelector('.loading-spinner');
    if (loader) {
      loader.classList.add('hidden'); // Hide loader after DOM is ready
    }
  
    // Other global scripts can go here
  });
  