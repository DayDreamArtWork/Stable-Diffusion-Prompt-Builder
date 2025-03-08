# Stable Diffusion Prompt Builder

A powerful tool designed to help create, manage, and optimize prompts for Stable Diffusion image generation. This application provides an intuitive interface for building structured prompts, analyzing images, and saving your favorite prompt combinations.

[Stable Diffusion Prompt Builder] ![image](https://github.com/user-attachments/assets/8c78a7dc-14af-455d-a267-a54c0f10b96b)

## Features

- **Prompt Builder**: Create structured prompts with categorized elements
- **Image Analysis**: Upload images and analyze them to extract prompt suggestions
- **Batch Analysis**: Process multiple images at once
- **Prompt Mixer**: Combine and refine multiple prompts with AI assistance
- **Style Library**: Access a collection of pre-defined art styles
- **Easy Saving & Management**: Save, organize, and reuse your favorite prompts
- **AI-Powered Suggestions**: Generate prompt content using local LLMs via Ollama

## Requirements

- **Node.js**: v14.0.0 or higher
- **Ollama** (optional but recommended): For AI-powered features

## Quick Start

1. Clone this repository:
   ```bash
   git clone https://github.com/yourusername/sd-prompt-builder.git
   cd sd-prompt-builder
   ```

2. Run the start script:
   ```bash
   start.bat   # On Windows
   ./start.sh  # On Linux/Mac (make it executable first with: chmod +x start.sh)
   ```

   The script will:
   - Check and install required dependencies
   - Verify Ollama installation (if available)
   - Pull necessary models for Ollama (if needed)
   - Start both backend and frontend servers
   - Open the application in your default browser

## Manual Setup

If you prefer to set up manually:

1. Install dependencies:
   ```bash
   npm install
   ```

2. Install Ollama (optional):
   Download from [ollama.ai](https://ollama.ai/download)

3. Pull required models for Ollama:
   ```bash
   ollama pull llama2  # For text generation
   ollama pull llava   # For image analysis (optional)
   ```

4. Start the backend server:
   ```bash
   node server.js
   ```

5. Start the frontend development server:
   ```bash
   npm run dev
   ```

6. Open your browser and navigate to:
   ```
   http://localhost:5173
   ```

## Using the Application

### Prompt Builder

The Prompt Builder provides a structured way to create prompts for Stable Diffusion. It includes several categories:

- Main Subject
- Style
- Quality Enhancers
- Composition
- Lighting
- Color Palette
- Environment/Background
- Mood/Atmosphere

Each category can be toggled on/off and can be populated manually or with AI assistance.

### Image Analysis

Upload an image to analyze it and generate a prompt that would create a similar image. This feature requires Ollama with the llava model installed.

### Prompt Mixer

Select multiple saved prompts or add custom text to mix them together with AI assistance. This creates new, refined prompts combining elements from the sources.

### Saved Prompts

All your saved prompts are stored locally in your browser. You can:
- Search through your saved prompts
- Edit existing prompts
- Delete prompts you no longer need
- Export your collection as a JSON file
- Import prompts from a JSON file

## Configuration

Advanced configuration can be modified in:
- `src/lib/constants.ts`: Default categories, token limits, etc.
- `server.js`: Server configuration, AI model parameters

## Troubleshooting

### AI Features Not Working

1. Ensure Ollama is installed and running:
   ```bash
   ollama list
   ```

2. Check if required models are installed:
   ```bash
   ollama list
   ```
   You should see `llama2` and ideally `llava` in the list.

3. Verify the backend server is running:
   ```bash
   curl http://localhost:3001/api/ollama-status
   ```

### Application Won't Start

1. Check Node.js version:
   ```bash
   node -v
   ```
   It should be v14.0.0 or higher.

2. Verify all dependencies are installed:
   ```bash
   npm install
   ```

3. Check for errors in the console or browser developer tools.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

[MIT License](LICENSE)

## Acknowledgements

- Built with React, Express, and Ollama
- UI components from shadcn/ui
- Icons from Lucide

---

Created by [DayDream A.I ArtWorks]
