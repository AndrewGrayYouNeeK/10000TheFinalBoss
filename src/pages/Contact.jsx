import React from "react";
import { Link } from "react-router-dom";
import { Mail, Twitter, MessageSquare } from "lucide-react";
import BackButton, { PAGE_HEADER_SAFE_STYLE } from "@/components/ui/BackButton";

export default function Contact() {
  return (
    <div className="min-h-screen bg-slate-950 text-white pb-16">
      <div
        className="sticky top-0 z-20 border-b border-slate-800 bg-slate-950/95 backdrop-blur px-4 pb-3"
        style={PAGE_HEADER_SAFE_STYLE}
      >
        <BackButton to="/" label="Back" />
      </div>
      <div className="max-w-2xl mx-auto p-6">
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