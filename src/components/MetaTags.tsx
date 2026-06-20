import React, { useEffect } from 'react';

interface MetaTagsProps {
  title: string;
  description?: string;
  keywords?: string;
}

export const MetaTags: React.FC<MetaTagsProps> = ({ title, description, keywords }) => {
  useEffect(() => {
    // Set title
    const fullTitle = title ? `${title} | Remotoon` : 'Remotoon | JIT Component Studio';
    document.title = fullTitle;

    // Helper to update or create meta tags
    const updateMetaTag = (attributeName: string, attributeValue: string, contentValue: string) => {
      let element = document.querySelector(`meta[${attributeName}="${attributeValue}"]`);
      if (!element) {
        element = document.createElement('meta');
        element.setAttribute(attributeName, attributeValue);
        document.head.appendChild(element);
      }
      element.setAttribute('content', contentValue);
    };

    const defaultDesc = 'Remotion Editor - JIT Component Studio for creating dynamic videos with React';
    const finalDesc = description || defaultDesc;

    // Standard meta tags
    updateMetaTag('name', 'description', finalDesc);
    if (keywords) {
      updateMetaTag('name', 'keywords', keywords);
    }

    // Open Graph meta tags
    updateMetaTag('property', 'og:title', fullTitle);
    updateMetaTag('property', 'og:description', finalDesc);

    // Twitter card meta tags
    updateMetaTag('name', 'twitter:title', fullTitle);
    updateMetaTag('name', 'twitter:description', finalDesc);
  }, [title, description, keywords]);

  return null;
};
