import React, { useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { 
  Square, 
  Grid3x3,
  Minus,
  Columns3,
  Rows3,
  X
} from "lucide-react";
import { HexColorPicker } from "react-colorful";
import { cn } from "@/lib/utils";

interface BorderPickerProps {
  trigger: React.ReactNode;
  onBorderApply: (options: BorderOptions) => void;
}

export interface BorderOptions {
  positions: BorderPosition[];
  style: "solid" | "dashed" | "dotted";
  thickness: "thin" | "medium" | "thick";
  color: string;
}

type BorderPosition = 
  | "all" 
  | "outer" 
  | "inner" 
  | "top" 
  | "bottom" 
  | "left" 
  | "right"
  | "horizontal"
  | "vertical"
  | "none";

const BORDER_POSITIONS: { id: BorderPosition; icon: React.ReactNode; label: string }[] = [
  { id: "all", icon: <Grid3x3 size={20} />, label: "All borders" },
  { id: "outer", icon: <Square size={20} />, label: "Outer borders" },
  { id: "inner", icon: <div className="grid grid-cols-2 gap-0.5 w-5 h-5"><div className="border-r border-b" /><div className="border-b" /><div className="border-r" /><div /></div>, label: "Inner borders" },
  { id: "top", icon: <div className="w-5 h-5 border-t-2" />, label: "Top border" },
  { id: "bottom", icon: <div className="w-5 h-5 border-b-2" />, label: "Bottom border" },
  { id: "left", icon: <div className="w-5 h-5 border-l-2" />, label: "Left border" },
  { id: "right", icon: <div className="w-5 h-5 border-r-2" />, label: "Right border" },
  { id: "horizontal", icon: <Rows3 size={20} />, label: "Horizontal inner" },
  { id: "vertical", icon: <Columns3 size={20} />, label: "Vertical inner" },
  { id: "none", icon: <X size={20} />, label: "No borders" },
];

const BORDER_STYLES: { value: "solid" | "dashed" | "dotted"; label: string; preview: React.ReactNode }[] = [
  { value: "solid", label: "Solid", preview: <div className="w-12 h-0.5 bg-foreground" /> },
  { value: "dashed", label: "Dashed", preview: <div className="w-12 h-0.5 border-t-2 border-dashed border-foreground" /> },
  { value: "dotted", label: "Dotted", preview: <div className="w-12 h-0.5 border-t-2 border-dotted border-foreground" /> },
];

const BORDER_THICKNESS: { value: "thin" | "medium" | "thick"; label: string; pixels: string }[] = [
  { value: "thin", label: "Thin", pixels: "1px" },
  { value: "medium", label: "Medium", pixels: "2px" },
  { value: "thick", label: "Thick", pixels: "3px" },
];

export const BorderPicker: React.FC<BorderPickerProps> = ({ trigger, onBorderApply }) => {
  const [open, setOpen] = useState(false);
  const [selectedPositions, setSelectedPositions] = useState<BorderPosition[]>(["all"]);
  const [selectedStyle, setSelectedStyle] = useState<"solid" | "dashed" | "dotted">("solid");
  const [selectedThickness, setSelectedThickness] = useState<"thin" | "medium" | "thick">("thin");
  const [selectedColor, setSelectedColor] = useState("#000000");
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [customColor, setCustomColor] = useState("#000000");

  const RECENT_COLORS_KEY = "border-recent-colors";
  const THEME_COLORS = ["#000000", "#434343", "#666666", "#999999", "#b7b7b7", "#cccccc", "#d9d9d9", "#efefef", "#f3f3f3", "#ffffff"];
  const STANDARD_COLORS = [
    "#ff0000", "#ff9900", "#ffff00", "#00ff00", "#00ffff", "#0000ff", "#9900ff", "#ff00ff",
    "#f4cccc", "#fce5cd", "#fff2cc", "#d9ead3", "#d0e0e3", "#cfe2f3", "#d9d2e9", "#ead1dc",
  ];

  const loadRecentColors = (): string[] => {
    const stored = localStorage.getItem(RECENT_COLORS_KEY);
    return stored ? JSON.parse(stored) : [];
  };

  const [recentColors, setRecentColors] = useState<string[]>(loadRecentColors());

  const addToRecentColors = (color: string) => {
    const newRecents = [color, ...recentColors.filter(c => c !== color)].slice(0, 10);
    setRecentColors(newRecents);
    localStorage.setItem(RECENT_COLORS_KEY, JSON.stringify(newRecents));
  };

  const togglePosition = (position: BorderPosition) => {
    if (position === "none") {
      setSelectedPositions(["none"]);
    } else {
      const newPositions = selectedPositions.includes(position)
        ? selectedPositions.filter(p => p !== position && p !== "none")
        : [...selectedPositions.filter(p => p !== "none"), position];
      setSelectedPositions(newPositions.length > 0 ? newPositions : ["none"]);
    }
  };

  const handleApply = () => {
    const finalColor = showColorPicker ? customColor : selectedColor;
    addToRecentColors(finalColor);
    onBorderApply({
      positions: selectedPositions,
      style: selectedStyle,
      thickness: selectedThickness,
      color: finalColor,
    });
    setOpen(false);
    setShowColorPicker(false);
  };

  const handleColorSelect = (color: string) => {
    setSelectedColor(color);
    setCustomColor(color);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        {trigger}
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0 z-[9999]" align="start">
        {!showColorPicker ? (
          <div className="p-3 space-y-3">
            {/* Border Position Grid */}
            <div>
              <div className="text-xs font-medium mb-2 text-muted-foreground">Border Position</div>
              <div className="grid grid-cols-5 gap-1">
                {BORDER_POSITIONS.map((position) => (
                  <Button
                    key={position.id}
                    variant="outline"
                    size="sm"
                    className={cn(
                      "h-10 p-1",
                      selectedPositions.includes(position.id) && "bg-accent border-primary"
                    )}
                    onClick={() => togglePosition(position.id)}
                    title={position.label}
                  >
                    {position.icon}
                  </Button>
                ))}
              </div>
            </div>

            <Separator />

            {/* Border Style */}
            <div>
              <div className="text-xs font-medium mb-2 text-muted-foreground">Border Style</div>
              <div className="space-y-1">
                {BORDER_STYLES.map((style) => (
                  <Button
                    key={style.value}
                    variant="ghost"
                    size="sm"
                    className={cn(
                      "w-full justify-start gap-3",
                      selectedStyle === style.value && "bg-accent"
                    )}
                    onClick={() => setSelectedStyle(style.value)}
                  >
                    {style.preview}
                    <span className="text-sm">{style.label}</span>
                  </Button>
                ))}
              </div>
            </div>

            <Separator />

            {/* Border Thickness */}
            <div>
              <div className="text-xs font-medium mb-2 text-muted-foreground">Border Thickness</div>
              <div className="space-y-1">
                {BORDER_THICKNESS.map((thickness) => (
                  <Button
                    key={thickness.value}
                    variant="ghost"
                    size="sm"
                    className={cn(
                      "w-full justify-start gap-3",
                      selectedThickness === thickness.value && "bg-accent"
                    )}
                    onClick={() => setSelectedThickness(thickness.value)}
                  >
                    <div 
                      className="w-12 bg-foreground rounded"
                      style={{ height: thickness.pixels }}
                    />
                    <span className="text-sm">{thickness.label} ({thickness.pixels})</span>
                  </Button>
                ))}
              </div>
            </div>

            <Separator />

            {/* Color Picker */}
            <div>
              <div className="text-xs font-medium mb-2 text-muted-foreground">Border Color</div>
              <div className="space-y-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start gap-2"
                  onClick={() => setShowColorPicker(true)}
                >
                  <div 
                    className="w-5 h-5 rounded border"
                    style={{ backgroundColor: selectedColor }}
                  />
                  <span className="text-sm">{selectedColor.toUpperCase()}</span>
                </Button>
                
                {/* Recent Colors */}
                {recentColors.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {recentColors.map((color, idx) => (
                      <button
                        key={idx}
                        className="w-6 h-6 rounded border border-border hover:scale-110 transition-transform"
                        style={{ backgroundColor: color }}
                        onClick={() => handleColorSelect(color)}
                        title={color}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>

            <Separator />

            {/* Apply Button */}
            <Button 
              onClick={handleApply}
              className="w-full"
              size="sm"
            >
              Apply Borders
            </Button>
          </div>
        ) : (
          <div className="p-3 space-y-3">
            {/* Color Picker View */}
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm font-medium">Custom Color</div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowColorPicker(false)}
              >
                Back
              </Button>
            </div>

            <HexColorPicker color={customColor} onChange={setCustomColor} className="w-full" />

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={customColor}
                  onChange={(e) => setCustomColor(e.target.value)}
                  className="flex-1 px-2 py-1 text-sm border rounded"
                  placeholder="#000000"
                />
                <div 
                  className="w-8 h-8 rounded border"
                  style={{ backgroundColor: customColor }}
                />
              </div>
            </div>

            {/* Theme Colors */}
            <div>
              <div className="text-xs font-medium mb-2 text-muted-foreground">Theme Colors</div>
              <div className="grid grid-cols-10 gap-1">
                {THEME_COLORS.map((color, idx) => (
                  <button
                    key={idx}
                    className="w-6 h-6 rounded border border-border hover:scale-110 transition-transform"
                    style={{ backgroundColor: color }}
                    onClick={() => setCustomColor(color)}
                    title={color}
                  />
                ))}
              </div>
            </div>

            {/* Standard Colors */}
            <div>
              <div className="text-xs font-medium mb-2 text-muted-foreground">Standard Colors</div>
              <div className="grid grid-cols-8 gap-1">
                {STANDARD_COLORS.map((color, idx) => (
                  <button
                    key={idx}
                    className="w-6 h-6 rounded border border-border hover:scale-110 transition-transform"
                    style={{ backgroundColor: color }}
                    onClick={() => setCustomColor(color)}
                    title={color}
                  />
                ))}
              </div>
            </div>

            <Button 
              onClick={() => {
                setSelectedColor(customColor);
                setShowColorPicker(false);
              }}
              className="w-full"
              size="sm"
            >
              Select Color
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
};
