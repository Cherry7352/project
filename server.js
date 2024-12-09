const express = require('express');
const bodyParser = require('body-parser');
const mysql = require('mysql2');
const axios = require('axios');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = 3000; // Unified port for all APIs

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));

// Database connection
const db = mysql.createConnection(process.env.MYSQL_URL);

db.connect(err => {
    if (err) throw err;
    console.log('Connected to the database.');
});

app.use(express.static('public'));  // Ensure 'public' folder has your HTML, CSS, etc.

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Predefined chatbot responses
const quickResponses = {
    "what is your name?": "I am an Animal Facts Chatbot!",
    "who are you?": "I am an Animal Facts Chatbot!",
    "who are you": "I am an Animal Facts Chatbot!",
    "how are you?": "I'm just a chatbot, but thanks for asking! 😊",
    "what is the largest animal?": "The blue whale is the largest animal on Earth.",
    "tell me an animal fact": "Did you know that octopuses have three hearts and blue blood?",
    "who is the king of the jungle?": "The lion is often called the king of the jungle.",
    "what is the fastest animal?": "The cheetah is the fastest land animal, capable of running up to 60-70 mph.",
    "hello": "Hi there! How’s it going? Want to learn something cool about animals today?",
    "yes": "Well then, ask me a question about animals thats bothering you.",
    "how are you?": "I’m doing great, thanks for asking! Ready to explore the animal kingdom with me?",
    "tell me something interesting about animals": "Sure! Did you know that octopuses have three hearts? One pumps blood to the body, while the other two pump it to the gills.",
    "whats your favorite animal?": "I think I’d go with the dolphin—so smart and playful! What’s your favorite animal?",
    "what animal can live the longest?": "The Greenland shark! Some of them can live up to 400 years! That's a seriously long life!",
    "do you like animals?": "Of course! I love talking about them. There’s so much to learn. Do you have a favorite animal?",
    "whats your name?": "I’m your friendly animal facts bot! Ready to share some amazing animal trivia!",
    "can you tell me about elephants?": "Elephants are amazing creatures! They’re the largest land mammals and have incredible memories. Did you know they can recognize themselves in mirrors?",
    "where do you live?": "I live in the digital world, always ready to chat about animals! Do you want to know more about an animal today?",
    "goodbye": "Goodbye! It was fun chatting with you. Come back anytime for more animal facts!",
    "how are you": "I’m doing great, thanks for asking! Ready to explore the animal kingdom with me",
    "tell me something interesting about animals": "Sure! Did you know that octopuses have three hearts? One pumps blood to the body, while the other two pump it to the gills.",
    "what’s your favorite animal": "I think I’d go with the dolphin—so smart and playful! What’s your favorite animal",
    "what animal can live the longest": "The Greenland shark! Some of them can live up to 400 years! That's a seriously long life",
    "do you like animals": "Of course! I love talking about them. There’s so much to learn. Do you have a favorite animal",
    "what’s your name": "I’m your friendly animal facts bot! Ready to share some amazing animal trivia!",
    "can you tell me about elephants": "Elephants are amazing creatures! They’re the largest land mammals and have incredible memories. Did you know they can recognize themselves in mirrors",
    "where do you live": "I live in the digital world, always ready to chat about animals! Do you want to know more about an animal today",
    "goodbye": "Goodbye! It was fun chatting with you. Come back anytime for more animal facts"
};

// Chatbot API route
app.post('/chat', async (req, res) => {
    const userMessage = req.body.message;

    // Validate user message
    if (!userMessage || typeof userMessage !== 'string') {
        res.status(400).json({ reply: 'Invalid input message.' });
        return;
    }

    // Check predefined responses
    if (quickResponses[userMessage.toLowerCase()]) {
        res.json({ reply: quickResponses[userMessage.toLowerCase()] });
        return;
    }

    // Fetch FAQ data from the database
    db.query('SELECT * FROM faq', async (err, results) => {
        if (err) {
            console.error('Error fetching data from database:', err);
            res.status(500).json({ reply: 'Something went wrong!' });
            return;
        }

        if (!results || results.length === 0) {
            res.status(404).json({ reply: 'No FAQ data available.' });
            return;
        }

        // Fetch embedding for user message
        const userEmbedding = await getEmbedding(userMessage.toLowerCase());
        if (!userEmbedding) {
            res.json({ reply: "I'm sorry, I couldn't understand that." });
            return;
        }

        let bestMatch = null;
        let highestSimilarity = -1;

        for (const row of results) {
            try {
                // Fetch embedding for each question in the FAQ
                const questionEmbedding = await getEmbedding(row.question.toLowerCase());
                if (!questionEmbedding) continue;

                const similarity = cosineSimilarity(userEmbedding, questionEmbedding);
                if (similarity > highestSimilarity) {
                    highestSimilarity = similarity;
                    bestMatch = row;
                }
            } catch (error) {
                console.error('Error calculating similarity:', error);
            }
        }

        if (bestMatch && highestSimilarity > 0.7) {
            res.json({ reply: bestMatch.answer });
        } else {
            res.json({ reply: "I'm sorry, I don't understand. Can you ask something else?" });
        }
    });
});

