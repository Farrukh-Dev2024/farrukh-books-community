'use client'
import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function ContactPage() {
    const mailtoRef = React.useRef<HTMLAnchorElement | null>(null);
    const email_link = "mailto:farrukhaleem.dev2024@gmail.com";

    const [formData, setFormData] = React.useState({
        name: "",
        email: "",
        message: "",
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (mailtoRef.current) {
            mailtoRef.current.href =
                email_link +
                "?subject=" +
                encodeURIComponent(formData.name + " has requested to contact") +
                "&body=" +
                encodeURIComponent(formData.message + "\n\nFrom: " + formData.email);

            mailtoRef.current.click();
        }
    };

    return (
        <main className="max-w-3xl mx-auto p-6 min-h-[80vh]">
            <h1 className="text-3xl font-bold mb-6">
                Contact Us
                <a hidden ref={mailtoRef} href={email_link}>Contact me using email.</a>
            </h1>

            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="name">Name</Label>
                    <Input
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        type="text"
                        placeholder="Your Name"
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        type="email"
                        placeholder="you@example.com"
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="message">Message</Label>
                    <textarea
                        id="message"
                        name="message"
                        value={formData.message}
                        onChange={handleChange}
                        className="w-full p-2 border rounded-md"
                        rows={5}
                        placeholder="Your message"
                    />
                </div>

                <Button type="submit">Send Message</Button>
            </form>
        </main>
    );
}
