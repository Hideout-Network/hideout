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
import { Plus } from "lucide-react";

const appCategories = [
  "AI",
  "Education",
  "Entertainment",
  "Productivity",
  "Social",
  "Tools",
  "Utilities",
];

export const RequestAppDialog = () => {
  const [open, setOpen] = useState(false);
  const [appName, setAppName] = useState("");
  const [category, setCategory] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");
  const [description, setDescription] = useState("");

  const handleSubmit = () => {
    const subject = "App Request";
    let body = `Request Type: App\nName: ${appName}\n`;
    
    if (category) {
      body += `Category: ${category}\n`;
    }
    
    if (sourceUrl) {
      body += `Source URL: ${sourceUrl}\n`;
    }
    
    if (description) {
      body += `Description: ${description}`;
    }
    
    const mailto = `mailto:hideout-network-buisness@hotmail.com?subject=${encodeURIComponent(
      subject
    )}&body=${encodeURIComponent(body)}`;
    window.location.href = mailto;
    setOpen(false);
    setAppName("");
    setCategory("");
    setSourceUrl("");
    setDescription("");
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="w-4 h-4" />
          Request App
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Request an App</DialogTitle>
          <DialogDescription>
            Request an app to be added to Hideout.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="app-name">App Name *</Label>
            <Input
              id="app-name"
              value={appName}
              onChange={(e) => setAppName(e.target.value)}
              placeholder="Enter app name"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="category">Category (Optional)</Label>
            <Input
              id="category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="e.g., Productivity, Social, etc."
              list="app-categories"
            />
            <datalist id="app-categories">
              {appCategories.map((cat) => (
                <option key={cat} value={cat} />
              ))}
            </datalist>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="source-url">Source URL (Optional)</Label>
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
          disabled={!appName}
          className="w-full"
        >
          Submit Request
        </Button>
      </DialogContent>
    </Dialog>
  );
};
