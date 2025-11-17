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
import { Bug } from "lucide-react";
import { SiGithub } from "react-icons/si";
import informationData from "@/jsons/information.json";

export const ReportBugDialog = () => {
  const [open, setOpen] = useState(false);
  const [showEmailReport, setShowEmailReport] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [pageSection, setPageSection] = useState("");

  const handleGitHubReport = () => {
    window.open(informationData.github + "/issues/new", "_blank");
    setOpen(false);
  };

  const handleEmailSubmit = () => {
    const subject = `Bug Report: ${title}`;
    const body = `Bug Title: ${title}\n\nDescription:\n${description}\n\nPage/Section: ${pageSection || "Not specified"}`;
    const mailto = `mailto:${informationData.email}?subject=${encodeURIComponent(
      subject
    )}&body=${encodeURIComponent(body)}`;
    window.location.href = mailto;
    setOpen(false);
    setShowEmailReport(false);
    setTitle("");
    setDescription("");
    setPageSection("");
  };

  const handleBack = () => {
    setShowEmailReport(false);
    setTitle("");
    setDescription("");
    setPageSection("");
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      setOpen(isOpen);
      if (!isOpen) {
        setShowEmailReport(false);
        setTitle("");
        setDescription("");
        setPageSection("");
      }
    }}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Bug className="w-4 h-4" />
          Report Bug
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Report a Bug</DialogTitle>
          <DialogDescription>
            Help us improve Hideout by reporting any issues you encounter.
          </DialogDescription>
        </DialogHeader>

        {!showEmailReport ? (
          <div className="space-y-4 py-4">
            <Button
              onClick={handleGitHubReport}
              className="w-full h-auto flex-col gap-2 py-6"
            >
              <SiGithub className="w-8 h-8" />
              <div className="flex flex-col gap-1">
                <span className="font-semibold">Report on GitHub</span>
                <span className="text-xs opacity-80">Recommended</span>
              </div>
            </Button>
            
            <Button
              onClick={() => setShowEmailReport(true)}
              variant="outline"
              className="w-full"
            >
              Report via Email
            </Button>
          </div>
        ) : (
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="bug-title">Bug Title *</Label>
              <Input
                id="bug-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Brief description of the bug"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bug-description">Description *</Label>
              <Textarea
                id="bug-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Detailed description of the bug and steps to reproduce"
                rows={5}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="page-section">Page/Section (Optional)</Label>
              <Input
                id="page-section"
                value={pageSection}
                onChange={(e) => setPageSection(e.target.value)}
                placeholder="e.g., Games page, Browser, Home"
              />
            </div>
            <div className="flex gap-2">
              <Button
                onClick={handleBack}
                variant="outline"
                className="flex-1"
              >
                Back
              </Button>
              <Button
                onClick={handleEmailSubmit}
                disabled={!title || !description}
                className="flex-1"
              >
                Submit Bug Report
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
