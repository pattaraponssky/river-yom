// src/hooks/useFileLastModified.ts
import { useState, useEffect } from 'react';

const useFileLastModified = (url: string) => {
  const [lastModifiedDate, setLastModifiedDate] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLastModified = async () => {
      try {
        const response = await fetch(url, { method: 'HEAD' });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const lastModified = response.headers.get('Last-Modified');
        if (lastModified) {
          // You might need to format this date string as you wish
          const date = new Date(lastModified);
          setLastModifiedDate(date.toLocaleDateString('th-TH', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          }));
        } else {
          setError('Last-Modified header not found.');
        }
      } catch (e: any) {
        console.error("Failed to fetch file metadata:", e);
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };

    fetchLastModified();
  }, [url]);

  return { lastModifiedDate, loading, error };
};

export default useFileLastModified;