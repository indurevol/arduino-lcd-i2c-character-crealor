// Global variables
let displayGrid = Array(2).fill().map(() => Array(16).fill().map(() => Array(8).fill().map(() => Array(5).fill(false))));
let currentCellRow = 0;
let currentCellCol = 0;
let currentGrid = Array(8).fill().map(() => Array(5).fill(false));
let isMouseDown = false;
let isDragging = false;
let currentToggleState = false;
let copiedCellData = null; // For cell copy/paste functionality
let animationInterval = null; // For animation control
let isAnimationPlaying = false; // Animation state

// DOM Elements
const characterGrid = document.getElementById('character-grid');
const clearBtn = document.getElementById('clear-btn');
const resetDisplayBtn = document.getElementById('reset-display-btn');
const copyCellBtn = document.getElementById('copy-cell-btn');
const pasteCellBtn = document.getElementById('paste-cell-btn');
const transmissionOptions = document.getElementsByName('transmission');
const formatOptions = document.getElementsByName('format');
const scrollingCheckbox = document.getElementById('scrolling-checkbox');
const animationSpeed = document.getElementById('animation-speed');
const codeAnimationSpeed = document.getElementById('code-animation-speed');
const speedValue = document.getElementById('speed-value');
const animationDirection = document.getElementById('animation-direction');
const codeAnimationDirection = document.getElementById('code-animation-direction');
const applyAnimationCheckbox = document.getElementById('apply-animation-checkbox');
const playAnimationBtn = document.getElementById('play-animation-btn');
const stopAnimationBtn = document.getElementById('stop-animation-btn');
const codeOutput = document.getElementById('code-output');
const copyCodeBtn = document.getElementById('copy-code-btn');
const currentRowSpan = document.getElementById('current-row');
const currentColSpan = document.getElementById('current-col');
const activeCountSpan = document.getElementById('active-count');

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    createDisplay();
    createEditorGrid();
    updateEditorFromCurrentCell();
    updateActiveCount();
    generateCode(); // Auto-generate code on load
    
    // Event listeners
    clearBtn.addEventListener('click', clearEditor);
    resetDisplayBtn.addEventListener('click', resetDisplay);
    copyCellBtn.addEventListener('click', copyCell);
    pasteCellBtn.addEventListener('click', pasteCell);
    copyCodeBtn.addEventListener('click', copyCodeToClipboard);
    playAnimationBtn.addEventListener('click', playAnimation);
    stopAnimationBtn.addEventListener('click', stopAnimation);
    
    // Transmission option change
    transmissionOptions.forEach(option => {
        option.addEventListener('change', generateCode);
    });
    
    // Format option change
    formatOptions.forEach(option => {
        option.addEventListener('change', generateCode);
    });
    
    // Scrolling checkbox change - synchronize with apply animation checkbox
    scrollingCheckbox.addEventListener('change', function() {
        applyAnimationCheckbox.checked = scrollingCheckbox.checked;
        generateCode();
    });
    
    // Apply animation checkbox change - synchronize with scrolling checkbox
    applyAnimationCheckbox.addEventListener('change', function() {
        scrollingCheckbox.checked = applyAnimationCheckbox.checked;
        generateCode();
    });
    
    // Animation controls synchronization
    animationSpeed.addEventListener('input', function() {
        updateSpeedValue();
        syncAnimationSpeed();
        if (isAnimationPlaying) {
            // Restart animation with new speed
            stopAnimation();
            playAnimation();
        }
    });
    
    codeAnimationSpeed.addEventListener('input', function() {
        syncAnimationSpeedFromCode();
        if (isAnimationPlaying) {
            // Restart animation with new speed
            stopAnimation();
            playAnimation();
        }
    });
    
    animationDirection.addEventListener('change', function() {
        syncAnimationDirection();
        if (isAnimationPlaying) {
            // Restart animation with new direction
            stopAnimation();
            playAnimation();
        }
    });
    
    codeAnimationDirection.addEventListener('change', function() {
        syncAnimationDirectionFromCode();
        if (isAnimationPlaying) {
            // Restart animation with new direction
            stopAnimation();
            playAnimation();
        }
    });
    
    // Prevent dragging images
    document.addEventListener('dragstart', (e) => {
        e.preventDefault();
    });
    
    // Handle mouseup anywhere on document
    document.addEventListener('mouseup', () => {
        isMouseDown = false;
        isDragging = false;
        // Remove drag-active class from all cells
        document.querySelectorAll('.grid-cell').forEach(cell => {
            cell.classList.remove('drag-active');
        });
    });
});

