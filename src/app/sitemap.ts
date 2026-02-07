import { MetadataRoute } from 'next';


export default function sitemap(): MetadataRoute.Sitemap {
    const baseUrl = process.env.NEXTAUTH_URL;
    return [
        { url: `${baseUrl}/`, lastModified: new Date() },
        { url: `${baseUrl}/privacy`, lastModified: new Date() },
        { url: `${baseUrl}/terms`, lastModified: new Date() },
        { url: `${baseUrl}/contact`, lastModified: new Date() },
        // Add more routes as needed
    ];
}