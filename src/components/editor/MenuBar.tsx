import { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface MenuBarProps {
  onSave: () => void;
  onExport: () => void;
  onClose: () => void;
  onRename: () => void;
  onDelete: () => void;
  onUndo: () => void;
  onRedo: () => void;
  onToggleGridlines: () => void;
  onToggleFormulaBar: () => void;
}

export const MenuBar = ({
  onSave,
  onExport,
  onClose,
  onRename,
  onDelete,
  onUndo,
  onRedo,
  onToggleGridlines,
  onToggleFormulaBar,
}: MenuBarProps) => {
  const handleMock = (feature: string) => {
    toast.info(`${feature} - Coming soon`);
  };

  return (
    <div className="flex items-center gap-1 px-2 py-1 border-b bg-background">
      {/* File Menu */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="h-8 px-3 text-sm font-normal">
            File
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-56">
          <DropdownMenuItem onClick={() => handleMock("New sheet")}>
            New sheet
          </DropdownMenuItem>
          <DropdownMenuItem onClick={onClose}>Open</DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleMock("Make a copy")}>
            Make a copy
          </DropdownMenuItem>
          <DropdownMenuItem onClick={onRename}>Rename</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={onExport}>Download (.xlsx)</DropdownMenuItem>
          <DropdownMenuItem onClick={() => window.print()}>Print</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => handleMock("Share")}>
            Share
          </DropdownMenuItem>
          <DropdownMenuItem onClick={onDelete} className="text-destructive">
            Move to trash
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => handleMock("Version history")}>
            Version history
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Edit Menu */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="h-8 px-3 text-sm font-normal">
            Edit
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-56">
          <DropdownMenuItem onClick={onUndo}>Undo</DropdownMenuItem>
          <DropdownMenuItem onClick={onRedo}>Redo</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => handleMock("Cut")}>Cut</DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleMock("Copy")}>Copy</DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleMock("Paste")}>Paste</DropdownMenuItem>
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>Paste special</DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              <DropdownMenuItem onClick={() => handleMock("Paste values")}>
                Values only
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleMock("Paste format")}>
                Format only
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleMock("Paste formulas")}>
                Formulas only
              </DropdownMenuItem>
            </DropdownMenuSubContent>
          </DropdownMenuSub>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => handleMock("Find and replace")}>
            Find and replace
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>Delete</DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              <DropdownMenuItem onClick={() => handleMock("Delete cells")}>
                Cells
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleMock("Delete row")}>
                Row
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleMock("Delete column")}>
                Column
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleMock("Delete sheet")}>
                Sheet
              </DropdownMenuItem>
            </DropdownMenuSubContent>
          </DropdownMenuSub>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* View Menu */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="h-8 px-3 text-sm font-normal">
            View
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-56">
          <DropdownMenuItem onClick={onToggleGridlines}>
            Toggle gridlines
          </DropdownMenuItem>
          <DropdownMenuItem onClick={onToggleFormulaBar}>
            Toggle formula bar
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>Freeze</DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              <DropdownMenuItem onClick={() => handleMock("Freeze 1 row")}>
                1 row
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleMock("Freeze 2 rows")}>
                2 rows
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleMock("Freeze 1 column")}>
                1 column
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleMock("Freeze 2 columns")}>
                2 columns
              </DropdownMenuItem>
            </DropdownMenuSubContent>
          </DropdownMenuSub>
          <DropdownMenuItem onClick={() => handleMock("Hidden sheets")}>
            Show hidden sheets
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => handleMock("Full screen")}>
            Full screen
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Insert Menu */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="h-8 px-3 text-sm font-normal">
            Insert
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-56">
          <DropdownMenuItem onClick={() => handleMock("Insert row above")}>
            Row above
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleMock("Insert row below")}>
            Row below
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleMock("Insert column left")}>
            Column left
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleMock("Insert column right")}>
            Column right
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => handleMock("Insert cells")}>
            Cells
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleMock("Insert image")}>
            Image
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleMock("Insert chart")}>
            Chart
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleMock("Insert link")}>
            Link
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => handleMock("Insert comment")}>
            Comment
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleMock("Insert note")}>
            Note
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleMock("Insert function")}>
            Function
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleMock("Insert drawing")}>
            Drawing
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleMock("Insert checkbox")}>
            Checkbox
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleMock("Insert dropdown")}>
            Dropdown
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Format Menu */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="h-8 px-3 text-sm font-normal">
            Format
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-56">
          <DropdownMenuItem onClick={() => handleMock("Bold")}>Bold</DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleMock("Italic")}>Italic</DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleMock("Strikethrough")}>
            Strikethrough
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => handleMock("Text color")}>
            Text color
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleMock("Fill color")}>
            Fill color
          </DropdownMenuItem>
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>Borders</DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
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
            </DropdownMenuSubContent>
          </DropdownMenuSub>
          <DropdownMenuSeparator />
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>Merge cells</DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              <DropdownMenuItem onClick={() => handleMock("Merge all")}>
                Merge all
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleMock("Merge horizontally")}>
                Merge horizontally
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleMock("Merge vertically")}>
                Merge vertically
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleMock("Unmerge")}>
                Unmerge
              </DropdownMenuItem>
            </DropdownMenuSubContent>
          </DropdownMenuSub>
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>Wrap text</DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              <DropdownMenuItem onClick={() => handleMock("Overflow")}>
                Overflow
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleMock("Wrap")}>
                Wrap
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleMock("Clip")}>
                Clip
              </DropdownMenuItem>
            </DropdownMenuSubContent>
          </DropdownMenuSub>
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>Alignment</DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              <DropdownMenuItem onClick={() => handleMock("Align left")}>
                Left
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleMock("Align center")}>
                Center
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleMock("Align right")}>
                Right
              </DropdownMenuItem>
            </DropdownMenuSubContent>
          </DropdownMenuSub>
          <DropdownMenuSeparator />
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>Number format</DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              <DropdownMenuItem onClick={() => handleMock("Number")}>
                Number
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleMock("Currency")}>
                Currency
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleMock("Date")}>
                Date
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleMock("Time")}>
                Time
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleMock("Percentage")}>
                Percentage
              </DropdownMenuItem>
            </DropdownMenuSubContent>
          </DropdownMenuSub>
          <DropdownMenuItem onClick={() => handleMock("Conditional formatting")}>
            Conditional formatting
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleMock("Alternating colors")}>
            Alternating colors
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => handleMock("Clear formatting")}>
            Clear formatting
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Data Menu */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="h-8 px-3 text-sm font-normal">
            Data
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-56">
          <DropdownMenuItem onClick={() => handleMock("Sort A-Z")}>
            Sort A-Z
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleMock("Sort Z-A")}>
            Sort Z-A
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => handleMock("Create filter")}>
            Create filter
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleMock("Filter views")}>
            Filter views
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => handleMock("Pivot table")}>
            Pivot table
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleMock("Slicer")}>
            Slicer
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleMock("Data validation")}>
            Data validation
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleMock("Protect sheet")}>
            Protect sheet
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>Data cleanup</DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              <DropdownMenuItem onClick={() => handleMock("Remove duplicates")}>
                Remove duplicates
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleMock("Trim whitespace")}>
                Trim whitespace
              </DropdownMenuItem>
            </DropdownMenuSubContent>
          </DropdownMenuSub>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Tools Menu */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="h-8 px-3 text-sm font-normal">
            Tools
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-56">
          <DropdownMenuItem onClick={() => handleMock("Spelling")}>
            Spelling
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleMock("Notification rules")}>
            Notification rules
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleMock("Accessibility")}>
            Accessibility
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => handleMock("Script editor")}>
            Script editor
          </DropdownMenuItem>
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>Macros</DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              <DropdownMenuItem onClick={() => handleMock("Record macro")}>
                Record macro
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleMock("Play macro")}>
                Play macro
              </DropdownMenuItem>
            </DropdownMenuSubContent>
          </DropdownMenuSub>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Extensions Menu */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="h-8 px-3 text-sm font-normal">
            Extensions
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-56">
          <DropdownMenuItem onClick={() => handleMock("Add-ons")}>
            Add-ons
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleMock("Apps Script")}>
            Apps Script
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Help Menu */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="h-8 px-3 text-sm font-normal">
            Help
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-56">
          <DropdownMenuItem onClick={() => handleMock("Search help")}>
            Search help
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleMock("Training")}>
            Training
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleMock("Updates")}>
            Updates
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => handleMock("Keyboard shortcuts")}>
            Keyboard shortcuts
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleMock("Report issue")}>
            Report issue
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};