// Create the 16x2 LCD display
function createDisplay() {
    // Initialize all display cells
    for (let row = 0; row < 2; row++) {
        for (let col = 0; col < 16; col++) {
            updateDisplayCell(row, col);
        }
    }
    
    const lcdCells = document.querySelectorAll('.lcd-cell');
    lcdCells.forEach(cell => {
        cell.addEventListener('click', () => {
            const row = parseInt(cell.dataset.row);
            const col = parseInt(cell.dataset.col);
            
            // Remove active class from all cells
            document.querySelectorAll('.lcd-cell').forEach(c => {
                c.classList.remove('active-cell');
            });
            
            // Add active class to clicked cell
            cell.classList.add('active-cell');
            
            // Update current cell position
            currentCellRow = row;
            currentCellCol = col;
            
            // Update UI
            currentRowSpan.textContent = currentCellRow;
            currentColSpan.textContent = currentCellCol;
            
            // Load this cell's data into editor
            updateEditorFromCurrentCell();
        });
    });
    
    // Set first cell as active by default
    if (lcdCells.length > 0) {
        lcdCells[0].classList.add('active-cell');
        currentRowSpan.textContent = '0';
        currentColSpan.textContent = '0';
    }
}

// Create the 5x8 editor grid
function createEditorGrid() {
    characterGrid.innerHTML = '';
    for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 5; col++) {
            const cell = document.createElement('div');
            cell.className = 'grid-cell';
            cell.dataset.row = row;
            cell.dataset.col = col;
            
            // Add mouse events for drag painting
            cell.addEventListener('mousedown', (e) => {
                e.preventDefault();
                isMouseDown = true;
                isDragging = true;
                // Set the toggle state based on the current cell state
                currentToggleState = !currentGrid[row][col];
                toggleCell(row, col, currentToggleState);
                cell.classList.add('drag-active');
            });
            
            cell.addEventListener('mouseover', () => {
                if (isMouseDown && isDragging) {
                    toggleCell(row, col, currentToggleState);
                    cell.classList.add('drag-active');
                }
            });
            
            cell.addEventListener('mouseup', () => {
                isDragging = false;
                cell.classList.remove('drag-active');
            });
            
            // Prevent default drag behavior
            cell.addEventListener('dragstart', (e) => {
                e.preventDefault();
            });
            
            characterGrid.appendChild(cell);
        }
    }
    
    updateEditorDisplay();
}

// Toggle cell state in editor
function toggleCell(row, col, state = null) {
    if (state !== null) {
        currentGrid[row][col] = state;
    } else {
        currentGrid[row][col] = !currentGrid[row][col];
    }
    updateEditorDisplay();
    updateActiveCount();
    // Auto-save and generate code
    autoSaveAndGenerate();
}

// Update editor display to reflect currentGrid state
function updateEditorDisplay() {
    const cells = document.querySelectorAll('.grid-cell');
    cells.forEach(cell => {
        const row = parseInt(cell.dataset.row);
        const col = parseInt(cell.dataset.col);
        if (currentGrid[row][col]) {
            cell.classList.add('active');
        } else {
            cell.classList.remove('active');
        }
    });
}

// Update active pixel count
function updateActiveCount() {
    let count = 0;
    for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 5; col++) {
            if (currentGrid[row][col]) {
                count++;
            }
        }
    }
    activeCountSpan.textContent = count;
}

