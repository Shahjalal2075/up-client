// Upload-er age browser-ei chhoto kore (max 800px, JPEG) — tai fast upload ar kom data.
export async function resizeToDataUrl(file, maxSide = 800, maxLen = 900_000) {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise((res, rej) => {
      const i = new Image();
      i.onload = () => res(i);
      i.onerror = () => rej(new Error('ছবিটি পড়া যায়নি। অন্য ছবি দিন।'));
      i.src = url;
    });
    const scale = Math.min(1, maxSide / Math.max(img.width, img.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(img.width * scale);
    canvas.height = Math.round(img.height * scale);
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#fff'; // PNG-r transparent ongsho shada hobe
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    let q = 0.88;
    let out = canvas.toDataURL('image/jpeg', q);
    while (out.length > maxLen && q > 0.4) { q -= 0.1; out = canvas.toDataURL('image/jpeg', q); }
    return out;
  } finally {
    URL.revokeObjectURL(url);
  }
}
