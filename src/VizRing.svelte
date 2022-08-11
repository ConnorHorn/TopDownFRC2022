<script>
    import {fieldHeight, fieldWidth, robotDatas, vizRingSize} from "./stores";
    let show=true;
    console.log("viz")
    $: vizRingUpdate($robotDatas)
    function vizRingUpdate() {
        let robotsIn=0;
        for (let i = 0; i < $robotDatas.length; i++) {
             if(Math.sqrt(($robotDatas[i].robotCoords.x - $fieldWidth / 2) ** 2 + ($robotDatas[i].robotCoords.y - $fieldHeight / 2) ** 2) < $vizRingSize / 2) {
                 robotsIn++;
             }
        }
        if(robotsIn>0){
            show=true;
        }
        else{
            show=false;
        }
    }
</script>

{#if show}
    <div class="rounded-full border-green-500 border-4 border-dotted fixed z-90 ml-[450px]"
         style="height:{$vizRingSize}px; width:{$vizRingSize}px">
    </div>
{/if}