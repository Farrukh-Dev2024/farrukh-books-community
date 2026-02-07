// app/docs/page.tsx
import React from "react";
import { Metadata } from "next";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Farrukh-Books Documentation",
  description: "Learn how to use Farrukh-Books with tutorials and videos.",
};

export default function DocsPage() {
  return (
    <main className="min-h-screen w-full bg-background text-foreground px-6 py-12">
      <div className="max-w-4xl mx-auto space-y-8">
        <h1 className="text-3xl font-extrabold text-center">Farrukh-Books Docs</h1>
        <p className="text-center text-muted-foreground">
          Watch the tutorial below to get started quickly.
        </p>

        {/* YouTube Video */}
        <div className="w-full aspect-video rounded-lg overflow-hidden shadow-lg">
          <iframe
            width="100%"
            height="100%"
            src="https://www.youtube.com/embed/videoseries?si=up-zB3vvkn8eOlf3&amp;list=PLVjcvtsnAc0dHJyOGj87PUmNNLvgFoFas"
            title="Farrukh-Books Tutorial"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          ></iframe>
        </div>

        {/* Link to your channel */}
        <div className="text-center">
          <p className="text-muted-foreground mb-2">Learn more tutorials on my YouTube channel:</p>
          <Button asChild>
            <a
              href="https://www.youtube.com/@Farrukh-Dev2024"
              target="_blank"
              rel="noopener noreferrer"
            >
              Visit YouTube Channel
            </a>
          </Button>
        </div>
      </div>
    </main>
  );
}
