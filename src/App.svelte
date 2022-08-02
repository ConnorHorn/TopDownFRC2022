<script>
    import Robot from "./Robot.svelte";

    let hubSize=90;
</script>

<div class="box grid h-screen w-screen place-items-center fixed">
<svg viewBox="0 0 {hubSize} {hubSize}"  xmlns="http://www.w3.org/2000/svg" class="fixed overflow-visible"><circle fill="none" r="8" stroke="white" stroke-linecap="round" stroke-linejoin="round"/></svg>
</div>
<Robot/>
