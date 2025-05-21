document.addEventListener('DOMContentLoaded', async () => {
    const burger = document.querySelector('.burger');
    const nav = document.querySelector('.nav-links');
    const navLinks = document.querySelectorAll('.nav-links li');
    const loadingOverlay = document.getElementById('loadingOverlay');

    // Auth Elements
    const authOverlay = document.getElementById('authOverlay');
    const mainContent = document.getElementById('mainContent');
    const authForm = document.getElementById('authForm');
    const authEmailInput = document.getElementById('authEmail');
    const authPasswordInput = document.getElementById('authPassword');
    const authSubmitButton = document.getElementById('authSubmitButton');
    const authSwitchLink = document.getElementById('authSwitchLink');
    const authTitle = document.getElementById('authTitle');
    const authSubtitle = document.getElementById('authSubtitle');
    const authError = document.getElementById('authError');

    let isLoginMode = true; // State to track if we are in login or signup mode

    // --- Firebase Initialization and Auth Listener ---
    // These are exposed globally from the script tag in index.html
    const app = window.firebaseApp;
    const auth = window.firebaseAuth;
    const db = window.firebaseDb;
    const appId = window.currentAppId;
    const initialAuthToken = window.initialAuthToken;

    // Firebase Auth methods
    const { signInWithEmailAndPassword, createUserWithEmailAndPassword, onAuthStateChanged, signOut, signInAnonymously } = window.firebaseAuth;
    const { doc, getDoc, setDoc, collection, query, where, addDoc, getDocs, updateDoc, deleteDoc, onSnapshot } = window.firestore;


    // Function to show/hide loading overlay
    function showLoading() {
        if (loadingOverlay) {
            loadingOverlay.classList.add('visible');
        }
    }

    function hideLoading() {
        if (loadingOverlay) {
            loadingOverlay.classList.remove('visible');
        }
    }

    // Function to show main content and hide auth overlay
    function showMainContent() {
        console.log("showMainContent: Starting transition.");

        // 1. Make main content display: block immediately to allow transitions
        mainContent.style.display = 'block';
        // 2. Remove 'hidden' class and add 'visible' class to trigger its showing transition
        mainContent.classList.remove('hidden');
        mainContent.classList.add('visible');

        // 3. Add 'hidden' class to auth overlay to trigger its hiding transition
        authOverlay.classList.add('hidden');
        authOverlay.classList.remove('active'); // Remove active for consistency

        // 4. After auth overlay's transition, set its display to 'none'
        setTimeout(() => {
            authOverlay.style.display = 'none';
            document.body.style.overflow = 'auto'; // Allow scrolling on main content
            console.log("showMainContent: Auth overlay hidden, main content visible.");
        }, 500); // Matches auth-overlay's transition duration
    }

    // Function to show auth overlay and hide main content
    function showAuthOverlay() {
        console.log("showAuthOverlay: Starting transition.");

        // 1. Make auth overlay display: flex immediately to allow transitions
        authOverlay.style.display = 'flex';
        // 2. Remove 'hidden' class and add 'active' class to trigger its showing transition
        authOverlay.classList.remove('hidden');
        authOverlay.classList.add('active');

        // 3. Add 'hidden' class to main content to trigger its hiding transition
        mainContent.classList.add('hidden');
        mainContent.classList.remove('visible'); // Ensure it's not stuck in visible state

        // 4. After main content's transition, set its display to 'none'
        setTimeout(() => {
            mainContent.style.display = 'none';
            document.body.style.overflow = 'hidden'; // Prevent scrolling on auth screen
            console.log("showAuthOverlay: Main content hidden, auth overlay visible.");
        }, 1000); // Matches main-content-wrapper's transition duration
    }

    // Auth state listener
    onAuthStateChanged(auth, (user) => {
        if (user) {
            console.log("User is signed in:", user.uid);
            showMainContent();
            // You can now fetch/save user-specific data using user.uid
            // Example: const userDocRef = doc(db, "artifacts", appId, "users", user.uid, "profile", "data");
        } else {
            console.log("No user is signed in.");
            showAuthOverlay(); // Use the new function
        }
        hideLoading(); // Hide loading after auth state is determined
    });

    // Initial Firebase sign-in (anonymous or custom token)
    // This should be called after the onAuthStateChanged listener is set up
    // to ensure the UI updates correctly based on the initial auth state.
    // The DOMContentLoaded listener ensures the DOM elements are ready.
    window.initializeFirebaseAuth(); // This function is defined in index.html script tag

    // --- Auth Form Logic ---
    authSwitchLink.addEventListener('click', (e) => {
        e.preventDefault();
        isLoginMode = !isLoginMode;
        authError.textContent = ''; // Clear previous errors

        if (isLoginMode) {
            authTitle.textContent = 'Welcome Back!';
            authSubtitle.textContent = 'Sign in to continue your health journey.';
            authSubmitButton.textContent = 'Login';
            authSwitchLink.textContent = 'Sign Up';
        } else {
            authTitle.textContent = 'Join FoodWise AI!';
            authSubtitle.textContent = 'Create an account to get started.';
            authSubmitButton.textContent = 'Sign Up';
            authSwitchLink.textContent = 'Login';
        }
    });

    authForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = authEmailInput.value;
        const password = authPasswordInput.value;
        authError.textContent = ''; // Clear previous errors
        showLoading();

        try {
            if (isLoginMode) {
                await signInWithEmailAndPassword(auth, email, password);
                console.log("User logged in successfully!");
            } else {
                await createUserWithEmailAndPassword(auth, email, password);
                console.log("User signed up successfully!");
                // Optionally, save initial user profile data to Firestore here
                const userId = auth.currentUser.uid;
                await setDoc(doc(db, "artifacts", appId, "users", userId, "profile", "data"), {
                    email: email,
                    createdAt: new Date().toISOString(),
                    // Add other default profile data
                });
            }
        } catch (error) {
            console.error("Authentication error:", error.code, error.message);
            switch (error.code) {
                case 'auth/invalid-email':
                    authError.textContent = 'Invalid email address format.';
                    break;
                case 'auth/user-disabled':
                    authError.textContent = 'Your account has been disabled.';
                    break;
                case 'auth/user-not-found':
                    authError.textContent = 'No user found with this email.';
                    break;
                case 'auth/wrong-password':
                    authError.textContent = 'Incorrect password.';
                    break;
                case 'auth/email-already-in-use':
                    authError.textContent = 'This email is already in use. Try logging in.';
                    break;
                case 'auth/weak-password':
                    authError.textContent = 'Password should be at least 6 characters.';
                    break;
                default:
                    authError.textContent = 'Authentication failed. Please try again.';
                    break;
            }
        } finally {
            hideLoading();
        }
    });

    // --- Mobile Navigation Toggle ---
    if (burger && nav && navLinks) {
        burger.addEventListener('click', () => {
            nav.classList.toggle('nav-active');

            navLinks.forEach((link, index) => {
                if (link.style.animation) {
                    link.style.animation = '';
                } else {
                    link.style.animation = navLinkFade 0.5s ease forwards ${index / 7 + 0.3}s;
                }
            });
            burger.classList.toggle('toggle');
        });

        // --- Close nav when a link is clicked ---
        navLinks.forEach(link => {
            link.addEventListener('click', () => {
                nav.classList.remove('nav-active');
                burger.classList.remove('toggle');
                navLinks.forEach(item => item.style.animation = ''); // Reset animation
            });
        });
    }


    // --- Smooth scrolling for navigation links ---
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            const targetElement = document.querySelector(targetId);

            if (targetElement) {
                targetElement.scrollIntoView({
                    behavior: 'smooth'
                });
            }
        });
    });

    // --- Hero CTA Button Scroll ---
    const heroCtaButton = document.querySelector('.hero-cta-button');
    if (heroCtaButton) {
        heroCtaButton.addEventListener('click', () => {
            const featuresSection = document.getElementById('features');
            if (featuresSection) {
                featuresSection.scrollIntoView({ behavior: 'smooth' });
            }
        });
    }


    // --- Feature Implementations ---

    // 1. BMI Calculator
    const calculateBmiButton = document.getElementById('calculateBmiButton');
    const weightInput = document.getElementById('weight');
    const heightInput = document.getElementById('height');
    const bmiResultDiv = document.getElementById('bmiResult');

    if (calculateBmiButton) {
        calculateBmiButton.addEventListener('click', () => {
            const weight = parseFloat(weightInput.value);
            const height = parseFloat(heightInput.value); // Height in cm

            bmiResultDiv.className = 'bmi-result'; // Reset class for styling

            if (isNaN(weight) || isNaN(height) || weight <= 0 || height <= 0) {
                bmiResultDiv.textContent = 'Please enter valid positive numbers for weight and height.';
                bmiResultDiv.classList.add('error');
                return;
            }

            // BMI calculation: weight (kg) / (height (m))^2
            const heightInMeters = height / 100;
            const bmi = weight / (heightInMeters * heightInMeters);
            const roundedBmi = bmi.toFixed(2);

            let category = '';
            if (bmi < 18.5) {
                category = 'Underweight';
                bmiResultDiv.classList.add('warning');
            } else if (bmi >= 18.5 && bmi < 24.9) {
                category = 'Normal weight';
                bmiResultDiv.classList.add('success');
            } else if (bmi >= 25 && bmi < 29.9) {
                category = 'Overweight';
                bmiResultDiv.classList.add('warning');
            } else {
                category = 'Obesity';
                bmiResultDiv.classList.add('error');
            }

            bmiResultDiv.textContent = Your BMI: ${roundedBmi} (${category});
        });
    }

    // 2. Recipe Finder (with dummy data and filtering)
    const recipeSearchInput = document.getElementById('recipeSearchInput');
    const dietaryFilter = document.getElementById('dietaryFilter');
    const allergenFilter = document.getElementById('allergenFilter');
    const searchRecipeButton = document.getElementById('searchRecipeButton');
    const recipeResultsGrid = document.getElementById('recipeResultsGrid');
    const loadMoreRecipesButton = document.getElementById('loadMoreRecipesButton');

    // Dummy Recipe Data (replace with API calls to your GenAI backend later)
    const allRecipes = [
        {
            id: 1,
            name: "Mediterranean Quinoa Salad",
            description: "A light and refreshing salad packed with protein and fresh vegetables.",
            image: "https://placehold.co/400x250/A7D9C6/333333?text=Quinoa+Salad",
            tags: ["Vegetarian", "Gluten-Free", "Healthy", "Lunch"],
            allergens: []
        },
        {
            id: 2,
            name: "Spicy Chicken Stir-fry",
            description: "Quick, flavorful, and loaded with vibrant veggies for a balanced meal.",
            image: "https://placehold.co/400x250/C8E6C9/333333?text=Chicken+Stir-fry",
            tags: ["Dinner", "Healthy", "High-Protein"],
            allergens: ["Soy"]
        },
        {
            id: 3,
            name: "Berry Almond Smoothie Bowl",
            description: "Start your day with this nutrient-dense and delicious breakfast bowl.",
            image: "https://placehold.co/400x250/DCE775/333333?text=Smoothie+Bowl",
            tags: ["Breakfast", "Vegan", "Gluten-Free", "Healthy"],
            allergens: ["Tree Nuts"]
        },
        {
            id: 4,
            name: "Hearty Lentil Soup",
            description: "A comforting and protein-rich soup, perfect for any season.",
            image: "https://placehold.co/400x250/FFAB91/333333?text=Lentil+Soup",
            tags: ["Vegan", "Gluten-Free", "Soup", "Healthy"],
            allergens: []
        },
        {
            id: 5,
            name: "Baked Salmon with Asparagus",
            description: "Simple yet elegant, a healthy meal bursting with omega-3s.",
            image: "https://placehold.co/400x250/B3E5FC/333333?text=Salmon+Asparagus",
            tags: ["Dinner", "Healthy", "Fish"],
            allergens: ["Fish"]
        },
        {
            id: 6,
            name: "Creamy Coconut Vegetable Curry",
            description: "A flavorful and wholesome plant-based meal for the whole family.",
            image: "https://placehold.co/400x250/FFCC80/333333?text=Veg+Curry",
            tags: ["Vegan", "Dinner", "Spicy"],
            allergens: []
        },
        {
            id: 7,
            name: "Healthy Breakfast Burrito",
            description: "Packed with eggs, beans, and veggies for a great start to your day.",
            image: "https://placehold.co/400x250/A7D9C6/333333?text=Breakfast+Burrito",
            tags: ["Breakfast", "Vegetarian"],
            allergens: ["Eggs"]
        },
        {
            id: 8,
            name: "Gourmet Avocado Toast",
            description: "Simple, yet satisfying and loaded with healthy fats.",
            image: "https://placehold.co/400x250/C8E6C9/333333?text=Avocado+Toast",
            tags: ["Breakfast", "Vegetarian", "Quick"],
            allergens: ["Wheat"]
        },
        {
            id: 9,
            name: "Light Chicken Salad Wraps",
            description: "Fresh and easy for a quick lunch or dinner.",
            image: "https://placehold.co/400x250/DCE775/333333?text=Chicken+Wraps",
            tags: ["Lunch", "High-Protein"],
            allergens: []
        },
        {
            id: 10,
            name: "Spinach and Feta Stuffed Chicken",
            description: "Juicy chicken breast stuffed with a flavorful spinach and feta mixture.",
            image: "https://placehold.co/400x250/FFAB91/333333?text=Stuffed+Chicken",
            tags: ["Dinner", "High-Protein"],
            allergens: ["Dairy"]
        },
        {
            id: 11,
            name: "Vegan Chickpea & Spinach Curry",
            description: "A rich and flavorful plant-based curry that's easy to make.",
            image: "https://placehold.co/400x250/B3E5FC/333333?text=Chickpea+Curry",
            tags: ["Vegan", "Dinner", "Quick"],
            allergens: []
        },
         {
            id: 12,
            name: "Grilled Portobello Mushroom Burgers",
            description: "A hearty and satisfying vegetarian burger alternative.",
            image: "https://placehold.co/400x250/FFCC80/333333?text=Mushroom+Burger",
            tags: ["Vegetarian", "Grill", "Lunch"],
            allergens: []
        },
         {
            id: 13,
            name: "Lemon Herb Roasted Chicken and Veggies",
            description: "A simple sheet pan dinner bursting with fresh flavors.",
            image: "https://placehold.co/400x250/A7D9C6/333333?text=Roasted+Chicken",
            tags: ["Dinner", "Healthy", "One-Pan"],
            allergens: []
        },
         {
            id: 14,
            name: "Sweet Potato and Black Bean Chili",
            description: "A warming and nutritious chili that's perfect for a crowd.",
            image: "https://placehold.co/400x250/C8E6C9/333333?text=Sweet+Potato+Chili",
            tags: ["Vegan", "Dinner", "Comfort Food"],
            allergens: []
        },
        {
            id: 15,
            name: "Quinoa Stuffed Bell Peppers",
            description: "Colorful bell peppers filled with nutritious quinoa and vegetables.",
            image: "https://placehold.co/400x250/DCE775/333333?text=Stuffed+Peppers",
            tags: ["Vegetarian", "Gluten-Free", "Dinner"],
            allergens: []
        },
        {
            id: 16,
            name: "Broccoli Cheddar Soup",
            description: "A creamy and comforting soup, packed with broccoli goodness.",
            image: "https://placehold.co/400x250/FFAB91/333333?text=Broccoli+Soup",
            tags: ["Vegetarian", "Soup"],
            allergens: ["Dairy"]
        },
        {
            id: 17,
            name: "Shrimp Scampi with Zucchini Noodles",
            description: "A light and flavorful seafood dish, low in carbs.",
            image: "https://placehold.co/400x250/B3E5FC/333333?text=Shrimp+Scampi",
            tags: ["Dinner", "Low-Carb", "Seafood"],
            allergens: ["Shellfish"]
        },
        {
            id: 18,
            name: "Overnight Oats with Chia Seeds",
            description: "Prepare this healthy breakfast the night before for a quick morning.",
            image: "https://placehold.co/400x250/FFCC80/333333?text=Overnight+Oats",
            tags: ["Breakfast", "Vegan", "Gluten-Free", "Quick"],
            allergens: []
        }
    ];

    let currentRecipeStartIndex = 0;
    const recipesPerPage = 6;
    let currentFilteredRecipes = [];

    function renderRecipes(recipesToDisplay) {
        recipeResultsGrid.innerHTML = '';
        if (recipesToDisplay.length === 0) {
            recipeResultsGrid.innerHTML = '<p class="placeholder-text">No recipes found matching your criteria.</p>';
            loadMoreRecipesButton.style.display = 'none';
            return;
        }

        const visibleRecipes = recipesToDisplay.slice(0, currentRecipeStartIndex + recipesPerPage);

        visibleRecipes.forEach(recipe => {
            const recipeCard = document.createElement('div');
            recipeCard.classList.add('recipe-card');
            recipeCard.innerHTML = `
                <img src="${recipe.image}" alt="${recipe.name}" onerror="this.onerror=null;this.src='https://placehold.co/400x250/cccccc/333333?text=Image+Not+Found';">
                <h3>${recipe.name}</h3>
                <p>${recipe.description}</p>
                <div class="recipe-tags">
                    ${recipe.tags.map(tag => <span class="tag">${tag}</span>).join('')}
                </div>
                ${recipe.allergens.length > 0 ? <div class="allergy-alert-tag"><i class="fas fa-exclamation-triangle"></i> Allergens: ${recipe.allergens.join(', ')}</div> : ''}
                <a href="#" class="view-recipe-button">View Recipe</a>
            `;
            recipeResultsGrid.appendChild(recipeCard);
        });

        if (currentRecipeStartIndex + recipesPerPage < recipesToDisplay.length) {
            loadMoreRecipesButton.style.display = 'block';
        } else {
            loadMoreRecipesButton.style.display = 'none';
        }
    }

    function filterAndSearchRecipes() {
        currentRecipeStartIndex = 0;
        const searchTerm = recipeSearchInput.value.toLowerCase();
        const selectedDiet = dietaryFilter.value;
        const selectedAllergen = allergenFilter.value;

        currentFilteredRecipes = allRecipes.filter(recipe => {
            const matchesSearch = recipe.name.toLowerCase().includes(searchTerm) ||
                                  recipe.description.toLowerCase().includes(searchTerm) ||
                                  recipe.tags.some(tag => tag.toLowerCase().includes(searchTerm));

            const matchesDiet = selectedDiet === "" || recipe.tags.includes(selectedDiet);

            const hasSelectedAllergen = selectedAllergen !== "" && recipe.allergens.includes(selectedAllergen);
            const matchesAllergen = selectedAllergen === "" || !hasSelectedAllergen;

            return matchesSearch && matchesDiet && matchesAllergen;
        });

        renderRecipes(currentFilteredRecipes);
    }

    if (searchRecipeButton) {
        searchRecipeButton.addEventListener('click', filterAndSearchRecipes);
        recipeSearchInput.addEventListener('keyup', (event) => {
            if (event.key === 'Enter') {
                filterAndSearchRecipes();
            }
        });
        dietaryFilter.addEventListener('change', filterAndSearchRecipes);
        allergenFilter.addEventListener('change', filterAndSearchRecipes);
    }

    if (loadMoreRecipesButton) {
        loadMoreRecipesButton.addEventListener('click', () => {
            currentRecipeStartIndex += recipesPerPage;
            renderRecipes(currentFilteredRecipes);
        });
    }

    filterAndSearchRecipes();


    // 3. Meal Planning (Simulated GenAI Response)
    const generateMealPlanButton = document.querySelector('.generate-meal-plan-button');
    const mealDietaryPreference = document.getElementById('mealDietaryPreference');
    const mealGender = document.getElementById('mealGender');
    const mealActivityLevel = document.getElementById('mealActivityLevel');
    const mealAdditionalGoals = document.getElementById('mealAdditionalGoals');
    const mealPlanOutputDiv = document.getElementById('mealPlanOutput');

    if (generateMealPlanButton) {
        generateMealPlanButton.addEventListener('click', async () => {
            const dietaryPref = mealDietaryPreference.value;
            const gender = mealGender.value;
            const activityLevel = mealActivityLevel.value;
            const additionalGoals = mealAdditionalGoals.value.trim();

            mealPlanOutputDiv.innerHTML = '<p class="placeholder-text">Generating your personalized meal plan...</p>';
            showLoading();

            // In a real app, you'd send these to your GenAI backend
            // const payload = { dietaryPref, gender, activityLevel, additionalGoals };
            // const response = await fetch('/api/generate-meal-plan', { /* ... */ });
            // const data = await response.json();
            // mealPlanOutputDiv.innerHTML = <pre>${data.mealPlan}</pre>;

            setTimeout(() => {
                let dummyMealPlan = `
Based on your preferences:
* *Dietary Preference:* ${dietaryPref}
* *Gender:* ${gender}
* *Activity Level:* ${activityLevel}
`;
                if (additionalGoals) {
                    dummyMealPlan += * **Additional Goals:** ${additionalGoals}\n;
                }

                dummyMealPlan += `
Here's a sample 3-day meal plan tailored for you:

*Day 1: Balanced & Energizing*
* *Breakfast:* Oatmeal with berries, chia seeds, and a scoop of ${dietaryPref === 'Vegan' ? 'plant-based protein' : 'whey protein'}.
* *Lunch:* Large salad with mixed greens, chickpeas, cucumber, tomato, and a light vinaigrette. Add grilled chicken/tofu if not vegetarian.
* *Dinner:* Baked sweet potato with black beans, corn, and avocado.

*Day 2: Lean & Green*
* *Breakfast:* Smoothie with spinach, banana, ${dietaryPref === 'Dairy-Free' ? 'almond milk' : 'Greek yogurt'}, and a touch of honey.
* *Lunch:* Lentil soup (as seen in our recipes!) with a side of whole-grain crackers.
* *Dinner:* Stir-fry with your choice of lean protein (chicken, shrimp, or tempeh) and plenty of colorful vegetables.

*Day 3: Comfort & Nutrients*
* *Breakfast:* Scrambled eggs (or tofu scramble for vegan) with sautéed mushrooms and whole-wheat toast.
* *Lunch:* Leftover stir-fry or a hearty vegetable wrap.
* *Dinner:* Homemade turkey/veg chili with a sprinkle of cheese (optional, based on dairy preference).

*Shopping List Highlights:*
* Produce: Berries, Spinach, Bananas, Sweet Potatoes, Bell Peppers, Broccoli, Carrots, Cucumbers, Tomatoes, Avocado, Mushrooms, Onions, Garlic.
* Proteins: Oats, Chia Seeds, ${dietaryPref === 'Vegan' ? 'Plant-based protein powder, Tofu, Tempeh, Lentils, Black Beans' : 'Whey Protein, Chicken Breast, Shrimp, Eggs, Greek Yogurt, Turkey'}.
* Pantry: Olive Oil, Honey, Whole-grain crackers/bread, Spices, Canned tomatoes.

Remember to adjust portion sizes to your specific calorie needs and always consult with a healthcare professional for personalized dietary advice.
                `;
                mealPlanOutputDiv.innerHTML = <pre>${dummyMealPlan}</pre>;
                hideLoading();
            }, 2000);
        });
    }

    // 4. Healthy Food Swaps (Simulated GenAI Response)
    const getSwapSuggestionButton = document.getElementById('getSwapSuggestionButton');
    const swapItemSelect = document.getElementById('swapItemSelect');
    const genaiSwapOutputDiv = document.getElementById('genaiSwapOutput');

    if (getSwapSuggestionButton) {
        getSwapSuggestionButton.addEventListener('click', async () => {
            const selectedItem = swapItemSelect.value;
            genaiSwapOutputDiv.innerHTML = '<p class="placeholder-text">Searching for healthy swap suggestions...</p>';
            showLoading();

            if (!selectedItem) {
                genaiSwapOutputDiv.innerHTML = '<p class="placeholder-text error">Please select an item to get a swap suggestion.</p>';
                hideLoading();
                return;
            }

            // In a real app, you'd send this to your GenAI backend
            // const payload = { query: selectedItem };
            // const response = await fetch('/api/get-food-swap', { /* ... */ });
            // const data = await response.json();
            // genaiSwapOutputDiv.innerHTML = <pre>${data.swapSuggestion}</pre>;

            setTimeout(() => {
                let swapResult = '';
                switch (selectedItem) {
                    case 'White Rice':
                        swapResult = `For "White Rice," consider:
* *Quinoa:* Complete protein, high in fiber.
* *Brown Rice:* More fiber and nutrients than white rice.
* *Cauliflower Rice:* Low-carb, low-calorie veggie alternative.`;
                        break;
                    case 'Sugary Sodas':
                        swapResult = `For "Sugary Sodas," try:
* *Sparkling Water with Fruit:* Refreshing and sugar-free.
* *Unsweetened Iced Tea:* A flavorful, low-calorie option.
* *Kombucha:* Probiotic-rich fermented tea (check sugar content).`;
                        break;
                    case 'Mayonnaise':
                        swapResult = `For "Mayonnaise," swap with:
* *Avocado Mash:* Healthy fats, creamy texture.
* *Hummus:* Adds protein and fiber.
* *Greek Yogurt:* Lower fat, higher protein (for savory dishes).`;
                        break;
                    case 'Sour Cream':
                        swapResult = `For "Sour Cream," opt for:
* *Greek Yogurt:* High in protein, lower in fat.
* *Cashew Cream:* Dairy-free, creamy alternative.`;
                        break;
                    case 'White Bread':
                        swapResult = `For "White Bread," choose:
* *Whole Wheat Bread:* More fiber and nutrients.
* *Lettuce Wraps:* Low-carb, crunchy alternative.
* *Ezekiel Bread:* Sprouted grain bread, highly nutritious.`;
                        break;
                    case 'Potato Chips':
                        swapResult = `For "Potato Chips," snack on:
* *Air-popped Popcorn:* Whole grain, good source of fiber.
* *Baked Kale Chips:* Crispy, nutritious, and easy to make.
* *Sliced Cucumbers or Carrots with Hummus:* Crunchy and packed with nutrients.`;
                        break;
                    case 'Processed Snacks':
                        swapResult = `Instead of "Processed Snacks," go for:
* *Fresh Fruit:* Natural sweetness, vitamins, fiber.
* *A Handful of Nuts/Seeds:* Healthy fats, protein.
* *Vegetable Sticks with Hummus:* Crunchy and nutritious.`;
                        break;
                    case 'Fried Chicken':
                        swapResult = `Instead of "Fried Chicken," try:
* *Grilled Chicken:* Significantly lower in fat and calories.
* *Baked Chicken:* Another healthier cooking method.
* *Air-Fried Chicken:* Can give a crispy texture with less oil.`;
                        break;
                    case 'Milk Chocolate':
                        swapResult = `For "Milk Chocolate," consider:
* *Dark Chocolate (70%+ cacao):* Lower sugar, more antioxidants.
* *Cacao Nibs:* Pure chocolate flavor, no added sugar.
* *Fruit:* Satisfy sweet cravings naturally.`;
                        break;
                    case 'Sugar':
                        swapResult = `For "Sugar" in recipes, try:
* *Stevia or Erythritol:* Natural, zero-calorie sweeteners.
* *Maple Syrup or Honey:* Natural sweeteners (use in moderation).
* *Mashed Banana or Applesauce:* Can replace sugar and add moisture in baking.`;
                        break;
                    case 'Butter':
                        swapResult = `For "Butter" in cooking/baking:
* *Avocado (mashed):* Healthy fats, good for baking.
* *Applesauce:* A fat replacer in baking, adds moisture.
* *Olive Oil:* Great for savory dishes, but changes flavor in baking.`;
                        break;
                    case 'Cream Cheese':
                        swapResult = `For "Cream Cheese," try:
* *Greek Yogurt (strained):* Similar tang and creaminess, higher protein.
* *Cashew Cream:* Dairy-free, great for dips and spreads.
* *Ricotta Cheese (light):* Lower fat, still creamy.`;
                        break;
                    case 'Ground Beef':
                        swapResult = `For "Ground Beef," opt for:
* *Lean Ground Turkey/Chicken:* Lower in saturated fat.
* *Lentils or Mushrooms:* Excellent plant-based alternatives for texture and protein.`;
                        break;
                    default:
                        swapResult = Please select an item from the dropdown to get a healthy swap suggestion.;
                }
                genaiSwapOutputDiv.innerHTML = <pre>${swapResult}</pre>;
                hideLoading();
            }, 1500);
        });
    }
});