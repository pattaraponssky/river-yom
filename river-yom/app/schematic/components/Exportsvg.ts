// lib/exportSvg.ts

/**
 * Export SVG element เป็นไฟล์ .svg
 * @param svgEl  — ref.current ของ <svg>
 * @param filename — ชื่อไฟล์ (ไม่ต้องใส่นามสกุล)
 */
export function exportAsSvg(svgEl: SVGSVGElement, filename = 'schematic') {
  // clone เพื่อไม่กระทบ DOM จริง
  const clone = svgEl.cloneNode(true) as SVGSVGElement;

  // ฝัง font Prompt เผื่อ viewer อื่นอ่านได้
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
 * @param svgEl    — ref.current ของ <svg>
 * @param filename — ชื่อไฟล์ (ไม่ต้องใส่นามสกุล)
 * @param scale    — ความละเอียด (default 2 = 2x / Retina)
 */
export function exportAsPng(
  svgEl: SVGSVGElement,
  filename = 'schematic',
  scale = 2,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const bbox   = svgEl.getBoundingClientRect();
    const width  = bbox.width  || svgEl.viewBox.baseVal.width;
    const height = bbox.height || svgEl.viewBox.baseVal.height;

    const clone = svgEl.cloneNode(true) as SVGSVGElement;
    clone.setAttribute('width',  String(width));
    clone.setAttribute('height', String(height));

    const serializer = new XMLSerializer();
    const svgStr  = serializer.serializeToString(clone);
    const svgBlob = new Blob([svgStr], { type: 'image/svg+xml;charset=utf-8' });
    const url     = URL.createObjectURL(svgBlob);

    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width  = width  * scale;
      canvas.height = height * scale;

      const ctx = canvas.getContext('2d');
      if (!ctx) { reject(new Error('canvas context unavailable')); return; }

      // พื้นหลังสีขาว (PNG โปร่งใสอาจดูแปลกใน viewer)
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
  a.href     = href;
  a.download = filename;
  a.click();
  // cleanup หลัง browser จัดการ download
  setTimeout(() => URL.revokeObjectURL(href), 5000);
}