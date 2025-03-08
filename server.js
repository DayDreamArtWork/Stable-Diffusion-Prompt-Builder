// server.js - Complete implementation
import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';

const app = express();
const PORT = 3001;

// Middleware setup
app.use(cors({
  origin: '*', // Allow all origins for development
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));
app.use(express.json({ limit: '50mb' })); // Increased limit for large images

// Endpoint for text generation with Ollama
app.post('/api/generate', async (req, res) => {
  try {
    const { prompt, model, options = {} } = req.body;
    
    // Add language instruction and randomization instruction to the prompt
    const englishPrompt = `Please respond strictly in English and provide a DIFFERENT response each time even if the input is identical: ${prompt}`;
    
    console.log(`Text generation request - Model: ${model || 'llama2'}, Prompt length: ${englishPrompt.length} characters`);
    
    // Default options
    const defaultOptions = {
      temperature: 0.7, // Increased from 0.2 to 0.7 for more randomness
      system: "You are an AI that must only respond in English. Never use any other language. Always generate a different response, even if the input prompt is the same as before.",
      num_predict: 500
    };
    
    // Merge user options with defaults
    const mergedOptions = { ...defaultOptions, ...options };
    
    // Add a random seed to ensure different outputs
    mergedOptions.seed = Math.floor(Math.random() * 2147483647);
    
    // Log options
    console.log(`Options: temperature=${mergedOptions.temperature}, num_predict=${mergedOptions.num_predict || 'default'}, seed=${mergedOptions.seed}`);
    
    // Ollama API call
    const response = await fetch('http://localhost:11434/api/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: model || 'llama2', // Default model if not specified
        prompt: englishPrompt,
        stream: false,
        options: mergedOptions
      }),
    });

    // Error handling
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Ollama API error: ${response.status} ${response.statusText}`);
      console.error(`Detailed error: ${errorText}`);
      
      return res.status(response.status).json({ 
        error: `Error from Ollama API: ${response.status} ${response.statusText}`,
        details: errorText,
        suggestion: "Check if Ollama is running and the specified model is installed."
      });
    }

    // Processing successful response
    const data = await response.json();
    console.log(`Text generation complete - Response length: ${data.response?.length || 0} characters`);
    res.json(data);
  } catch (error) {
    console.error('Error calling Ollama API:', error);
    res.status(500).json({ 
      error: error.message, 
      suggestion: "Check if the Ollama server is running at http://localhost:11434."
    });
  }
});

// Endpoint for image analysis
app.post('/api/analyze-image', async (req, res) => {
  try {
    const { imageData, model } = req.body;
    
    // Log basic information
    console.log(`Image analysis request - Model: ${model || 'not specified'}`);
    console.log(`Image data length: ${imageData ? imageData.length : 'no image data'} characters`);
    
    // Data validation
    if (!imageData) {
      return res.status(400).json({ error: "Missing image data" });
    }
    
    if (!model) {
      return res.status(400).json({ error: "Missing model parameter" });
    }
    
    // Clean base64 image - remove "data:image/jpeg;base64," prefix
    const base64Image = imageData.replace(/^data:image\/\w+;base64,/, '');
    
    // Simple but effective English prompt
    const analysisPrompt = "Please respond strictly in English: Analyze this image in detail and suggest a Stable Diffusion prompt that would create a similar image. Use this format:\n\nComposition: [description]\nLighting: [description]\nColors: [description]\nStyle: [description]\n\nSuggested Prompt: [Stable Diffusion prompt]";
    
    console.log("Sending request to Ollama API with strict English instructions...");
    
    try {
      const response = await fetch('http://localhost:11434/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: model,
          prompt: analysisPrompt,
          images: [base64Image],
          stream: false,
          options: {
            temperature: 0.7, // Increased from 0.2 to 0.7 for more randomness
            system: "You are an AI that must only respond in English. Never use any other language.",
            seed: Math.floor(Math.random() * 2147483647) // Add random seed
          }
        }),
      });

      // Check response
      if (!response.ok) {
        console.error(`Ollama API error: ${response.status} ${response.statusText}`);
        const errorText = await response.text();
        console.error("Detailed error:", errorText);
        
        return res.status(response.status).json({ 
          error: `Ollama API returned an error: ${response.status} ${response.statusText}`, 
          details: errorText,
          suggestion: `Check if Ollama is running and the ${model} model is installed. If not, use 'ollama pull ${model}' command.`
        });
      }

      const data = await response.json();
      console.log("Successful Ollama response:", data.response.substring(0, 100) + "...");
      
      // Parse response with regex for the structured format
      const responseText = data.response || "";
      
      // Extract different parts from the response
      const compositionMatch = responseText.match(/Composition:?\s*(.*?)(?=Lighting:|Colors:|Style:|Suggested Prompt:|$)/is);
      const lightingMatch = responseText.match(/Lighting:?\s*(.*?)(?=Composition:|Colors:|Style:|Suggested Prompt:|$)/is);
      const colorsMatch = responseText.match(/Colors:?\s*(.*?)(?=Composition:|Lighting:|Style:|Suggested Prompt:|$)/is);
      const styleMatch = responseText.match(/Style:?\s*(.*?)(?=Composition:|Lighting:|Colors:|Suggested Prompt:|$)/is);
      const promptMatch = responseText.match(/Suggested Prompt:?\s*(.*?)(?=Composition:|Lighting:|Colors:|Style:|$)/is);
      
      // Build the result
      const analysisResult = {
        composition: compositionMatch ? compositionMatch[1].trim() : "Composition analysis not available",
        lighting: lightingMatch ? lightingMatch[1].trim() : "Lighting analysis not available",
        colors: colorsMatch ? colorsMatch[1].trim() : "Color analysis not available",
        style: styleMatch ? styleMatch[1].trim() : "Style analysis not available",
        suggestedPrompt: promptMatch ? promptMatch[1].trim() : responseText.trim()
      };
      
      console.log("Analysis result compiled and sent to client");
      res.json(analysisResult);
    } catch (error) {
      console.error('Error calling Ollama API:', error);
      res.status(500).json({ 
        error: error.message, 
        suggestion: `Check if Ollama is running at http://localhost:11434. Error: ${error.message}`
      });
    }
  } catch (error) {
    console.error('General error during image analysis:', error);
    res.status(500).json({ 
      error: error.message, 
      suggestion: "Make sure Ollama is running at http://localhost:11434 and the selected model is installed."
    });
  }
});

