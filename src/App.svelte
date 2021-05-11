<main>
	<aside>
		<img src="/favicon.png" class="logo" />
		{#each Object.keys(pages) as page}
			<div on:click={() => currentPage = page} class="item" class:active={currentPage == page}>
				<img src="/icons/{page}.png" />
			</div>
		{/each}
	</aside>
	<svelte:component this={pages[currentPage]} />
</main>

<script>
import BlueprintGenerator from './Blueprint/Generator.svelte'
import ParticleGenerator from './ParticleGenerator.svelte'

const pages = {
	blueprint: BlueprintGenerator,
	particles: ParticleGenerator,
};

let currentPage = Object.keys(pages)[0];
</script>
