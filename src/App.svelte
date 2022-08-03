<script>
    import Robot from "./Robot.svelte";

    let hubSize=120;
</script>

<div class="box grid h-screen w-screen place-items-center fixed">
<svg xmlns="http://www.w3.org/2000/svg" class="fixed overflow-visible"><circle fill="none" r="{hubSize}" stroke="white" stroke-linecap="round" stroke-width="8" stroke-linejoin="round"/></svg>
</div>
<Robot/>