// Fetch models from Ollama API
app.get('/api/models', async (req, res) => {
  try {
    console.log("Fetching models from Ollama API...");
    const response = await fetch('http://localhost:11434/api/tags');
    
    if (!response.ok) {
      console.error(`Ollama API error fetching models: ${response.status}`);
      return res.status(response.status).json({ 
        error: `Error fetching models: ${response.status} ${response.statusText}`,
        suggestion: "Check if the Ollama server is running."
      });
    }
    
    const data = await response.json();
    console.log(`${data.models?.length || 0} models found`);
    
    // Check if llava or other multimodal model exists
    const hasLlava = data.models?.some(model => model.name.includes('llava'));
    if (!hasLlava) {
      console.log("WARNING: No llava model installed!");
    }
    
    res.json(data);
  } catch (error) {
    console.error('Error fetching models:', error);
    res.status(500).json({ 
      error: error.message,
      suggestion: "Check if the Ollama server is running at http://localhost:11434."
    });
  }
});

// Check Ollama availability
app.get('/api/ollama-status', async (req, res) => {
  try {
    console.log("Checking Ollama server status...");
    
    // Try to get information from Ollama API
    const response = await fetch('http://localhost:11434/api/tags');
    
    const status = {
      running: response.ok,
      statusCode: response.status,
      statusText: response.statusText
    };
    
    // Fetch models if Ollama is running
    if (response.ok) {
      try {
        const modelsData = await response.json();
        status.models = modelsData.models || [];
        status.hasLlava = modelsData.models?.some(model => model.name.includes('llava')) || false;
        
        // List models
        if (status.models.length > 0) {
          status.modelNames = status.models.map(model => model.name);
        }
      } catch (modelsError) {
        console.error("Error fetching models:", modelsError);
        status.modelsError = modelsError.message;
      }
    }
    
    res.json(status);
  } catch (error) {
    console.error('Error checking Ollama status:', error);
    res.json({ 
      running: false,
      error: error.message,
      suggestion: "Ollama server is not reachable. Check if Ollama is running."
    });
  }
});

// Start server
app.listen(PORT, async () => {
  console.log(`Server running at http://localhost:${PORT}`);
  
  // Check Ollama availability
  try {
    console.log("Checking Ollama availability...");
    const response = await fetch('http://localhost:11434/api/tags');
    
    if (response.ok) {
      console.log("Ollama server is available at http://localhost:11434.");
      
      // Fetch models
      try {
        const modelsData = await response.json();
        const models = modelsData.models || [];
        console.log(`Installed models (${models.length}):`);
        models.forEach(model => console.log(`- ${model.name}`));
        
        // Check for llava model
        const llavaModels = models.filter(model => model.name.includes('llava'));
        if (llavaModels.length === 0) {
          console.warn("WARNING: No llava model found!");
          console.warn("Image analysis function won't work without a llava model.");
          console.warn("Install the model with: ollama pull llava");
        } else {
          console.log(`Found llava models (${llavaModels.length}): ${llavaModels.map(m => m.name).join(', ')}`);
          console.log("Image analysis function is ready to use.");
        }
      } catch (modelsError) {
        console.error("Error fetching models:", modelsError);
      }
    } else {
      console.error(`Ollama server not available! Status: ${response.status} ${response.statusText}`);
    }
  } catch (error) {
    console.error("Error checking Ollama availability:", error.message);
    console.error("Check if Ollama is running at http://localhost:11434.");
  }
});