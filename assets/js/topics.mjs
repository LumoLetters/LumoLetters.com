// assets/js/topics.mjs
// Complete topics management for the dashboard

import { getOrCreateUserProfile, getToken } from './authentication.mjs';
import config from './lib/config.mjs';

let allTopics = [];
let userSelectedTopics = [];
let initialSelectedTopics = [];

// Fetch all available topics from the data file
async function fetchAllTopics() {
  try {
    const response = await fetch('/_data/letter_topics.yml');
    if (!response.ok) {
      throw new Error('Failed to load topics data');
    }
    
    // Since Jekyll doesn't serve YAML directly, we'll need to parse it from the page
    // or have it rendered as JSON. For now, let's get it from the rendered HTML
    const topicsData = window.TOPICS_DATA || [];
    return topicsData;
  } catch (error) {
    console.error('Error fetching topics:', error);
    return [];
  }
}

// Fetch user's selected topics from backend
async function fetchUserTopics() {
  try {
    const user = await getOrCreateUserProfile();
    
    // Get interests from onboarding or userInterests field
    const interests = user.onboarding?.interests || user.userInterests || [];
    
    return Array.isArray(interests) ? interests : [];
  } catch (error) {
    console.error('Error fetching user topics:', error);
    return [];
  }
}

// Save user's topic selections to backend
async function saveUserTopics(topicIds) {
  const token = getToken();
  if (!token) {
    throw new Error('User is not authenticated');
  }

  const response = await fetch(`${config.api.baseUrl}/auth-user`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({
      userInterests: topicIds
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to save topics');
  }

  return response.json();
}

// Render topics to the page
function renderTopics(topics, selectedIds, filterCategory = 'all') {
  const container = document.getElementById('topics-container');
  const template = document.getElementById('topic-card-template');
  
  if (!container || !template) {
    console.error('Topics container or template not found');
    return;
  }

  // Clear container
  container.innerHTML = '';

  // Filter topics by category if needed
  let filteredTopics = topics;
  if (filterCategory !== 'all') {
    filteredTopics = topics.filter(t => t.category === filterCategory);
  }

  // Group by category
  const categorizedTopics = {};
  filteredTopics.forEach(topic => {
    if (!categorizedTopics[topic.category]) {
      categorizedTopics[topic.category] = [];
    }
    categorizedTopics[topic.category].push(topic);
  });

  // Render each category
  Object.entries(categorizedTopics).forEach(([category, categoryTopics]) => {
    // Add category header
    const header = document.createElement('div');
    header.className = 'topics-category-header';
    header.innerHTML = `<h3>${category}</h3>`;
    container.appendChild(header);

    // Add topics in this category
    categoryTopics.forEach(topic => {
      const card = template.content.cloneNode(true);
      const cardElement = card.querySelector('.topic-card');
      
      cardElement.dataset.topicId = topic.id;
      cardElement.querySelector('.topic-card__category').textContent = topic.category;
      cardElement.querySelector('.topic-card__name').textContent = topic.name;
      cardElement.querySelector('.topic-card__description').textContent = topic.description;
      
      // Set selected state
      if (selectedIds.includes(topic.id)) {
        cardElement.classList.add('selected');
        cardElement.setAttribute('aria-checked', 'true');
      }
      
      // Add click handler
      cardElement.addEventListener('click', () => toggleTopic(topic.id));
      
      // Keyboard handler
      cardElement.addEventListener('keydown', (e) => {
        if (e.key === ' ' || e.key === 'Enter') {
          e.preventDefault();
          toggleTopic(topic.id);
        }
      });
      
      container.appendChild(card);
    });
  });

  // Show container
  container.classList.remove('hidden');
  
  // Update count
  updateSelectedCount();
}

// Toggle topic selection
function toggleTopic(topicId) {
  const index = userSelectedTopics.indexOf(topicId);
  
  if (index > -1) {
    // Remove topic
    userSelectedTopics.splice(index, 1);
  } else {
    // Add topic
    userSelectedTopics.push(topicId);
  }
  
  // Update UI
  const card = document.querySelector(`[data-topic-id="${topicId}"]`);
  if (card) {
    if (userSelectedTopics.includes(topicId)) {
      card.classList.add('selected');
      card.setAttribute('aria-checked', 'true');
    } else {
      card.classList.remove('selected');
      card.setAttribute('aria-checked', 'false');
    }
  }
  
  updateSelectedCount();
  checkForChanges();
}

// Update selected count display
function updateSelectedCount() {
  const countElement = document.getElementById('selected-count');
  if (countElement) {
    countElement.textContent = userSelectedTopics.length;
  }
}

// Check if there are unsaved changes
function checkForChanges() {
  const hasChanges = JSON.stringify(initialSelectedTopics.sort()) !== 
                     JSON.stringify(userSelectedTopics.sort());
  
  const actionsDiv = document.getElementById('topics-actions');
  if (actionsDiv) {
    if (hasChanges) {
      actionsDiv.classList.remove('hidden');
    } else {
      actionsDiv.classList.add('hidden');
    }
  }
}

// Setup filter buttons
function setupFilters() {
  const filterButtons = document.querySelectorAll('.filter-btn');
  
  filterButtons.forEach(btn => {
    btn.addEventListener('click', function() {
      // Update active state
      filterButtons.forEach(b => b.classList.remove('active'));
      this.classList.add('active');
      
      // Get filter value
      const filter = this.dataset.filter;
      
      // Re-render with filter
      renderTopics(allTopics, userSelectedTopics, filter);
    });
  });
}

// Save topics handler
async function handleSaveTopics() {
  const saveBtn = document.getElementById('save-topics-btn');
  const errorDiv = document.getElementById('topics-error');
  const successDiv = document.getElementById('save-success');
  
  if (saveBtn) saveBtn.disabled = true;
  if (errorDiv) errorDiv.classList.add('hidden');
  if (successDiv) successDiv.classList.add('hidden');
  
  try {
    await saveUserTopics(userSelectedTopics);
    
    // Update initial state
    initialSelectedTopics = [...userSelectedTopics];
    
    // Show success message
    if (successDiv) {
      successDiv.classList.remove('hidden');
      setTimeout(() => {
        successDiv.classList.add('hidden');
      }, 3000);
    }
    
    // Hide actions
    const actionsDiv = document.getElementById('topics-actions');
    if (actionsDiv) {
      actionsDiv.classList.add('hidden');
    }
  } catch (error) {
    console.error('Error saving topics:', error);
    if (errorDiv) {
      errorDiv.querySelector('p').textContent = error.message || 'Failed to save topics. Please try again.';
      errorDiv.classList.remove('hidden');
    }
  } finally {
    if (saveBtn) saveBtn.disabled = false;
  }
}

// Cancel changes handler
function handleCancelChanges() {
  // Reset to initial state
  userSelectedTopics = [...initialSelectedTopics];
  
  // Re-render
  const activeFilter = document.querySelector('.filter-btn.active');
  const filter = activeFilter ? activeFilter.dataset.filter : 'all';
  renderTopics(allTopics, userSelectedTopics, filter);
  
  // Hide actions
  const actionsDiv = document.getElementById('topics-actions');
  if (actionsDiv) {
    actionsDiv.classList.add('hidden');
  }
}

// Initialize topics page
async function initTopicsPage() {
  const loadingDiv = document.getElementById('topics-loading');
  const errorDiv = document.getElementById('topics-error');
  const container = document.getElementById('topics-container');
  
  try {
    // Show loading
    if (loadingDiv) loadingDiv.classList.remove('hidden');
    if (errorDiv) errorDiv.classList.add('hidden');
    if (container) container.classList.add('hidden');
    
    // Fetch data - topics are embedded in the page by Jekyll
    const topicsElements = document.querySelectorAll('[data-topic-data]');
    allTopics = Array.from(topicsElements).map(el => JSON.parse(el.dataset.topicData));
    
    // If no topics found in DOM, show error
    if (allTopics.length === 0) {
      throw new Error('No topics data found. Please contact support.');
    }
    
    // Fetch user's selected topics
    const selectedIds = await fetchUserTopics();
    userSelectedTopics = [...selectedIds];
    initialSelectedTopics = [...selectedIds];
    
    // Hide loading
    if (loadingDiv) loadingDiv.classList.add('hidden');
    
    // Render topics
    renderTopics(allTopics, userSelectedTopics);
    
    // Setup filters
    setupFilters();
    
    // Setup action buttons
    const saveBtn = document.getElementById('save-topics-btn');
    const cancelBtn = document.getElementById('cancel-btn');
    
    if (saveBtn) {
      saveBtn.addEventListener('click', handleSaveTopics);
    }
    
    if (cancelBtn) {
      cancelBtn.addEventListener('click', handleCancelChanges);
    }
    
  } catch (error) {
    console.error('Error initializing topics page:', error);
    
    // Hide loading
    if (loadingDiv) loadingDiv.classList.add('hidden');
    
    // Show error
    if (errorDiv) {
      errorDiv.querySelector('p').textContent = error.message || 'Failed to load topics. Please try again.';
      errorDiv.classList.remove('hidden');
    }
  }
}

// Run on page load
document.addEventListener('DOMContentLoaded', initTopicsPage);