// Update editor from current display cell
function updateEditorFromCurrentCell() {
    currentGrid = displayGrid[currentCellRow][currentCellCol].map(row => [...row]);
    updateEditorDisplay();
    updateActiveCount();
}

// Clear the editor grid
function clearEditor() {
    currentGrid = Array(8).fill().map(() => Array(5).fill(false));
    updateEditorDisplay();
    updateActiveCount();
    // Auto-save and generate code
    autoSaveAndGenerate();
}

// Reset the entire display
function resetDisplay() {
    // Clear all display cells
    displayGrid = Array(2).fill().map(() => Array(16).fill().map(() => Array(8).fill().map(() => Array(5).fill(false))));
    
    // Update all display cells
    for (let row = 0; row < 2; row++) {
        for (let col = 0; col < 16; col++) {
            updateDisplayCell(row, col);
        }
    }
    
    // Reset current editor
    currentGrid = Array(8).fill().map(() => Array(5).fill(false));
    updateEditorDisplay();
    updateActiveCount();
    
    // Auto-generate code
    generateCode();
}

// Copy the current cell
function copyCell() {
    // Create a deep copy of the current cell data
    copiedCellData = JSON.parse(JSON.stringify(currentGrid));
    console.log("Cell copied");
}

// Paste the copied cell data to the current cell
function pasteCell() {
    if (copiedCellData) {
        // Copy the cell data to the current grid
        currentGrid = JSON.parse(JSON.stringify(copiedCellData));
        
        // Update the editor display
        updateEditorDisplay();
        updateActiveCount();
        
        // Auto-save and generate code
        autoSaveAndGenerate();
        
        console.log("Cell pasted");
    } else {
        console.log("No cell data to paste");
    }
}

// Auto-save and generate code
function autoSaveAndGenerate() {
    // Auto-save to current display cell
    displayGrid[currentCellRow][currentCellCol] = currentGrid.map(row => [...row]);
    updateDisplayCell(currentCellRow, currentCellCol);
    // Auto-generate code
    generateCode();
}

// Update a specific cell in the display
function updateDisplayCell(row, col) {
    const cellGrid = document.getElementById(`cell-grid-${row}-${col}`);
    if (!cellGrid) return;
    
    cellGrid.innerHTML = '';
    const cellData = displayGrid[row][col];
    
    for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 5; c++) {
            const pixel = document.createElement('div');
            pixel.className = 'grid-pixel';
            if (cellData[r][c]) {
                pixel.classList.add('active');
            }
            cellGrid.appendChild(pixel);
        }
    }
    
    // If animation is playing, update the animation display as well
    if (isAnimationPlaying) {
        // The animation will automatically pick up the changes on its next cycle
    }
}

// Update speed value display
function updateSpeedValue() {
    speedValue.textContent = `${animationSpeed.value}ms`;
}

// Synchronize animation speed between top and bottom controls
function syncAnimationSpeed() {
    const speed = animationSpeed.value;
    codeAnimationSpeed.value = speed;
    speedValue.textContent = `${speed}ms`;
    generateCode(); // Regenerate code when speed changes
}

// Synchronize animation speed from code section to top controls
function syncAnimationSpeedFromCode() {
    const speed = codeAnimationSpeed.value;
    animationSpeed.value = speed;
    speedValue.textContent = `${speed}ms`;
    generateCode(); // Regenerate code when speed changes
}

// Synchronize animation direction between top and bottom controls
function syncAnimationDirection() {
    const direction = animationDirection.value;
    codeAnimationDirection.value = direction;
    generateCode(); // Regenerate code when direction changes
}

// Synchronize animation direction from code section to top controls
function syncAnimationDirectionFromCode() {
    const direction = codeAnimationDirection.value;
    animationDirection.value = direction;
    generateCode(); // Regenerate code when direction changes
}

