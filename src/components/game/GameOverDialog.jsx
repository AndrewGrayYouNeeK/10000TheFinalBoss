import React, { useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Trophy, RotateCcw, Home } from "lucide-react";
import confetti from "canvas-confetti";
import { Link } from "react-router-dom";

export default function GameOverDialog({ open, winner, onPlayAgain }) {
  useEffect(() => {
    if (open && winner) {
      const duration = 2500;
      const end = Date.now() + duration;
      (function frame() {
        confetti({ particleCount: 5, angle: 60, spread: 55, origin: { x: 0 } });
        confetti({ particleCount: 5, angle: 120, spread: 55, origin: { x: 1 } });
        if (Date.now() < end) requestAnimationFrame(frame);
      })();
    }
  }, [open, winner]);

  return (
    <Dialog open={open}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-center gap-2 text-2xl">
            <Trophy className="w-7 h-7 text-yellow-500" />
            Winner!
          </DialogTitle>
        </DialogHeader>
        <div className="text-center py-4">
          <div className="text-4xl font-black mb-2">{winner?.name}</div>
          <div className="text-lg text-muted-foreground">
            with {winner?.score.toLocaleString()} points
          </div>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline" className="flex-1">
            <Link to="/"><Home className="w-4 h-4 mr-2" />Home</Link>
          </Button>
          <Button onClick={onPlayAgain} className="flex-1">
            <RotateCcw className="w-4 h-4 mr-2" />Play Again
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}