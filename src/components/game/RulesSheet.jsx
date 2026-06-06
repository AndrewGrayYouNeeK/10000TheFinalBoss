import React from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { HelpCircle } from "lucide-react";

export default function RulesSheet() {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon">
          <HelpCircle className="w-5 h-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="bottom" className="rounded-t-3xl max-h-[85vh] overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="text-2xl">How to Play Dice 10,000</SheetTitle>
        </SheetHeader>
        <div className="space-y-4 pt-4 text-sm pb-8">
          <section>
            <h3 className="font-bold text-base mb-1">🎯 Goal</h3>
            <p>First player to reach <b>10,000 points</b> wins.</p>
          </section>
          <section>
            <h3 className="font-bold text-base mb-1">🎲 On Your Turn</h3>
            <ol className="list-decimal ml-5 space-y-1">
              <li>Roll all 6 dice.</li>
              <li>Select at least one scoring die to keep.</li>
              <li>Bank your points and end turn — or risk it and re-roll the remaining dice.</li>
              <li>If a roll has NO scoring dice → <b>YEEET! / SKEERT!</b> You lose all points this turn.</li>
              <li>If you score with all 6 dice → <b>Hot Dice!</b> Re-roll all 6 and keep adding.</li>
            </ol>
          </section>
          <section>
            <h3 className="font-bold text-base mb-1">🚪 Entry Rule</h3>
            <p>You must bank at least <b>1,000 points in a single turn</b> to get "on the board". Until then, banking less than 1,000 scores 0.</p>
          </section>
          <section>
            <h3 className="font-bold text-base mb-1">🏆 Scoring</h3>
            <ul className="space-y-1">
              <li>Single <b>1</b> = 100</li>
              <li>Single <b>5</b> = 50</li>
              <li>Three 1s = 1000 • Three 2s = 200 • Three 3s = 300</li>
              <li>Three 4s = 400 • Three 5s = 500 • Three 6s = 600</li>
              <li>Four of a kind = 2,000</li>
              <li>Five of a kind = 4,000</li>
              <li><b>Six of a kind = INSTANT WIN 🎉</b></li>
              <li>Small Straight (1-2-3-4-5 or 2-3-4-5-6) = 1000</li>
              <li>Large Straight (1-2-3-4-5-6) = 1500</li>
              <li>Three Pairs = 1500</li>
            </ul>
          </section>
        </div>
      </SheetContent>
    </Sheet>
  );
}