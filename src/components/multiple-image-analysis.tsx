"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState, useEffect } from "react";
import { Upload, Image as ImageIcon, Wand2, Copy, RefreshCw, Check, Trash } from "lucide-react";
import { toast } from "sonner";

// Simple image with analysis type without using uuid
interface ImageWithAnalysis {
  id: number; // Use simple numeric IDs instead of uuid
  imageData: string;
  analysis: AnalysisResult | null;
  isAnalyzing: boolean;
  error?: string;
}

// Analysis result interface
interface AnalysisResult {
  composition: string;
  lighting: string;
  colors: string;
  style: string;
  suggestedPrompt: string;
}

export function MultipleImageAnalysis() {
  // State for images and analysis results
  const [images, setImages] = useState<ImageWithAnalysis[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoadingModels, setIsLoadingModels] = useState(false);
  const [availableModels, setAvailableModels] = useState<any[]>([]);
  const [selectedModel, setSelectedModel] = useState<string>("llava");
  const [enableMultipleImages, setEnableMultipleImages] = useState(false);
  const [mixedPrompt, setMixedPrompt] = useState<AnalysisResult | null>(null);
  const [activeTab, setActiveTab] = useState("upload");

  // Calculate remaining upload slots
  const remainingUploadSlots = 6 - images.length;

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

    // Check if multiple image upload is enabled or if this is the first image
    if (!enableMultipleImages && images.length > 0) {
      toast.error("Multiple image upload is disabled. Enable it to add more images.");
      return;
    }

    // Check if we've reached the maximum number of images
    if (images.length >= 6) {
      toast.error("Maximum of 6 images reached. Remove some images before adding more.");
      return;
    }

    const files = Array.from(e.dataTransfer.files).filter(file => file.type.startsWith('image/'));
    
    // Check if adding these files would exceed the limit
    if (files.length > remainingUploadSlots) {
      toast.warning(`You can only add ${remainingUploadSlots} more image(s). Only the first ${remainingUploadSlots} will be processed.`);
    }
    
    // Process up to the remaining slots
    const filesToProcess = files.slice(0, remainingUploadSlots);
    
    filesToProcess.forEach(file => {
      loadImageFile(file);
    });
  };

  // File selection handling
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return;
    
    // Check if multiple image upload is enabled or if this is the first image
    if (!enableMultipleImages && images.length > 0) {
      toast.error("Multiple image upload is disabled. Enable it to add more images.");
      return;
    }

    // Check if we've reached the maximum number of images
    if (images.length >= 6) {
      toast.error("Maximum of 6 images reached. Remove some images before adding more.");
      return;
    }

    const files = Array.from(e.target.files).filter(file => file.type.startsWith('image/'));
    
    // Check if adding these files would exceed the limit
    if (files.length > remainingUploadSlots) {
      toast.warning(`You can only add ${remainingUploadSlots} more image(s). Only the first ${remainingUploadSlots} will be processed.`);
    }
    
    // Process up to the remaining slots
    const filesToProcess = files.slice(0, remainingUploadSlots);
    
    filesToProcess.forEach(file => {
      loadImageFile(file);
    });
  };

  // Load image file and convert to dataURL
  const loadImageFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        const newImage: ImageWithAnalysis = {
          id: Date.now() + Math.floor(Math.random() * 1000), // Simple unique ID based on timestamp
          imageData: e.target.result as string,
          analysis: null,
          isAnalyzing: false
        };
        
        setImages(prev => [...prev, newImage]);
        
        // If this is the first image, switch to results tab
        if (images.length === 0) {
          setActiveTab("results");
        }
      }
    };
    reader.onerror = () => {
      toast.error("Failed to load image");
    };
    reader.readAsDataURL(file);
  };

  // Remove an image
  const removeImage = (id: number) => {
    setImages(prev => prev.filter(img => img.id !== id));
    
    // Reset mixed prompt if an image is removed
    setMixedPrompt(null);
    
    // If all images are removed, switch back to upload tab
    if (images.length === 1) { // We're checking current length, so if it's 1, it will be 0 after removal
      setActiveTab("upload");
    }
  };

  // Analyze a single image
  const analyzeImage = async (imageId: number) => {
    const imageToAnalyze = images.find(img => img.id === imageId);
    if (!imageToAnalyze) return;
    
    // Update image state to show it's being analyzed
    setImages(prev => prev.map(img => 
      img.id === imageId ? { ...img, isAnalyzing: true, error: undefined } : img
    ));
    
    try {
      // Send data to server
      const response = await fetch('http://localhost:3001/api/analyze-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          imageData: imageToAnalyze.imageData,
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
      
      // Update the image with analysis results
      setImages(prev => prev.map(img => 
        img.id === imageId ? { ...img, analysis: data, isAnalyzing: false } : img
      ));
      
      toast.success('Image analyzed successfully!');
    } catch (error) {
      console.error('Error analyzing image:', error);
      
      // Update the image with error information
      setImages(prev => prev.map(img => 
        img.id === imageId ? { 
          ...img, 
          isAnalyzing: false,
          error: `Analysis failed: ${(error as Error).message}`
        } : img
      ));
      
      toast.error('Failed to analyze image.');
    }
  };

  // Analyze all images that haven't been analyzed yet
  const analyzeAllImages = async () => {
    // Check if there are any images to analyze
    if (images.length === 0) {
      toast.error("No images to analyze");
      return;
    }
    
    // Set the overall analyzing state
    setIsAnalyzing(true);
    
    try {
      // Find images that haven't been analyzed yet
      const unanalyzedImages = images.filter(img => !img.analysis && !img.isAnalyzing);
      
      if (unanalyzedImages.length === 0) {
        toast.info("All images have already been analyzed");
        setIsAnalyzing(false);
        return;
      }
      
      // Analyze each unanalyzed image sequentially
      for (const image of unanalyzedImages) {
        await analyzeImage(image.id);
      }
      
      toast.success(`Analyzed ${unanalyzedImages.length} image(s)`);
    } catch (error) {
      console.error("Error during batch analysis:", error);
      toast.error("Failed to complete analysis of all images");
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

  // Mix analysis results from all analyzed images
  const mixPrompts = () => {
    // Get all successfully analyzed images
    const analyzedImages = images.filter(img => img.analysis !== null);
    
    if (analyzedImages.length < 2) {
      toast.error("Need at least 2 analyzed images to mix prompts");
      return;
    }
    
    // Create a mixed prompt by combining elements from each analysis
    const compositions = analyzedImages.map(img => img.analysis?.composition || "").filter(Boolean);
    const lightings = analyzedImages.map(img => img.analysis?.lighting || "").filter(Boolean);
    const colors = analyzedImages.map(img => img.analysis?.colors || "").filter(Boolean);
    const styles = analyzedImages.map(img => img.analysis?.style || "").filter(Boolean);
    
    // Create a unified prompt by combining elements from each image's suggested prompt
    const allPrompts = analyzedImages.map(img => img.analysis?.suggestedPrompt || "").filter(Boolean);
    const combinedPrompt = allPrompts.join(", ");
    
    // Create mixed analysis result
    const mixed: AnalysisResult = {
      composition: compositions.length > 0 ? compositions[Math.floor(Math.random() * compositions.length)] : "No composition data available",
      lighting: lightings.length > 0 ? lightings[Math.floor(Math.random() * lightings.length)] : "No lighting data available",
      colors: colors.length > 0 ? colors[Math.floor(Math.random() * colors.length)] : "No color data available",
      style: styles.length > 0 ? styles[Math.floor(Math.random() * styles.length)] : "No style data available",
      suggestedPrompt: `Mixed prompt from ${analyzedImages.length} images: ${combinedPrompt}`
    };
    
    setMixedPrompt(mixed);
    toast.success("Created mixed prompt from analyzed images");
  };

  // Calculate whether the Mix button should be enabled
  const canMix = images.filter(img => img.analysis !== null).length >= 2;

  return (
    <div className="space-y-4">
      <Card className="overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Image Analysis</CardTitle>
            <p className="text-sm text-muted-foreground">Upload and analyze images to generate Stable Diffusion prompts</p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Switch
                checked={enableMultipleImages}
                onCheckedChange={setEnableMultipleImages}
                id="multiple-images"
              />
              <Label htmlFor="multiple-images">Multiple Images</Label>
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
          </div>
        </CardHeader>
        
        <CardContent>
          <div className="space-y-4">
            {/* Tab buttons */}
            <div className="flex border-b">
              <button
                className={`px-4 py-2 font-medium ${activeTab === 'upload' ? 'border-b-2 border-primary' : 'text-muted-foreground'}`}
                onClick={() => setActiveTab('upload')}
              >
                Upload
              </button>
              <button
                className={`px-4 py-2 font-medium ${activeTab === 'results' ? 'border-b-2 border-primary' : 'text-muted-foreground'}`}
                onClick={() => setActiveTab('results')}
                disabled={images.length === 0}
              >
                Results ({images.length})
              </button>
              <button
                className={`px-4 py-2 font-medium ${activeTab === 'mixed' ? 'border-b-2 border-primary' : 'text-muted-foreground'}`}
                onClick={() => setActiveTab('mixed')}
                disabled={!mixedPrompt}
              >
                Mixed Prompt
              </button>
            </div>
            
            {/* Upload tab */}
            {activeTab === 'upload' && (
              <div className="space-y-6">
                {/* Upload Area */}
                <div
                  className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                    isDragging
                      ? "border-primary bg-primary/10"
                      : "border-muted-foreground/25"
                  }`}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                >
                  <Upload className="mx-auto h-12 w-12 text-muted-foreground/50" />
                  <p className="mt-2 text-sm text-muted-foreground">
                    Drag and drop your image{enableMultipleImages ? 's' : ''} here, or click to select
                  </p>
                  <Input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileSelect}
                    id="image-upload"
                    multiple={enableMultipleImages}
                  />
                  <Button
                    variant="secondary"
                    className="mt-4"
                    onClick={() => document.getElementById("image-upload")?.click()}
                  >
                    Select Image{enableMultipleImages ? '(s)' : ''}
                  </Button>
                  
                  {enableMultipleImages && (
                    <p className="mt-2 text-xs text-muted-foreground">
                      You can upload up to 6 images. {remainingUploadSlots} slot{remainingUploadSlots !== 1 ? 's' : ''} remaining.
                    </p>
                  )}
                </div>
                
                {/* Model Selection */}
                <div className="space-y-2">
                  <Label>Select Analysis Model</Label>
                  <Select
                    value={selectedModel}
                    onValueChange={setSelectedModel}
                    disabled={isLoadingModels}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a model" />
                    </SelectTrigger>
                    <SelectContent>
                      {isLoadingModels ? (
                        <SelectItem value="loading" disabled>
                          Loading models...
                        </SelectItem>
                      ) : availableModels.length > 0 ? (
                        availableModels.map((model: any) => (
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
                
                {/* Error message display */}
                {errorMessage && (
                  <div className="bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 p-3 rounded-md flex items-start space-x-2">
                    <p className="text-sm text-amber-800 dark:text-amber-200">
                      {errorMessage}
                    </p>
                  </div>
                )}
              </div>
            )}
            
            {/* Results tab */}
            {activeTab === 'results' && (
              <div className="space-y-6">
                {/* Control Buttons */}
                <div className="flex justify-between items-center">
                  <Button 
                    onClick={analyzeAllImages} 
                    disabled={isAnalyzing || images.length === 0}
                  >
                    <Wand2 className="mr-2 h-4 w-4" />
                    {isAnalyzing ? "Analyzing..." : "Analyze All Images"}
                  </Button>
                  
                  <Button
                    variant="outline"
                    onClick={mixPrompts}
                    disabled={!canMix}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2 h-4 w-4">
                      <path d="M8 3v3a2 2 0 0 1-2 2H3"></path>
                      <path d="M21 8h-3a2 2 0 0 1-2-2V3"></path>
                      <path d="M3 16h3a2 2 0 0 1 2 2v3"></path>
                      <path d="M16 21v-3a2 2 0 0 1 2-2h3"></path>
                    </svg>
                    Mix Prompts
                  </Button>
                </div>
                
                {/* Image Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {images.map((image) => (
                    <Card key={image.id} className="overflow-hidden">
                      <div className="aspect-video relative">
                        <img 
                          src={image.imageData} 
                          alt="Uploaded image" 
                          className="object-cover w-full h-full"
                        />
                        <Button
                          variant="destructive"
                          size="icon"
                          className="absolute top-2 right-2 h-6 w-6 rounded-full opacity-80 hover:opacity-100"
                          onClick={() => removeImage(image.id)}
                        >
                          <Trash className="h-3 w-3" />
                        </Button>
                      </div>
                      <div className="p-4 space-y-3">
                        <div className="flex justify-between items-center">
                          <h4 className="font-medium">Image {images.indexOf(image) + 1}</h4>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => analyzeImage(image.id)}
                            disabled={image.isAnalyzing}
                          >
                            {image.isAnalyzing ? (
                              <>
                                <RefreshCw className="h-3 w-3 animate-spin mr-1" />
                                Analyzing...
                              </>
                            ) : image.analysis ? (
                              <>
                                <Check className="h-3 w-3 mr-1" />
                                Analyzed
                              </>
                            ) : (
                              <>
                                <Wand2 className="h-3 w-3 mr-1" />
                                Analyze
                              </>
                            )}
                          </Button>
                        </div>
                        
                        {/* Analysis Results or Error */}
                        {image.error ? (
                          <div className="text-xs text-red-500">
                            {image.error}
                          </div>
                        ) : image.analysis ? (
                          <div className="space-y-2">
                            <p className="text-xs font-medium">Suggested Prompt:</p>
                            <div className="flex items-start gap-1">
                              <p className="text-xs text-muted-foreground line-clamp-3">
                                {image.analysis.suggestedPrompt}
                              </p>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-5 w-5 mt-[-2px] shrink-0"
                                onClick={() => copyToClipboard(image.analysis?.suggestedPrompt || "")}
                              >
                                <Copy className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <p className="text-xs text-muted-foreground italic">
                            Not yet analyzed
                          </p>
                        )}
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}
            
            {/* Mixed Prompt tab */}
            {activeTab === 'mixed' && mixedPrompt && (
              <Card>
                <CardHeader>
                  <CardTitle>Mixed Prompt Result</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Combined prompt from {images.filter(img => img.analysis !== null).length} analyzed images
                  </p>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[500px]">
                    <div className="space-y-6">
                      <div>
                        <h3 className="text-lg font-semibold mb-2">Composition</h3>
                        <p className="text-muted-foreground">
                          {mixedPrompt.composition}
                        </p>
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold mb-2">Lighting</h3>
                        <p className="text-muted-foreground">
                          {mixedPrompt.lighting}
                        </p>
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold mb-2">Colors</h3>
                        <p className="text-muted-foreground">
                          {mixedPrompt.colors}
                        </p>
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold mb-2">Style</h3>
                        <p className="text-muted-foreground">
                          {mixedPrompt.style}
                        </p>
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold mb-2">Suggested Prompt</h3>
                        <div className="flex items-start gap-2">
                          <p className="text-muted-foreground flex-1">
                            {mixedPrompt.suggestedPrompt}
                          </p>
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => copyToClipboard(mixedPrompt.suggestedPrompt)}
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
          </div>
        </CardContent>
      </Card>
    </div>
  );
}