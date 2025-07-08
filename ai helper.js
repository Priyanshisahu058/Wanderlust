// Travel Recommendations with Groq API Integration
class TravelRecommendationSystem {
    constructor() {
        this.apiKey = 'process.env.API_KEY'; // Replace with your actual Groq API key
        this.apiUrl = 'https://api.groq.com/openai/v1/chat/completions';
        this.currentRecommendations = [];
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.setupFormHandlers();
    }

    setupEventListeners() {
        // Budget slider update
        const budgetSlider = document.getElementById('budget');
        const budgetValue = document.getElementById('budget-value');
        
        if (budgetSlider && budgetValue) {
            budgetSlider.addEventListener('input', function() {
                budgetValue.textContent = this.value;
            });
        }

        // Traveler count buttons
        this.setupCounterButtons();
        
        // Form submissions
        this.setupFormSubmissions();
        
        // Mode toggle
        this.setupModeToggle();
    }

    setupCounterButtons() {
        // Counter functions for travelers
        window.increaseCount = (type) => {
            const countElement = document.getElementById(type + '-count');
            let count = parseInt(countElement.textContent);
            if (count < 20) {
                countElement.textContent = count + 1;
            }
        };

        window.decreaseCount = (type) => {
            const countElement = document.getElementById(type + '-count');
            let count = parseInt(countElement.textContent);
            if (count > 1) {
                countElement.textContent = count - 1;
            }
        };
    }

    setupModeToggle() {
        window.toggleMode = (mode) => {
            const specificForm = document.getElementById('specific-form');
            const suggestForm = document.getElementById('suggest-form');
            const buttons = document.querySelectorAll('.mode-btn');
            
            buttons.forEach(btn => btn.classList.remove('active'));
            
            if (mode === 'specific') {
                specificForm.classList.remove('hidden');
                suggestForm.classList.add('hidden');
                buttons[0].classList.add('active');
            } else {
                specificForm.classList.add('hidden');
                suggestForm.classList.remove('hidden');
                buttons[1].classList.add('active');
            }
        };
    }

    setupFormHandlers() {
        // Set minimum dates
        const today = new Date().toISOString().split('T')[0];
        const checkinInput = document.getElementById('checkin');
        const checkoutInput = document.getElementById('checkout');
        
        if (checkinInput && checkoutInput) {
            checkinInput.setAttribute('min', today);
            checkoutInput.setAttribute('min', today);
            
            checkinInput.addEventListener('change', function() {
                checkoutInput.setAttribute('min', this.value);
            });
        }
    }

