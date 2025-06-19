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

function removeAllChildNodes(el) {
    while (el.firstChild) {
        el.removeChild(el.firstChild);
    }
}

function calculateTextPosition(
    position,
    customY,
    height,
    totalTextHeight,
    lines
) {
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

const boxEl = document.getElementById("box");
const alignInputsEl = document.getElementById("align-inputs");
const colorInputsEl = document.getElementById("color-inputs");
const positionInputsEl = document.getElementById("position-inputs");
const customYEl = document.getElementById("custom-y");
const transparentBackgroundCheckboxEl = document.getElementById(
    "misc-transparent-bg"
);
const createButtonEl = document.getElementById("button-create");
const textEl = document.getElementById("text");

COLORS.forEach((color, i) => {
    const colorId = `color-${color.name}`;

    colorInputsEl.innerHTML += HTML([
        "input",
        {
            type: "radio",
            name: "color",
            id: colorId,
            checked: [i == 0],
            dataBgColor: color.bg,
            dataFgColor: color.fg,
            dataFgColorIfTransparent: color.fgIfTransparent ?? color.fg,
        },
    ]);

    colorInputsEl.innerHTML += HTML([
        "label",
        {
            class: "color-label",
            for: colorId,
            style: `background-color: ${color.bg};`,
        },
    ]);
});

colorInputsEl.querySelectorAll("input[type=radio]").forEach((el) => {
    el.onchange = (evt) => {
        const isTransparent = transparentBackgroundCheckboxEl.checked;
        const dataset = evt.target.dataset;

        boxEl.style.setProperty(
            "--bg-color",
            dataset.bgColor + (isTransparent ? "c0" : "")
        );
        boxEl.style.setProperty(
            "--fg-color",
            isTransparent ? dataset.fgColorIfTransparent : dataset.fgColor
        );
    };

    if (el.checked) {
        el.dispatchEvent(new Event("change"));
    }
});

alignInputsEl.querySelectorAll("input[type=radio]").forEach((el) => {
    el.onchange = (evt) => {
        boxEl.dataset.align = evt.target.value;
        textEl.style.textAlign = evt.target.value;
        textEl.dispatchEvent(new Event("change"));
    };

    if (el.checked) {
        el.dispatchEvent(new Event("change"));
    }
});

transparentBackgroundCheckboxEl.onchange = (evt) => {
    colorInputsEl
        .querySelector("input[type=radio]:checked")
        .dispatchEvent(new Event("change"));
};

// Handle position input changes
positionInputsEl.querySelectorAll("input[type=radio]").forEach((el) => {
    el.onchange = (evt) => {
        const isCustom = evt.target.value === "custom";
        customYEl.disabled = !isCustom;
        if (isCustom) {
            customYEl.focus();
        }
    };

    if (el.checked) {
        el.dispatchEvent(new Event("change"));
    }
});

textEl.onchange = (evt) => {
    removeAllChildNodes(boxEl);
    const align = boxEl.dataset.align;

    const lines = evt.target.value.split("\n");

    for (let i = 0; i < lines.length; i++) {
        let [lineText, lineScale] = lines[i].split("|");
        lineScale = parseFloat(lineScale) || 1;

        boxEl.innerHTML += HTML([
            "div",
            { class: "line" },
            { style: `--font-scale: ${lineScale}` },
            HTML.escape(lineText),
        ]);

        const thisLine = boxEl.lastElementChild;
        const lastLine = thisLine.previousElementSibling;

        if (!lastLine) continue;

        const thisStyle = getComputedStyle(thisLine);
        const thisBorderRadius =
            parseFloat(thisStyle.getPropertyValue("--border-radius")) *
            parseFloat(thisStyle.fontSize);
        const thisTolerance =
            align === "center" ? thisBorderRadius * 2 : thisBorderRadius;

        const lastStyle = getComputedStyle(lastLine);
        const lastBorderRadius =
            parseFloat(lastStyle.getPropertyValue("--border-radius")) *
            parseFloat(lastStyle.fontSize);
        const lastTolerance =
            align === "center" ? lastBorderRadius * 2 : lastBorderRadius;

        // If this line is smaller than last line
        if (
            lastLine.offsetWidth - lastTolerance >=
            thisLine.offsetWidth + thisTolerance
        ) {
            if (align !== "left") thisLine.classList.add("corner-tl");
            if (align !== "right") thisLine.classList.add("corner-tr");
        }
        // If this line is bigger than last line
        else if (
            lastLine.offsetWidth + lastTolerance <=
            thisLine.offsetWidth - thisTolerance
        ) {
            if (align !== "left") lastLine.classList.add("corner-bl");
            if (align !== "right") lastLine.classList.add("corner-br");
        }
        // If the lines are about equal
        else {
            const width = Math.max(lastLine.offsetWidth, thisLine.offsetWidth);
            lastLine.classList.add("connect-b");
            lastLine.style.width = `${width}px`;
            thisLine.classList.add("connect-t");
            thisLine.style.width = `${width}px`;
        }
    }
};

textEl.onkeyup = textEl.onchange;
textEl.dispatchEvent(new Event("change"));

createButtonEl.onclick = async (evt) => {
    const scale = 2;

    // First, capture the text overlay
    const textDataUrl = await domtoimage.toPng(boxEl, {
        width: boxEl.offsetWidth * scale,
        height: boxEl.offsetHeight * scale,
        style: {
            transform: `scale(${scale})`,
            transformOrigin: "top left",
            margin: 0,
            width: `${boxEl.offsetWidth}px`,
            height: `${boxEl.offsetHeight}px`,
        },
    });

    // Load the background image from content folder
    const backgroundImage = new Image();
    backgroundImage.crossOrigin = "anonymous";

    // Try different path formats for the background image
    const possiblePaths = [
        'content/bottom-image-2dbc21b1-a3c2-41a1-9591-d5382d38e28c.png',
        './content/bottom-image-2dbc21b1-a3c2-41a1-9591-d5382d38e28c.png',
        '/content/bottom-image-2dbc21b1-a3c2-41a1-9591-d5382d38e28c.png'
    ];

    let currentPathIndex = 0;

    const tryLoadImage = () => {
        const currentPath = possiblePaths[currentPathIndex];
        console.log('Attempting to load background image:', currentPath);

        backgroundImage.onload = async () => {
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
                // Get selected position
                const selectedPosition = positionInputsEl.querySelector("input[type=radio]:checked").value;
                const customYPercent = parseFloat(customYEl.value) || 50;
                const customYPixels = (customYPercent / 100) * canvas.height;

                // Parse text lines to get scaling information
                const textLines = textEl.value.split("\n").map(line => {
                    const [lineText, lineScale] = line.split("|");
                    return {
                        text: lineText,
                        scale: parseFloat(lineScale) || 1
                    };
                });

                // Calculate text positioning
                const totalTextHeight = textImage.height;

                const textX = (canvas.width - textImage.width) / 2;
                const textY = calculateTextPosition(
                    selectedPosition,
                    customYPixels,
                    canvas.height,
                    totalTextHeight,
                    textLines
                );

                // Draw text overlay at calculated position
                ctx.drawImage(textImage, textX, textY);

                // Convert canvas to blob and open
                canvas.toBlob((blob) => {
                    window.open(URL.createObjectURL(blob));
                });
            };
            textImage.src = textDataUrl;
        };

        backgroundImage.onerror = (error) => {
            console.error('Failed to load background image:', currentPath, error);
            currentPathIndex++;

            if (currentPathIndex < possiblePaths.length) {
                // Try next path
                tryLoadImage();
            } else {
                alert(`Failed to load background image from any of these paths:\n${possiblePaths.join('\n')}\n\nMake sure you're running this on a local server (not file://) and the image exists.`);
            }
        };

        backgroundImage.src = currentPath;
    };

    tryLoadImage();
};
