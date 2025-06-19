/**
 * TikTok-style Text to Image Generator
 * Standalone function for creating text overlays on background images
 * Compatible with Node.js environments
 */

// Color definitions
const COLORS = [
    {
        name: "white",
        bg: "#ffffff",
        fg: "#000000",
        fgIfTransparent: "#ffffff",
    },
    {
        name: "black",
        bg: "#000000",
        fg: "#ffffff",
    },
    {
        name: "red",
        bg: "#ea403f",
        fg: "#ffffff",
    },
    {
        name: "orange",
        bg: "#ff933d",
        fg: "#ffffff",
    },
    {
        name: "yellow",
        bg: "#f2cd46",
        fg: "#000000",
    },
    {
        name: "lime-green",
        bg: "#78c25e",
        fg: "#ffffff",
    },
    {
        name: "teal",
        bg: "#77c8a6",
        fg: "#ffffff",
    },
    {
        name: "light-blue",
        bg: "#3496f0",
        fg: "#ffffff",
    },
    {
        name: "dark-blue",
        bg: "#2344b2",
        fg: "#ffffff",
    },
    {
        name: "violet",
        bg: "#5756d4",
        fg: "#ffffff",
    },
    {
        name: "pink",
        bg: "#f7d7e9",
        fg: "#000000",
    },
    {
        name: "brown",
        bg: "#a3895b",
        fg: "#ffffff",
    },
    {
        name: "dark-green",
        bg: "#32523b",
        fg: "#ffffff",
    },
    {
        name: "blue-gray",
        bg: "#2f688c",
        fg: "#ffffff",
    },
    {
        name: "light-gray",
        bg: "#92979e",
        fg: "#000000",
    },
    {
        name: "dark-gray",
        bg: "#333333",
        fg: "#ffffff",
    },
];

/**
 * Calculate text position on the image
 * @param {string} position - Position type: 'top', 'center', 'bottom', 'custom'
 * @param {number} customY - Custom Y position in pixels (for 'custom' position)
 * @param {number} height - Total image height
 * @param {number} totalTextHeight - Height of the text overlay
 * @param {Array} lines - Array of text lines with scaling info
 * @returns {number} Y position for text placement
 */
function calculateTextPosition(position, customY, height, totalTextHeight, lines) {
    const padding = 100;
    if (!lines || lines.length === 0) return height / 2;

    switch (position) {
        case "top":
            return padding;
        case "bottom":
            return height - padding - totalTextHeight;
        case "custom":
            return customY - (totalTextHeight / 2) || (height - totalTextHeight) / 2;
        default: // center
            return (height - totalTextHeight) / 2;
    }
}

/**
 * Get color configuration by name
 * @param {string} colorName - Name of the color
 * @returns {Object} Color configuration object
 */
function getColorConfig(colorName) {
    return COLORS.find(color => color.name === colorName) || COLORS[0];
}

/**
 * Create TikTok-style text overlay on background image
 * @param {Object} options - Configuration options
 * @param {string} options.text - Text content (supports line scaling with | separator)
 * @param {string} options.backgroundImagePath - Path to background image
 * @param {string} [options.colorName='white'] - Color scheme name
 * @param {string} [options.align='center'] - Text alignment: 'left', 'center', 'right'
 * @param {string} [options.position='center'] - Text position: 'top', 'center', 'bottom', 'custom'
 * @param {number} [options.customY=50] - Custom Y position as percentage (0-100) for 'custom' position
 * @param {boolean} [options.transparentBackground=false] - Use transparent background
 * @param {number} [options.scale=2] - Text scaling factor
 * @param {Function} [options.onProgress] - Progress callback function
 * @returns {Promise<Blob>} Promise that resolves to image blob
 */
