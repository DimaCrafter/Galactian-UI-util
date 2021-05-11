<canvas id="blueprint" on:click={update} width="32" height="32"></canvas>

<script>
import { onMount } from 'svelte'

const tplImage = document.createElement('img');
tplImage.src = '/resources/blueprint-template.png';

export let itemImage;

/** @type {CanvasRenderingContext2D} */
let ctx;
$: itemImage && update();

function update () {
	if (!ctx) return;

	ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
	ctx.drawImage(tplImage, 0, 0);
	ctx.drawImage(itemImage, Math.round((tplImage.naturalWidth - itemImage.naturalWidth) / 2), Math.round(5 + (16 - itemImage.naturalHeight) / 2));

	drawLinePattern(8, 23);
	drawLinePattern(8, 25);

	for (let x = 26; x < 29; x++) {
		for (let y = 23; y < 26; y++) {
			if (Math.random() >= 0.5) continue;

			ctx.fillStyle = '#fff';
			ctx.fillRect(x, y, 1, 1);

			ctx.fillStyle = '#0051d1';
			ctx.fillRect(x, y + 1, 1, 1);
		}
	}

	ctx.fillStyle = null;
}

function drawLinePattern (sx, sy) {
	for (const [x1, x2] of generateLinePattern(16)) {
		ctx.fillStyle = '#fff';
		ctx.fillRect(sx + x1, sy, x2 - x1, 1);

		ctx.fillStyle = '#0051d1';
		ctx.fillRect(sx + x1, sy + 1, x2 - x1, 1);
	}

	ctx.fillStyle = null;
}

function* generateLinePattern (max) {
    const dashes = 1 + Math.round(Math.random() * 2);
    const length = max - dashes + 1;

    switch (dashes) {
        case 1:
			yield [0, Math.round(length * Math.min(Math.random(), 0.45))];
            return;
    }

    let available = length;
    let x = 0;
    for (let i = 0; i < dashes; i++) {
        const part = 1 / (dashes - i);
        const r = Math.min(part, Math.max(part / 2, Math.random()));

        const dash = Math.round(available * r);
		yield [x, x + dash];
        x = dash + 1;

        available -= dash;
    }
}

onMount(() => {
	ctx = document.getElementById('blueprint').getContext('2d');
});
</script>