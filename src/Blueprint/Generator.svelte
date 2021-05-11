<div id="controls">
	<div class="input-wrapper">
		<span class="label">Item image (white, outlined, max 16x16):</span>
		<input on:change={updateItemImage} type="file" />
	</div>
	<div class="input-wrapper">
		<span class="label">Blueprint name:</span>
		<input bind:value={blueprintName} on:input={update} type="text" />
	</div>
	<button on:click={dump}>Dump</button>
	<hr />

	<div class="input-wrapper">
		<span class="label">Item name:</span>
		<input bind:value={lastTooltip.name} on:input={inputUpdate} type="text" />
	</div>
	<div class="input-wrapper">
		<span class="label">Item panel's line start side:</span>
		<select bind:value={lastTooltip.lineStart} on:blur={inputUpdate}>
			<option>left</option>
			<option>right</option>
			<option>top</option>
			<option>bottom</option>
		</select>
	</div>
	<button on:click={addTooltip}>Add tootlip</button>
	{#if lastTooltip != NEW_TOOLTIP}
	<button on:click={removeTooltip}>Remove</button>
	{/if}
	<hr />

	<Blueprint itemImage={itemImage} />
</div>
<canvas id="drafting-table"></canvas>

<script>
import { onMount } from 'svelte'
import { waitEvent } from '../utils'
import Blueprint from './Blueprint.svelte'

/** @type {CanvasRenderingContext2D} */
let ctx, realCtx;
const itemImage = document.createElement('img');
const bgImage = document.createElement('img');

const tooltips = [];
let blueprintName = '';
const NEW_TOOLTIP = {
	name: '',
	lineStart: 'left'
};

onMount(() => {
	const canvas = document.getElementById('drafting-table');
	realCtx = canvas.getContext('2d');
	ctx = document.createElement('canvas').getContext('2d');

	bgImage.src = '/resources/bg.png';
	bgImage.onload = () => {
		ctx.canvas.width = canvas.width = bgImage.naturalWidth;
		canvas.style.width = bgImage.naturalWidth + 'px';
		ctx.canvas.height = canvas.height = bgImage.naturalHeight;
		canvas.style.height = bgImage.naturalHeight + 'px';
	};

	canvas.addEventListener('mousedown', e => {
		startDrag(e.offsetX, e. offsetY);
	});

	canvas.addEventListener('mousemove', e => {
		execDrag(e.offsetX, e. offsetY);
	});

	canvas.addEventListener('mouseup', () => {
		endDrag();
	});
});

function drawRoundedRect (x, y, width, height, color, radius) {
	ctx.beginPath();
	ctx.moveTo(x + radius, y);
	ctx.lineTo(x + width - radius, y);
	ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
	ctx.lineTo(x + width, y + height - radius);
	ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
	ctx.lineTo(x + radius, y + height);
	ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
	ctx.lineTo(x, y + radius);
	ctx.quadraticCurveTo(x, y, x + radius, y);
	ctx.closePath();

	ctx.fillStyle = color;
	ctx.fill();
	ctx.fillStyle = null;
}

const CONNECTION_LINE_OFFSET = 12;
const CONNECTION_POINT_RADIUS = 3;
function drawConnection (tooltip) {
	let sx = 0, sy = 0;
	const [dx, dy] = tooltip.lineEnd;
	let xOffset = 0, yOffset = 0;

	switch (tooltip.lineStart) {
		case 'left':
			sx = tooltip.pos[0];
			sy = tooltip.pos[1] + tooltip.size[1] / 2;
			xOffset = -CONNECTION_LINE_OFFSET;
			break;
		case 'right':
			sx = tooltip.pos[0] + tooltip.size[0];
			sy = tooltip.pos[1] + tooltip.size[1] / 2;
			xOffset = CONNECTION_LINE_OFFSET;
			break;
		case 'top':
			sx = tooltip.pos[0] + tooltip.size[0] / 2;
			sy = tooltip.pos[1];
			yOffset = -CONNECTION_LINE_OFFSET;
			break;
		case 'bottom':
			sx = tooltip.pos[0] + tooltip.size[0] / 2;
			sy = tooltip.pos[1] + tooltip.size[1];
			yOffset = CONNECTION_LINE_OFFSET;
			break;
	}

	ctx.beginPath();
	ctx.arc(sx, sy, CONNECTION_POINT_RADIUS, 0, 2 * Math.PI, false);
	ctx.moveTo(sx + (CONNECTION_POINT_RADIUS - 1) * Math.sign(xOffset), sy + (CONNECTION_POINT_RADIUS - 1) * Math.sign(yOffset));

	ctx.lineTo(sx + xOffset, sy + yOffset);
	ctx.lineTo(dx - xOffset, dy - yOffset);

	ctx.lineTo(dx - (CONNECTION_POINT_RADIUS + 1) * Math.sign(xOffset), dy - (CONNECTION_POINT_RADIUS - 1) * Math.sign(yOffset));
	ctx.moveTo(dx + CONNECTION_POINT_RADIUS + 1, dy);
	ctx.arc(dx, dy, CONNECTION_POINT_RADIUS, 0, 2 * Math.PI, false);

	ctx.strokeStyle = '#fff';
	// const gradient = ctx.createLinearGradient(0, 0, 1, 0);
	// gradient.addColorStop(0, '#000');
	// gradient.addColorStop(1, '#fff');
	// ctx.strokeStyle = gradient;

	ctx.lineWidth = 2;
	ctx.stroke();
	ctx.strokeStyle = null;
}

function drawLine (sx, sy, dx, dy, color) {
	ctx.beginPath();
	ctx.moveTo(sx, sy + 0.5);
	ctx.lineTo(dx, dy + 0.5);

	ctx.lineWidth = 1;
	ctx.strokeStyle = color;
	ctx.stroke();
	ctx.strokeStyle = null;
}

function update () {
	ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
	ctx.textBaseline = 'top';

	ctx.font = "22px Andy, 'Comic Sans MS', 'Comic Sans', cursive";
	ctx.fillStyle = '#fff';
	ctx.fillText(blueprintName, 22, 18);

	ctx.fillStyle = null;
	ctx.font = "16px Andy, 'Comic Sans MS', 'Comic Sans', cursive";

	for (const tooltip of tooltips) {
		drawRoundedRect(...tooltip.pos, ...tooltip.size, 'rgba(90, 135, 255, 0.75)', 8);
		drawConnection(tooltip);

		ctx.fillStyle = lastTooltip == tooltip ? '#ffe14d' : '#fff';
		const measuredText = ctx.measureText(tooltip.name);
		ctx.fillText(tooltip.name, tooltip.pos[0] + (tooltip.size[0] - measuredText.width) / 2, tooltip.pos[1] + 10);
		ctx.fillStyle = null;

		drawLine(tooltip.pos[0] + 10, tooltip.pos[1] + 30, tooltip.pos[0] + tooltip.size[0] - 10, tooltip.pos[1] + 30, lastTooltip == tooltip ? '#ffe14d' : 'rgba(255, 255, 255, 0.15)');
	}

	drawAdaptiveImage(itemImage, (ctx.canvas.width - itemImage.width) / 2, (ctx.canvas.height - itemImage.height) / 2);

	realCtx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
	realCtx.drawImage(bgImage, 0, 0);
	realCtx.drawImage(ctx.canvas, 0, 0);
}

function mixColors (a, b, percent) {
	return a.map((val, i) => val * (1 - percent) + b[i] * percent);
}

function drawAdaptiveImage (img, x, y) {
	const imgCanvas = document.createElement('canvas');
	const imgCtx = imgCanvas.getContext('2d');
	imgCtx.imageSmoothingEnabled = false;
	imgCtx.drawImage(img, 0, 0, img.width, img.height);

	const src = imgCtx.getImageData(0, 0, img.width, img.height);
	const dest = ctx.getImageData(x, y, img.width, img.height);

	for (let y = 0; y < img.height; y++) {
		for (let x = 0; x < img.width; x++) {
			const i = (x + y * img.width) << 2;
			if (src.data[i + 3] == 0) continue;

			let color = ~~((dest.data[i] + dest.data[i + 1] + dest.data[i + 2]) / 3);

			if (color == 255) {
				const [r, g, b, a] = mixColors(src.data.slice(i, i + 4), [58, 111, 255, 217], dest.data[i + 3] / 255);
				// rgba(58, 111, 255, 0.85)
				dest.data[  i  ] = r;
				dest.data[i + 1] = g;
				dest.data[i + 2] = b;
				// dest.data[i + 3] = 255 - dest.data[i + 3] + 217;
				dest.data[i + 3] = a;
			} else {
				dest.data[  i  ] = src.data[i];
				dest.data[i + 1] = src.data[i + 1];
				dest.data[i + 2] = src.data[i + 2];
				dest.data[i + 3] = src.data[i + 3];
			}
		}
	}

	ctx.putImageData(dest, x, y);
}

async function updateItemImage (e) {
	const [file] = e.target.files;
	itemImage.src = URL.createObjectURL(file);
	await waitEvent(itemImage, 'load');
	itemImage.width = itemImage.naturalWidth * 8;
	itemImage.height = itemImage.naturalHeight * 8;

	update();
}

function inputUpdate () {
	if (lastTooltip != NEW_TOOLTIP) update();
}

let lastTooltip = NEW_TOOLTIP;
function addTooltip () {
	const tooltip = {
		...NEW_TOOLTIP,
		pos: [0, 0], // TODO: random math pos
		size: [250, 125], // TODO: rethink
		items: [],
		lineEnd: [ctx.canvas.width / 2, ctx.canvas.height / 2]
	};

	tooltips.push(tooltip);
	lastTooltip = tooltip;

	NEW_TOOLTIP.name = '';
	NEW_TOOLTIP.lineStart = 'top';
	update();
}

function removeTooltip () {
	tooltips.splice(tooltips.indexOf(lastTooltip), 1);
	lastTooltip = NEW_TOOLTIP;
	update();
}

let dragEvent = null;
function startDrag (x, y) {
	for (const tooltip of tooltips) {
		if (
			tooltip.pos[0] <= x
		 && tooltip.pos[1] <= y
		 && x <= tooltip.pos[0] + tooltip.size[0]
		 && y <= tooltip.pos[1] + tooltip.size[1]
		) {
			tooltip.startPos = [...tooltip.pos];
			dragEvent = { tooltip, x, y, isPoint: false };
			lastTooltip = tooltip;
			update();
			return;
		}

		if (
			tooltip.lineEnd[0] - CONNECTION_POINT_RADIUS - 1 <= x
		 && tooltip.lineEnd[1] - CONNECTION_POINT_RADIUS - 1 <= y
		 && x <= tooltip.lineEnd[0] + CONNECTION_POINT_RADIUS + 1
		 && y <= tooltip.lineEnd[1] + CONNECTION_POINT_RADIUS + 1
		) {
			tooltip.startPos = [...tooltip.lineEnd];
			dragEvent = { tooltip, x, y, isPoint: true };
			lastTooltip = tooltip;
			update();
			return;
		}
	}

	lastTooltip = NEW_TOOLTIP;
	update();
}

function execDrag (x, y) {
	if (!dragEvent) return;

	if (dragEvent.isPoint) {
		dragEvent.tooltip.lineEnd[0] = dragEvent.tooltip.startPos[0] - (dragEvent.x - x);
		dragEvent.tooltip.lineEnd[1] = dragEvent.tooltip.startPos[1] - (dragEvent.y - y);
	} else {
		dragEvent.tooltip.pos[0] = dragEvent.tooltip.startPos[0] - (dragEvent.x - x);
		dragEvent.tooltip.pos[1] = dragEvent.tooltip.startPos[1] - (dragEvent.y - y);
	}

	update();
}

function endDrag () {
	if (dragEvent) {
		delete dragEvent.tooltip.startPos;
		dragEvent = null;
	}
}

function dump () {
	if (tooltips.length) {
		prompt('Copy this data to reuse:', JSON.stringify({
			blueprintName,
			tooltips
		}));
	} else {
		const res = JSON.parse(prompt('Paste data to reuse:'));
		tooltips.push(...res.tooltips);
		blueprintName = res.blueprintName;
		update();
	}
}
</script>
