import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger } from "@/components/ui/context-menu";

interface Tab {
  id: number;
  title: string;
  url: string;
  proxiedUrl: string;
  proxiedHtml?: string;
  history: string[];
  historyIndex: number;
  pinned?: boolean;
}

interface TabBarProps {
  tabs: Tab[];
  activeTabId: number;
  onTabSelect: (id: number) => void;
  onTabClose: (id: number) => void;
  onNewTab: () => void;
  onDuplicateTab: (id: number) => void;
  onCloseOthers: (id: number) => void;
  onCloseToRight: (id: number) => void;
  onPinTab: (id: number) => void;
}

export const TabBar = ({
  tabs,
  activeTabId,
  onTabSelect,
  onTabClose,
  onNewTab,
  onDuplicateTab,
  onCloseOthers,
  onCloseToRight,
  onPinTab,
}: TabBarProps) => {
  const maxTabs = 10;
  const canAddTab = tabs.length < maxTabs;
  
  const getTabWidth = () => {
    const tabCount = tabs.length;
    if (tabCount === 1) return "auto";
    if (tabCount <= 3) return "220px";
    if (tabCount <= 5) return "180px";
    if (tabCount <= 7) return "140px";
    return "100px";
  };

  return (
    <TooltipProvider>
      <div className="flex items-center gap-1">
        <div className="flex items-center gap-1 flex-1 min-w-0">
          {tabs.map((tab, index) => (
            <ContextMenu key={tab.id}>
              <ContextMenuTrigger>
                <div
                  className={`flex items-center gap-2 px-3 py-2 rounded-t-lg cursor-pointer group transition-all duration-200 animate-scale-in ${
                    activeTabId === tab.id 
                      ? 'bg-background shadow-sm border-b-2 border-primary' 
                      : 'bg-card hover:bg-muted'
                  } ${tab.pinned ? 'min-w-[60px] max-w-[60px]' : ''}`}
                  style={{ 
                    minWidth: tab.pinned ? '60px' : getTabWidth(), 
                    maxWidth: tab.pinned ? '60px' : getTabWidth() 
                  }}
                  onClick={() => onTabSelect(tab.id)}
                >
                {tab.url && (() => { 
                  try { 
                    const d = new URL(tab.url).hostname; 
                    return (<img src={`https://www.google.com/s2/favicons?domain=${d}`} alt="" className="h-4 w-4 flex-shrink-0" />); 
                  } catch { 
                    return null; 
                  } 
                })()}
                {!tab.pinned && <span className="flex-1 truncate text-sm">{tab.title}</span>}
                {tabs.length > 1 && !tab.pinned && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive/10 hover:text-destructive"
                    onClick={(e) => {
                      e.stopPropagation();
                      onTabClose(tab.id);
                    }}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                )}
              </div>
            </ContextMenuTrigger>
            <ContextMenuContent>
              <ContextMenuItem onClick={() => onDuplicateTab(tab.id)}>Duplicate Tab</ContextMenuItem>
              <ContextMenuItem onClick={() => onPinTab(tab.id)}>
                {tab.pinned ? 'Unpin Tab' : 'Pin Tab'}
              </ContextMenuItem>
              <ContextMenuItem onClick={() => onTabClose(tab.id)} disabled={tabs.length === 1}>
                Close Tab
              </ContextMenuItem>
              <ContextMenuItem onClick={() => onCloseOthers(tab.id)} disabled={tabs.length === 1}>
                Close Other Tabs
              </ContextMenuItem>
              <ContextMenuItem onClick={() => onCloseToRight(tab.id)} disabled={index === tabs.length - 1}>
                Close Tabs to the Right
              </ContextMenuItem>
            </ContextMenuContent>
          </ContextMenu>
        ))}
        </div>
        
        <Tooltip>
          <TooltipTrigger asChild>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8 flex-shrink-0 hover-scale" 
              onClick={onNewTab}
              disabled={!canAddTab}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            {canAddTab ? `New Tab (Alt+T)` : `Max ${maxTabs} tabs reached`}
          </TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  );
};
