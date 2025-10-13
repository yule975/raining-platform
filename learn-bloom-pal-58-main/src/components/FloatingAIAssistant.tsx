import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Bot, MessageCircle, X } from "lucide-react";
import SmartAssistant from "./SmartAssistant";

export default function FloatingAIAssistant() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Floating Action Button */}
      <div className="fixed bottom-6 right-6 z-50">
        <Button
          size="lg"
          className="w-16 h-16 rounded-full bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg hover:shadow-xl transition-all duration-300"
          onClick={() => setIsOpen(true)}
        >
          <Bot className="h-8 w-8 text-primary-foreground" />
        </Button>
      </div>

      {/* AI Assistant Dialog */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-3xl h-[600px] p-0">
          <DialogHeader className="p-6 pb-0">
            <DialogTitle className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                <Bot className="h-6 w-6 text-primary" />
              </div>
              <span className="text-lg font-medium text-foreground">智能伙伴</span>
              <Button
                variant="ghost"
                size="sm"
                className="ml-auto"
                onClick={() => setIsOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 p-6 pt-0">
            <SmartAssistant />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}