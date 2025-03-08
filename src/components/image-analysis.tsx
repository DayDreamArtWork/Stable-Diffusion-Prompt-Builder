"use client";

import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { ScrollArea } from "./ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { useState, useEffect } from "react";
import { Upload, Image as ImageIcon, Wand2, Copy, RefreshCw, AlertTriangle, Check } from "lucide-react";
import { toast } from "sonner";

// Define types
interface AnalysisResult {
  composition: string;
  lighting: string;
  colors: string;
  style: string;
  suggestedPrompt: string;
}

// Export the ImageAnalysis component correctly
export function ImageAnalysis() {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoadingModels, setIsLoadingModels] = useState(false);
  const [availableModels, setAvailableModels] = useState<any[]>([]);
  const [selectedModel, setSelectedModel] = useState<string>("llava");
  const [ollamaStatus, setOllamaStatus] = useState<{running: boolean, hasLlava?: boolean} | null>(null);

  // Check Ollama status and fetch models when component loads
  useEffect(() => {
    checkOllamaStatus();
    fetchModels();
  }, []);

  // Check Ollama server status
  const checkOllamaStatus = async () => {
    try {
      setIsLoadingModels(true);
      const response = await fetch('http://localhost:3001/api/ollama-status');
      
      if (!response.ok) {
        throw new Error(`Server response error: ${response.status}`);
      }
      
      const status = await response.json();
      setOllamaStatus(status);
      
      if (!status.running) {
        setErrorMessage("Ollama server is not running. Start the server to use this feature.");
        toast.error("Ollama server not available");
      } else if (!status.hasLlava) {
        setErrorMessage("Ollama is running, but no llava model was found, which is required for image analysis.");
        toast.warning("Llava model not found");
      } else {
        setErrorMessage(null);
        toast.success("Ollama server and required models are available");
      }
    } catch (error) {
      console.error("Error checking Ollama status:", error);
      setErrorMessage(`Failed to connect to Ollama server: ${(error as Error).message}`);
      setOllamaStatus({ running: false });
      toast.error("Communication error with Ollama server");
    } finally {
      setIsLoadingModels(false);
    }
  };

  // Fetch models from server
  const fetchModels = async () => {
    try {
      setIsLoadingModels(true);
      const response = await fetch('http://localhost:3001/api/models');
      
      if (!response.ok) {
        throw new Error(`Server response error: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data && data.models) {
        // Process models, marking multimodal ones
        const models = data.models.map((model: any) => ({
          name: model.name,
          isMultimodal: model.name.includes('llava') || model.name.includes('baker') || model.name.includes('vision'),
          type: model.name.includes('llava') || model.name.includes('baker') || model.name.includes('vision') 
            ? 'multimodal' 
            : 'text'
        }));
        
        setAvailableModels(models);
        
        // If llava model exists, select it automatically
        const llavaModel = models.find((model: any) => model.name.includes('llava'));
        if (llavaModel) {
          setSelectedModel(llavaModel.name);
        }
      }
    } catch (error) {
      console.error("Error fetching models:", error);
      toast.error("Failed to fetch models");
    } finally {
      setIsLoadingModels(false);
    }
  };

  // Drag and drop handling
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      loadImageFile(file);
    } else {
      toast.error("Only image files can be analyzed");
    }
  };

  // File selection handling
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      loadImageFile(file);
    }
  };

  // Clipboard paste handling
  const handlePaste = (e: React.ClipboardEvent) => {
    const items = e.clipboardData.items;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.startsWith('image/')) {
        const file = items[i].getAsFile();
        if (file) {
          loadImageFile(file);
        }
      }
    }
  };

  // Load image file and convert to dataURL
  const loadImageFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        setSelectedImage(e.target.result as string);
        // Clear previous analysis result when loading a new image
        setAnalysisResult(null);
      }
    };
    reader.onerror = () => {
      toast.error("Failed to load image");
    };
    reader.readAsDataURL(file);
  };

  // Analyze image via Ollama API
  const analyzeImage = async () => {
    if (!selectedImage) {
      toast.error("Please upload an image for analysis!");
      return;
    }
    
    if (!selectedModel) {
      toast.error("Please select a model for analysis!");
      return;
    }
    
    setIsAnalyzing(true);
    setErrorMessage(null);
    
    try {
      // Send data to server
      const response = await fetch('http://localhost:3001/api/analyze-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          imageData: selectedImage,
          model: selectedModel,
        }),
      });
      
      // Error handling for non-2xx responses
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! Status: ${response.status}`);
      }
      
      // Process successful response
      const data = await response.json();
      setAnalysisResult(data);
      toast.success('Image analysis successful!');
    } catch (error) {
      console.error('Error analyzing image:', error);
      setErrorMessage(
        `An error occurred while analyzing the image: ${(error as Error).message}. ` +
        `Check if Ollama is running and the selected model (${selectedModel}) is installed.`
      );
      toast.error('Failed to analyze image.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Copy text to clipboard
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
      .then(() => toast.success("Text copied to clipboard!"))
      .catch(() => toast.error("Failed to copy text"));
  };

  // Actual component rendering
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* Image upload area */}
      <Card className="lg:col-span-2">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Upload Image for Analysis</CardTitle>
            <p className="text-sm text-muted-foreground">Drag and drop your image, paste from clipboard, or select a file</p>
          </div>
          <Button 
            variant="outline" 
            onClick={checkOllamaStatus}
            disabled={isLoadingModels}
          >
            {isLoadingModels ? (
              <RefreshCw className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            Check Ollama
          </Button>
        </CardHeader>
        <CardContent>
          {/* Ollama status indicator */}
          {ollamaStatus && (
            <div className={`mb-4 p-2 rounded-md flex items-center gap-2 ${
              ollamaStatus.running && ollamaStatus.hasLlava 
                ? 'bg-green-50 dark:bg-green-950 text-green-600 dark:text-green-400'
                : 'bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400'
            }`}>
              {ollamaStatus.running && ollamaStatus.hasLlava ? (
                <Check className="h-5 w-5" />
              ) : (
                <AlertTriangle className="h-5 w-5" />
              )}
              <span className="text-sm">
                {ollamaStatus.running 
                  ? ollamaStatus.hasLlava 
                    ? "Ollama server is running and required models are installed" 
                    : "Ollama server is running, but no llava model is installed"
                  : "Ollama server is not available"
                }
              </span>
            </div>
          )}

          {/* Image upload area */}
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              isDragging
                ? "border-primary bg-primary/10"
                : "border-muted-foreground/25"
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onPaste={handlePaste}
          >
            {selectedImage ? (
              <div className="space-y-4">
                <img
                  src={selectedImage}
                  alt="Uploaded image"
                  className="max-h-[400px] mx-auto rounded-lg"
                />
                <Button
                  variant="outline"
                  onClick={() => setSelectedImage(null)}
                >
                  Remove Image
                </Button>
              </div>
            ) : (
              <>
                <Upload className="mx-auto h-12 w-12 text-muted-foreground/50" />
                <p className="mt-2 text-sm text-muted-foreground">
                  Drag and drop your image here, paste from clipboard, or click to select
                </p>
                <Input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileSelect}
                  id="image-upload"
                />
                <Button
                  variant="secondary"
                  className="mt-4"
                  onClick={() => document.getElementById("image-upload")?.click()}
                >
                  Select Image
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Analysis area - only appears when an image is selected */}
      {selectedImage && (
        <>
          {/* Analysis settings panel */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Analysis Settings</CardTitle>
              <Button
                onClick={analyzeImage}
                disabled={isAnalyzing || !selectedModel}
              >
                <Wand2 className="mr-2 h-4 w-4" />
                {isAnalyzing ? "Analyzing..." : "Analyze Image"}
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Model selection */}
                <div className="space-y-2">
                  <label htmlFor="model-selector" className="text-sm font-medium">
                    Select Analysis Model
                  </label>
                  <Select
                    value={selectedModel}
                    onValueChange={setSelectedModel}
                    disabled={isLoadingModels || isAnalyzing}
                  >
                    <SelectTrigger id="model-selector">
                      <SelectValue placeholder="Choose a model" />
                    </SelectTrigger>
                    <SelectContent>
                      {isLoadingModels ? (
                        <SelectItem value="loading" disabled>
                          Loading models...
                        </SelectItem>
                      ) : availableModels.length > 0 ? (
                        availableModels.map((model) => (
                          <SelectItem 
                            key={model.name} 
                            value={model.name}
                            disabled={!model.isMultimodal}
                          >
                            {model.name} {model.isMultimodal ? '(supports image analysis)' : '(not suitable for image analysis)'}
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="none" disabled>
                          No models available
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>

                {/* Status and progress indicator */}
                <div className="flex items-center space-x-2">
                  <ImageIcon className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    {isAnalyzing 
                      ? "AI is analyzing the image..." 
                      : "Image is ready for analysis"
                    }
                  </span>
                </div>

                {/* Informational text */}
                <p className="text-sm text-muted-foreground">
                  Click the "Analyze Image" button to have the AI analyze your image. The analysis requires
                  that the Ollama server is running and a multimodal model (e.g., llava) is installed.
                </p>
                
                {/* Error message display, if any */}
                {errorMessage && (
                  <div className="bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 p-3 rounded-md flex items-start space-x-2">
                    <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                    <div className="text-sm text-amber-800 dark:text-amber-200">
                      {errorMessage}
                    </div>
                  </div>
                )}
                
                {/* Troubleshooting tips */}
                <div className="border border-border p-3 rounded-md">
                  <h4 className="text-sm font-medium mb-2">Troubleshooting Tips:</h4>
                  <ol className="text-sm text-muted-foreground space-y-2 pl-5 list-decimal">
                    <li>Make sure Ollama is running, in the terminal run: <code className="px-1 py-0.5 bg-muted rounded">ollama list</code></li>
                    <li>If llava is not installed, in the terminal run: <code className="px-1 py-0.5 bg-muted rounded">ollama pull llava</code></li>
                    <li>Check that the appropriate model is selected in the dropdown (a multimodal model like llava is required)</li>
                    <li>If you continue to have issues, check the browser developer tools (F12) for detailed error messages</li>
                  </ol>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Analysis results - only appears when there are results */}
          {analysisResult && (
            <Card>
              <CardHeader>
                <CardTitle>Analysis Results</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[400px] pr-4">
                  <div className="space-y-6">
                    <div>
                      <h3 className="font-semibold mb-2">Composition</h3>
                      <p className="text-sm text-muted-foreground">
                        {analysisResult.composition}
                      </p>
                    </div>
                    <div>
                      <h3 className="font-semibold mb-2">Lighting</h3>
                      <p className="text-sm text-muted-foreground">
                        {analysisResult.lighting}
                      </p>
                    </div>
                    <div>
                      <h3 className="font-semibold mb-2">Colors</h3>
                      <p className="text-sm text-muted-foreground">
                        {analysisResult.colors}
                      </p>
                    </div>
                    <div>
                      <h3 className="font-semibold mb-2">Style</h3>
                      <p className="text-sm text-muted-foreground">
                        {analysisResult.style}
                      </p>
                    </div>
                    <div>
                      <h3 className="font-semibold mb-2">Suggested Prompt</h3>
                      <div className="flex items-center space-x-2">
                        <p className="text-sm text-muted-foreground flex-1">
                          {analysisResult.suggestedPrompt}
                        </p>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => copyToClipboard(analysisResult.suggestedPrompt)}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}