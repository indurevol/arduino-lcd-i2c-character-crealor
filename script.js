// Global variables
let displayGrid = Array(2).fill().map(() => Array(16).fill().map(() => Array(8).fill().map(() => Array(5).fill(false))));
let currentCellRow = 0;
let currentCellCol = 0;
let currentGrid = Array(8).fill().map(() => Array(5).fill(false));
let isMouseDown = false;
let isDragging = false;
let currentToggleState = false;

// DOM Elements
const characterGrid = document.getElementById('character-grid');
const clearBtn = document.getElementById('clear-btn');
const resetDisplayBtn = document.getElementById('reset-display-btn');
const transmissionOptions = document.getElementsByName('transmission');
const formatOptions = document.getElementsByName('format');
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
    copyCodeBtn.addEventListener('click', copyCodeToClipboard);
    
    // Transmission option change
    transmissionOptions.forEach(option => {
        option.addEventListener('change', generateCode);
    });
    
    // Format option change
    formatOptions.forEach(option => {
        option.addEventListener('change', generateCode);
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
}

// Generate Arduino code
function generateCode() {
    const isI2C = document.querySelector('input[name="transmission"]:checked').value === 'i2c';
    const format = document.querySelector('input[name="format"]:checked').value;
    
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
    let charPositions = []; // Track which characters are at which positions
    
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
                
                charPositions.push({
                    row: row,
                    col: col,
                    charIndex: charMap[charString]
                });
            }
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
    
    code += '}\n\n';
    code += 'void loop() {\n';
    code += '  lcd.clear();\n';
    
    // Display the content using setCursor for each character
    for (let i = 0; i < charPositions.length; i++) {
        const pos = charPositions[i];
        code += `  lcd.setCursor(${pos.col}, ${pos.row});\n`;
        code += `  lcd.write(byte(${pos.charIndex}));\n`;
    }
    
    code += '  delay(2000);\n';
    code += '}';
    
    codeOutput.value = code;
}

// Copy code to clipboard
function copyCodeToClipboard() {
    codeOutput.select();
    document.execCommand('copy');
    // Removed alert for automatic operation
}