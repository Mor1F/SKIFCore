const fileInput = document.getElementById('fileInput');
const sourceImage = document.getElementById('sourceImage');
const previewContent = document.getElementById('previewContent');
const dropContent = document.getElementById('dropContent');
const resultsSection = document.getElementById('resultsSection');
const htmlCode = document.getElementById('htmlCode');
const toast = document.getElementById('toast');

let uploadedFile = null;
let imageSource = null; // <img> или ImageBitmap
let isSVG = false;

fileInput.addEventListener('change', async e => {
    uploadedFile = e.target.files[0];
    if (!uploadedFile) return;

    isSVG = uploadedFile.type === 'image/svg+xml';

    const url = URL.createObjectURL(uploadedFile);
    sourceImage.src = url;

    if (isSVG) {
        imageSource = await loadSvgAsImage(url);
    } else {
        imageSource = await createImageBitmap(uploadedFile);
    }

    dropContent.style.display = 'none';
    previewContent.style.display = 'flex';
});

function loadSvgAsImage(url) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = () => reject('SVG load error');
        img.src = url;
    });
}

function resetUpload() {
    uploadedFile = null;
    imageSource = null;
    fileInput.value = '';
    dropContent.style.display = 'flex';
    previewContent.style.display = 'none';
    resultsSection.style.display = 'none';
}

function generateFavicons() {
    generateHtmlCode();
    resultsSection.style.display = 'block';
}

function generateHtmlCode() {
    let path = document.getElementById('faviconPath').value.trim();
    let siteName = document.getElementById('siteName').value.trim();

    if (!path.endsWith('/')) path += '/';
    if (!siteName) siteName = 'MyWebSite';

    htmlCode.textContent = `
<link rel="icon" sizes="16x16" href="/${path}favicon-16x16.png">
<link rel="icon" sizes="32x32" href="/${path}favicon-32x32.png">
<link rel="icon" sizes="48x48" href="/${path}favicon-48x48.png">
<link rel="icon" sizes="96x96" href="/${path}favicon-96x96.png">

<link rel="apple-touch-icon" sizes="180x180" href="/${path}apple-touch-icon.png">
<link rel="manifest" href="/${path}site.webmanifest">

<meta name="application-name" content="${siteName}">
<meta name="apple-mobile-web-app-title" content="${siteName}">
<meta name="theme-color" content="#050505">
`.trim();
}

function drawToCanvas(size) {
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');

    ctx.clearRect(0, 0, size, size);
    ctx.drawImage(imageSource, 0, 0, size, size);

    return new Promise(res => canvas.toBlob(res, 'image/png'));
}

async function downloadZip() {
    if (!imageSource) return;

    let path = document.getElementById('faviconPath').value.trim();
    const siteName = document.getElementById('siteName').value || 'MyWebSite';

    // нормализация пути
    path = path.replace(/^\/+/, '');      // убрать /
    if (!path.endsWith('/')) path += '/'; // гарантировать /

    const zip = new JSZip();
    const folder = zip.folder(path); // 🔥 ВАЖНО

    const files = [
        { s: 16, n: 'favicon-16x16.png' },
        { s: 32, n: 'favicon-32x32.png' },
        { s: 48, n: 'favicon-48x48.png' },
        { s: 96, n: 'favicon-96x96.png' },
        { s: 180, n: 'apple-touch-icon.png' },
        { s: 192, n: 'android-chrome-192x192.png' },
        { s: 512, n: 'android-chrome-512x512.png' }
    ];

    for (const f of files) {
        const blob = await drawToCanvas(f.s);
        folder.file(f.n, blob); // ← КЛАДЁМ В ПАПКУ
    }

    folder.file(
        'site.webmanifest',
        JSON.stringify({
            name: siteName,
            short_name: siteName,
            icons: [
                { src: "android-chrome-192x192.png", sizes: "192x192", type: "image/png" },
                { src: "android-chrome-512x512.png", sizes: "512x512", type: "image/png" }
            ],
            theme_color: "#050505",
            background_color: "#050505",
            display: "standalone"
        }, null, 2)
    );

    saveAs(await zip.generateAsync({ type: 'blob' }), 'favicons.zip');
}

function copyCode() {
    navigator.clipboard.writeText(htmlCode.textContent);
    toast.classList.add('active');
    setTimeout(() => toast.classList.remove('active'), 1500);
}
