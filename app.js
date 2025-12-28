// ChakulaChap Kenya - Main Application
// Complete Firebase Integrated App

// Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyC7YyVZv8Q9xJ8Xq9Q6Wq5Y0qY5Q6Wq5Y0",
    authDomain: "chakulachap-kenya.firebaseapp.com",
    projectId: "chakulachap-kenya",
    storageBucket: "chakulachap-kenya.appspot.com",
    messagingSenderId: "123456789012",
    appId: "1:123456789012:web:abcdef1234567890",
    measurementId: "G-ABCDEF1234"
};

// Initialize Firebase
const app = firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const auth = firebase.auth();

// App State
class AppState {
    constructor() {
        this.currentCampus = 'uo_nairobi';
        this.currentBudget = 150;
        this.user = null;
        this.campuses = {};
        this.isLoading = true;
        this.init();
    }

    async init() {
        try {
            // Hide loading screen after 2 seconds
            setTimeout(() => {
                document.getElementById('loadingScreen').style.opacity = '0';
                setTimeout(() => {
                    document.getElementById('loadingScreen').style.display = 'none';
                }, 500);
            }, 2000);

            // Setup Firebase auth listener
            this.setupAuth();
            
            // Load initial data
            await this.loadInitialData();
            
            // Setup event listeners
            this.setupEventListeners();
            
            // Render initial UI
            this.renderCampuses();
            this.updateStats();
            
            this.isLoading = false;
            
        } catch (error) {
            console.error('App initialization error:', error);
            this.showError('Failed to load app. Please refresh.');
        }
    }

    setupAuth() {
        auth.onAuthStateChanged((user) => {
            this.user = user;
            if (user) {
                console.log('User logged in:', user.email);
                document.getElementById('loginBtn').innerHTML = '<i class="fas fa-user"></i> ' + user.email.split('@')[0];
                this.loadUserPreferences(user.uid);
            } else {
                document.getElementById('loginBtn').innerHTML = '<i class="fas fa-user"></i> Login';
            }
        });
    }

    async loadInitialData() {
        console.log('Loading data from Firebase...');
        
        // Try to load from Firebase
        try {
            // Load campuses
            const campusesSnapshot = await db.collection('campuses')
                .where('status', '==', 'active')
                .get();
            
            this.campuses = {};
            campusesSnapshot.forEach(doc => {
                this.campuses[doc.id] = {
                    id: doc.id,
                    ...doc.data(),
                    meals: []
                };
            });
            
            // Load meals for each campus
            for (const campusId in this.campuses) {
                const mealsSnapshot = await db.collection('meals')
                    .where('campusId', '==', campusId)
                    .where('available', '==', true)
                    .get();
                
                this.campuses[campusId].meals = [];
                mealsSnapshot.forEach(doc => {
                    this.campuses[campusId].meals.push({
                        id: doc.id,
                        ...doc.data()
                    });
                });
            }
            
            console.log('Data loaded successfully:', Object.keys(this.campuses).length, 'campuses');
            
        } catch (error) {
            console.error('Error loading Firebase data:', error);
            // Fallback to sample data
            this.loadSampleData();
        }
    }

