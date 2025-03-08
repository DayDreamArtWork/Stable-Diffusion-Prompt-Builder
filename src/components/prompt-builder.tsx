"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { useState, useEffect } from "react";
import { Copy, Save, Wand2, Edit, Check } from "lucide-react";
import { toast } from "sonner";
import { CategoryCard } from "./category-card";
import { TokenCounter } from "./token-counter";
import { ModelSelector } from "./model-selector";
import { StyleSelector } from "./style-selector";
import { DEFAULT_CATEGORIES, MODEL_TOKEN_LIMITS } from "@/lib/constants";
import { Category, SDModel, TokenCount, SavedPrompt } from "@/lib/types";
import { v4 as uuidv4 } from 'uuid';

export function PromptBuilder() {
  const [categories, setCategories] = useState<Category[]>(DEFAULT_CATEGORIES);
  const [negativePrompt, setNegativePrompt] = useState("");
  const [selectedModel, setSelectedModel] = useState<SDModel>("SD 1.5");
  const [ollamaModels, setOllamaModels] = useState<string[]>([]);
  const [selectedOllamaModel, setSelectedOllamaModel] = useState<string>("llama2");
  const [isGenerating, setIsGenerating] = useState(false);
  const [savedPrompts, setSavedPrompts] = useState<SavedPrompt[]>([]);
  const [promptTitle, setPromptTitle] = useState("");
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [currentPromptId, setCurrentPromptId] = useState<string | null>(null);
  
  const tokenCount: TokenCount = {
    total: calculateTokens(buildPrompt()),
    limit: MODEL_TOKEN_LIMITS[selectedModel],
    isOverLimit: calculateTokens(buildPrompt()) > MODEL_TOKEN_LIMITS[selectedModel]
  };

  // Load saved prompts from localStorage
  useEffect(() => {
    const savedPromptsData = localStorage.getItem('savedPrompts');
    if (savedPromptsData) {
      try {
        setSavedPrompts(JSON.parse(savedPromptsData));
      } catch (e) {
        console.error('Error loading saved prompts:', e);
      }
    }
  }, []);

  // Add event listener to listen for saved prompt loading
  useEffect(() => {
    const handleLoadSavedPrompt = (event: CustomEvent) => {
      const promptId = event.detail;
      loadPrompt(promptId);
    };
    
    // Add event listener with type assertion
    document.addEventListener('loadSavedPrompt', handleLoadSavedPrompt as EventListener);
    
    // Clean up event listener on component unmount
    return () => {
      document.removeEventListener('loadSavedPrompt', handleLoadSavedPrompt as EventListener);
    };
  }, []);

  // Fetch Ollama models
  useEffect(() => {
    const fetchModels = async () => {
      try {
        const response = await fetch('http://localhost:3001/api/models');
        const data = await response.json();
        if (data && data.models) {
          setOllamaModels(data.models.map(model => model.name));
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

  function calculateTokens(text: string): number {
    return text.split(/\s+/).length;
  }

  function buildPrompt(): string {
    return categories
      .filter(cat => cat.active && cat.content.trim())
      .sort((a, b) => a.order - b.order)
      .map(cat => cat.content.trim())
      .join(", ");
  }

  const toggleCategory = (id: string) => {
    setCategories(cats =>
      cats.map(cat =>
        cat.id === id ? { ...cat, active: !cat.active } : cat
      )
    );
  };

  const updateCategoryContent = (id: string, content: string) => {
    setCategories(cats =>
      cats.map(cat =>
        cat.id === id ? { ...cat, content } : cat
      )
    );
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard!");
  };

  const savePrompt = () => {
    const prompt = buildPrompt();
    if (!prompt) {
      toast.error("Please add some content to your prompt before saving");
      return;
    }
    
    if (!promptTitle) {
      toast.error("Please provide a title for your prompt");
      return;
    }
    
    const categoriesContent: Record<string, string> = {};
    categories.forEach(cat => {
      if (cat.active && cat.content) {
        categoriesContent[cat.id] = cat.content;
      }
    });
    
    const timestamp = new Date().toISOString();
    
    try {
      // Always read the current state from localStorage to avoid stale data
      const currentSavedPromptsStr = localStorage.getItem('savedPrompts');
      const currentSavedPrompts = currentSavedPromptsStr ? JSON.parse(currentSavedPromptsStr) : [];
      
      let updatedPrompts;
      
      if (currentPromptId) {
        // Update existing prompt
        updatedPrompts = currentSavedPrompts.map((p: SavedPrompt) => 
          p.id === currentPromptId ? {
            ...p,
            title: promptTitle,
            prompt,
            negativePrompt,
            model: selectedModel,
            categories: categoriesContent,
            updatedAt: timestamp
          } : p
        );
        
        toast.success("Prompt updated successfully!");
      } else {
        // Create new prompt
        const newPrompt: SavedPrompt = {
          id: uuidv4(),
          title: promptTitle,
          prompt,
          negativePrompt,
          model: selectedModel,
          categories: categoriesContent,
          createdAt: timestamp,
          updatedAt: timestamp
        };
        
        updatedPrompts = [...currentSavedPrompts, newPrompt];
        toast.success("Prompt saved successfully!");
      }
      
      // Update localStorage
      localStorage.setItem('savedPrompts', JSON.stringify(updatedPrompts));
      
      // Update local state
      setSavedPrompts(updatedPrompts);
      
      // Reset after save
      setCurrentPromptId(null);
      setPromptTitle("");
      setIsEditingTitle(false);
    } catch (error) {
      console.error("Error saving prompt:", error);
      toast.error("Failed to save prompt. Please try again.");
    }
  };

  const loadPrompt = (promptId: string) => {
    const prompt = savedPrompts.find(p => p.id === promptId);
    if (!prompt) return;
    
    // Reset categories
    const newCategories = DEFAULT_CATEGORIES.map(cat => {
      const savedContent = prompt.categories[cat.id] || '';
      return {
        ...cat,
        content: savedContent,
        active: !!savedContent
      };
    });
    
    setCategories(newCategories);
    setNegativePrompt(prompt.negativePrompt);
    setSelectedModel(prompt.model);
    setPromptTitle(prompt.title);
    setCurrentPromptId(prompt.id);
  };
  
  const clearPrompt = () => {
    setCategories(DEFAULT_CATEGORIES);
    setNegativePrompt("");
    setPromptTitle("");
    setCurrentPromptId(null);
  };

  // Handle style selection from StyleSelector
  const handleStyleSelect = (stylePrompt: string) => {
    updateCategoryContent('style', stylePrompt);
  };

  // Modified AI prompt generation to consider context and ensure randomization
  const generateWithAI = async (categoryId: string, context: string) => {
    const category = categories.find(cat => cat.id === categoryId);
    if (!category) return;
    
    setIsGenerating(true);
    
    try {
      // Current category content
      const currentContent = category.content.trim();
      
      // Add randomization instruction and timestamp to ensure different responses
      const timestamp = new Date().toISOString();
      
      // Build prompt with randomization instructions
      let promptText = `Generate a completely unique and creative prompt section for Stable Diffusion category: "${category.name}" (${category.description}). `;
      promptText += `Current timestamp (ignore this, it's for randomization): ${timestamp}. `;
      
      // If there's already content, include it
      if (currentContent) {
        promptText += `Build upon or modify this existing content: "${currentContent}". `;
      }
      
      // Include context if available
      if (context) {
        promptText += `Consider this context for other prompt sections: ${context}. `;
      }
      
      promptText += `Make it detailed and descriptive in 10-15 words. Provide a DIFFERENT response each time, even for identical inputs.`;
      
      const response = await fetch('http://localhost:3001/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: promptText,
          model: selectedOllamaModel,
          options: {
            temperature: 0.8, // Higher temperature for more randomness
            seed: Math.floor(Math.random() * 2147483647) // Random seed every time
          }
        }),
      });
      
      const data = await response.json();
      
      if (data && data.response) {
        updateCategoryContent(categoryId, data.response.trim());
        toast.success(`Generated content for ${category.name}`);
      }
    } catch (error) {
      console.error('Error generating with AI:', error);
      toast.error('Failed to generate content. Make sure Ollama is running.');
    } finally {
      setIsGenerating(false);
    }
  };

  // Generate negative prompt with randomization
  const generateNegativePrompt = async () => {
    setIsGenerating(true);
    
    try {
      const basePrompt = buildPrompt();
      // Add timestamp for randomization
      const timestamp = new Date().toISOString();
      
      const prompt = `Generate a comprehensive negative prompt for this Stable Diffusion prompt: "${basePrompt}". 
        Current timestamp (ignore this, it's for randomization): ${timestamp}.
        Include common negative terms to avoid artifacts and issues. Provide a DIFFERENT response even for identical inputs.`;
      
      const response = await fetch('http://localhost:3001/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt,
          model: selectedOllamaModel,
          options: {
            temperature: 0.8, // Higher temperature for more randomness
            seed: Math.floor(Math.random() * 2147483647) // Random seed every time
          }
        }),
      });
      
      const data = await response.json();
      
      if (data && data.response) {
        setNegativePrompt(data.response.trim());
        toast.success('Generated negative prompt');
      }
    } catch (error) {
      console.error('Error generating negative prompt:', error);
      toast.error('Failed to generate negative prompt. Make sure Ollama is running.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <div className="space-y-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Categories</CardTitle>
            <div className="flex gap-2 items-center">
              <ModelSelector value={selectedModel} onChange={setSelectedModel} />
              {ollamaModels.length > 0 && (
                <select 
                  value={selectedOllamaModel} 
                  onChange={(e) => setSelectedOllamaModel(e.target.value)}
                  className="p-2 rounded-md border bg-background"
                >
                  {ollamaModels.map(model => (
                    <option key={model} value={model}>{model}</option>
                  ))}
                </select>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[600px] pr-4">
              {/* Style Selector */}
              <div className="mb-4 border-b pb-4">
                <StyleSelector onSelect={handleStyleSelect} />
              </div>
              
              {/* Category Cards with All Categories passed */}
              {categories.map((category) => (
                <CategoryCard
                  key={category.id}
                  category={category}
                  onToggle={toggleCategory}
                  onContentChange={updateCategoryContent}
                  onGenerateWithAI={generateWithAI}
                  isGenerating={isGenerating}
                  allCategories={categories} // Passing all categories
                />
              ))}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div className="flex-1">
              {isEditingTitle ? (
                <div className="flex items-center gap-2">
                  <Input
                    value={promptTitle}
                    onChange={(e) => setPromptTitle(e.target.value)}
                    placeholder="Enter prompt title"
                    className="max-w-xs"
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsEditingTitle(false)}
                  >
                    <Check className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <CardTitle>
                    {promptTitle ? promptTitle : "Final Prompt"}
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsEditingTitle(true)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => copyToClipboard(buildPrompt())}
              >
                <Copy className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={savePrompt}
              >
                <Save className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              placeholder="Your prompt will appear here..."
              value={buildPrompt()}
              readOnly
              className="min-h-[200px]"
            />
            <TokenCounter tokenCount={tokenCount} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Negative Prompt</CardTitle>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => copyToClipboard(negativePrompt)}
              >
                <Copy className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                onClick={generateNegativePrompt}
                disabled={isGenerating || !buildPrompt()}
              >
                <Wand2 className="h-4 w-4 mr-2" />
                Generate
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <Textarea
              placeholder="Your negative prompt will appear here..."
              value={negativePrompt}
              onChange={(e) => setNegativePrompt(e.target.value)}
              className="min-h-[200px]"
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}