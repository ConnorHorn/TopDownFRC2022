<script>
    import {fieldHeight, fieldWidth} from "./stores";
    import Robot from "./Robot.svelte";
    import CargoOnField from "./CargoOnField.svelte";

    let hubSize=120;
</script>


<div class="fixed" style="width: {$fieldWidth} height: {fieldHeight}">
    <svg width={$fieldWidth} height={$fieldHeight} class="fixed">
        <rect width={$fieldWidth} height={$fieldHeight} style="fill:black;stroke-width:3;stroke:white" />
    </svg>
    <div class="mt-[{$fieldHeight/2}px] ml-[{$fieldWidth/2}px] fixed z-20">
        <svg xmlns="http://www.w3.org/2000/svg" class="fixed overflow-visible"><circle fill="none" r="{hubSize}" stroke="white" stroke-linecap="round" stroke-width="8" stroke-linejoin="round"/></svg>
    </div>
    <div class="z-50 fixed">
    <CargoOnField/>
        <Robot/>
</div>
</div>



