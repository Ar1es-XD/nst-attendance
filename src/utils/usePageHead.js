import { useEffect } from 'react';

const CANONICAL_BASE = 'https://nst-attendance.vercel.app';

export function usePageHead({
  title,
  description,
  path = '',
  image = '/og-image.png'
}) {
  useEffect(() => {
    // 1. Dynamic Title (Never include "Vite" or "React")
    const fullTitle = title
      ? `${title} | Newton School Attendance Tracker`
      : 'Newton School Attendance Tracker | Smart Bunk & Class Planner';
    document.title = fullTitle;

    // 2. Meta Description
    let metaDesc = document.querySelector('meta[name="description"]');
    if (!metaDesc) {
      metaDesc = document.createElement('meta');
      metaDesc.setAttribute('name', 'description');
      document.head.appendChild(metaDesc);
    }
    const cleanDesc = description || 'Newton School of Technology Attendance Tracker: Calculate bunk capacity with mathematical certainty, monitor lecture ledger, and simulate schedules.';
    metaDesc.setAttribute('content', cleanDesc);

    // 3. Canonical Tag
    let canonicalLink = document.querySelector('link[rel="canonical"]');
    if (!canonicalLink) {
      canonicalLink = document.createElement('link');
      canonicalLink.setAttribute('rel', 'canonical');
      document.head.appendChild(canonicalLink);
    }
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    const fullCanonical = `${CANONICAL_BASE}${cleanPath === '/' ? '' : cleanPath}`;
    canonicalLink.setAttribute('href', fullCanonical);

    // 4. Open Graph Tags
    const ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle) ogTitle.setAttribute('content', fullTitle);

    const ogDesc = document.querySelector('meta[property="og:description"]');
    if (ogDesc) ogDesc.setAttribute('content', cleanDesc);

    const ogUrl = document.querySelector('meta[property="og:url"]');
    if (ogUrl) ogUrl.setAttribute('content', fullCanonical);

    const ogImage = document.querySelector('meta[property="og:image"]');
    if (ogImage) {
      const fullImgUrl = image.startsWith('http') ? image : `${CANONICAL_BASE}${image}`;
      ogImage.setAttribute('content', fullImgUrl);
    }

    // 5. Twitter Card Tags
    const twitterTitle = document.querySelector('meta[name="twitter:title"]');
    if (twitterTitle) twitterTitle.setAttribute('content', fullTitle);

    const twitterDesc = document.querySelector('meta[name="twitter:description"]');
    if (twitterDesc) twitterDesc.setAttribute('content', cleanDesc);

    const twitterUrl = document.querySelector('meta[name="twitter:url"]');
    if (twitterUrl) twitterUrl.setAttribute('content', fullCanonical);
  }, [title, description, path, image]);
}
