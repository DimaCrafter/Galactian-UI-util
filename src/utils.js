export function waitEvent ($el, event) {
	return new Promise(resolve => {
		const listener = () => {
			resolve();
			$el.removeEventListener(event, listener);
		};

		$el.addEventListener(event, listener);
	});
}

/** @argument {HTMLImageElement} $img */
export function parseSprite ($img) {
	const frameCount = ($img.height - $img.width) / ($img.width + 2) + 1;

	let frames = [];
	for (let frame = 0; frame < frameCount; frame++) {
		frames.push(createImageBitmap($img, 0, frame * ($img.width + 2), $img.width, $img.width));
	}

	return Promise.all(frames);
}

export function drawRotatedImage (ctx, img, angle, x, y, w, h) {
	ctx.translate(x, y);
	ctx.rotate(angle);
	ctx.drawImage(img, -w/2, -h/2, w, h);
	ctx.rotate(-angle);
	ctx.translate(-x, -y);
}
