import { useEffect } from 'react';

export interface SEOHeadProps {
    title: string;
    description: string;
    ogImage?: string;
    ogUrl?: string;
    twitterCard?: 'summary' | 'summary_large_image';
    canonicalUrl?: string;
    keywords?: string;
    author?: string;
}

/**
 * SEOHead Component
 * 
 * Manages page-specific meta tags for SEO and social media sharing.
 * Updates document head dynamically for single-page applications.
 * 
 * @example
 * <SEOHead 
 *   title="Galleries | RawBox Studio"
 *   description="Browse professional photography galleries"
 *   ogImage="https://RawBox.studio/og-galleries.jpg"
 * />
 */
export const SEOHead: React.FC<SEOHeadProps> = ({
    title,
    description,
    ogImage,
    ogUrl,
    twitterCard = 'summary_large_image',
    canonicalUrl,
    keywords,
    author,
}) => {
    useEffect(() => {
        // Update document title
        document.title = title;

        // Helper function to update or create meta tag
        const updateMetaTag = (property: string, content: string, isProperty = false) => {
            const attribute = isProperty ? 'property' : 'name';
            let element = document.querySelector(`meta[${attribute}="${property}"]`);

            if (!element) {
                element = document.createElement('meta');
                element.setAttribute(attribute, property);
                document.head.appendChild(element);
            }

            element.setAttribute('content', content);
        };

        // Update basic meta tags
        updateMetaTag('description', description);

        if (keywords) {
            updateMetaTag('keywords', keywords);
        }

        if (author) {
            updateMetaTag('author', author);
        }

        // Update Open Graph tags
        updateMetaTag('og:title', title, true);
        updateMetaTag('og:description', description, true);
        updateMetaTag('og:type', 'website', true);

        if (ogImage) {
            updateMetaTag('og:image', ogImage, true);
        }

        if (ogUrl) {
            updateMetaTag('og:url', ogUrl, true);
        }

        // Update Twitter Card tags
        updateMetaTag('twitter:card', twitterCard);
        updateMetaTag('twitter:title', title);
        updateMetaTag('twitter:description', description);

        if (ogImage) {
            updateMetaTag('twitter:image', ogImage);
        }

        // Update canonical URL
        if (canonicalUrl) {
            let linkElement = document.querySelector('link[rel="canonical"]');

            if (!linkElement) {
                linkElement = document.createElement('link');
                linkElement.setAttribute('rel', 'canonical');
                document.head.appendChild(linkElement);
            }

            linkElement.setAttribute('href', canonicalUrl);
        }

        // Cleanup function (optional - meta tags typically persist)
        return () => {
            // Meta tags are intentionally left in place for SPA navigation
            // They will be updated on next SEOHead render
        };
    }, [title, description, ogImage, ogUrl, twitterCard, canonicalUrl, keywords, author]);

    // This component doesn't render anything visible
    return null;
};
