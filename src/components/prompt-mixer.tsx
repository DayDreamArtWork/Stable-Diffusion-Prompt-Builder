// src/components/prompt-mixer.tsx - Fixed version with token limit corrections
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "./ui/scroll-area";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { useState, useEffect } from "react";
import { Wand2, Copy, Save, RefreshCw, Search } from "lucide-react";
import { toast } from "sonner";
import { SavedPrompt } from "@/lib/types";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";

export function PromptMixer() {
  const [savedPrompts, setSavedPrompts] = useState<SavedPrompt[]>([]);
  const [selectedPromptIds, setSelectedPromptIds] = useState<string[]>([]);
  const [customPrompt, setCustomPrompt] = useState("");
  const [mixedPrompt, setMixedPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedOllamaModel, setSelectedOllamaModel] = useState<string>("llama2");
  const [ollamaModels, setOllamaModels] = useState<string[]>([]);
  const [temperature, setTemperature] = useState(0.7);
  const [maxTokens, setMaxTokens] = useState(500); // Default to 500
  const [searchQuery, setSearchQuery] = useState("");
  const [isSaveDialogOpen, setIsSaveDialogOpen] = useState(false);
  const [savePromptTitle, setSavePromptTitle] = useState("");

  // Initialize and load saved prompts
  useEffect(() => {
    // Check if localStorage has savedPrompts
    const savedPromptsData = localStorage.getItem('savedPrompts');
    if (!savedPromptsData) {
      // If not, initialize with an empty array
      localStorage.setItem('savedPrompts', JSON.stringify([]));
    }
    
    // Load saved prompts
    try {
      const parsedPrompts = savedPromptsData ? JSON.parse(savedPromptsData) : [];
      setSavedPrompts(parsedPrompts);
      console.log("Loaded saved prompts:", parsedPrompts.length);
    } catch (e) {
      console.error('Error loading saved prompts:', e);
      setSavedPrompts([]);
    }
  }, []);

  // Fetch Ollama models
  useEffect(() => {
    const fetchModels = async () => {
      try {
        const response = await fetch('http://localhost:3001/api/models');
        const data = await response.json();
        if (data && data.models) {
          setOllamaModels(data.models.map((model: any) => model.name));
          if (data.models.length > 0) {
            setSelectedOllamaModel(data.models[0].name);
          }
        }
      } catch (error) {
        console.error('Error fetching models:', error);
      }
    };
    
    fetchModels();
  }, []);

  // Handle prompt selection
  const togglePromptSelection = (promptId: string) => {
    setSelectedPromptIds(prev => 
      prev.includes(promptId)
        ? prev.filter(id => id !== promptId)
        : [...prev, promptId]
    );
  };

  // Search prompts
  const filteredPrompts = savedPrompts.filter(prompt =>
    prompt.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    prompt.prompt.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Mix prompts with Ollama - with improved randomization
  const mixPrompts = async () => {
    if (selectedPromptIds.length === 0 && !customPrompt.trim()) {
      toast.error("Select at least one prompt or enter custom text");
      return;
    }

    setIsGenerating(true);

    try {
      // Gather selected prompts
      const selectedPromptTexts = selectedPromptIds.map(id => {
        const prompt = savedPrompts.find(p => p.id === id);
        return prompt ? prompt.prompt : "";
      }).filter(Boolean);

      // Add custom prompt if provided
      if (customPrompt.trim()) {
        selectedPromptTexts.push(customPrompt.trim());
      }

      // If only one prompt, no need to mix
      if (selectedPromptTexts.length === 1) {
        setMixedPrompt(selectedPromptTexts[0]);
        toast.info("Only one prompt selected, no mixing needed");
        setIsGenerating(false);
        return;
      }

      // Build Ollama prompt with randomization instruction
      const promptText = `I need you to combine and refine these Stable Diffusion prompts into a single coherent prompt. Create a creative and UNIQUE response each time this request is made, even if the source prompts are identical:
      
${selectedPromptTexts.map((text, i) => `Prompt ${i+1}: ${text}`).join('\n\n')}

Create a single improved prompt that includes the best elements from all of these. Make sure the result is cohesive, well-structured, and effective for Stable Diffusion image generation. Focus on descriptive elements, style, composition, and quality enhancers. Your response should be unique and creative, different from previous generations even with the same inputs.`;

      // API call to Ollama with randomization options
      const response = await fetch('http://localhost:3001/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: promptText,
          model: selectedOllamaModel,
          options: {
            temperature: parseFloat(temperature.toString()),
            num_predict: parseInt(maxTokens.toString()),
            seed: Math.floor(Math.random() * 2147483647) // Random seed every time
          }
        }),
      });

      const data = await response.json();
      
      if (data && data.response) {
        // Clean response: only take the prompt part
        let cleanedResponse = data.response;
        
        // Remove "Improved Prompt:" or similar prefixes
        const promptMarkers = ["Improved Prompt:", "Combined Prompt:", "Final Prompt:", "Result:", "Mixed Prompt:"];
        
        for (const marker of promptMarkers) {
          if (cleanedResponse.includes(marker)) {
            cleanedResponse = cleanedResponse.split(marker)[1].trim();
            break;
          }
        }
        
        setMixedPrompt(cleanedResponse);
        toast.success("Prompts successfully mixed!");
      }
    } catch (error) {
      console.error('Error mixing prompts:', error);
      toast.error('Failed to mix prompts. Make sure Ollama is running.');
    } finally {
      setIsGenerating(false);
    }
  };

  // Copy prompt to clipboard
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard!");
  };

  // Open save dialog
  const openSaveDialog = () => {
    if (!mixedPrompt.trim()) {
      toast.error("No prompt to save");
      return;
    }
    
    // Set default title
    setSavePromptTitle(`Mixed Prompt ${new Date().toLocaleString()}`);
    setIsSaveDialogOpen(true);
  };

  // Save mixed prompt - fixed version
  const saveMixedPrompt = () => {
    if (!mixedPrompt.trim()) {
      toast.error("No prompt to save");
      return;
    }

    if (!savePromptTitle.trim()) {
      toast.error("Please provide a title for your prompt");
      return;
    }

    const timestamp = new Date().toISOString();
    
    // Create new prompt object
    const newPrompt: SavedPrompt = {
      id: Date.now().toString(), // Unique ID based on current timestamp
      title: savePromptTitle,
      prompt: mixedPrompt,
      negativePrompt: "",
      model: "SD 1.5",
      categories: {},
      createdAt: timestamp,
      updatedAt: timestamp
    };
    
    // Read again from localStorage to get the most up-to-date data
    try {
      const currentSavedPromptsStr = localStorage.getItem('savedPrompts');
      const currentSavedPrompts = currentSavedPromptsStr ? JSON.parse(currentSavedPromptsStr) : [];
      
      // Add new prompt
      const updatedPrompts = [...currentSavedPrompts, newPrompt];
      
      // Update localStorage
      localStorage.setItem('savedPrompts', JSON.stringify(updatedPrompts));
      
      // Update state
      setSavedPrompts(updatedPrompts);
      
      setIsSaveDialogOpen(false);
      toast.success("Mixed prompt saved successfully!");
      
      // Clear save title
      setSavePromptTitle("");
    } catch (error) {
      console.error("Error saving prompt:", error);
      toast.error("Failed to save prompt. Please try again.");
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wand2 className="h-5 w-5" />
            Prompt Mixer
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Select saved prompts and mix them into a new prompt with AI
          </p>
        </CardHeader>
      </Card>

      {/* Left panel - Prompt Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Select Prompts to Mix</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Search bar */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search saved prompts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          
          <ScrollArea className="h-[300px] pr-4 mb-4">
            {filteredPrompts.length > 0 ? (
              <div className="space-y-2">
                {filteredPrompts.map((prompt) => (
                  <div key={prompt.id} className="flex items-start gap-2 p-2 border rounded-md">
                    <input 
                      type="checkbox"
                      id={`prompt-${prompt.id}`}
                      checked={selectedPromptIds.includes(prompt.id)}
                      onChange={() => togglePromptSelection(prompt.id)}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <Label 
                        htmlFor={`prompt-${prompt.id}`}
                        className="font-medium cursor-pointer"
                      >
                        {prompt.title}
                      </Label>
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {prompt.prompt}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No saved prompts found</p>
              </div>
            )}
          </ScrollArea>

          <div className="space-y-2">
            <Label htmlFor="custom-prompt">Custom Text</Label>
            <Textarea 
              id="custom-prompt"
              placeholder="Add your own prompt text to mix..."
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              className="min-h-[100px]"
            />
          </div>

          <div className="space-y-4 mt-4">
            <div>
              <Label htmlFor="model-selector" className="text-sm font-medium">
                AI Model
              </Label>
              <select
                id="model-selector"
                value={selectedOllamaModel}
                onChange={(e) => setSelectedOllamaModel(e.target.value)}
                className="mt-1 w-full p-2 border rounded-md bg-background text-foreground"
              >
                {ollamaModels.map(model => (
                  <option key={model} value={model}>{model}</option>
                ))}
              </select>
            </div>
            
            <div>
              <Label htmlFor="temperature" className="text-sm font-medium">
                Temperature: {temperature}
              </Label>
              <div className="flex items-center gap-2">
                <span>0.1</span>
                <input
                  id="temperature"
                  type="range"
                  min="0.1"
                  max="2.0"
                  step="0.1"
                  value={temperature}
                  onChange={(e) => setTemperature(parseFloat(e.target.value))}
                  className="flex-1"
                />
                <span>2.0</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Lower values generate more deterministic output, higher values more creative.
              </p>
            </div>
            
            <div>
              <Label htmlFor="max-tokens" className="text-sm font-medium">
                Max Tokens: {maxTokens}
              </Label>
              <div className="flex items-center gap-2">
                <span>40</span>
                <input
                  id="max-tokens"
                  type="range"
                  min="40"
                  max="800"
                  step="10"
                  value={maxTokens}
                  onChange={(e) => setMaxTokens(parseInt(e.target.value))}
                  className="flex-1"
                />
                <span>800</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Maximum number of tokens to generate.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Right panel - Mixed Result */}
      <Card>
        <CardHeader>
          <CardTitle>Mixed Prompt</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button
            onClick={mixPrompts}
            disabled={isGenerating || (selectedPromptIds.length === 0 && !customPrompt.trim())}
            className="w-full"
          >
            {isGenerating ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Wand2 className="mr-2 h-4 w-4" />
                Mix Prompts
              </>
            )}
          </Button>

          <Textarea
            placeholder="Mixed prompt will appear here..."
            value={mixedPrompt}
            onChange={(e) => setMixedPrompt(e.target.value)}
            className="min-h-[300px]"
          />

          <div className="flex space-x-2">
            <Button
              variant="outline"
              onClick={() => copyToClipboard(mixedPrompt)}
              disabled={!mixedPrompt.trim()}
              className="flex-1"
            >
              <Copy className="mr-2 h-4 w-4" />
              Copy
            </Button>
            <Button
              variant="outline"
              onClick={openSaveDialog}
              disabled={!mixedPrompt.trim()}
              className="flex-1"
            >
              <Save className="mr-2 h-4 w-4" />
              Save
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Save Dialog */}
      <Dialog open={isSaveDialogOpen} onOpenChange={setIsSaveDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Save Mixed Prompt</DialogTitle>
            <DialogDescription>
              Enter a title for your mixed prompt
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="prompt-title">Title</Label>
              <Input
                id="prompt-title"
                value={savePromptTitle}
                onChange={(e) => setSavePromptTitle(e.target.value)}
                placeholder="Enter prompt title..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsSaveDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={saveMixedPrompt}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}