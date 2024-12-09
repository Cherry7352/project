from flask import Flask, request, jsonify
from sentence_transformers import SentenceTransformer
import numpy as np

# Initialize the SentenceTransformer model
model = SentenceTransformer('all-MiniLM-L6-v2')  # You can use other pre-trained models

app = Flask(__name__)

@app.route('/embed', methods=['POST'])
def embed():
    try:
        # Extract the text from the request
        data = request.get_json()
        sentence = data.get('sentence', '')
        
        if sentence == '':
            return jsonify({'error': 'No sentence provided'}), 400
        
        # Generate the embedding for the sentence
        embedding = model.encode(sentence)
        # Return the embedding as a JSON response
        return jsonify({'embedding': embedding.tolist()})
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5001)
