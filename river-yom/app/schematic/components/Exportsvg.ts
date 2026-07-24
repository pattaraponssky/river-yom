// lib/exportSvg.ts

/**
 * แปลง <image> ทุกตัวใน SVG clone ให้เป็น base64 data URI
 * เพื่อให้ export ได้แบบ self-contained ไม่ต้องพึ่งการโหลดรูปจาก network
 */
async function embedImages(svgEl: SVGSVGElement): Promise<void> {
  const images = Array.from(svgEl.querySelectorAll('image'));

  await Promise.all(
    images.map(async (imgEl) => {
      const href =
        imgEl.getAttribute('href') ||
        imgEl.getAttribute('xlink:href') ||
        imgEl.getAttributeNS('http://www.w3.org/1999/xlink', 'href');

      if (!href || href.startsWith('data:')) return; // ข้ามถ้าเป็น data URI อยู่แล้ว

      try {
        const dataUrl = await urlToDataUri(href);
        imgEl.setAttribute('href', dataUrl);
        imgEl.setAttributeNS('http://www.w3.org/1999/xlink', 'xlink:href', dataUrl);
      } catch (err) {
        console.warn('embedImages: โหลดรูปไม่สำเร็จ', href, err);
      }
    })
  );
}

function urlToDataUri(url: string): Promise<string> {
  return fetch(url, { mode: 'cors' })
    .then(res => {
      if (!res.ok) throw new Error(`fetch failed: ${res.status}`);
      return res.blob();
    })
    .then(
      blob =>
        new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        })
    );
}

/**
 * Export SVG element เป็นไฟล์ .svg
 */
export async function exportAsSvg(svgEl: SVGSVGElement, filename = 'schematic') {
  const clone = svgEl.cloneNode(true) as SVGSVGElement;

  await embedImages(clone); // ← ฝังรูปเป็น base64 ก่อน

  const style = document.createElementNS('http://www.w3.org/2000/svg', 'style');
  style.textContent = `@import url('https://fonts.googleapis.com/css2?family=Prompt:wght@400;500;700&display=swap');`;
  clone.insertBefore(style, clone.firstChild);

  const serializer = new XMLSerializer();
  const svgStr = serializer.serializeToString(clone);
  const blob = new Blob([svgStr], { type: 'image/svg+xml;charset=utf-8' });

  triggerDownload(URL.createObjectURL(blob), `${filename}.svg`);
}

/**
 * Export SVG element เป็นไฟล์ .png
 */
export async function exportAsPng(
  svgEl: SVGSVGElement,
  filename = 'schematic',
  scale = 2,
): Promise<void> {
  const bbox = svgEl.getBoundingClientRect();
  const width = bbox.width || svgEl.viewBox.baseVal.width;
  const height = bbox.height || svgEl.viewBox.baseVal.height;

  const clone = svgEl.cloneNode(true) as SVGSVGElement;
  clone.setAttribute('width', String(width));
  clone.setAttribute('height', String(height));

  await embedImages(clone); // ← ฝังรูปเป็น base64 ก่อน rasterize

  return new Promise((resolve, reject) => {
    const serializer = new XMLSerializer();
    const svgStr = serializer.serializeToString(clone);
    const svgBlob = new Blob([svgStr], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);

    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = width * scale;
      canvas.height = height * scale;

      const ctx = canvas.getContext('2d');
      if (!ctx) { reject(new Error('canvas context unavailable')); return; }

      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.scale(scale, scale);
      ctx.drawImage(img, 0, 0, width, height);

      URL.revokeObjectURL(url);

      canvas.toBlob(blob => {
        if (!blob) { reject(new Error('canvas toBlob failed')); return; }
        triggerDownload(URL.createObjectURL(blob), `${filename}.png`);
        resolve();
      }, 'image/png');
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('SVG image load failed'));
    };

    img.src = url;
  });
}

// ─── Internal helper ──────────────────────────────────────────

function triggerDownload(href: string, filename: string) {
  const a = document.createElement('a');
  a.href = href;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(href), 5000);
}