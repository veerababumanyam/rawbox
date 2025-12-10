
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { Photo, Face } from "../types";

// Get model name from environment
const getModelName = () => {
    return import.meta.env.VITE_GEMINI_MODEL_FAST || 'gemini-2.5-flash';
};

// Initialize Gemini Client
const getAiClient = () => {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (!apiKey || apiKey === 'your-api-key-here') {
        throw new Error("VITE_GEMINI_API_KEY not set. Please add it to .env file.");
    }
    return new GoogleGenAI({ apiKey });
};

/**
 * Helper to fetch image and convert to base64
 */
const fetchImageAsBase64 = async (url: string): Promise<string> => {
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error("Failed to fetch image");
        const blob = await response.blob();
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => {
                const base64 = (reader.result as string).split(',')[1];
                resolve(base64);
            };
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    } catch (error) {
        console.error("Image fetch failed", error);
        throw error;
    }
};

/**
 * Analyzes a photo using Gemini 2.5 Flash to generate a caption and tags.
 */
export const analyzePhoto = async (photoUrl: string): Promise<{ description: string; tags: string[] }> => {
    try {
        const ai = getAiClient();

        // Attempt to fetch real image data
        let imagePart = null;
        try {
            const base64Data = await fetchImageAsBase64(photoUrl);
            imagePart = {
                inlineData: {
                    data: base64Data,
                    mimeType: "image/jpeg"
                }
            };
        } catch (e) {
            console.warn("Could not fetch image for analysis, falling back to text prompt only.");
        }

        const prompt = `Analyze this image. Generate a creative, elegant caption for a high-quality photography portfolio. Also provide 5 relevant hashtags.
    Return JSON format: { "description": "string", "tags": ["string"] }`;

        const contents = imagePart ? { parts: [imagePart, { text: prompt }] } : prompt;

        const response: GenerateContentResponse = await ai.models.generateContent({
            model: getModelName(),
            contents: contents,
            config: {
                responseMimeType: 'application/json'
            }
        });

        const text = response.text;
        if (!text) return { description: "Could not analyze image.", tags: [] };

        const data = JSON.parse(text);
        return {
            description: data.description || "No description available.",
            tags: data.tags || []
        };

    } catch (error) {
        console.error("Gemini analysis failed", error);
        return {
            description: "AI Analysis unavailable.",
            tags: []
        };
    }
};

/**
 * Smart Curation: Selects the best photos from a batch based on quality.
 */
export const curateBestPhotos = async (photos: Photo[]): Promise<string[]> => {
    try {
        const ai = getAiClient();

        // Limit batch size to avoid payload issues in this demo environment
        const samplePhotos = photos.slice(0, 4);
        const parts: any[] = [];

        for (const photo of samplePhotos) {
            try {
                const base64 = await fetchImageAsBase64(photo.thumbnailUrl); // Use thumbnail to save bandwidth
                parts.push({
                    inlineData: {
                        data: base64,
                        mimeType: "image/jpeg"
                    }
                });
                parts.push({ text: `Photo ID: ${photo.id}` });
            } catch (e) {
                console.warn(`Skipping photo ${photo.id} for curation due to fetch error.`);
            }
        }

        if (parts.length === 0) return [];

        parts.push({
            text: `Analyze these ${samplePhotos.length} photos for composition, lighting, focus, and emotional impact. 
            Select the top 50% best photos.
            Return JSON format: { "bestPhotoIds": ["id1", "id2"] }`
        });

        const response: GenerateContentResponse = await ai.models.generateContent({
            model: getModelName(),
            contents: { parts },
            config: {
                responseMimeType: 'application/json'
            }
        });

        const text = response.text;
        if (!text) return [];
        const data = JSON.parse(text);
        return data.bestPhotoIds || [];

    } catch (error) {
        console.error("Curation failed", error);
        return [];
    }
};

/**
 * Detects people in a photo and returns descriptive labels AND bounding boxes.
 */
