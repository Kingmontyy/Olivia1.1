import { useState, useEffect } from "react";
import { HexColorPicker } from "react-colorful";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Pipette } from "lucide-react";

interface ColorPickerProps {
  trigger: React.ReactNode;
  onColorSelect: (color: string) => void;
  type: "text" | "fill";
}

// Google Sheets standard colors palette (40 colors in 4 rows x 10 columns)
const STANDARD_COLORS = [
  // Row 1: Grays and blacks
  "#000000", "#434343", "#666666", "#999999", "#b7b7b7", "#cccccc", "#d9d9d9", "#efefef", "#f3f3f3", "#ffffff",
  // Row 2: Reds and oranges
  "#980000", "#ff0000", "#ff9900", "#ffff00", "#00ff00", "#00ffff", "#4a86e8", "#0000ff", "#9900ff", "#ff00ff",
  // Row 3: Dark reds to purples
  "#e6b8af", "#f4cccc", "#fce5cd", "#fff2cc", "#d9ead3", "#d0e0e3", "#c9daf8", "#cfe2f3", "#d9d2e9", "#ead1dc",
  // Row 4: Light tints
  "#dd7e6b", "#ea9999", "#f9cb9c", "#ffe599", "#b6d7a8", "#a2c4c9", "#a4c2f4", "#9fc5e8", "#b4a7d6", "#d5a6bd",
  // Row 5: Medium tints
  "#cc4125", "#e06666", "#f6b26b", "#ffd966", "#93c47d", "#76a5af", "#6d9eeb", "#6fa8dc", "#8e7cc3", "#c27ba0",
  // Row 6: Saturated
  "#a61c00", "#cc0000", "#e69138", "#f1c232", "#6aa84f", "#45818e", "#3c78d8", "#3d85c6", "#674ea7", "#a64d79",
];

// Theme colors from design system
const THEME_COLORS = [
  "#3b82f6", // primary
  "#ef4444", // red/destructive
  "#22c55e", // green
  "#eab308", // yellow
  "#a855f7", // purple
  "#f97316", // orange
  "#ec4899", // pink
  "#6b7280", // gray
  "#000000", // black
  "#ffffff", // white
];

const RECENT_COLORS_KEY = "spreadsheet-recent-colors";
const MAX_RECENT_COLORS = 8;