// Play animation
function playAnimation() {
    if (isAnimationPlaying) return;
    
    isAnimationPlaying = true;
    const speed = parseInt(animationSpeed.value);
    const direction = animationDirection.value; // Get current direction
    
    // Stop any existing animation
    if (animationInterval) {
        clearInterval(animationInterval);
    }
    
    // Start new animation
    let frame = 0;
    animationInterval = setInterval(() => {
        // Update display with animation effect
        animateDisplay(frame, direction);
        frame++;
        if (frame > 1000) frame = 0; // Prevent overflow
    }, speed);
}

// Stop animation
function stopAnimation() {
    isAnimationPlaying = false;
    if (animationInterval) {
        clearInterval(animationInterval);
        animationInterval = null;
    }
    
    // Reset display to normal state
    for (let row = 0; row < 2; row++) {
        for (let col = 0; col < 16; col++) {
            updateDisplayCell(row, col);
        }
    }
}

// Animate display
function animateDisplay(frame, direction) {
    // Animation effect based on direction
    for (let row = 0; row < 2; row++) {
        for (let col = 0; col < 16; col++) {
            const cellGrid = document.getElementById(`cell-grid-${row}-${col}`);
            if (!cellGrid) continue;
            
            // Calculate shifted position based on direction and frame
            let shift;
            if (direction === 'left') {
                // For left scrolling: characters move right to left
                shift = (col + frame) % 16;
            } else {
                // For right scrolling: characters move left to right
                shift = (col - frame) % 16;
                if (shift < 0) {
                    shift += 16;
                }
            }
            
            const shiftedCellData = displayGrid[row][shift];
            
            // Update cell display with shifted data
            cellGrid.innerHTML = '';
            for (let r = 0; r < 8; r++) {
                for (let c = 0; c < 5; c++) {
                    const pixel = document.createElement('div');
                    pixel.className = 'grid-pixel';
                    if (shiftedCellData[r][c]) {
                        pixel.classList.add('active');
                    }
                    cellGrid.appendChild(pixel);
                }
            }
        }
    }
}

