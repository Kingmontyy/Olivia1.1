import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface ReplaceFileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  coreFileType: string;
  existingFileName?: string;
  newFileName: string;
}

export function ReplaceFileDialog({
  open,
  onOpenChange,
  onConfirm,
  coreFileType,
  existingFileName,
  newFileName,
}: ReplaceFileDialogProps) {
  const coreFileLabels: Record<string, string> = {
    proforma: "Proforma",
    inventory_logistics: "Inventory Logistics",
    cashflow: "Cashflow",
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Replace Core File?</AlertDialogTitle>
          <AlertDialogDescription className="space-y-2">
            <p>
              You are about to replace the <strong>{coreFileLabels[coreFileType]}</strong> core file.
            </p>
            {existingFileName && (
              <p>
                Current: <span className="font-medium">{existingFileName}</span>
              </p>
            )}
            <p>
              New: <span className="font-medium">{newFileName}</span>
            </p>
            <p className="text-destructive font-semibold mt-4">
              Warning: Core files can only be updated by Olivia through connected APIs. 
              Are you sure you want to continue?
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>No</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm}>Yes, Replace</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
