document.addEventListener('DOMContentLoaded', () => {
    const sliderContainer = document.querySelector('.animal-slider');

    // Fetch all animals for the slider
    fetch('/api/animals')
        .then(response => response.json())
        .then(data => {
            // Pre-create slide elements to avoid re-building them multiple times
            const slides = data.map(animal => {
                const slide = document.createElement('div');
                slide.classList.add('slide');

                // Split images and facts into arrays
                const images = animal.images.split(', ');
                const facts = animal.facts.split('; ');

                // Use the first image and fact to populate the slide
                slide.innerHTML = `
                    <img data-src="${images[0]}" alt="${animal.name}" class="animal-image" loading="lazy" />
                    <div class="animal-data">
                        <h1>Did you know?</h1>
                        <p>${facts[0]}</p>
                    </div>
                `;

                // Lazy load other images once the slide is in view
                slide.dataset.images = images.join(', ');
                slide.dataset.facts = facts.join('; ');

                return slide;
            });

            // Append all slides to the slider container in one go
            sliderContainer.append(...slides);

            // Set the initial slide index and mark first slide as visible
            let currentSlide = 0;
            updateSlider(currentSlide);
        })
        .catch(error => console.error('Error fetching animal data:', error));
});

// Slider controls (navigation)
let currentSlide = 0;
let autoSlideInterval;

function updateSlider(index) {
    const slider = document.querySelector('.animal-slider');
    const slides = document.querySelectorAll('.slide');
    slides.forEach((slide, i) => {
        slide.style.transform = `translateX(-${index * 100}%)`;  // Efficient transition on transform
        if (i === index) {
            const img = slide.querySelector('img');
            if (img && !img.src) {
                // Load other images only when the slide is active
                img.src = img.dataset.src;  // Load the actual image only when visible
            }
        }
    });
}

// Move to the next slide
function nextSlide() {
    const slides = document.querySelectorAll('.slide');
    currentSlide = (currentSlide + 1) % slides.length;
    updateSlider(currentSlide);
}

// Move to the previous slide
function prevSlide() {
    const slides = document.querySelectorAll('.slide');
    currentSlide = (currentSlide - 1 + slides.length) % slides.length;
    updateSlider(currentSlide);
}

// Auto-slide function
function startAutoSlide() {
    autoSlideInterval = setInterval(nextSlide, 8000);
}

// Stop auto-slide function
function stopAutoSlide() {
    clearInterval(autoSlideInterval);
}

// Lazy loading and smoother transitions with requestAnimationFrame
function smoothTransition() {
    requestAnimationFrame(() => {
        const slides = document.querySelectorAll('.slide');
        slides.forEach((slide, index) => {
            slide.style.transition = 'transform 0.5s ease-out';  // Smooth sliding animation
        });
    });
}

// Initialize the slider and start auto-sliding
startAutoSlide();

// Add event listeners for the navigation buttons
document.querySelector('#next').addEventListener('click', nextSlide);
document.querySelector('#prev').addEventListener('click', prevSlide);


function throttle(func, limit) {
    let lastFunc;
    let lastRan;
    return function () {
        const context = this;
        const args = arguments;
        if (!lastRan) {
            func.apply(context, args);
            lastRan = Date.now();
        } else {
            clearTimeout(lastFunc);
            lastFunc = setTimeout(function () {
                if (Date.now() - lastRan >= limit) {
                    func.apply(context, args);
                    lastRan = Date.now();
                }
            }, limit - (Date.now() - lastRan));
        }
    };
}

const optimizedNextSlide = throttle(nextSlide, 3000);

// Event listener for the search bar input
document.getElementById('searchButton').addEventListener('click', () => {
    const animalKey = document.getElementById('search-input').value.trim().toLowerCase();
    
    if (animalKey) {
        showModal(animalKey);
    } else {
        alert("Please enter an animal name.");
    }
});

function showModal(animalKey) {
    const modal = document.getElementById("animalModal");

    // Fetch animal data from your API
    fetch(`/api/animals/${animalKey}`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Animal not found in database');
            }
            return response.json();
        })
        .then(animal => {
            if (!animal) {
                alert("Animal not found!");
                return;
            }

            currentAnimal = animal; // Set the current animal data
            currentModalImage = 0; // Initialize the image index to 0

            // Update modal content with fetched data
            document.getElementById("modalAnimalName").textContent = animal.name.charAt(0).toUpperCase() + animal.name.slice(1);
            document.getElementById("modalAnimalDescription").textContent = animal.description;
            document.getElementById("modalAnimalFact").textContent = animal.facts.join(", ");

            // Generate image slider
            const modalSliderContainer = document.querySelector(".modal-slider-container");
            modalSliderContainer.innerHTML = animal.images
                .map(img => `<img class="modal-image" src="${img}" alt="${animal.name}">`)
                .join("");

            // Show the modal
            modal.style.display = "flex";
            document.body.style.overflow = "hidden"; // Disable background scrolling
            updateModalImageSlider(); // Update the slider with the first image
        })
        .catch(error => {
            console.error("Error fetching animal data:", error);
            alert("Error fetching animal data: " + error.message);
        });
}

function closeModal() {
    const modal = document.getElementById("animalModal");
    modal.style.display = "none";
    document.body.style.overflow = "auto"; // Enable background scroll
}

