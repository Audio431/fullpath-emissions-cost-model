document.addEventListener('DOMContentLoaded', () => {
    const activityList = document.getElementById('activity-list');
  
    // Get activities from window.localStorage
    const activities = JSON.parse(localStorage.getItem('userActivities') || '[]');
    
    activities.forEach((activity) => {
      const li = document.createElement('li');
      li.textContent = `[${activity.timestamp}] ${activity.type}: ${JSON.stringify(activity.data)}`;
      activityList.appendChild(li);
    });
  });
  