async function createTextOnImage(options) {
    const {
        text,
        backgroundImagePath,
        colorName = 'white',
        align = 'center',
        position = 'center',
        customY = 50,
        transparentBackground = false,
        scale = 2,
        onProgress = () => {}
    } = options;

    // Validate required parameters
    if (!text || !backgroundImagePath) {
        throw new Error('Text and backgroundImagePath are required parameters');
    }

    onProgress('Initializing...');

    // Get color configuration
    const colorConfig = getColorConfig(colorName);
    const bgColor = colorConfig.bg + (transparentBackground ? 'c0' : '');
    const fgColor = transparentBackground ? 
        (colorConfig.fgIfTransparent || colorConfig.fg) : 
        colorConfig.fg;

    onProgress('Creating text overlay...');

    // Ensure we're in a browser environment
    if (typeof document === 'undefined') {
        throw new Error('This function requires a DOM environment. Use jsdom or puppeteer in Node.js.');
    }

    // Create temporary container for text rendering
    const container = document.createElement('div');
    container.style.cssText = `
        position: absolute;
        left: -9999px;
        top: -9999px;
        display: flex;
        flex-direction: column;
        width: fit-content;
        margin: 0 auto;
        box-sizing: border-box;
        font-family: "Montserrat SemiBold", Arial, sans-serif;
    `;

    // Set alignment
    if (align === 'left') container.style.alignItems = 'start';
    else if (align === 'center') container.style.alignItems = 'center';
    else if (align === 'right') container.style.alignItems = 'end';

    // Set data attribute for alignment (needed for CSS rules)
    container.setAttribute('data-align', align);

    // Set CSS custom properties like the original implementation
    container.style.setProperty('--bg-color', bgColor);
    container.style.setProperty('--fg-color', fgColor);

    document.body.appendChild(container);

    try {
        // Parse text lines and create styled elements
        const lines = text.split('\n');
        const textLines = [];

        for (let i = 0; i < lines.length; i++) {
            let [lineText, lineScale] = lines[i].split('|');
            lineScale = parseFloat(lineScale) || 1;
            
            textLines.push({
                text: lineText,
                scale: lineScale
            });

            // Create line element
            const lineEl = document.createElement('div');
            lineEl.className = 'line';

            lineEl.style.cssText = `
                --font-scale: ${lineScale};
                --border-radius: 0.2em;
                position: relative;
                background-color: ${bgColor};
                color: ${fgColor};
                font-family: "Montserrat SemiBold", Arial, sans-serif;
                font-size: calc(28px * var(--font-scale));
                width: fit-content;
                padding: 0.4em 0.8em;
                border-radius: 0.2em;
                text-align: center;
                white-space: pre;
                box-sizing: border-box;
                margin: 0;
            `;

            // Handle empty lines
            if (!lineText.trim()) {
                lineEl.style.visibility = 'hidden';
                lineEl.style.height = '1em';
            }

            lineEl.textContent = lineText;
            container.appendChild(lineEl);
        }

        onProgress('Applying TikTok-style borders...');

        // Apply TikTok-style border logic
        const lineElements = container.querySelectorAll('.line');
        for (let i = 1; i < lineElements.length; i++) {
            const thisLine = lineElements[i];
            const lastLine = lineElements[i - 1];

            // Force layout calculation
            const thisWidth = thisLine.offsetWidth;
            const lastWidth = lastLine.offsetWidth;

            const thisStyle = getComputedStyle(thisLine);
            const thisBorderRadius = parseFloat(thisStyle.getPropertyValue('--border-radius')) * 
                parseFloat(thisStyle.fontSize);
            const thisTolerance = align === 'center' ? thisBorderRadius * 2 : thisBorderRadius;

            const lastStyle = getComputedStyle(lastLine);
            const lastBorderRadius = parseFloat(lastStyle.getPropertyValue('--border-radius')) * 
                parseFloat(lastStyle.fontSize);
            const lastTolerance = align === 'center' ? lastBorderRadius * 2 : lastBorderRadius;

            // Apply border styling based on line width relationships
            if (lastWidth - lastTolerance >= thisWidth + thisTolerance) {
                // This line is smaller than last line
                if (align !== 'left') thisLine.classList.add('corner-tl');
                if (align !== 'right') thisLine.classList.add('corner-tr');
            } else if (lastWidth + lastTolerance <= thisWidth - thisTolerance) {
                // This line is bigger than last line
                if (align !== 'left') lastLine.classList.add('corner-bl');
                if (align !== 'right') lastLine.classList.add('corner-br');
            } else {
                // Lines are about equal
                const width = Math.max(lastWidth, thisWidth);
                lastLine.classList.add('connect-b');
                lastLine.style.width = `${width}px`;
                thisLine.classList.add('connect-t');
                thisLine.style.width = `${width}px`;
            }
        }

        console.log('Using CSS custom properties approach like original implementation');
        console.log('Background color variable:', bgColor);

        // Add CSS using the exact same approach as the original style.css
        const style = document.createElement('style');
        style.id = 'text-to-image-styles';
        style.textContent = `
            [data-align="left"] .line:not(:first-child) { border-top-left-radius: 0; }
            [data-align="left"] .line:not(:last-child) { border-bottom-left-radius: 0; }
            [data-align="right"] .line:not(:first-child) { border-top-right-radius: 0; }
            [data-align="right"] .line:not(:last-child) { border-bottom-right-radius: 0; }

            .line.corner-tl { border-top-left-radius: 0 !important; }
            .line.corner-bl { border-bottom-left-radius: 0 !important; }
            .line.corner-tr { border-top-right-radius: 0 !important; }
            .line.corner-br { border-bottom-right-radius: 0 !important; }
            .line.connect-b { border-bottom-left-radius: 0; border-bottom-right-radius: 0; }
            .line.connect-t { border-top-left-radius: 0; border-top-right-radius: 0; }

            .line.corner-tl::before,
            .line.corner-bl::before,
            .line.corner-tr::after,
            .line.corner-br::after {
                display: block;
                position: absolute;
                top: 0;
                background-color: transparent;
                width: 0.4em;
                height: 100%;
                clip-path: inset(-1px);
            }

            .line.corner-tl::before,
            .line.corner-bl::before {
                content: "";
                left: -0.4em;
            }

            .line.corner-tr::after,
            .line.corner-br::after {
                content: "";
                right: -0.4em;
            }

            .line.corner-tl::before {
                border-top-right-radius: 0.2em;
                box-shadow: 0.2em -0.2em 0 var(--bg-color, black);
            }

            .line.corner-bl::before {
                border-bottom-right-radius: 0.2em;
                box-shadow: 0.2em 0.2em 0 var(--bg-color, black);
            }

            .line.corner-tl.corner-bl::before {
                border-bottom-right-radius: 0.2em;
                border-top-right-radius: 0.2em;
                box-shadow: 0.2em 0.2em 0 var(--bg-color, black),
                           0.2em -0.2em 0 var(--bg-color, black);
            }

            .line.corner-tr::after {
                border-top-left-radius: 0.2em;
                box-shadow: -0.2em -0.2em 0 var(--bg-color, black);
            }

            .line.corner-br::after {
                border-bottom-left-radius: 0.2em;
                box-shadow: -0.2em 0.2em 0 var(--bg-color, black);
            }

            .line.corner-tr.corner-br::after {
                border-top-left-radius: 0.2em;
                border-bottom-left-radius: 0.2em;
                box-shadow: -0.2em -0.2em 0 var(--bg-color, black),
                           -0.2em 0.2em 0 var(--bg-color, black);
            }
        `;

        document.head.appendChild(style);

        onProgress('Capturing text as image...');

        // Capture text overlay as image (requires dom-to-image library)
        if (typeof domtoimage === 'undefined') {
            throw new Error('dom-to-image library is required. Include it in your HTML or install for Node.js.');
        }

        // Temporarily make container visible for rendering
        container.style.left = '0px';
        container.style.top = '0px';
        container.style.position = 'fixed';
        container.style.zIndex = '9999';

        // Force layout calculation
        const containerWidth = container.offsetWidth;
        const containerHeight = container.offsetHeight;

        console.log('Container dimensions:', containerWidth, 'x', containerHeight);
        console.log('Container children:', container.children.length);

        if (containerWidth === 0 || containerHeight === 0) {
            throw new Error('Text container has zero dimensions. Check text content and styling.');
        }

        const textDataUrl = await domtoimage.toPng(container, {
            width: containerWidth * scale,
            height: containerHeight * scale,
            style: {
                transform: `scale(${scale})`,
                transformOrigin: 'top left',
                margin: 0,
                width: `${containerWidth}px`,
                height: `${containerHeight}px`,
            },
        });

        // Hide container again
        container.style.left = '-9999px';
        container.style.top = '-9999px';
        container.style.position = 'absolute';

        onProgress('Loading background image...');

        // Load background image
        const backgroundImage = new Image();
        backgroundImage.crossOrigin = 'anonymous';

        return new Promise((resolve, reject) => {
            backgroundImage.onload = async () => {
                onProgress('Compositing images...');

                // Create canvas for compositing
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');

                // Set canvas size to match background image
                canvas.width = backgroundImage.width;
                canvas.height = backgroundImage.height;

                // Draw background image
                ctx.drawImage(backgroundImage, 0, 0);

                // Load and draw text overlay
                const textImage = new Image();
                textImage.onload = () => {
                    // Calculate position
                    const customYPixels = (customY / 100) * canvas.height;
                    const totalTextHeight = textImage.height;

                    const textX = (canvas.width - textImage.width) / 2;
                    const textY = calculateTextPosition(
                        position,
                        customYPixels,
                        canvas.height,
                        totalTextHeight,
                        textLines
                    );

                    // Draw text overlay at calculated position
                    ctx.drawImage(textImage, textX, textY);

                    onProgress('Finalizing image...');

                    // Convert canvas to blob
                    canvas.toBlob((blob) => {
                        resolve(blob);
                    });
                };

                textImage.onerror = () => reject(new Error('Failed to load text overlay image'));
                textImage.src = textDataUrl;
            };

            backgroundImage.onerror = () => reject(new Error(`Failed to load background image: ${backgroundImagePath}`));
            backgroundImage.src = backgroundImagePath;
        });

    } finally {
        // Cleanup
        if (container && container.parentNode) {
            document.body.removeChild(container);
        }
        const style = document.getElementById('text-to-image-styles');
        if (style && style.parentNode) {
            document.head.removeChild(style);
        }
    }
}

// Export for different environments
if (typeof module !== 'undefined' && module.exports) {
    // Node.js
    module.exports = { createTextOnImage, COLORS, getColorConfig };
} else if (typeof window !== 'undefined') {
    // Browser
    window.createTextOnImage = createTextOnImage;
    window.TextToImageColors = COLORS;
    window.getColorConfig = getColorConfig;
}
