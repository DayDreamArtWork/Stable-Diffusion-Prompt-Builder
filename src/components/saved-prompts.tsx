// src/components/saved-prompts.tsx - Fixed version to prevent freezing
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { ScrollArea } from "./ui/scroll-area";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { useState, useEffect } from "react";
import { Search, MoreVertical, Copy, Pencil, Trash, Clock, Download, Upload } from "lucide-react";
import { SavedPrompt, SDModel } from "@/lib/types";
import { toast } from "sonner";
import { format } from "date-fns";

export function SavedPrompts() {
  const [searchQuery, setSearchQuery] = useState("");
  const [prompts, setPrompts] = useState<SavedPrompt[]>([]);
  const [editingPrompt, setEditingPrompt] = useState<SavedPrompt | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [deletePromptId, setDeletePromptId] = useState<string | null>(null);
  const [importedPrompts, setImportedPrompts] = useState<SavedPrompt[]>([]);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);

  // Load saved prompts from localStorage
  const loadPrompts = () => {
    const savedPromptsData = localStorage.getItem('savedPrompts');
    if (savedPromptsData) {
      try {
        const parsedPrompts = JSON.parse(savedPromptsData);
        setPrompts(parsedPrompts);
        console.log("Loaded prompts:", parsedPrompts.length);
      } catch (e) {
        console.error('Error loading saved prompts:', e);
      }
    }
  };

  // Load prompts on component mount
  useEffect(() => {
    loadPrompts();
  }, []);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard!");
  };

  const deletePrompt = (id: string) => {
    try {
      // Read the latest data from localStorage
      const savedPromptsData = localStorage.getItem('savedPrompts');
      const currentPrompts = savedPromptsData ? JSON.parse(savedPromptsData) : [];
      
      // Create a new array without the deleted prompt
      const updatedPrompts = currentPrompts.filter((p: SavedPrompt) => p.id !== id);
      
      // Update localStorage
      localStorage.setItem('savedPrompts', JSON.stringify(updatedPrompts));
      
      // Update state
      setPrompts(updatedPrompts);
      
      // Close dialog and show success message
      setDeletePromptId(null);
      toast.success("Prompt deleted successfully!");
    } catch (error) {
      console.error("Error deleting prompt:", error);
      toast.error("Failed to delete prompt. Please try again.");
    }
  };

  const editPrompt = (id: string) => {
    // Find the prompt to edit
    const promptToEdit = prompts.find(p => p.id === id);
    
    if (promptToEdit) {
      // Create a deep copy of the prompt to avoid reference issues
      const promptCopy = JSON.parse(JSON.stringify(promptToEdit));
      
      // Set the editing prompt and open dialog
      setEditingPrompt(promptCopy);
      setIsDialogOpen(true);
    }
  };

  const saveEditedPrompt = () => {
    if (!editingPrompt) return;

    try {
      // Read the latest data from localStorage
      const savedPromptsData = localStorage.getItem('savedPrompts');
      const currentPrompts = savedPromptsData ? JSON.parse(savedPromptsData) : [];
      
      // Create a new array with the updated prompt
      const updatedPrompts = currentPrompts.map((p: SavedPrompt) => 
        p.id === editingPrompt.id ? {...editingPrompt} : p
      );
      
      // Update localStorage
      localStorage.setItem('savedPrompts', JSON.stringify(updatedPrompts));
      
      // Update state
      setPrompts(updatedPrompts);
      
      // Close dialog and clear editing prompt
      setIsDialogOpen(false);
      setEditingPrompt(null);
      
      toast.success("Prompt updated successfully!");
      
      // Force reload prompts to ensure UI consistency
      loadPrompts();
    } catch (error) {
      console.error("Error saving edited prompt:", error);
      toast.error("Failed to save changes. Please try again.");
    }
  };

  // Handle JSON file upload
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const parsed = JSON.parse(content);
        
        // Check if it's an array or a single prompt object
        const promptsToImport = Array.isArray(parsed) ? parsed : [parsed];
        
        // Validate prompts
        const validPrompts = promptsToImport.filter(p => 
          p.id && p.title && p.prompt && p.model
        );
        
        if (validPrompts.length === 0) {
          toast.error("No valid prompts found in the file");
          return;
        }
        
        // Normalize prompts with any missing fields
        const normalizedPrompts = validPrompts.map(p => ({
          id: p.id || Date.now().toString(),
          title: p.title || "Imported Prompt",
          prompt: p.prompt || "",
          negativePrompt: p.negativePrompt || "",
          model: p.model || "SD 1.5",
          categories: p.categories || {},
          createdAt: p.createdAt || new Date().toISOString(),
          updatedAt: p.updatedAt || new Date().toISOString()
        }));
        
        setImportedPrompts(normalizedPrompts);
        setIsImportDialogOpen(true);
      } catch (error) {
        toast.error("Failed to parse JSON file");
        console.error("JSON parse error:", error);
      }
    };
    reader.readAsText(file);
  };

  // Import prompts
  const saveImportedPrompts = () => {
    try {
      // Read the latest data from localStorage
      const savedPromptsData = localStorage.getItem('savedPrompts');
      const currentPrompts = savedPromptsData ? JSON.parse(savedPromptsData) : [];
      
      // Combine current and imported prompts
      const updatedPrompts = [...currentPrompts, ...importedPrompts];
      
      // Update localStorage
      localStorage.setItem('savedPrompts', JSON.stringify(updatedPrompts));
      
      // Update state
      setPrompts(updatedPrompts);
      
      // Reset import state
      setIsImportDialogOpen(false);
      setImportedPrompts([]);
      
      toast.success(`${importedPrompts.length} prompt(s) imported successfully!`);
      
      // Force reload prompts to ensure UI consistency
      loadPrompts();
    } catch (error) {
      console.error("Error importing prompts:", error);
      toast.error("Failed to import prompts. Please try again.");
    }
  };

  // Export function - export all prompts as JSON file
  const exportPrompts = () => {
    if (prompts.length === 0) {
      toast.error("No prompts to export");
      return;
    }

    try {
      const dataStr = JSON.stringify(prompts, null, 2);
      const dataUri = `data:application/json;charset=utf-8,${encodeURIComponent(dataStr)}`;
      
      const exportFileDefaultName = `sd-prompts-${new Date().toISOString().slice(0, 10)}.json`;
      
      const linkElement = document.createElement('a');
      linkElement.setAttribute('href', dataUri);
      linkElement.setAttribute('download', exportFileDefaultName);
      linkElement.click();
      
      toast.success(`${prompts.length} prompt(s) exported successfully!`);
    } catch (error) {
      console.error("Error exporting prompts:", error);
      toast.error("Failed to export prompts. Please try again.");
    }
  };

  // Filter prompts based on search query
  const filteredPrompts = prompts.filter(prompt =>
    prompt.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    prompt.prompt.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Your Saved Prompts</CardTitle>
          <div className="flex space-x-2">
            <label htmlFor="import-prompts">
              <Button variant="outline" size="sm" asChild>
                <div className="flex items-center">
                  <Upload className="h-4 w-4 mr-2" />
                  Import
                </div>
              </Button>
            </label>
            <input
              type="file"
              id="import-prompts"
              className="hidden"
              accept=".json"
              onChange={handleFileUpload}
            />
            
            <Button 
              variant="outline" 
              size="sm" 
              onClick={exportPrompts}
              disabled={prompts.length === 0}
            >
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search saved prompts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          
          <ScrollArea className="h-[600px] mt-4">
            {filteredPrompts.length > 0 ? (
              <div className="space-y-4">
                {filteredPrompts.map((prompt) => (
                  <Card key={prompt.id} className="bg-muted/50">
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1 max-w-[80%]">
                          <h3 className="font-semibold">{prompt.title}</h3>
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {prompt.prompt}
                          </p>
                          <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            <span>
                              {format(new Date(prompt.createdAt), "MMM d, yyyy")}
                            </span>
                            <span className="px-1">•</span>
                            <span>{prompt.model}</span>
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() => copyToClipboard(prompt.prompt)}
                              >
                                <Copy className="mr-2 h-4 w-4" />
                                Copy Prompt
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => editPrompt(prompt.id)}
                              >
                                <Pencil className="mr-2 h-4 w-4" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="text-destructive"
                                onClick={() => setDeletePromptId(prompt.id)}
                              >
                                <Trash className="mr-2 h-4 w-4" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No saved prompts found</p>
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={(open) => {
        setIsDialogOpen(open);
        if (!open) {
          setEditingPrompt(null);
          // Force reload prompts to ensure UI consistency when dialog is closed
          loadPrompts();
        }
      }}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Prompt</DialogTitle>
            <DialogDescription>
              Make changes to your saved prompt.
            </DialogDescription>
          </DialogHeader>
          
          {editingPrompt && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Title</label>
                <Input 
                  value={editingPrompt.title}
                  onChange={(e) => setEditingPrompt({...editingPrompt, title: e.target.value})}
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Prompt</label>
                <textarea 
                  className="w-full min-h-[100px] p-2 rounded-md border bg-background text-foreground"
                  value={editingPrompt.prompt}
                  onChange={(e) => setEditingPrompt({...editingPrompt, prompt: e.target.value})}
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Negative Prompt</label>
                <textarea 
                  className="w-full min-h-[60px] p-2 rounded-md border bg-background text-foreground"
                  value={editingPrompt.negativePrompt}
                  onChange={(e) => setEditingPrompt({...editingPrompt, negativePrompt: e.target.value})}
                />
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button 
              variant="ghost" 
              onClick={() => {
                setIsDialogOpen(false);
                setEditingPrompt(null);
                // Force reload prompts to ensure UI consistency
                loadPrompts();
              }}
            >
              Cancel
            </Button>
            <Button onClick={saveEditedPrompt}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Import Confirmation Dialog */}
      <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Import Prompts</DialogTitle>
            <DialogDescription>
              {importedPrompts.length} prompt(s) found in the file. Review and confirm import.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <ScrollArea className="h-[300px]">
              {importedPrompts.map((prompt, index) => (
                <div key={prompt.id} className="mb-3 p-3 border rounded-md">
                  <div className="font-medium">{prompt.title}</div>
                  <div className="text-sm text-muted-foreground mt-1 line-clamp-2">{prompt.prompt}</div>
                </div>
              ))}
            </ScrollArea>
          </div>
          
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsImportDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={saveImportedPrompts}>
              Import Prompts
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deletePromptId} onOpenChange={(open) => !open && setDeletePromptId(null)}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this prompt? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          
          <DialogFooter className="sm:justify-between">
            <Button variant="ghost" onClick={() => setDeletePromptId(null)}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={() => deletePromptId && deletePrompt(deletePromptId)}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}