// Add event listener to close button
const closeButton = document.querySelector(".close-btn");
if (closeButton) {
    closeButton.addEventListener("click", closeModal);
}


function nextModalImage() {
    currentModalImage = (currentModalImage + 1) % currentAnimal.images.length;
    updateModalImageSlider();
}
function prevModalImage() {
    currentModalImage =
        (currentModalImage - 1 + currentAnimal.images.length) % currentAnimal.images.length;
    updateModalImageSlider();
}
function updateModalImageSlider() {
    const container = document.querySelector(".modal-slider-container");
    if (!container) {
        console.error("Modal slider container not found!");
        return;
    }

    // Update the slider to show the current image
    container.style.transform = `translateX(-${currentModalImage * 100}%)`;
}



function searchAnimal() {
    const input = document.getElementById("search-input").value.trim().replace(/\s+/g, '').toLowerCase();
    
    console.log("Searching for:", input); // Add this line for debugging
    
    if (!input) {
        alert("Please enter a valid animal name.");
        return; // Exit if the input is empty or invalid
    }

    showModal(input); // Trigger modal with the input animal
}

function searchAnimal1(name){
    showModal(name);
}


document.querySelector('.see-more a').addEventListener('click', (e) => {
    e.preventDefault();
    window.location.href = "gallery.html"; // Redirects to gallery.html
});

async function showRandomFact() {
    try {
        const response = await fetch('/api/random-fact');
        if (!response.ok) throw new Error('Failed to fetch random fact');
        
        const randomAnimal = await response.json();

        // Ensure image and fact are present in the response
        if (!randomAnimal.image || !randomAnimal.fact) {
            throw new Error('Incomplete data received');
        }

        // Get the fact container
        const factContainer = document.querySelector('.fact-container');

        // Clear any previous content
        factContainer.innerHTML = '';

        // Create and populate image element
        const animalImage = document.createElement('img');
        animalImage.src = randomAnimal.image;
        animalImage.alt = randomAnimal.name;

        // Create and populate text container
        let animalname = capitalizeFirstLetter(randomAnimal.name); // Capitalize the first letter

const factText = document.createElement('div');
factText.classList.add('fact-text');
factText.innerHTML = `<h3>${animalname}</h3><p>${randomAnimal.fact}</p>`;

// Function to capitalize the first letter
function capitalizeFirstLetter(string) {
    if (!string) return ''; // Handle empty or undefined values
    return string.charAt(0).toUpperCase() + string.slice(1).toLowerCase();
}

        // Append the image and text to the container
        factContainer.appendChild(animalImage);
        factContainer.appendChild(factText);
    } catch (error) {
        console.error('Error:', error.message);
    }
}

document.addEventListener("DOMContentLoaded", () => {
    // Chat Modal Elements
    const chatbotIcon = document.getElementById("chatbot-icon");
    const chatModal = document.getElementById("chatModal");
    const chatModalClose = document.getElementById("chatModalClose");
    const chatMessages = document.getElementById("chatMessages");
    const chatInput = document.getElementById("chatInput");
    const chatSendButton = document.getElementById("chatSendButton");

    // Open chat modal
    chatbotIcon.addEventListener("click", () => {
        chatModal.style.display = "block";

        // Apply blur to the background
        document.body.classList.add("modal-open");
    });

    // Close chat modal
    chatModalClose.addEventListener("click", () => {
        chatModal.style.display = "none";

        // Remove blur from the background
        document.body.classList.remove("modal-open");
    });

    // Add message to chat messages container
    const addMessageToChat = (message, sender) => {
        const messageElement = document.createElement("p");
        messageElement.textContent = message;
        messageElement.classList.add(sender); // Add class based on sender type
        chatMessages.appendChild(messageElement);

        // Auto-scroll to the bottom
        chatMessages.scrollTop = chatMessages.scrollHeight;
    };

    // Send message to backend and handle response
    const sendMessageToBackend = (message) => {
        const spinner = document.getElementById("loadingSpinner");
    spinner.style.display = "block"; // Show the spinner
        fetch("python-backend-production-b950.up.railway.app/chat", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ message }),
        })
            .then((response) => response.json())
            .then((data) => {
                if (data.reply) {
                    spinner.style.display = "none"; // Hide the spinner
                    // Add bot's response to chat
                    addMessageToChat(data.reply, "bot-message");
                } else {
                    spinner.style.display = "none"; // Hide the spinner even on error
                    addMessageToChat("Oops! I didn't get that. Try again.", "bot-message");
                }
            })
            .catch((error) => {
                console.error("Error:", error);
                spinner.style.display = "none";
                addMessageToChat("There was an error connecting to the server.", "bot-message");
            });
    };

    // Handle Send Button Click
    chatSendButton.addEventListener("click", () => {
        const userMessage = chatInput.value.trim();
        if (userMessage) {
            // Display user message in the chat
            addMessageToChat(userMessage, "user-message");

            // Clear input field
            chatInput.value = "";

            // Send the message to the backend
            sendMessageToBackend(userMessage);
        }
    });

    // Allow sending messages with "Enter" key
    chatInput.addEventListener("keypress", (event) => {
        if (event.key === "Enter") {
            chatSendButton.click();
        }
    });

    // Close modal when clicking outside the chat content
    window.addEventListener("click", (event) => {
        if (event.target === chatModal) {
            chatModalClose.click();
        }
    });
});