export const detectPeople = async (photoUrl: string): Promise<{ people: string[]; faces: Face[] }> => {
    try {
        const ai = getAiClient();

        let imagePart = null;
        try {
            const base64Data = await fetchImageAsBase64(photoUrl);
            imagePart = {
                inlineData: {
                    data: base64Data,
                    mimeType: "image/jpeg"
                }
            };
        } catch (e) {
            console.warn("Could not fetch image for detection.");
            return { people: [], faces: [] };
        }

        const prompt = `Identify the distinct people in this image. 
        For each person detected, provide:
        1. A descriptive label (e.g., "Bride", "Groom", "Girl in Red Dress").
        2. A bounding box [ymin, xmin, ymax, xmax] with values normalized to 0-100 (percentages).
        
        Return JSON format: { "items": [{ "label": "string", "box_2d": [0,0,100,100] }] }`;

        const contents = { parts: [imagePart, { text: prompt }] };

        const response: GenerateContentResponse = await ai.models.generateContent({
            model: getModelName(),
            contents: contents,
            config: {
                responseMimeType: 'application/json'
            }
        });

        const text = response.text;
        if (!text) return { people: [], faces: [] };

        const data = JSON.parse(text);
        const items = data.items || [];

        // Extract unique labels for people list
        const people = Array.from(new Set(items.map((i: any) => i.label))) as string[];

        // Map to Face objects
        const faces: Face[] = items.map((item: any, index: number) => {
            const [ymin, xmin, ymax, xmax] = item.box_2d || [0, 0, 0, 0];
            return {
                id: `face-${Date.now()}-${index}`,
                box: {
                    y: ymin,
                    x: xmin,
                    h: ymax - ymin,
                    w: xmax - xmin
                },
                personId: item.label // Temporarily link label as ID for aggregation
            };
        });

        return { people, faces };
    } catch (error) {
        console.error("Person detection failed", error);
        return { people: [], faces: [] };
    }
}

/**
 * Generates a creative story/summary for an album based on photo metadata.
 * Priorities:
 * 1. User Inputs (customInstruction)
 * 2. Photo Context (keywords derived from selected or all photos)
 */
export const generateAlbumStory = async (
    albumTitle: string,
    clientName: string,
    keywords: string[],
    customInstruction?: string
): Promise<string> => {
    try {
        const ai = getAiClient();

        const baseContext = `You are a professional storyteller writing a blog post summary (approx 100 words) for a photography album.
        Album Title: "${albumTitle}"
        Client Name: "${clientName}"
        Contextual Keywords from Photos: ${keywords.join(', ')}.`;

        const userDirective = customInstruction
            ? `USER INSTRUCTION (Priority 1): "${customInstruction}". Follow this instruction strictly while using the context provided.`
            : `Directive: Write a professional, warm, and artistic summary capturing the emotion of the event.`;

        const prompt = `${baseContext}\n\n${userDirective}`;

        const response: GenerateContentResponse = await ai.models.generateContent({
            model: getModelName(),
            contents: prompt,
        });

        return response.text || "Could not generate story.";
    } catch (error) {
        console.error("Story generation failed", error);
        return "AI Story generation unavailable.";
    }
};

/**
 * Generates legal policies based on company details.
 */
export const generateLegalPolicy = async (
    type: 'Terms of Service' | 'Privacy Policy' | 'Refund Policy',
    company: { name: string; email: string; address: string; website: string; phone: string }
): Promise<string> => {
    try {
        const ai = getAiClient();

        const prompt = `
        You are a legal assistant for a photography business. 
        Write a professional, standard ${type}.
        
        Business Details:
        - Company Name: ${company.name || '[Company Name]'}
        - Address: ${company.address || '[Address]'}
        - Contact Email: ${company.email || '[Email]'}
        - Contact Phone: ${company.phone || '[Phone]'}
        - Website: ${company.website || '[Website]'}
        
        Context:
        The business uses a client gallery platform where clients can view, download, and purchase photos.
        
        Requirements:
        - Ensure the language is formal and legally sound for general jurisdictions.
        - Include standard clauses relevant to photography (copyright, usage rights, cancellations).
        - Format the output in clean text with spacing (no markdown symbols like # or *).
        - Keep it concise but comprehensive (approx 300-500 words).
        `;

        const response: GenerateContentResponse = await ai.models.generateContent({
            model: getModelName(),
            contents: prompt,
        });

        return response.text || "Could not generate policy.";
    } catch (error) {
        console.error("Policy generation failed", error);
        return "Service unavailable. Please try again later.";
    }
};

export const semanticSearch = async (query: string, photos: any[]): Promise<string[]> => {
    // Mock implementation for demo
    return photos.slice(0, 3).map(p => p.id);
}
