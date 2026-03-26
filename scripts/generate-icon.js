/**
 * Generate PNG icon from SVG
 * Run with: node scripts/generate-icon.js
 */

const fs = require('fs');
const path = require('path');

// Simple 32x32 skull icon as base64 PNG (white skull on transparent background)
// This is a minimal placeholder icon for Electron
const SKULL_ICON_BASE64 = `
iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAABHNCSVQICAgIfAhkiAAAA
AlwSFlzAAAA7AAAAOwBeShxvQAAABl0RVh0U29mdHdhcmUAd3d3Lmlua3NjYXBlLm9yZ5
vuPBoAAALkSURBVFiF7ZZNaBNBFMd/s9lNstlN0kRba1NrFT8QD4p48KLgwYsH8aAHD1
4EvYl4EPQgXhQPevAgHgQPHjx4EA+iB8WD4kG0WrW1rR9t05g0TbKbzeyOh91oTJMYQR
B8MAwz7/9+b2beyAr+MeSfdsD/HQBgmCYdnZ3E4nF0XWdleYUn9+/RqDf+DABgGAZdXV
10dHYhywqqquI4DpZlkc1m2d7exmpY+AIBQqEQHo9ERhbp7e0lHA7z7t07qqqqJvE/AJ
iWSU9PDx0dHXxaWCQYCjE0NISu6ywuLDA8PIyh61y/do3pyUlOnjrFyMgIjuNQXFxk8u
lTTp8+je/IYWZmZnBdl1QqxcqHD1RVVnL+wgVkScKyLF6/ekVfXx/RaJRwOIxlWTx/9o
zy8nK6urtxHKchAMD1eOjq7qakpISF+Xl8fj/DQ0PomsbrV6+oqa2lsqKCd2/fcvjIEQ
YHBigqKmJ2ZoaOri7q6+tZWlpi4OlT6urqaGxsxO1ys7m5yaOHDymIRGhtbSUWi1FfX4
/f58M0TZ48fkxbWxv19fXsZLOk02kePHhALBajqamJkpISJEli/tNnent78fm8JBIJkq
kkFy5dQpIk5ufn+fjhAydOnKCwsJCamhoAnieTXLp8Ga/Xy+zsLKurq7S1tRGJRIjH4y
STSe7evUtJSQlNjY1EIhHS6TRzc3MMDg4SiUQ4evQoiqKQSqVYW1vj0aNH+P1+mpubKS
4uJp1Os7y8TDKZpLKykuPHj1NUVEQmk2FhYYHp6WkKCgqIRqMcPHgQRVFYXV0lk8lw79
49ioqKaGpqoqCgAFVVyWQy3Llzh0gkQnNzM4FAYFcAl8tFS0sLsiyzs7ODqqqIoohpmq
RSKUzTRNM0IpEIsiyj6zq6ruM4DoZhYJom+Xwe0zTJZDLouo4oikQiETweD5qmkc1mcR
wHVVWxbZtAIEAwGESWZfL5PJqm4bouqqpiWRaBQIBwOIwsy2ia9vMKfgG+AbVPz9LAqF
dYAAAAAElFTkSuQmCC
`.replace(/\s/g, '');

// Output path
const outputDir = path.join(__dirname, '..', 'src', 'assets', 'skull');
const outputPath = path.join(outputDir, 'skull.png');

// Ensure directory exists
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Write the PNG file
const buffer = Buffer.from(SKULL_ICON_BASE64, 'base64');
fs.writeFileSync(outputPath, buffer);

console.log('Icon generated:', outputPath);
console.log('Size:', buffer.length, 'bytes');