// Cosine similarity function
function cosineSimilarity(vecA, vecB) {
    const dotProduct = vecA.reduce((sum, val, idx) => sum + (val * vecB[idx]), 0);
    const magnitudeA = Math.sqrt(vecA.reduce((sum, val) => sum + (val * val), 0));
    const magnitudeB = Math.sqrt(vecB.reduce((sum, val) => sum + (val * val), 0));
    return dotProduct / (magnitudeA * magnitudeB);
}

// Fetch embedding from Python server
async function getEmbedding(sentence) {
    try {
        const response = await axios.post('python-backend-production-b950.up.railway.app/embed', { sentence });
        return response.data.embedding;
    } catch (error) {
        console.error('Error getting embedding from Python server:', error);
        return null;
    }
}


app.get('/api/random-fact', (req, res) => {
    const query = `
        SELECT a.name, ai.image_path AS image, af.fact
        FROM animals a
        JOIN animal_images ai ON a.id = ai.animal_id
        JOIN animal_facts af ON a.id = af.animal_id
        ORDER BY RAND()
        LIMIT 1;
    `;

    db.query(query, (err, results) => {
        if (err) {
            console.error('Error fetching random fact:', err);
            return res.status(500).json({ error: 'Error fetching random fact', details: err.message });
        }
        if (results.length === 0) {
            return res.status(404).json({ error: 'No facts found' });
        }

        const randomFact = {
            name: results[0].name,
            image: results[0].image,
            fact: results[0].fact,
        };

        res.json(randomFact);
    });
});



app.get('/api/animals/paginated', (req, res) => {
    const offset = parseInt(req.query.offset) || 0;  // Default offset is 0
    const limit = parseInt(req.query.limit) || 6;   // Default limit is 6
    const type = req.query.type || 'all';            // Default type is 'all'

    // Modify the query based on the `type` parameter
    let query = `
        SELECT 
            a.id, 
            a.name, 
            a.description, 
            a.type, 
            GROUP_CONCAT(DISTINCT ai.image_path) AS images, 
            GROUP_CONCAT(DISTINCT af.fact SEPARATOR '|') AS facts
        FROM animals a
        LEFT JOIN animal_images ai ON a.id = ai.animal_id
        LEFT JOIN animal_facts af ON a.id = af.animal_id
    `;

    // Only filter by type if it's not 'all'
    if (type !== 'all') {
        query += ` WHERE a.type = ?`;
    }

    query += `
        GROUP BY a.id
        LIMIT ?, ?;
    `;

    const queryParams = type !== 'all' ? [type, offset, limit] : [offset, limit];

    db.query(query, queryParams, (err, results) => {
        if (err) {
            console.error('Error retrieving paginated animals:', err);
            return res.status(500).json({ error: 'Error retrieving paginated animals', details: err.message });
        }

        // Transform the results into a structured JSON response
        const animals = results.map(row => ({
            id: row.id,
            name: row.name,
            description: row.description,
            type: row.type,
            images: row.images ? row.images.split(',') : [],  // Split comma-separated image paths into an array
            facts: row.facts ? row.facts.split('|') : []      // Split pipe-separated facts into an array
        }));

        res.json(animals);
    });
});


app.get('/api/animals/:name', (req, res) => {
    const animalName = req.params.name;

    // Get animal details
    db.query('SELECT * FROM animals WHERE LOWER(REPLACE(name, " ", "")) = ?', 
  [animalName.toLowerCase().replace(/\s+/g, '')], (err, animalResults) => {
        if (err) return res.status(500).send('Error retrieving animal details');

        if (animalResults.length === 0) {
            return res.status(404).send('Animal not found');
        }

        const animal = animalResults[0]; // Assuming one result is returned

        // Get images related to the animal
        db.query('SELECT image_path FROM animal_images WHERE animal_id = ?', [animal.id], (err, imageResults) => {
            if (err) return res.status(500).send('Error retrieving animal images');

            // Get facts related to the animal
            db.query('SELECT fact FROM animal_facts WHERE animal_id = ?', [animal.id], (err, factResults) => {
                if (err) return res.status(500).send('Error retrieving animal facts');

                // Send combined response
                res.json({
                    name: animal.name,
                    description: animal.description,
                    facts: factResults.map(fact => fact.fact),
                    images: imageResults.map(image => image.image_path)
                });
            });
        });
    });
});




// Fetch animal data for the slider
app.get('/api/animals', (req, res) => {
    const query = `
        SELECT 
            a.id, 
            a.name, 
            GROUP_CONCAT(DISTINCT af.fact SEPARATOR '; ') AS facts, 
            GROUP_CONCAT(DISTINCT ai.image_path SEPARATOR ', ') AS images
        FROM animals a
        LEFT JOIN animal_facts af ON a.id = af.animal_id
        LEFT JOIN animal_images ai ON a.id = ai.animal_id
        GROUP BY a.id;
    `;

    db.query(query, (err, results) => {
        if (err) {
            console.error('Error retrieving animal data:', err); // Log error for debugging
            return res.status(500).json({ error: 'Error retrieving animal data', details: err.message });
        }
        res.json(results); // Send combined data as JSON
    });
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
