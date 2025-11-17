import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus } from "lucide-react";

const requestTypes = ["Game", "App", "Add-on", "Feature", "Theme"] as const;

const gameCategories = [
  "Action",
  "Adventure",
  "Arcade",
  "Classic",
  "Puzzle",
  "Racing",
  "Simulation",
  "Sports",
  "Strategy",
];

const appCategories = [
  "AI",
  "Education",
  "Entertainment",
  "Productivity",
  "Social",
  "Tools",
  "Utilities",
];

export const RequestGameDialog = ({ variant = "default" }: { variant?: "default" | "outline" }) => {
  const [open, setOpen] = useState(false);
  const [requestType, setRequestType] = useState<typeof requestTypes[number]>("Game");
  const [itemName, setItemName] = useState("");
  const [category, setCategory] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");
  const [description, setDescription] = useState("");

  const handleSubmit = () => {
    const subject = `${requestType} Request`;
    let body = `Request Type: ${requestType}\n`;
    
    // Dynamic field names based on type
    const itemLabel = requestType === "App" ? "App Name" : 
                     requestType === "Game" ? "Game Name" : 
                     requestType === "Theme" ? "Theme Name" :
                     `${requestType} Name`;
    const linkLabel = requestType === "App" ? "App Link" : 
                     requestType === "Game" ? "Game Link" : 
                     "Source URL";
    
    body += `${itemLabel}: ${itemName}\n`;
    
    if ((requestType === "Game" || requestType === "App") && category) {
      body += `Category: ${category}\n`;
    }
    
    if (sourceUrl) {
      body += `${linkLabel}: ${sourceUrl}\n`;
    }
    
    if (description) {
      body += `Description: ${description}`;
    }
    
    const mailto = `mailto:hideout-network-buisness@hotmail.com?subject=${encodeURIComponent(
      subject
    )}&body=${encodeURIComponent(body)}`;
    window.location.href = mailto;
    setOpen(false);
    setItemName("");
    setCategory("");
    setSourceUrl("");
    setDescription("");
    setRequestType("Game");
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant={variant} className="gap-2">
          <Plus className="w-4 h-4" />
          Request
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Submit a Request</DialogTitle>
          <DialogDescription>
            Request a game, app, add-on, or feature to be added to Hideout.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="request-type">Request Type *</Label>
            <Select value={requestType} onValueChange={(v) => setRequestType(v as typeof requestTypes[number])}>
              <SelectTrigger id="request-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {requestTypes.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="item-name">
              {requestType === "App" ? "App Name" : 
               requestType === "Game" ? "Game Name" : 
               requestType === "Theme" ? "Theme Name" :
               `${requestType} Name`} *
            </Label>
            <Input
              id="item-name"
              value={itemName}
              onChange={(e) => setItemName(e.target.value)}
              placeholder={`Enter ${requestType.toLowerCase()} name`}
            />
          </div>
          
          {(requestType === "Game" || requestType === "App") && (
            <div className="space-y-2">
              <Label htmlFor="category">Category *</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger id="category">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {(requestType === "Game" ? gameCategories : appCategories).map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          
          <div className="space-y-2">
            <Label htmlFor="source-url">
              {requestType === "App" ? "App Link (Optional)" : 
               requestType === "Game" ? "Game Link (Optional)" : 
               "Source URL (Optional)"}
            </Label>
            <Input
              id="source-url"
              value={sourceUrl}
              onChange={(e) => setSourceUrl(e.target.value)}
              placeholder="https://..."
              type="url"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Additional details..."
              rows={3}
            />
          </div>
        </div>
        <Button
          onClick={handleSubmit}
          disabled={!itemName || ((requestType === "Game" || requestType === "App") && !category)}
          className="w-full"
        >
          Submit Request
        </Button>
      </DialogContent>
    </Dialog>
  );
};