    setupFormSubmissions() {
        // Specific destination form
        const specificForm = document.getElementById('specific-form');
        if (specificForm) {
            specificForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleSpecificDestinationForm();
            });
        }

        // Suggestion form
        const suggestForm = document.getElementById('suggest-form');
        if (suggestForm) {
            suggestForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleSuggestionForm();
            });
        }
    }

    async handleSuggestionForm() {
        try {
            // Show loading state
            this.showLoadingState();
            
            // Collect form data
            const formData = this.collectSuggestionFormData();
            
            // Get recommendations from Groq
            const recommendations = await this.getRecommendationsFromGroq(formData);
            
            // Display recommendations
            this.displayRecommendations(recommendations);
            
        } catch (error) {
            console.error('Error getting recommendations:', error);
            this.showErrorState('Failed to get recommendations. Please try again.');
        }
    }

    collectSuggestionFormData() {
        const travelType = document.querySelector('input[name="travel-type-suggest"]:checked')?.value || 'solo';
        const travelStyle = document.getElementById('travel-style')?.value || 'relaxation';
        const duration = document.getElementById('duration')?.value || 'week';
        const budget = document.getElementById('budget')?.value || 3000;
        
        // Collect interests
        const interests = [];
        document.querySelectorAll('#suggest-form input[type="checkbox"]:checked').forEach(checkbox => {
            interests.push(checkbox.value);
        });

        return {
            travelType,
            travelStyle,
            duration,
            budget: parseInt(budget),
            interests
        };
    }

    async getRecommendationsFromGroq(formData) {
        const prompt = this.buildPrompt(formData);
        
        const response = await fetch(this.apiUrl, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${this.apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: 'llama3-8b-8192', // or another available model
                messages: [
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                temperature: 0.7,
                max_tokens: 1000
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        return this.parseRecommendations(data.choices[0].message.content);
    }

    buildPrompt(formData) {
        return `As a travel expert, provide exactly 3 travel destination recommendations based on these preferences:

Travel Type: ${formData.travelType}
Travel Style: ${formData.travelStyle}
Duration: ${formData.duration}
Budget: $${formData.budget} per person
Interests: ${formData.interests.join(', ') || 'General sightseeing'}

For each destination, provide:
1. Destination name and country
2. Brief description (2-3 sentences)
3. Why it matches their preferences
4. Estimated cost range
5. Best time to visit
6. Top 3 activities

Format the response as JSON with this structure:
{
  "recommendations": [
    {
      "destination": "City, Country",
      "description": "Brief description...",
      "whyMatch": "Why this matches their preferences...",
      "costRange": "$X - $Y",
      "bestTime": "Season/months",
      "activities": ["Activity 1", "Activity 2", "Activity 3"],
      "emoji": "🏝️" // relevant emoji
    }
  ]
}`;
    }

    parseRecommendations(responseText) {
        try {
            // Extract JSON from response
            const jsonMatch = responseText.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                return JSON.parse(jsonMatch[0]);
            }
            throw new Error('No valid JSON found in response');
        } catch (error) {
            console.error('Error parsing recommendations:', error);
            // Fallback to default recommendations
            return this.getDefaultRecommendations();
        }
    }

    getDefaultRecommendations() {
        return {
            recommendations: [
                {
                    destination: "Bali, Indonesia",
                    description: "Tropical paradise with stunning beaches, ancient temples, and vibrant culture. Perfect for relaxation and adventure.",
                    whyMatch: "Offers great value for money with diverse activities and beautiful scenery.",
                    costRange: "$800 - $1,200",
                    bestTime: "April to October",
                    activities: ["Temple hopping", "Beach relaxation", "Rice terrace tours"],
                    emoji: "🏝️"
                },
                {
                    destination: "Prague, Czech Republic",
                    description: "Fairytale city with medieval architecture, rich history, and affordable luxury. Great for culture enthusiasts.",
                    whyMatch: "Perfect blend of history, culture, and budget-friendly options.",
                    costRange: "$600 - $1,000",
                    bestTime: "May to September",
                    activities: ["Castle tours", "River cruises", "Beer tasting"],
                    emoji: "🏰"
                },
                {
                    destination: "Costa Rica",
                    description: "Adventure paradise with incredible biodiversity, beaches, and eco-tourism opportunities.",
                    whyMatch: "Ideal for nature lovers and adventure seekers with sustainable tourism focus.",
                    costRange: "$1,000 - $1,500",
                    bestTime: "December to April",
                    activities: ["Wildlife watching", "Zip-lining", "Volcano tours"],
                    emoji: "🌿"
                }
            ]
        };
    }

    displayRecommendations(data) {
        this.currentRecommendations = data.recommendations;
        this.hideLoadingState();
        
        // Create recommendations container
        const recommendationsHtml = this.createRecommendationsHtml(data.recommendations);
        
        // Insert after the suggestion form
        const suggestForm = document.getElementById('suggest-form');
        const existingRecommendations = document.getElementById('recommendations-container');
        
        if (existingRecommendations) {
            existingRecommendations.remove();
        }
        
        suggestForm.insertAdjacentHTML('afterend', recommendationsHtml);
        
        // Setup recommendation selection handlers
        this.setupRecommendationHandlers();
        
        // Scroll to recommendations
        document.getElementById('recommendations-container').scrollIntoView({ 
            behavior: 'smooth',
            block: 'start'
        });
    }

    createRecommendationsHtml(recommendations) {
        const recommendationsCards = recommendations.map((rec, index) => `
            <div class="recommendation-card" data-index="${index}">
                <div class="recommendation-header">
                    <span class="recommendation-emoji">${rec.emoji}</span>
                    <h3>${rec.destination}</h3>
                </div>
                <div class="recommendation-content">
                    <p class="recommendation-description">${rec.description}</p>
                    <div class="recommendation-details">
                        <div class="detail-item">
                            <strong>Why this matches:</strong>
                            <span>${rec.whyMatch}</span>
                        </div>
                        <div class="detail-item">
                            <strong>Cost Range:</strong>
                            <span>${rec.costRange}</span>
                        </div>
                        <div class="detail-item">
                            <strong>Best Time:</strong>
                            <span>${rec.bestTime}</span>
                        </div>
                        <div class="detail-item">
                            <strong>Top Activities:</strong>
                            <ul>
                                ${rec.activities.map(activity => `<li>${activity}</li>`).join('')}
                            </ul>
                        </div>
                    </div>
                    <button class="select-destination-btn" onclick="travelSystem.selectDestination(${index})">
                        Select This Destination
                    </button>
                </div>
            </div>
        `).join('');

        return `
            <div id="recommendations-container" class="recommendations-section">
                <h2 class="recommendations-title">✨ Your Personalized Recommendations</h2>
                <p class="recommendations-subtitle">Based on your preferences, here are our top 3 destination suggestions:</p>
                <div class="recommendations-grid">
                    ${recommendationsCards}
                </div>
            </div>
            <style>
                .recommendations-section {
                    margin-top: 3rem;
                    padding: 2rem 0;
                    background: rgba(255, 255, 255, 0.1);
                    border-radius: 20px;
                    backdrop-filter: blur(10px);
                }
                
                .recommendations-title {
                    text-align: center;
                    color: #2d3436;
                    font-size: 2rem;
                    margin-bottom: 0.5rem;
                    font-weight: 600;
                }
                
                .recommendations-subtitle {
                    text-align: center;
                    color: #636e72;
                    margin-bottom: 2rem;
                    font-size: 1.1rem;
                }
                
                .recommendations-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
                    gap: 1.5rem;
                    margin-top: 1.5rem;
                }
                
                .recommendation-card {
                    background: rgba(255, 255, 255, 0.95);
                    border-radius: 16px;
                    padding: 1.5rem;
                    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
                    border: 1px solid rgba(255, 255, 255, 0.3);
                    transition: all 0.3s ease;
                    cursor: pointer;
                }
                
                .recommendation-card:hover {
                    transform: translateY(-5px);
                    box-shadow: 0 15px 40px rgba(0, 0, 0, 0.15);
                }
                
                .recommendation-header {
                    display: flex;
                    align-items: center;
                    gap: 1rem;
                    margin-bottom: 1rem;
                }
                
                .recommendation-emoji {
                    font-size: 2.5rem;
                }
                
                .recommendation-card h3 {
                    color: #2d3436;
                    font-size: 1.3rem;
                    margin: 0;
                    font-weight: 600;
                }
                
                .recommendation-description {
                    color: #636e72;
                    line-height: 1.6;
                    margin-bottom: 1.5rem;
                }
                
                .recommendation-details {
                    margin-bottom: 1.5rem;
                }
                
                .detail-item {
                    margin-bottom: 1rem;
                    font-size: 0.9rem;
                }
                
                .detail-item strong {
                    color: #2d3436;
                    display: block;
                    margin-bottom: 0.3rem;
                }
                
                .detail-item span {
                    color: #636e72;
                }
                
                .detail-item ul {
                    margin: 0.5rem 0 0 1rem;
                    color: #636e72;
                }
                
                .detail-item li {
                    margin-bottom: 0.2rem;
                }
                
                .select-destination-btn {
                    width: 100%;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%);
                    color: white;
                    border: none;
                    padding: 1rem;
                    border-radius: 8px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    font-size: 1rem;
                }
                
                .select-destination-btn:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 5px 15px rgba(102, 126, 234, 0.3);
                }
                
                @media (max-width: 768px) {
                    .recommendations-grid {
                        grid-template-columns: 1fr;
                    }
                    
                    .recommendations-title {
                        font-size: 1.5rem;
                    }
                }
            </style>
        `;
    }

    setupRecommendationHandlers() {
        // Selection handler is already set up in the HTML via onclick
    }

    selectDestination(index) {
        const selectedDestination = this.currentRecommendations[index];
        
        // Switch to specific destination form
        window.toggleMode('specific');
        
        // Fill in the destination field
        const destinationInput = document.getElementById('destination');
        if (destinationInput) {
            destinationInput.value = selectedDestination.destination;
        }
        
        // Scroll to the specific form
        document.getElementById('specific-form').scrollIntoView({ 
            behavior: 'smooth',
            block: 'start'
        });
        
        // Show success message
        this.showSuccessMessage(`Great choice! ${selectedDestination.destination} has been selected. Please fill in the remaining details.`);
    }

    handleSpecificDestinationForm() {
        // Collect form data
        const formData = {
            origin: document.getElementById('origin').value,
            destination: document.getElementById('destination').value,
            checkin: document.getElementById('checkin').value,
            checkout: document.getElementById('checkout').value,
            travelType: document.querySelector('input[name="travel-type"]:checked')?.value,
            travelers: document.getElementById('travelers-count').textContent
        };
        
        // Validate form
        if (!formData.origin || !formData.destination || !formData.checkin || !formData.checkout) {
            this.showErrorState('Please fill in all required fields.');
            return;
        }
        
        // Store data in sessionStorage for the itinerary page
        sessionStorage.setItem('travelData', JSON.stringify(formData));
        
        // Show loading message
        this.showSuccessMessage('Preparing your itinerary...');
        
        // Redirect to itinerary page after a short delay
        setTimeout(() => {
            window.location.href = 'itinerary.html';
        }, 1500);
    }

    showLoadingState() {
        const submitBtn = document.querySelector('#suggest-form .btn');
        if (submitBtn) {
            submitBtn.innerHTML = '🔄 Getting Recommendations...';
            submitBtn.disabled = true;
        }
    }

    hideLoadingState() {
        const submitBtn = document.querySelector('#suggest-form .btn');
        if (submitBtn) {
            submitBtn.innerHTML = 'Get Personalized Suggestions';
            submitBtn.disabled = false;
        }
    }

    showErrorState(message) {
        this.hideLoadingState();
        this.showNotification(message, 'error');
    }

    showSuccessMessage(message) {
        this.showNotification(message, 'success');
    }

    showNotification(message, type) {
        // Remove existing notification
        const existingNotification = document.querySelector('.notification');
        if (existingNotification) {
            existingNotification.remove();
        }
        
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <span class="notification-icon">${type === 'success' ? '✅' : '❌'}</span>
                <span class="notification-message">${message}</span>
                <button class="notification-close" onclick="this.parentElement.parentElement.remove()">×</button>
            </div>
        `;
        
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 1000;
            background: ${type === 'success' ? '#d4edda' : '#f8d7da'};
            color: ${type === 'success' ? '#155724' : '#721c24'};
            border: 1px solid ${type === 'success' ? '#c3e6cb' : '#f5c6cb'};
            border-radius: 8px;
            padding: 1rem;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            max-width: 400px;
            animation: slideIn 0.3s ease-out;
        `;
        
        const style = document.createElement('style');
        style.textContent = `
            @keyframes slideIn {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
            .notification-content {
                display: flex;
                align-items: center;
                gap: 0.5rem;
            }
            .notification-close {
                background: none;
                border: none;
                font-size: 1.2rem;
                cursor: pointer;
                margin-left: auto;
                padding: 0;
                color: inherit;
            }
            .notification-icon {
                font-size: 1.1rem;
            }
            .notification-message {
                flex: 1;
                font-weight: 500;
            }
        `;
        
        if (!document.querySelector('style[data-notification]')) {
            style.setAttribute('data-notification', 'true');
            document.head.appendChild(style);
        }
        
        document.body.appendChild(notification);
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, 5000);
    }
}

// Initialize the travel system when the page loads
document.addEventListener('DOMContentLoaded', () => {
    window.travelSystem = new TravelRecommendationSystem();
});

// Configuration object for easy customization
const TravelConfig = {
    GROQ_API_KEY: 'process.env.API_KEY', // Replace with your actual API key
    GROQ_MODEL: 'llama3-8b-8192',
    MAX_TRAVELERS: 20,
    MIN_BUDGET: 500,
    MAX_BUDGET: 15000,
    ITINERARY_PAGE: 'itinerary.html'
};

// Export for use in other scripts if needed
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TravelRecommendationSystem;
}