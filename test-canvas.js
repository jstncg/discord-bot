import { createCanvas } from '@napi-rs/canvas';
import { writeFile } from 'node:fs/promises';

const width = 200;
const height = 200;
const canvas = createCanvas(width, height);
const ctx = canvas.getContext('2d');

// background
ctx.fillStyle = '#fff';
ctx.fillRect(0, 0, width, height);

// red square
ctx.fillStyle = '#f00';
ctx.fillRect(50, 50, 100, 100);

// text
ctx.fillStyle = '#000';
ctx.font = '20px sans-serif';
ctx.fillText('Hello Canvas!', 20, 30);

// save PNG
const png = await canvas.encode('png');
await writeFile('test-canvas.png', png);
console.log('✅ Wrote test-canvas.png');