// Generate Arduino code
function generateCode() {
    const isI2C = document.querySelector('input[name="transmission"]:checked').value === 'i2c';
    const format = document.querySelector('input[name="format"]:checked').value;
    const generateScrolling = scrollingCheckbox.checked;
    const applyAnimation = applyAnimationCheckbox.checked;
    const animationDir = codeAnimationDirection.value;
    const animationSpeedValue = parseInt(codeAnimationSpeed.value);
    
    let code = '';
    
    if (isI2C) {
        code += '// I2C Connection\n';
        code += '#include <Wire.h>\n';
        code += '#include <LiquidCrystal_I2C.h>\n\n';
        code += '// Set the LCD address to 0x27 for a 16 chars and 2 line display\n';
        code += 'LiquidCrystal_I2C lcd(0x27, 16, 2);\n\n';
    } else {
        code += '// Basic Connection\n';
        code += '#include <LiquidCrystal.h>\n\n';
        code += '// Initialize the library with the interface pins\n';
        code += '// RS, Enable, D4, D5, D6, D7 pins\n';
        code += 'LiquidCrystal lcd(12, 11, 5, 4, 3, 2);\n\n';
    }
    
    // Add buffer arrays for smooth animation if scrolling is enabled
    if (generateScrolling && applyAnimation) {
        code += '// Buffers for storing previous screen state\n';
        code += 'byte prevLine0[16] = {0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF};\n';
        code += 'byte prevLine1[16] = {0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF};\n\n';
    }
    
    code += 'void setup() {\n';
    
    if (isI2C) {
        code += '  lcd.init(); // lcd.begin() can also be used\n';
        code += '  lcd.backlight();\n';
    } else {
        code += '  lcd.begin(16, 2);\n';
    }
    
    // Collect all unique characters from the display
    let uniqueChars = [];
    let charMap = {}; // Map display positions to character indices
    let displayContent = Array(2).fill().map(() => Array(16).fill(null)); // Track what's in each cell
    
    // Process the entire display to track both characters and empty spaces
    for (let row = 0; row < 2; row++) {
        for (let col = 0; col < 16; col++) {
            const cellData = displayGrid[row][col];
            // Check if cell has any active pixels
            let hasActivePixels = false;
            for (let r = 0; r < 8; r++) {
                for (let c = 0; c < 5; c++) {
                    if (cellData[r][c]) {
                        hasActivePixels = true;
                        break;
                    }
                }
                if (hasActivePixels) break;
            }
            
            if (hasActivePixels) {
                const charString = JSON.stringify(cellData);
                
                if (!charMap[charString]) {
                    charMap[charString] = uniqueChars.length;
                    uniqueChars.push(cellData);
                }
                
                displayContent[row][col] = charMap[charString];
            }
            // Empty cells are left as null
        }
    }
    
    // Generate character arrays and createChar calls (no limit on characters)
    for (let i = 0; i < uniqueChars.length; i++) {
        const charData = uniqueChars[i];
        let hasActivePixels = false;
        
        // Check if character has any active pixels
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 5; col++) {
                if (charData[row][col]) {
                    hasActivePixels = true;
                    break;
                }
            }
            if (hasActivePixels) break;
        }
        
        if (hasActivePixels) {
            code += `\n  // Character ${i}\n`;
            code += `  byte char${i}[8] = {\n`;
            
            for (let row = 0; row < 8; row++) {
                // Calculate the byte value for this row
                let byteValue = 0;
                for (let col = 0; col < 5; col++) {
                    if (charData[row][col]) {
                        byteValue |= (1 << (4 - col));
                    }
                }
                
                if (format === 'bin') {
                    // Binary format - convert byteValue to 8-bit binary
                    let binaryStr = byteValue.toString(2).padStart(8, '0');
                    code += `    0b${binaryStr}${row < 7 ? ',' : ''}\n`;
                } else {
                    // Hexadecimal format
                    code += `    0x${byteValue.toString(16).padStart(2, '0').toUpperCase()}${row < 7 ? ',' : ''}\n`;
                }
            }
            
            code += `  };\n`;
            code += `  lcd.createChar(${i}, char${i});\n`;
        }
    }
    
    // Add updateLine function for smooth animation if scrolling is enabled
    if (generateScrolling && applyAnimation) {
        code += '}\n\n';
        code += '// Function to update only changed characters\n';
        code += 'void updateLine(int line, byte newContent[16]) {\n';
        code += '  byte* prevContent = (line == 0) ? prevLine0 : prevLine1;\n';
        code += '  \n';
        code += '  for (int i = 0; i < 16; i++) {\n';
        code += '    if (newContent[i] != prevContent[i]) {\n';
        code += '      lcd.setCursor(i, line);\n';
        code += '      if (newContent[i] == 0xFF) {\n';
        code += '        lcd.print(" "); // Space for clearing\n';
        code += '      } else {\n';
        code += '        lcd.write(newContent[i]);\n';
        code += '      }\n';
        code += '      prevContent[i] = newContent[i];\n';
        code += '    }\n';
        code += '  }\n';
        code += '}\n';
    } else {
        code += '}\n';
    }
    
    code += '\n';
    
    if (generateScrolling && applyAnimation) {
        // Generate smooth scrolling animation code with direction and speed
        code += 'void loop() {\n';
        code += '  static int offset = 0;\n';
        code += '  byte currentLine0[16];\n';
        code += '  byte currentLine1[16];\n';
        code += '  \n';
        code += '  // Initialize buffers with spaces\n';
        code += '  for (int i = 0; i < 16; i++) {\n';
        code += '    currentLine0[i] = 0xFF; // 0xFF means space\n';
        code += '    currentLine1[i] = 0xFF;\n';
        code += '  }\n';
        code += '  \n';
        
        // Process each row for continuous scrolling
        for (let row = 0; row < 2; row++) {
            code += `  // Fill buffer for line ${row + 1}\n`;
            // Create an array of character positions for this line
            let charPositions = [];
            for (let col = 0; col < 16; col++) {
                if (displayContent[row][col] !== null) {
                    charPositions.push({
                        position: col,
                        charIndex: displayContent[row][col]
                    });
                }
            }
            
            if (charPositions.length > 0) {
                code += `  int positions${row}[${charPositions.length}] = {`;
                for (let i = 0; i < charPositions.length; i++) {
                    code += `${charPositions[i].position}${i < charPositions.length - 1 ? ', ' : ''}`;
                }
                code += `};\n`;
                
                code += `  byte chars${row}[${charPositions.length}] = {`;
                for (let i = 0; i < charPositions.length; i++) {
                    code += `${charPositions[i].charIndex}${i < charPositions.length - 1 ? ', ' : ''}`;
                }
                code += `};\n`;
                
                code += `  \n`;
                code += `  for (int i = 0; i < ${charPositions.length}; i++) {\n`;
                if (animationDir === 'left') {
                    code += `    int pos = (positions${row}[i] - offset) % 16;\n`;
                } else {
                    code += `    int pos = (positions${row}[i] + offset) % 16;\n`;
                }
                code += `    if (pos < 0) pos += 16;\n`;
                code += `    currentLine${row}[pos] = chars${row}[i];\n`;
                code += `  }\n`;
                code += `  \n`;
            }
        }
        
        code += '  // Update only changed characters\n';
        code += '  updateLine(0, currentLine0);\n';
        code += '  updateLine(1, currentLine1);\n';
        code += '  \n';
        code += '  offset++;\n';
        code += '  if (offset >= 16) offset = 0;\n';
        code += `  delay(${animationSpeedValue}); // Animation speed\n`;
        code += '}\n';
    } else if (generateScrolling) {
        // Generate continuous scrolling animation code (default direction and speed)
        code += 'void loop() {\n';
        code += '  // Continuous scrolling text animation\n';
        code += '  static int offset = 0;\n';
        code += '  lcd.clear();\n';
        code += '  \n';
        
        // Process each row for continuous scrolling
        for (let row = 0; row < 2; row++) {
            code += `  // Display content for line ${row + 1}\n`;
            // Create an array of character positions for this line
            let charPositions = [];
            for (let col = 0; col < 16; col++) {
                if (displayContent[row][col] !== null) {
                    charPositions.push({
                        position: col,
                        charIndex: displayContent[row][col]
                    });
                }
            }
            
            if (charPositions.length > 0) {
                code += `  // Line ${row + 1} characters\n`;
                for (let i = 0; i < charPositions.length; i++) {
                    const charInfo = charPositions[i];
                    code += `  {\n`;
                    if (animationDir === 'left') {
                        code += `    int pos = (${charInfo.position} - offset) % 16;\n`;
                    } else {
                        code += `    int pos = (${charInfo.position} + offset) % 16;\n`;
                    }
                    code += `    if (pos < 0) pos += 16;\n`;
                    code += `    lcd.setCursor(pos, ${row});\n`;
                    code += `    lcd.write(byte(${charInfo.charIndex}));\n`;
                    code += `  }\n`;
                }
                code += `  \n`;
            }
        }
        
        code += '  offset++;\n';
        code += '  if (offset >= 16) offset = 0; // Reset for continuous loop\n';
        code += '  delay(300); // Animation speed\n';
        code += '}\n';
    } else {
        // Generate static display code
        code += 'void loop() {\n';
        code += '  lcd.clear();\n';
        
        // Display the content using setCursor for each character
        for (let row = 0; row < 2; row++) {
            for (let col = 0; col < 16; col++) {
                if (displayContent[row][col] !== null) {
                    // This is a custom character
                    code += `  lcd.setCursor(${col}, ${row});\n`;
                    code += `  lcd.write(byte(${displayContent[row][col]}));\n`;
                }
                // Empty cells are skipped (they will appear as spaces)
            }
        }
        
        code += '  delay(2000);\n';
        code += '}\n';
    }
    
    codeOutput.value = code;
}

// Copy code to clipboard
function copyCodeToClipboard() {
    codeOutput.select();
    document.execCommand('copy');
    // Removed alert for automatic operation
}