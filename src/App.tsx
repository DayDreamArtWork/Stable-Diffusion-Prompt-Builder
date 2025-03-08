// src/App.tsx - Teljes kód (módosított container mérettel és megfelelő stílusokkal)
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./components/ui/tabs";
import { PromptBuilder } from "./components/prompt-builder";
import { ImageAnalysis } from "./components/image-analysis";
import { SavedPrompts } from "./components/saved-prompts";
import { MultipleImageAnalysis } from "./components/multiple-image-analysis";
import { PromptMixer } from "./components/prompt-mixer";
import { Button } from "./components/ui/button";
import { AIColorPalette } from "./components/ai-color-palette";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "./components/ui/dialog";
import { useState, useEffect } from "react";
import { Wand2, Settings, PlusSquare, Image as ImageIcon, Save, Images, Sun, Moon, Palette, GitMerge } from "lucide-react";

export default function App() {
  const [activeTab, setActiveTab] = useState("prompt-builder");
  const [isDarkTheme, setIsDarkTheme] = useState(true); // Default dark theme
  const [isAiTheme, setIsAiTheme] = useState(true); // Default AI theme enabled
  
  // Apply theme class to body on theme change
  useEffect(() => {
    const themeClasses = [];
    
    // Dark/Light mode
    if (isDarkTheme) {
      themeClasses.push("dark");
    } else {
      themeClasses.push("light");
    }
    
    // AI theme
    if (isAiTheme) {
      themeClasses.push("ai-theme");
    }
    
    document.body.className = themeClasses.join(" ");
  }, [isDarkTheme, isAiTheme]);

  // Toggle theme functions
  const toggleDarkMode = () => setIsDarkTheme(!isDarkTheme);
  const toggleAiTheme = () => setIsAiTheme(!isAiTheme);
  
  // Define theme classes
  const cardThemeClass = isDarkTheme 
    ? "bg-gray-800/90 border-gray-700" 
    : "bg-white/90 border-gray-200";

  return (
    <div className="min-h-screen gradient-bg p-4 md:p-8">
      <header className="mb-8 animate-fade-in">
        <div className="flex items-center justify-center gap-3 mb-4">
          <Wand2 className="w-10 h-10 glow-effect text-primary" />
          <h1 className="text-4xl font-bold gradient-text">Stable Diffusion Prompt Builder</h1>
        </div>
        <div className="flex items-center justify-between">
          <p className="text-muted-foreground text-lg">
          </p>
          <div className="flex gap-2">
            <Button variant="outline" size="icon" onClick={toggleDarkMode} title="Toggle dark mode">
              {isDarkTheme ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
            <Button 
              variant="outline" 
              size="icon" 
              onClick={toggleAiTheme} 
              title="Toggle AI theme" 
              className={isAiTheme ? "text-primary border-primary" : ""}
            >
              <Palette className="h-4 w-4" />
            </Button>
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="ml-2">
                  <Palette className="h-4 w-4 mr-2" />
                  Color Reference
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>AI Color Palette</DialogTitle>
                </DialogHeader>
                <AIColorPalette />
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </header>

      <main className={`container mx-auto max-w-[95%] xl:max-w-[1400px] enhanced-card ${cardThemeClass} rounded-lg p-6 border shadow-lg`}>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="enhanced-tabs">
          <TabsList className="grid w-full grid-cols-5 lg:w-[800px] mx-auto mb-6">
            <TabsTrigger value="prompt-builder" className="py-3">
              <PlusSquare className="h-4 w-4 mr-2" />
              Prompt Builder
            </TabsTrigger>
            <TabsTrigger value="image-analysis" className="py-3">
              <ImageIcon className="h-4 w-4 mr-2" />
              Image Analysis
            </TabsTrigger>
            <TabsTrigger value="multiple-image-analysis" className="py-3">
              <Images className="h-4 w-4 mr-2" />
              Batch Analysis
            </TabsTrigger>
            <TabsTrigger value="prompt-mixer" className="py-3">
              <GitMerge className="h-4 w-4 mr-2" />
              Prompt Mixer
            </TabsTrigger>
            <TabsTrigger value="saved-prompts" className="py-3">
              <Save className="h-4 w-4 mr-2" />
              Saved Prompts
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="prompt-builder" className="space-y-4 mt-6 animate-fade-in">
            <PromptBuilder />
          </TabsContent>
          
          <TabsContent value="image-analysis" className="space-y-4 mt-6 animate-fade-in">
            <ImageAnalysis />
          </TabsContent>
          
          <TabsContent value="multiple-image-analysis" className="space-y-4 mt-6 animate-fade-in">
            <MultipleImageAnalysis />
          </TabsContent>
          
          <TabsContent value="prompt-mixer" className="space-y-4 mt-6 animate-fade-in">
            <PromptMixer />
          </TabsContent>
          
          <TabsContent value="saved-prompts" className="space-y-4 mt-6 animate-fade-in">
            <SavedPrompts />
          </TabsContent>
        </Tabs>
      </main>
      
      <footer className="mt-8 text-center text-sm text-muted-foreground">
        <p>DayDream A.I Studio &copy; {new Date().getFullYear()}</p>
      </footer>
    </div>
  );
}