    loadSampleData() {
        console.log('Using sample data...');
        this.campuses = {
            'uo_nairobi': {
                id: 'uo_nairobi',
                name: 'University of Nairobi',
                icon: '🏛️',
                description: 'Main campus with multiple dining options',
                meals: [
                    { id: '1', name: 'Githeri Special', price: 70, vendor: 'Main Cafeteria', location: 'Central Campus', health: 4, calories: 350, tip: 'Add avocado for healthy fats' },
                    { id: '2', name: 'Ugali + Sukuma Wiki', price: 80, vendor: 'Main Cafeteria', location: 'Central Campus', health: 4, calories: 400, tip: 'Ask for extra soup for flavor' },
                    { id: '3', name: 'Chapati + Beans', price: 60, vendor: 'Hostel Kiosk', location: 'Hostel Zone', health: 4, calories: 450, tip: 'Perfect protein-carb combo' },
                    { id: '4', name: 'Chips + Sausage', price: 150, vendor: 'Taifa Food Court', location: 'Student Centre', health: 2, calories: 600, tip: 'Add tomato salad for vitamins' }
                ]
            },
            'ku': {
                id: 'ku',
                name: 'Kenyatta University',
                icon: '🎓',
                description: 'Large campus with diverse food options',
                meals: [
                    { id: '5', name: 'Rice + Beans', price: 60, vendor: 'KU Main Mess', location: 'Near Hall 7', health: 4, calories: 400, tip: 'Mix with avocado for creaminess' },
                    { id: '6', name: 'Ugali + Beef', price: 120, vendor: 'KU Main Mess', location: 'Near Hall 7', health: 3, calories: 500, tip: 'Portion is large - can share' }
                ]
            },
            'jkuat': {
                id: 'jkuat',
                name: 'JKUAT Juja',
                icon: '🔬',
                description: 'Technical university with affordable options',
                meals: [
                    { id: '7', name: 'Githeri Special', price: 70, vendor: 'Main Gate', location: 'Main Gate', health: 4, calories: 400, tip: 'Comes with free avocado on Tuesdays' },
                    { id: '8', name: 'Chapati + Minji', price: 80, vendor: 'Hostel Zone', location: 'Hostel Area', health: 4, calories: 450, tip: 'Hearty and filling meal' }
                ]
            }
        };
    }