export const ColorPicker = ({ trigger, onColorSelect, type }: ColorPickerProps) => {
  const [open, setOpen] = useState(false);
  const [showCustomPicker, setShowCustomPicker] = useState(false);
  const [customColor, setCustomColor] = useState("#3b82f6");
  const [hexInput, setHexInput] = useState("#3b82f6");
  const [recentColors, setRecentColors] = useState<string[]>([]);

  useEffect(() => {
    // Load recent colors from localStorage
    const stored = localStorage.getItem(RECENT_COLORS_KEY);
    if (stored) {
      try {
        setRecentColors(JSON.parse(stored));
      } catch (e) {
        setRecentColors([]);
      }
    }
  }, []);

  const addToRecent = (color: string) => {
    const normalizedColor = color.toLowerCase();
    const updated = [normalizedColor, ...recentColors.filter(c => c !== normalizedColor)].slice(0, MAX_RECENT_COLORS);
    setRecentColors(updated);
    localStorage.setItem(RECENT_COLORS_KEY, JSON.stringify(updated));
  };

  const handleColorClick = (color: string) => {
    addToRecent(color);
    onColorSelect(color);
    setOpen(false);
  };

  const handleCustomColorApply = () => {
    addToRecent(customColor);
    onColorSelect(customColor);
    setShowCustomPicker(false);
    setOpen(false);
  };

  const handleHexInputChange = (value: string) => {
    setHexInput(value);
    if (/^#[0-9A-Fa-f]{6}$/.test(value)) {
      setCustomColor(value);
    }
  };

  const rgbToHex = (r: number, g: number, b: number) => {
    return "#" + [r, g, b].map(x => {
      const hex = Math.max(0, Math.min(255, x)).toString(16);
      return hex.length === 1 ? "0" + hex : hex;
    }).join("");
  };

  const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : { r: 0, g: 0, b: 0 };
  };

  const rgb = hexToRgb(customColor);
  const [hue, saturation, lightness] = rgbToHsl(rgb.r, rgb.g, rgb.b);

  function rgbToHsl(r: number, g: number, b: number) {
    r /= 255;
    g /= 255;
    b /= 255;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0, s = 0, l = (max + min) / 2;

    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
        case g: h = ((b - r) / d + 2) / 6; break;
        case b: h = ((r - g) / d + 4) / 6; break;
      }
    }
    return [Math.round(h * 360), Math.round(s * 100), Math.round(l * 100)];
  }

  const handleEyedropper = async () => {
    if ('EyeDropper' in window) {
      try {
        // @ts-ignore - EyeDropper API
        const eyeDropper = new EyeDropper();
        const result = await eyeDropper.open();
        const color = result.sRGBHex;
        setCustomColor(color);
        setHexInput(color);
      } catch (e) {
        console.log('Eyedropper cancelled or not supported');
      }
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        {trigger}
      </PopoverTrigger>
      <PopoverContent className="w-[280px] p-0 bg-popover border shadow-lg z-50" align="start">
        {!showCustomPicker ? (
          <div className="p-3 space-y-3">
            {/* Recent Colors */}
            {recentColors.length > 0 && (
              <div>
                <p className="text-xs text-muted-foreground mb-2 font-medium">Recent colors</p>
                <div className="grid grid-cols-8 gap-1.5">
                  {recentColors.map((color, idx) => (
                    <button
                      key={`${color}-${idx}`}
                      onClick={() => handleColorClick(color)}
                      className="h-6 w-6 rounded border border-border hover:scale-110 hover:border-ring transition-all shadow-sm"
                      style={{ backgroundColor: color }}
                      title={color}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Theme Colors */}
            <div>
              <p className="text-xs text-muted-foreground mb-2 font-medium">Theme colors</p>
              <div className="grid grid-cols-10 gap-1.5">
                {THEME_COLORS.map((color, idx) => (
                  <button
                    key={`theme-${color}-${idx}`}
                    onClick={() => handleColorClick(color)}
                    className="h-6 w-6 rounded border border-border hover:scale-110 hover:border-ring transition-all shadow-sm"
                    style={{ backgroundColor: color }}
                    title={color}
                  />
                ))}
              </div>
            </div>

            {/* Standard Colors */}
            <div>
              <p className="text-xs text-muted-foreground mb-2 font-medium">Standard colors</p>
              <div className="grid grid-cols-10 gap-1.5">
                {STANDARD_COLORS.map((color, idx) => (
                  <button
                    key={`std-${color}-${idx}`}
                    onClick={() => handleColorClick(color)}
                    className="h-6 w-6 rounded border border-border hover:scale-110 hover:border-ring transition-all shadow-sm"
                    style={{ backgroundColor: color }}
                    title={color}
                  />
                ))}
              </div>
            </div>

            <Separator />

            {/* Custom Color Button */}
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() => setShowCustomPicker(true)}
            >
              Custom colors
            </Button>
          </div>
        ) : (
          <div className="p-3 space-y-3">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium">Custom color</p>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowCustomPicker(false)}
              >
                Back
              </Button>
            </div>

            {/* Color Picker */}
            <div className="flex justify-center">
              <HexColorPicker 
                color={customColor} 
                onChange={(color) => {
                  setCustomColor(color);
                  setHexInput(color);
                }}
                style={{ width: "100%", height: "180px" }}
              />
            </div>

            {/* Color Preview */}
            <div className="flex items-center gap-2">
              <div
                className="h-10 w-10 rounded border-2 border-border shadow-sm flex-shrink-0"
                style={{ backgroundColor: customColor }}
              />
              <div className="flex-1 space-y-1">
                <Label className="text-xs">Hex</Label>
                <Input
                  value={hexInput}
                  onChange={(e) => handleHexInputChange(e.target.value)}
                  className="h-8 text-xs font-mono"
                  placeholder="#000000"
                />
              </div>
            </div>

            {/* HSL Sliders */}
            <div className="space-y-2">
              <div>
                <div className="flex justify-between items-center mb-1">
                  <Label className="text-xs">Hue</Label>
                  <span className="text-xs text-muted-foreground">{hue}°</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="360"
                  value={hue}
                  onChange={(e) => {
                    const h = parseInt(e.target.value);
                    const newRgb = hslToRgb(h, saturation, lightness);
                    const hex = rgbToHex(newRgb.r, newRgb.g, newRgb.b);
                    setCustomColor(hex);
                    setHexInput(hex);
                  }}
                  className="w-full h-2 rounded-lg appearance-none cursor-pointer"
                  style={{
                    background: `linear-gradient(to right, 
                      hsl(0, ${saturation}%, ${lightness}%),
                      hsl(60, ${saturation}%, ${lightness}%),
                      hsl(120, ${saturation}%, ${lightness}%),
                      hsl(180, ${saturation}%, ${lightness}%),
                      hsl(240, ${saturation}%, ${lightness}%),
                      hsl(300, ${saturation}%, ${lightness}%),
                      hsl(360, ${saturation}%, ${lightness}%))`
                  }}
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <Label className="text-xs">Saturation</Label>
                  <span className="text-xs text-muted-foreground">{saturation}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={saturation}
                  onChange={(e) => {
                    const s = parseInt(e.target.value);
                    const newRgb = hslToRgb(hue, s, lightness);
                    const hex = rgbToHex(newRgb.r, newRgb.g, newRgb.b);
                    setCustomColor(hex);
                    setHexInput(hex);
                  }}
                  className="w-full h-2 rounded-lg appearance-none cursor-pointer"
                  style={{
                    background: `linear-gradient(to right, 
                      hsl(${hue}, 0%, ${lightness}%),
                      hsl(${hue}, 100%, ${lightness}%))`
                  }}
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <Label className="text-xs">Lightness</Label>
                  <span className="text-xs text-muted-foreground">{lightness}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={lightness}
                  onChange={(e) => {
                    const l = parseInt(e.target.value);
                    const newRgb = hslToRgb(hue, saturation, l);
                    const hex = rgbToHex(newRgb.r, newRgb.g, newRgb.b);
                    setCustomColor(hex);
                    setHexInput(hex);
                  }}
                  className="w-full h-2 rounded-lg appearance-none cursor-pointer"
                  style={{
                    background: `linear-gradient(to right, 
                      hsl(${hue}, ${saturation}%, 0%),
                      hsl(${hue}, ${saturation}%, 50%),
                      hsl(${hue}, ${saturation}%, 100%))`
                  }}
                />
              </div>
            </div>

            {/* RGB Inputs */}
            <div className="grid grid-cols-3 gap-2">
              <div>
                <Label className="text-xs">R</Label>
                <Input
                  type="number"
                  min="0"
                  max="255"
                  value={rgb.r}
                  onChange={(e) => {
                    const r = parseInt(e.target.value) || 0;
                    const hex = rgbToHex(r, rgb.g, rgb.b);
                    setCustomColor(hex);
                    setHexInput(hex);
                  }}
                  className="h-8 text-xs"
                />
              </div>
              <div>
                <Label className="text-xs">G</Label>
                <Input
                  type="number"
                  min="0"
                  max="255"
                  value={rgb.g}
                  onChange={(e) => {
                    const g = parseInt(e.target.value) || 0;
                    const hex = rgbToHex(rgb.r, g, rgb.b);
                    setCustomColor(hex);
                    setHexInput(hex);
                  }}
                  className="h-8 text-xs"
                />
              </div>
              <div>
                <Label className="text-xs">B</Label>
                <Input
                  type="number"
                  min="0"
                  max="255"
                  value={rgb.b}
                  onChange={(e) => {
                    const b = parseInt(e.target.value) || 0;
                    const hex = rgbToHex(rgb.r, rgb.g, b);
                    setCustomColor(hex);
                    setHexInput(hex);
                  }}
                  className="h-8 text-xs"
                />
              </div>
            </div>

            {/* Eyedropper */}
            {'EyeDropper' in window && (
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={handleEyedropper}
              >
                <Pipette className="h-4 w-4 mr-2" />
                Pick from screen
              </Button>
            )}

            <Separator />

            {/* Apply Button */}
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={() => setShowCustomPicker(false)}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                className="flex-1"
                onClick={handleCustomColorApply}
              >
                Apply
              </Button>
            </div>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
};

function hslToRgb(h: number, s: number, l: number) {
  s /= 100;
  l /= 100;
  const k = (n: number) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) =>
    l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  return {
    r: Math.round(255 * f(0)),
    g: Math.round(255 * f(8)),
    b: Math.round(255 * f(4))
  };
}
