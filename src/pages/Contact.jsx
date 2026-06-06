import React from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Mail, Twitter, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Contact() {
  return (
    <div className="min-h-screen bg-slate-950 text-white p-6 pb-16">
      <div className="max-w-2xl mx-auto">
        <Button asChild variant="ghost" size="icon" className="text-white hover:bg-white/10 mb-6">
          <Link to="/"><ArrowLeft className="w-5 h-5" /></Link>
        </Button>

        <h1 className="text-3xl font-black mb-2 text-amber-400">Contact Us</h1>
        <p className="text-slate-400 mb-10">Have feedback, a bug report, or just want to say hi? We'd love to hear from you.</p>

        <div className="space-y-4">
          <a
            href="mailto:hello@dice10k.app"
            className="flex items-center gap-4 p-4 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition-colors"
          >
            <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center flex-shrink-0">
              <Mail className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <div className="font-bold text-white">Email</div>
              <div className="text-slate-400 text-sm">hello@dice10k.app</div>
            </div>
          </a>

          <a
            href="https://twitter.com/dice10k"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-4 p-4 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition-colors"
          >
            <div className="w-10 h-10 rounded-full bg-sky-500/20 flex items-center justify-center flex-shrink-0">
              <Twitter className="w-5 h-5 text-sky-400" />
            </div>
            <div>
              <div className="font-bold text-white">Twitter / X</div>
              <div className="text-slate-400 text-sm">@dice10k</div>
            </div>
          </a>

          <a
            href="https://discord.gg/dice10k"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-4 p-4 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition-colors"
          >
            <div className="w-10 h-10 rounded-full bg-indigo-500/20 flex items-center justify-center flex-shrink-0">
              <MessageSquare className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <div className="font-bold text-white">Discord Community</div>
              <div className="text-slate-400 text-sm">discord.gg/dice10k</div>
            </div>
          </a>
        </div>

        <div className="mt-10">
          <Link to="/about" className="text-amber-400 hover:underline text-sm font-semibold">About the app</Link>
        </div>
      </div>
    </div>
  );
}