    setupEventListeners() {
        // Login button
        document.getElementById('loginBtn').addEventListener('click', () => {
            this.showLoginModal();
        });

        // Budget slider
        const budgetSlider = document.getElementById('budgetSlider');
        budgetSlider.addEventListener('input', (e) => {
            this.currentBudget = parseInt(e.target.value);
            document.getElementById('budgetDisplay').querySelector('.amount').textContent = this.currentBudget;
            this.updateBudgetPresets();
        });

        // Budget presets
        document.querySelectorAll('.budget-preset').forEach(preset => {
            preset.addEventListener('click', (e) => {
                const budget = parseInt(e.target.dataset.budget);
                this.currentBudget = budget;
                document.getElementById('budgetSlider').value = budget;
                document.getElementById('budgetDisplay').querySelector('.amount').textContent = budget;
                this.updateBudgetPresets();
            });
        });

        // Find meals button
        document.getElementById('findBtn').addEventListener('click', () => {
            this.findMeals();
        });

        // Campus links in footer
        document.querySelectorAll('[data-campus]').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const campusId = e.target.dataset.campus;
                if (this.campuses[campusId]) {
                    this.currentCampus = campusId;
                    this.renderCampuses();
                    document.querySelector('#find').scrollIntoView({ behavior: 'smooth' });
                }
            });
        });

        // Mobile menu toggle
        document.getElementById('menuToggle').addEventListener('click', () => {
            const navMenu = document.querySelector('.nav-menu');
            navMenu.style.display = navMenu.style.display === 'flex' ? 'none' : 'flex';
        });

        // Modal close buttons
        document.querySelectorAll('.modal-close').forEach(btn => {
            btn.addEventListener('click', () => {
                this.closeModal();
            });
        });

        // Login form
        document.getElementById('loginForm')?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.login();
        });

        // Signup form
        document.getElementById('signupForm')?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.signup();
        });
    }

    renderCampuses() {
        const campusGrid = document.getElementById('campusGrid');
        if (!campusGrid) return;
        
        campusGrid.innerHTML = '';
        
        for (const [id, campus] of Object.entries(this.campuses)) {
            const card = document.createElement('div');
            card.className = `campus-card ${id === this.currentCampus ? 'active' : ''}`;
            card.innerHTML = `
                <div class="campus-icon">${campus.icon || '🏫'}</div>
                <div class="campus-name">${campus.name}</div>
                <div class="campus-meals">${campus.meals?.length || 0} meals</div>
            `;
            card.addEventListener('click', () => this.selectCampus(id));
            campusGrid.appendChild(card);
        }
    }

    selectCampus(campusId) {
        if (!this.campuses[campusId]) return;
        
        this.currentCampus = campusId;
        
        // Update UI
        document.querySelectorAll('.campus-card').forEach(card => {
            card.classList.remove('active');
        });
        
        // Find and activate selected card
        const cards = document.querySelectorAll('.campus-card');
        for (let card of cards) {
            if (card.querySelector('.campus-name').textContent === this.campuses[campusId].name) {
                card.classList.add('active');
                break;
            }
        }
        
        // Save preference if user is logged in
        if (this.user) {
            this.saveUserPreference('lastCampus', campusId);
        }
    }

    updateStats() {
        const campusCount = Object.keys(this.campuses).length;
        let totalMeals = 0;
        let totalPrice = 0;
        let campusCountWithMeals = 0;
        
        for (const campus of Object.values(this.campuses)) {
            if (campus.meals && campus.meals.length > 0) {
                totalMeals += campus.meals.length;
                const avgCampusPrice = campus.meals.reduce((sum, meal) => sum + meal.price, 0) / campus.meals.length;
                totalPrice += avgCampusPrice;
                campusCountWithMeals++;
            }
        }
        
        document.getElementById('campusesCount').textContent = `${campusCount}+`;
        document.getElementById('mealsCount').textContent = `${totalMeals}+`;
        document.getElementById('avgPrice').textContent = campusCountWithMeals > 0 ? 
            `KES ${Math.round(totalPrice / campusCountWithMeals)}` : 'KES 85';
        document.getElementById('studentsCount').textContent = '2,000+';
    }

    updateBudgetPresets() {
        document.querySelectorAll('.budget-preset').forEach(preset => {
            preset.classList.remove('active');
            if (parseInt(preset.dataset.budget) === this.currentBudget) {
                preset.classList.add('active');
            }
        });
    }

    async findMeals() {
        const campus = this.campuses[this.currentCampus];
        if (!campus || !campus.meals) {
            this.showError('No meal data available for this campus.');
            return;
        }
        
        // Show loading state
        const findBtn = document.getElementById('findBtn');
        const originalText = findBtn.innerHTML;
        findBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Finding...';
        findBtn.disabled = true;
        
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 800));
        
        const meals = campus.meals;
        const affordableMeals = meals.filter(meal => meal.price <= this.currentBudget);
        
        // Sort by value (health per price)
        affordableMeals.sort((a, b) => {
            const valueA = (a.health || 3) * 10 / a.price;
            const valueB = (b.health || 3) * 10 / b.price;
            return valueB - valueA;
        });
        
        this.displayResults(affordableMeals);
        
        // Restore button
        findBtn.innerHTML = originalText;
        findBtn.disabled = false;
        
        // Log search analytics
        this.logSearchAnalytics(campus.id, this.currentBudget, affordableMeals.length);
    }

    displayResults(meals) {
        const container = document.getElementById('resultsContainer');
        const campus = this.campuses[this.currentCampus];
        
        if (meals.length === 0) {
            container.innerHTML = `
                <div class="no-results">
                    <div class="no-results-icon">😔</div>
                    <h3>No Meals Found</h3>
                    <p>We couldn't find meals under KES ${this.currentBudget} at ${campus.name}.</p>
                    <div style="margin-top: 20px;">
                        <p><strong>Suggestions:</strong></p>
                        <ul style="text-align: left; display: inline-block; margin-top: 10px;">
                            <li>Try increasing your budget to at least KES ${Math.min(...campus.meals.map(m => m.price))}</li>
                            <li>Check hostel kiosks for cheaper options</li>
                            <li>Consider buying ingredients instead</li>
                        </ul>
                    </div>
                    <div style="margin-top: 30px;">
                        <a href="https://wa.me/254778796999?text=Help%20me%20find%20meals%20under%20KES%20${this.currentBudget}%20at%20${campus.name}" 
                           class="btn btn-whatsapp" target="_blank">
                            <i class="fab fa-whatsapp"></i> Get Help on WhatsApp
                        </a>
                    </div>
                </div>
            `;
            return;
        }
        
        // Calculate statistics
        const cheapest = meals.reduce((min, meal) => meal.price < min.price ? meal : min, meals[0]);
        const averagePrice = meals.reduce((sum, meal) => sum + meal.price, 0) / meals.length;
        const savings = this.currentBudget - cheapest.price;
        
        let html = `
            <div class="section-header">
                <h2>${meals.length} Meals Found at ${campus.name}</h2>
                <p>All under KES ${this.currentBudget}</p>
            </div>
            
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px; background: white; padding: 20px; border-radius: var(--radius-lg); box-shadow: var(--shadow-sm);">
                <div style="text-align: center;">
                    <div style="font-size: 1.5rem; font-weight: 800; color: var(--primary);">KES ${cheapest.price}</div>
                    <div style="font-size: 0.875rem; color: var(--gray-600);">Cheapest</div>
                </div>
                <div style="text-align: center;">
                    <div style="font-size: 1.5rem; font-weight: 800; color: var(--primary);">KES ${Math.round(averagePrice)}</div>
                    <div style="font-size: 0.875rem; color: var(--gray-600);">Average</div>
                </div>
                <div style="text-align: center;">
                    <div style="font-size: 1.5rem; font-weight: 800; color: var(--primary);">KES ${savings}</div>
                    <div style="font-size: 0.875rem; color: var(--gray-600);">You Save</div>
                </div>
            </div>
            
            <div class="results-grid">
        `;
        
        // Show top 6 meals
        meals.slice(0, 6).forEach((meal, index) => {
            const healthStars = Array(5).fill().map((_, i) => 
                `<i class="fas fa-star" style="color: ${i < (meal.health || 3) ? '#FF9800' : '#DADCE0'};"></i>`
            ).join('');
            
            html += `
                <div class="meal-result-card ${index === 0 ? 'featured' : ''}">
                    <div class="meal-header">
                        <div class="meal-price">KES ${meal.price}</div>
                        <div class="meal-name">${meal.name}</div>
                        <div class="meal-vendor">${meal.vendor}</div>
                    </div>
                    <div class="meal-body">
                        <div class="meal-details">
                            <div class="meal-location">
                                <i class="fas fa-map-marker-alt"></i> ${meal.location}
                            </div>
                            <div class="meal-calories">
                                <i class="fas fa-fire"></i> ${meal.calories || 'N/A'} cal
                            </div>
                        </div>
                        <div style="margin: 15px 0;">
                            <div style="color: #FF9800; font-size: 0.875rem;">
                                ${healthStars}
                            </div>
                        </div>
                        <div class="meal-tip">
                            <i class="fas fa-lightbulb"></i> ${meal.tip || 'Good value meal!'}
                        </div>
                    </div>
                </div>
            `;
        });
        
        html += `
            </div>
            
            <div style="margin-top: 40px; background: #E8F5E9; padding: 30px; border-radius: var(--radius-lg);">
                <h3 style="margin-bottom: 15px;">💰 Budget Analysis</h3>
                <p style="margin-bottom: 15px;">
                    With KES ${this.currentBudget}, you can afford ${meals.length} different meals at ${campus.name}.
                    The <strong>${cheapest.name}</strong> at ${cheapest.vendor} is your best budget option at KES ${cheapest.price}.
                </p>
                ${this.currentBudget < 100 ? `
                    <p style="color: #e67e22; margin-bottom: 15px;">
                        <strong>Budget Tip:</strong> With less than KES 100, focus on staples like githeri, chapati, or boiled eggs.
                    </p>
                ` : ''}
                
                <div style="display: flex; gap: 15px; margin-top: 25px; flex-wrap: wrap;">
                    <a href="https://wa.me/254778796999?text=I%20found%20${meals.length}%20meals%20under%20KES%20${this.currentBudget}%20at%20${campus.name}" 
                       class="btn btn-whatsapp" target="_blank">
                        <i class="fab fa-whatsapp"></i> Save to WhatsApp
                    </a>
                    <button class="btn" style="background: var(--gray-100); color: var(--gray-700);" onclick="app.shareResults()">
                        <i class="fas fa-share"></i> Share Results
                    </button>
                    ${!this.user ? `
                    <button class="btn" style="background: var(--secondary); color: white;" onclick="app.showLoginModal()">
                        <i class="fas fa-save"></i> Save Preferences
                    </button>
                    ` : ''}
                </div>
            </div>
        `;
        
        container.innerHTML = html;
        
        // Scroll to results
        container.scrollIntoView({ behavior: 'smooth' });
    }

    async login() {
        const email = document.querySelector('#loginForm input[type="email"]').value;
        const password = document.querySelector('#loginForm input[type="password"]').value;
        
        try {
            const userCredential = await auth.signInWithEmailAndPassword(email, password);
            this.user = userCredential.user;
            this.closeModal();
            this.showSuccess('Login successful!');
        } catch (error) {
            this.showError('Login failed: ' + error.message);
        }
    }

    async signup() {
        const name = document.querySelector('#signupForm input[type="text"]').value;
        const email = document.querySelector('#signupForm input[type="email"]').value;
        const password = document.querySelector('#signupForm input[type="password"]').value;
        const campus = document.querySelector('#signupForm select').value;
        
        try {
            const userCredential = await auth.createUserWithEmailAndPassword(email, password);
            const user = userCredential.user;
            
            // Save user data to Firestore
            await db.collection('users').doc(user.uid).set({
                name: name,
                email: email,
                campus: campus,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                preferences: {
                    lastCampus: this.currentCampus,
                    lastBudget: this.currentBudget
                }
            });
            
            this.user = user;
            this.closeModal();
            this.showSuccess('Account created successfully!');
        } catch (error) {
            this.showError('Signup failed: ' + error.message);
        }
    }

    async loadUserPreferences(userId) {
        try {
            const userDoc = await db.collection('users').doc(userId).get();
            if (userDoc.exists) {
                const userData = userDoc.data();
                if (userData.preferences) {
                    if (userData.preferences.lastCampus && this.campuses[userData.preferences.lastCampus]) {
                        this.currentCampus = userData.preferences.lastCampus;
                        this.selectCampus(this.currentCampus);
                    }
                    if (userData.preferences.lastBudget) {
                        this.currentBudget = userData.preferences.lastBudget;
                        document.getElementById('budgetSlider').value = this.currentBudget;
                        document.getElementById('budgetDisplay').querySelector('.amount').textContent = this.currentBudget;
                        this.updateBudgetPresets();
                    }
                }
            }
        } catch (error) {
            console.error('Error loading preferences:', error);
        }
    }

    async saveUserPreference(key, value) {
        if (!this.user) return;
        
        try {
            await db.collection('users').doc(this.user.uid).update({
                [`preferences.${key}`]: value,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
        } catch (error) {
            console.error('Error saving preference:', error);
        }
    }

    async logSearchAnalytics(campusId, budget, resultsCount) {
        try {
            await db.collection('analytics').add({
                type: 'search',
                campusId: campusId,
                budget: budget,
                resultsCount: resultsCount,
                timestamp: firebase.firestore.FieldValue.serverTimestamp(),
                userId: this.user ? this.user.uid : null,
                userAgent: navigator.userAgent
            });
        } catch (error) {
            console.error('Error logging analytics:', error);
        }
    }

    showLoginModal() {
        document.getElementById('loginModal').classList.add('active');
    }

    showSignupModal() {
        this.closeModal();
        document.getElementById('signupModal').classList.add('active');
    }

    closeModal() {
        document.querySelectorAll('.modal').forEach(modal => {
            modal.classList.remove('active');
        });
    }

    showError(message) {
        alert('Error: ' + message);
    }

    showSuccess(message) {
        alert('Success: ' + message);
    }

    shareResults() {
        const campus = this.campuses[this.currentCampus];
        const text = `I found affordable meals at ${campus.name} using ChakulaChap Kenya! Check it out: ${window.location.href}`;
        
        if (navigator.share) {
            navigator.share({
                title: 'ChakulaChap Kenya',
                text: text,
                url: window.location.href
            });
        } else {
            navigator.clipboard.writeText(text).then(() => {
                alert('Results copied to clipboard! Share with friends.');
            });
        }
    }
}

// Initialize the app
const app = new AppState();
window.app = app;