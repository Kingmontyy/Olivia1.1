import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import {
  Undo,
  Redo,
  Printer,
  Paintbrush,
  ZoomIn,
  DollarSign,
  Percent,
  Hash,
  Bold,
  Italic,
  Strikethrough,
  Palette,
  PaintBucket,
  Grid3x3,
  Combine,
  AlignLeft,
  AlignCenter,
  AlignRight,
  WrapText,
  RotateCw,
  Link,
  MessageSquare,
  BarChart3,
  Filter,
  FunctionSquare,
} from "lucide-react";
import { toast } from "sonner";

interface FormattingToolbarProps {
  onUndo: () => void;
  onRedo: () => void;
  onBold: () => void;
  onItalic: () => void;
  onAlignment: (alignment: "left" | "center" | "right") => void;
  onFillColor: (color: string) => void;
  onTextColor: (color: string) => void;
}

export const FormattingToolbar = ({
  onUndo,
  onRedo,
  onBold,
  onItalic,
  onAlignment,
  onFillColor,
  onTextColor,
}: FormattingToolbarProps) => {
  const handleMock = (feature: string) => {
    toast.info(`${feature} - Coming soon`);
  };

  const colorOptions = [
    { name: 'red', hex: '#ef4444' },
    { name: 'blue', hex: '#3b82f6' },
    { name: 'green', hex: '#22c55e' },
    { name: 'yellow', hex: '#eab308' },
    { name: 'purple', hex: '#a855f7' },
    { name: 'orange', hex: '#f97316' },
    { name: 'pink', hex: '#ec4899' },
    { name: 'gray', hex: '#6b7280' },
    { name: 'black', hex: '#000000' },
    { name: 'white', hex: '#ffffff' },
  ];

  return (
    <div className="flex items-center gap-1 px-2 py-1.5 border-b bg-muted/30 flex-wrap">
      {/* Undo/Redo */}
      <Button
        variant="ghost"
        size="sm"
        onClick={onUndo}
        title="Undo"
        className="h-8 w-8 p-0"
      >
        <Undo className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={onRedo}
        title="Redo"
        className="h-8 w-8 p-0"
      >
        <Redo className="h-4 w-4" />
      </Button>

      <Button
        variant="ghost"
        size="sm"
        onClick={() => window.print()}
        title="Print"
        className="h-8 w-8 p-0"
      >
        <Printer className="h-4 w-4" />
      </Button>

      <Button
        variant="ghost"
        size="sm"
        onClick={() => handleMock("Paint format")}
        title="Paint format"
        className="h-8 w-8 p-0"
      >
        <Paintbrush className="h-4 w-4" />
      </Button>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" title="Zoom" className="h-8 w-8 p-0">
            <ZoomIn className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem onClick={() => handleMock("50%")}>50%</DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleMock("75%")}>75%</DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleMock("90%")}>90%</DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleMock("100%")}>100%</DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleMock("125%")}>125%</DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleMock("150%")}>150%</DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleMock("200%")}>200%</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Separator orientation="vertical" className="h-6 mx-1" />

      {/* Number Formatting */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => handleMock("Format as currency")}
        title="Format as currency"
        className="h-8 w-8 p-0"
      >
        <DollarSign className="h-4 w-4" />
      </Button>

      <Button
        variant="ghost"
        size="sm"
        onClick={() => handleMock("Format as percentage")}
        title="Format as percentage"
        className="h-8 w-8 p-0"
      >
        <Percent className="h-4 w-4" />
      </Button>

      <Button
        variant="ghost"
        size="sm"
        onClick={() => handleMock("Decrease decimal places")}
        title="Decrease decimal places"
        className="h-8 w-8 p-0"
      >
        .0
      </Button>

      <Button
        variant="ghost"
        size="sm"
        onClick={() => handleMock("Increase decimal places")}
        title="Increase decimal places"
        className="h-8 w-8 p-0"
      >
        .00
      </Button>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" title="More formats" className="h-8 w-8 p-0">
            <Hash className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem onClick={() => handleMock("Number")}>Number</DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleMock("Date")}>Date</DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleMock("Time")}>Time</DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleMock("Scientific")}>
            Scientific
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleMock("Custom")}>Custom</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Separator orientation="vertical" className="h-6 mx-1" />

      {/* Font Controls */}
      <Select defaultValue="inter">
        <SelectTrigger className="h-8 w-32">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="inter">Inter</SelectItem>
          <SelectItem value="arial">Arial</SelectItem>
          <SelectItem value="calibri">Calibri</SelectItem>
          <SelectItem value="times">Times New Roman</SelectItem>
          <SelectItem value="courier">Courier</SelectItem>
        </SelectContent>
      </Select>

      <Button
        variant="ghost"
        size="sm"
        onClick={() => handleMock("Decrease font size")}
        title="Decrease font size"
        className="h-8 px-2 text-xs"
      >
        A-
      </Button>

      <Button
        variant="ghost"
        size="sm"
        onClick={() => handleMock("Increase font size")}
        title="Increase font size"
        className="h-8 px-2 text-xs"
      >
        A+
      </Button>

      <Separator orientation="vertical" className="h-6 mx-1" />

      {/* Text Formatting */}
      <Button
        variant="ghost"
        size="sm"
        onClick={onBold}
        title="Bold"
        className="h-8 w-8 p-0 font-bold"
      >
        <Bold className="h-4 w-4" />
      </Button>

      <Button
        variant="ghost"
        size="sm"
        onClick={onItalic}
        title="Italic"
        className="h-8 w-8 p-0 italic"
      >
        <Italic className="h-4 w-4" />
      </Button>

      <Button
        variant="ghost"
        size="sm"
        onClick={() => handleMock("Strikethrough")}
        title="Strikethrough"
        className="h-8 w-8 p-0"
      >
        <Strikethrough className="h-4 w-4" />
      </Button>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" title="Text color" className="h-8 w-8 p-0">
            <Palette className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <div className="grid grid-cols-5 gap-2 p-2">
            {colorOptions.map((color) => (
              <button
                key={color.name}
                onClick={() => onTextColor(color.hex)}
                className="h-6 w-6 rounded border border-border hover:scale-110 transition-transform"
                style={{ backgroundColor: color.hex }}
                title={color.name}
              />
            ))}
          </div>
        </DropdownMenuContent>
      </DropdownMenu>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" title="Fill color" className="h-8 w-8 p-0">
            <PaintBucket className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <div className="grid grid-cols-5 gap-2 p-2">
            {colorOptions.map((color) => (
              <button
                key={color.name}
                onClick={() => onFillColor(color.hex)}
                className="h-6 w-6 rounded border border-border hover:scale-110 transition-transform"
                style={{ backgroundColor: color.hex }}
                title={color.name}
              />
            ))}
          </div>
        </DropdownMenuContent>
      </DropdownMenu>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" title="Borders" className="h-8 w-8 p-0">
            <Grid3x3 className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem onClick={() => handleMock("All borders")}>
            All borders
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleMock("Outer borders")}>
            Outer borders
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleMock("Inner borders")}>
            Inner borders
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleMock("No borders")}>
            No borders
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" title="Merge cells" className="h-8 w-8 p-0">
            <Combine className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem onClick={() => handleMock("Merge all")}>
            Merge all
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleMock("Merge horizontally")}>
            Merge horizontally
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleMock("Merge vertically")}>
            Merge vertically
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleMock("Unmerge")}>Unmerge</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Separator orientation="vertical" className="h-6 mx-1" />

      {/* Alignment */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" title="Alignment" className="h-8 w-8 p-0">
            <AlignLeft className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem onClick={() => onAlignment("left")}>
            <AlignLeft className="mr-2 h-4 w-4" />
            Left
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onAlignment("center")}>
            <AlignCenter className="mr-2 h-4 w-4" />
            Center
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onAlignment("right")}>
            <AlignRight className="mr-2 h-4 w-4" />
            Right
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" title="Text wrapping" className="h-8 w-8 p-0">
            <WrapText className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem onClick={() => handleMock("Overflow")}>Overflow</DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleMock("Wrap")}>Wrap</DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleMock("Clip")}>Clip</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" title="Text rotation" className="h-8 w-8 p-0">
            <RotateCw className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem onClick={() => handleMock("None")}>None</DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleMock("Tilt up")}>Tilt up</DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleMock("Tilt down")}>Tilt down</DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleMock("Stack")}>Stack</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Separator orientation="vertical" className="h-6 mx-1" />

      {/* Insert Tools */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => handleMock("Insert link")}
        title="Insert link"
        className="h-8 w-8 p-0"
      >
        <Link className="h-4 w-4" />
      </Button>

      <Button
        variant="ghost"
        size="sm"
        onClick={() => handleMock("Insert comment")}
        title="Insert comment"
        className="h-8 w-8 p-0"
      >
        <MessageSquare className="h-4 w-4" />
      </Button>

      <Button
        variant="ghost"
        size="sm"
        onClick={() => handleMock("Insert chart")}
        title="Insert chart"
        className="h-8 w-8 p-0"
      >
        <BarChart3 className="h-4 w-4" />
      </Button>

      <Button
        variant="ghost"
        size="sm"
        onClick={() => handleMock("Filter")}
        title="Create filter"
        className="h-8 w-8 p-0"
      >
        <Filter className="h-4 w-4" />
      </Button>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" title="Functions" className="h-8 w-8 p-0">
            <FunctionSquare className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem onClick={() => handleMock("SUM")}>SUM</DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleMock("AVERAGE")}>AVERAGE</DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleMock("COUNT")}>COUNT</DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleMock("MAX")}>MAX</DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleMock("MIN")}>MIN</DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleMock("IF")}>IF</DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleMock("VLOOKUP")}>VLOOKUP</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};
