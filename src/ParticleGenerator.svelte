<div id="controls">
	<div class="input-wrapper">
		<span class="label">Particle sprite:</span>
		<input on:change={updateParticleImage} type="file" />
	</div>
	<div class="input-wrapper">
		<span class="label">Count:</span>
		<input bind:value={particleAmount} min="1" max="250" type="range" />
	</div>
	<div class="input-wrapper">
		<span class="label">Frequency (in frames):</span>
		<input bind:value={framesUsage} min="1" max="60" type="range" />
	</div>
	<div class="input-wrapper">
		<span class="label">X offset:</span>
		<input bind:value={maxOffset} min="0" max="128" type="range" />
	</div>
	<div class="input-wrapper">
		<span class="label">Y offset:</span>
		<input bind:value={maxDistance} min="0" max="256" type="range" />
	</div>
</div>
<canvas id="particle-renderer"></canvas>

<script>
import { onDestroy, onMount } from 'svelte'
import { waitEvent, parseSprite, drawRotatedImage } from './utils'

/** @type {CanvasRenderingContext2D} */
let ctx;
onMount(() => {
	const canvas = document.getElementById('particle-renderer');
	ctx = canvas.getContext('2d');

	canvas.width = 256;
	canvas.style.width = canvas.width + 'px';
	canvas.height = 256;
	canvas.style.height = canvas.height + 'px';

	ctx.centerX = (canvas.width - 16) / 2;
	ctx.centerY = 16 / 2;
});

let particleFrames = [];
async function updateParticleImage (e) {
	const [file] = e.target.files;
	const $img = document.createElement('img');
	$img.src = URL.createObjectURL(file);
	await waitEvent($img, 'load');
	particleFrames = await parseSprite($img);

	update();
}

const FPS = 60;
let maxDistance = 120;
let maxOffset = 45;
let framesUsage = 20;
let frame = 0;

let particleAmount = 50;
let sceneParticles = [];
$: {
	sceneParticles = [];
	for (let i = 0; i < particleAmount; i++) {
		const lastFrame = ~~((Math.random() + 3) * FPS / 4);
		sceneParticles.push({
			distance: 0,
			offset: 0,
			angle: Math.random() * Math.PI,
			spriteFrame: 0,
			firstFrame: lastFrame - framesUsage,
			lastFrame
		});
	}
}

function getTiming (particle) {
	const delta = frame - particle.firstFrame;
	return (delta < 0 ? delta + 60 : delta) / framesUsage;
}

function update () {
	if (!particleFrames.length) return;
	ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

	for (const particle of sceneParticles) {
		if (particle.lastFrame == frame) {
			particle.spriteFrame = ~~(Math.random() * (particleFrames.length - 1));
			particle.distance = ~~(Math.random() * maxDistance);
			particle.offset = ~~(Math.random() * maxOffset * 2) - maxOffset;

			particle.firstFrame = particle.lastFrame;
			particle.lastFrame += framesUsage;
			particle.lastFrame %= FPS;
		}

		particle.angle += Math.PI / 90;

		let firstDelta = frame - particle.lastFrame + framesUsage;
		if (firstDelta < 0) firstDelta += FPS;
		const t = getTiming(particle);
		// console.log(t, frame, firstFrame, framesUsage);

		const x = ctx.centerX - particle.offset * t;
		const y = ctx.centerY + particle.distance * t;
		ctx.globalAlpha = 1 - t;
		ctx.imageSmoothingEnabled = false;
		drawRotatedImage(ctx, particleFrames[particle.spriteFrame], particle.angle, x, y, 16, 16);
		ctx.globalAlpha = 1;
	}

	// console.log(...sceneParticles.map(p => [p.firstFrame, p.lastFrame]));
}

const renderInterval = setInterval(() => {
	if (++frame == FPS) frame = 0;
	update();
}, 1000 / FPS);

onDestroy(() => {
	clearInterval(renderInterval);
})
</script>