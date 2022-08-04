<script>
    import Field from "./Field.svelte";
    import {fieldHeight, fieldWidth} from "./stores";
    let yOff = (innerHeight-$fieldHeight)/2
    let xOff = (innerWidth-$fieldWidth)/2
</script>

<div class="mt-[{50}px] fixed">
<Field/>
</div>
