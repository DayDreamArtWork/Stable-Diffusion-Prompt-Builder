"use client";

import { useEffect, useState } from "react";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { InfoIcon } from "lucide-react";
import { ArtStyle, StyleCategory, Styles } from "@/lib/types";

interface StyleSelectorProps {
  onSelect: (stylePrompt: string) => void;
}

export function StyleSelector({ onSelect }: StyleSelectorProps) {
  const [styles, setStyles] = useState<ArtStyle[]>([]);
  const [categories, setCategories] = useState<StyleCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedStyle, setSelectedStyle] = useState<string>("");

  useEffect(() => {
    const loadStyles = async () => {
      try {
        setLoading(true);
        // Load styles from the JSON file
        const response = await fetch('/styles.json');
        if (!response.ok) {
          throw new Error(`Failed to fetch styles: ${response.status} ${response.statusText}`);
        }
        
        const data: Styles = await response.json();
        setStyles(data.styles);
        setCategories(data.categories);
        setError(null);
      } catch (err) {
        console.error('Error loading styles:', err);
        setError('Failed to load styles. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    loadStyles();
  }, []);

  const handleStyleChange = (styleId: string) => {
    setSelectedStyle(styleId);
    
    // If "none" is selected, clear the style
    if (styleId === "none") {
      onSelect("");
      return;
    }
    
    // Otherwise find and use the selected style
    const selectedStyleObj = styles.find(style => style.id === styleId);
    if (selectedStyleObj) {
      onSelect(selectedStyleObj.prompt);
    }
  };

  if (loading) {
    return <div className="text-sm text-muted-foreground">Loading styles...</div>;
  }

  if (error) {
    return <div className="text-sm text-red-500">{error}</div>;
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium">
          Art Style
        </label>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-6 w-6">
                <InfoIcon className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p className="max-w-xs">Select a predefined art style to apply to your prompt</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
      
      <Select value={selectedStyle} onValueChange={handleStyleChange}>
        <SelectTrigger>
          <SelectValue placeholder="Select a style" />
        </SelectTrigger>
        <SelectContent>
          {/* Add "None" option at the top */}
          <SelectItem key="none" value="none">
            None (Clear style)
          </SelectItem>
          
          {/* Add separator */}
          <div className="h-px bg-muted my-1"></div>
          
          {/* Existing categories and styles */}
          {categories.map((category) => (
            <SelectGroup key={category.id}>
              <SelectLabel>{category.name}</SelectLabel>
              {styles
                .filter(style => style.category === category.id)
                .map(style => (
                  <SelectItem key={style.id} value={style.id}>
                    {style.name}
                  </SelectItem>
                ))
              }
            </SelectGroup>
          ))}
        </SelectContent>
      </Select>
      
      {selectedStyle && selectedStyle !== "none" && (
        <div className="pt-1">
          <p className="text-xs text-muted-foreground">
            {styles.find(s => s.id === selectedStyle)?.description}
          </p>
        </div>
      )}
    </div>
  );
}