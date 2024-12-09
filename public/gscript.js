document.addEventListener('DOMContentLoaded', () => {
    const galleryContainer = document.getElementById('gallery-container');
    const loadMoreButton = document.getElementById('load-more');
    const animalModal = document.getElementById('animalModal');
    const modalSliderContainer = document.querySelector('.modal-slider-container');
    const modalAnimalName = document.getElementById('modalAnimalName');
    const modalAnimalDescription = document.getElementById('modalAnimalDescription');
    const modalAnimalFact = document.getElementById('modalAnimalFact');
    const closeModal = document.querySelector('.close-btn');
    const animalTypeSelect = document.getElementById('animal-type'); // The animal type dropdown

    let offset = 0;
    const limit = 6;
    let selectedAnimalType = 'all'; // Default value, 'all' means no filter

    // State variables for the modal slider
    let currentAnimalImages = [];
    let currentAnimalIndex = 0;

    // Function to fetch animals and render them in the gallery
    const fetchAnimals = async () => {
        try {
            // Append the selected animal type to the API call
            const response = await fetch(`/api/animals/paginated?offset=${offset}&limit=${limit}&type=${selectedAnimalType}`);
            if (!response.ok) throw new Error(`Failed to load data: ${response.statusText}`);

            const animals = await response.json();

            // If no animals are returned, hide the "Load More" button
            if (animals.length === 0) {
                loadMoreButton.style.display = 'none';
                return;
            }

            animals.forEach(animal => {
                const animalCard = document.createElement('div');
                animalCard.classList.add('animal-card');

                // Display a single image for each animal
                const img = document.createElement('img');
                img.src = animal.images[0]; // Set the first image as the animal's image
                img.alt = `${animal.name} image`;
                img.addEventListener('click', () => openModal(animal)); // Open modal on image click
                
                const tempImage = new Image();
                tempImage.src = img.src;
                tempImage.onload = () => {
                    const aspectRatio = tempImage.width / tempImage.height;

                    // Add appropriate class based on aspect ratio
                    if (aspectRatio > 1.5) {
                        animalCard.classList.add('wide');  // Wide image (landscape)
                    } else if (aspectRatio < 0.7) {
                        animalCard.classList.add('tall');  // Tall image (portrait)
                    } else if (aspectRatio >= 0.7 && aspectRatio <= 1.5) {
                        animalCard.classList.add('big');  // Square-ish or big image
                    }

                    // Add the image to the card
                    animalCard.appendChild(img);
                    galleryContainer.appendChild(animalCard);
                };
            });

            offset += limit;
        } catch (error) {
            console.error('Error fetching animals:', error);
        }
    };

    // Function to open the modal with the selected animal's data
    const openModal = (animal) => {
        // Populate modal text content
        modalAnimalName.textContent = animal.name.charAt(0).toUpperCase() + animal.name.slice(1);;
        modalAnimalDescription.textContent = animal.description;
        modalAnimalFact.textContent = animal.facts.join(",") || "No fun fact available"; // Default if no facts

        // Populate the image slider
        modalSliderContainer.innerHTML = ''; // Clear any existing images
        currentAnimalImages = animal.images; // Store the animal's images for navigation
        currentAnimalIndex = 0; // Start with the first image

        // Add images to the slider
        currentAnimalImages.forEach((image, index) => {
            const img = document.createElement('img');
            img.src = image;
            img.alt = `${animal.name} image ${index + 1}`;
            img.classList.add('modal-image');
            if (index !== 0) img.style.display = 'none'; // Show only the first image
            modalSliderContainer.appendChild(img);
        });

        // Show the modal
        animalModal.style.display = 'block';
    };

    // Function to close the modal
    const closeModalHandler = () => {
        animalModal.style.display = 'none';
    };

    // Function to update the displayed image in the slider
    const updateModalImage = () => {
        const images = modalSliderContainer.querySelectorAll('.modal-image');
        images.forEach((img, index) => {
            img.style.display = index === currentAnimalIndex ? 'block' : 'none';
        });
    };

    // Functions for slider navigation
    const prevModalImage = () => {
        // Move to the previous image, or cycle to the last image if at the beginning
        currentAnimalIndex = (currentAnimalIndex - 1 + currentAnimalImages.length) % currentAnimalImages.length;
        updateModalImage();
    };
    
    const nextModalImage = () => {
        // Move to the next image, or cycle to the first image if at the end
        currentAnimalIndex = (currentAnimalIndex + 1) % currentAnimalImages.length;
        updateModalImage();
    };
    

    // Event listeners for modal
    closeModal.addEventListener('click', closeModalHandler);
    window.addEventListener('click', (event) => {
        if (event.target === animalModal) closeModalHandler();
    });

    // Expose navigation functions globally (optional, depending on inline `onclick` attributes)
    window.prevModalImage = prevModalImage;
    window.nextModalImage = nextModalImage;

    // Event listener for the "Load More" button
    loadMoreButton.addEventListener('click', fetchAnimals);

    // Event listener for the animal type selection
    animalTypeSelect.addEventListener('change', (event) => {
        selectedAnimalType = event.target.value; // Get the selected type
        offset = 0; // Reset offset to load from the start
        galleryContainer.innerHTML = ''; // Clear the current gallery
        loadMoreButton.style.display = 'inline-block'; // Show the load more button again
        fetchAnimals(); // Fetch the selected type of animals
    });

    // Initial fetch when the page loads
    fetchAnimals();
});
