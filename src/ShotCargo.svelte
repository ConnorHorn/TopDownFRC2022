<script>
    import {writable} from "svelte/store";
    import {onInterval} from "./utils";
    import {ballSlot1, ballSlot2, ballSlot4, ballSlot3, ballsInRobot, score} from "./stores";

    export let startX = 0;
    export let startY = 0;
    export let endX = 0;
    export let endY = 0;
    export let miss
    export let ballSlot
    let drawX=0
    let drawY=0
    startX=startX
    startY=startY
    endX=endX+((Math.random()-0.5)*2)*50
    endY=endY+((Math.random()-0.5)*2)*50
    let lengthX = Math.abs(endX-startX)
    let lengthY = Math.abs(endY-startY)
    let lengthHype = Math.sqrt(lengthX**2+lengthY**2)
    let angle = Math.atan2(endY - startY, endX - startX)
    let milliCount=0;
    let minBallSize=55, maxBallSize=90, endBallSize=60;
    let ballSize=minBallSize;
    const countUp = () => (milliCount += 1.8);
    onInterval(countUp, 1);
    $: {
        move(milliCount)
    }
    $ballsInRobot--;
    function move(){
        if(milliCount<=lengthHype) {
            if(milliCount<=lengthHype/2){
                ballSize = (milliCount/(lengthHype/2))*(maxBallSize-minBallSize)+minBallSize
            }
            if(milliCount>lengthHype/2){
                ballSize = maxBallSize-((milliCount-(lengthHype/2))/(lengthHype/2))*(maxBallSize-minBallSize)
            }
            drawX = Math.cos(angle) * milliCount + startX
            drawY = Math.sin(angle) * milliCount + startY
            drawX=drawX-ballSize/2
            drawY=drawY-ballSize/2
            return;
        }
        $score++;
        switch (ballSlot){
            case 1:
                $ballSlot1=true;
                break;
            case 2:
                $ballSlot2=true;
                break;
            case 3:
                $ballSlot3=true;
                break;
            case 4:
                $ballSlot4=true;
                break;
        }
    }

</script>

<div class="fixed" style="transform:
		translate({drawX}px,{drawY}px)">

<svg id="Layer_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"
     width="{ballSize}px" height="{ballSize}px" viewBox="0 0 120 120" enable-background="new 0 0 120 120" xml:space="preserve">
<circle cx="60" cy="60.834" r="55" style="fill:red"/>
</svg>

</div>

