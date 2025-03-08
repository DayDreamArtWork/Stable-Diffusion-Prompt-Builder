import React from 'react';

export function AIColorPalette() {
  // AI-inspired color palette
  const aiColors = [
    { name: "Primary", light: "#0EA5E9", dark: "#38BDF8", variable: "--primary" },
    { name: "Secondary", light: "#3B82F6", dark: "#60A5FA", variable: "--secondary" },
    { name: "Accent", light: "#6366F1", dark: "#818CF8", variable: "--accent" },
    { name: "Background", light: "#FFFFFF", dark: "#0F172A", variable: "--background" },
    { name: "Foreground", light: "#0F172A", dark: "#F8FAFC", variable: "--foreground" },
    { name: "Card", light: "#FFFFFF", dark: "#1E293B", variable: "--card" },
    { name: "Muted", light: "#F1F5F9", dark: "#334155", variable: "--muted" },
    { name: "Border", light: "#E2E8F0", dark: "#475569", variable: "--border" },
  ];
  
  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-6 gradient-text">AI Color Palette Reference</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Light Theme</h3>
          <div className="grid grid-cols-1 gap-2">
            {aiColors.map(color => (
              <div key={`light-${color.name}`} className="flex items-center p-2 rounded-md border">
                <div 
                  className="w-12 h-12 rounded-md shadow-sm mr-4" 
                  style={{ backgroundColor: color.light }}
                />
                <div>
                  <p className="font-medium">{color.name}</p>
                  <p className="text-sm text-muted-foreground">{color.light}</p>
                  <p className="text-xs opacity-70">CSS: {color.variable}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Dark Theme</h3>
          <div className="grid grid-cols-1 gap-2">
            {aiColors.map(color => (
              <div key={`dark-${color.name}`} className="flex items-center p-2 rounded-md border">
                <div 
                  className="w-12 h-12 rounded-md shadow-sm mr-4" 
                  style={{ backgroundColor: color.dark }}
                />
                <div>
                  <p className="font-medium">{color.name}</p>
                  <p className="text-sm text-muted-foreground">{color.dark}</p>
                  <p className="text-xs opacity-70">CSS: {color.variable}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      <div className="mt-8 p-4 bg-muted rounded-lg">
        <h3 className="text-lg font-medium mb-2">How to Use These Colors</h3>
        <p className="text-sm mb-4">
          These colors are available as CSS variables in both light and dark themes. You can use them in your CSS or Tailwind classes:
        </p>
        <div className="bg-card p-4 rounded-md">
          <pre className="text-xs overflow-x-auto">
            {`/* Using in CSS */
.my-element {
  background-color: hsl(var(--primary));
  color: hsl(var(--primary-foreground));
  border: 1px solid hsl(var(--border));
}

/* Using with Tailwind */
<div className="bg-primary text-primary-foreground border-border">
  Content
</div>`}
          </pre>
        </div>
      </div>
    </div>
  );
}