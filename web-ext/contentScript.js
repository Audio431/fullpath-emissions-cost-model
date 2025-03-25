// Track user click events
document.addEventListener('click', (event) => {
    console.log('User clicked:', event.target);
    saveActivity('click', event.target.outerHTML);  // Use outerHTML to store target element details
  });
  
  // Track mouse movements
  document.addEventListener('mousemove', (event) => {
    console.log(`Mouse moved to (${event.clientX}, ${event.clientY})`);
    saveActivity('mousemove', { x: event.clientX, y: event.clientY });
  });
  
  // Track page views
  console.log('Page viewed:', document.title);
  saveActivity('pageview', document.title);
  
  // Function to save activity to window.localStorage
  function saveActivity(type, data) {
    const activities = JSON.parse(localStorage.getItem('userActivities') || '[]');
    activities.push({
      type: type,
      data: data,
      timestamp: new Date().toISOString()
    });
    localStorage.setItem('userActivities', JSON.stringify(activities));
  }
  
  // Retrieve and log stored activities for testing
  console.log('Stored Activities:', JSON.parse(localStorage.getItem('userActivities')));
  