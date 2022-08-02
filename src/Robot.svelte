<script>
    import { onInterval } from './utils.js';
    import {test, ballSlot1, ballSlot2, ballSlot3, ballSlot4} from "./stores";
    import { spring } from 'svelte/motion';
    import {writable} from "svelte/store";
    import ShotCargo from "./ShotCargo.svelte";
    let key
    let x=100;
    let y=100;
    let speedModifier = 0.3;
    let wDown=false,aDown=false, sDown=false, dDown = false, jDown=false, lDown=false, spaceDown=false;
    let yValue=0, xValue=0;
    const coords = writable({ x: x, y: y});
    let ball1Coords = writable({ x: 0, y: 0});
    let ball2Coords = writable({ x: 0, y: 0});
    let ball3Coords = writable({ x: 0, y: 0});
    let ball4Coords = writable({ x: 0, y: 0});
    let centerCoords = writable({x: window.innerWidth/2, y: window.innerHeight/2})
    let maxYAcc=100, maxXAcc=100;
    let maxRotAcc=10, maxRotSpeed=1000, rotAcc=0, rot=0, rotDecay=0.3, rotPace=0.5;
    let yDecay=1, xDecay=1
    let milliCount=0;
    const countUp = () => (milliCount += 1);
    onInterval(countUp, 15);

    $ : {
        calcMovement(milliCount)
        calcRotation(milliCount)
    }

    function calcRotation(){
        if(jDown){
            if(rotAcc-rotPace>=maxRotAcc*-1){
                rotAcc-=rotPace;
            }
        }
        if(lDown){
            if(rotAcc+rotPace<=maxRotAcc){
                rotAcc+=rotPace;
            }
        }
        if(Math.abs(rotAcc)<rotDecay){
            rotAcc=0;
        }
        if(rotAcc>0){
            rotAcc-=rotDecay
        }
        if(rotAcc<0){
            rotAcc+=rotDecay
        }

        rot+=rotAcc;
    }

    function calcMovement() {
        if(!checkMoveValid($coords.x, $coords.y)){
            xValue=40;
            yValue=40;
        }
        if(wDown){
            if(yValue+2.5<=maxYAcc) {
                yValue+=2.5;
            }
        }
        if(sDown){
            if(yValue-2.5>=maxYAcc*-1) {
                yValue-=2.5;
            }
        }
        if(aDown){
            if(xValue-2.5>=maxXAcc*-1) {
                xValue-=2.5;
            }
        }
        if(dDown){
            if(xValue+2.5<=maxXAcc) {
                xValue+=2.5;
            }
        }
        if(Math.abs(yValue)<yDecay){
            yValue=0;
        }
        if(Math.abs(xValue)<xDecay){
            xValue=0;
        }
        if(yValue>0){
            yValue-=yDecay;
        }
        if(yValue<0){
            yValue+=yDecay;
        }
        if(xValue>0){
            xValue-=xDecay;
        }
        if(xValue<0){
            xValue+=xDecay;
        }
        x+=xValue*speedModifier;
        y-=yValue*speedModifier;
        if(x>window.innerWidth-130){
            x=window.innerWidth-130
        }
        if(y>window.innerHeight-130){
            y=window.innerHeight-130
        }
        if(x<0){
            x=0;
        }
        if(y<0){
            y=0;
        }
        let xValid=false, yValid=false;
        if(checkMoveValid($coords.x,y)){
            xValid=true;
        }
        if(checkMoveValid(x,$coords.y)){
            yValid=true;
        }
        if(!checkMoveValid(x,y)){
            xValid=false;
            yValid=false;
        }
        coords.update($coords => ({
            x: ((xValid) ? x : $coords.x),
            y: ((yValid) ? y : $coords.y)
        }));
        if(!xValid){
            xValue=0;
        }
        if(!yValid){
            yValue=0;
        }
        x=$coords.x
        y=$coords.y

    }

    function checkMoveValid(x, y){
        console.log(Math.sqrt(Math.abs(window.innerWidth/2 - x-65) ** 2 + Math.abs(window.innerHeight/2 - y-65) ** 2))
        return Math.sqrt(Math.abs(window.innerWidth/2 - x-65) ** 2 + Math.abs(window.innerHeight/2 - y-65) ** 2) >= 180;

    }
    function on_key_down(event) {
        // if (event.repeat) return;
        switch (event.key) {
            case "w":
                wDown = true;

                event.preventDefault();
                break;
            case "a":
                aDown = true;

                event.preventDefault();
                break;
            case "s":
                sDown = true;

                event.preventDefault();
                break;
            case "d":
                dDown = true;

                event.preventDefault();
                break;
            case "j":
                jDown = true;

                event.preventDefault();
                break;
            case "l":
                lDown = true;

                event.preventDefault();
                break;
            case "i":
                spaceDown = true;
                event.preventDefault();
                break;
        }
    }
    function on_key_up(event) {
        // if (event.repeat) return;
        switch (event.key) {
            case "w":
                wDown = false

                event.preventDefault();
                break;
            case "a":
                aDown = false;

                event.preventDefault();
                break;
            case "s":
                sDown = false;

                event.preventDefault();
                break;
            case "d":
                dDown = false;

                event.preventDefault();
                break;
            case "j":
                jDown = false;

                event.preventDefault();
                break;
            case "l":
                lDown = false;

                event.preventDefault();
                break;
            case "i":
                console.log("here")
                spaceDown = false;
                if($ballSlot1){
                    ball1Coords.update($ball1Coords => ({
                        x: $coords.x,
                        y: $coords.y
                    }));
                    $ballSlot1=false;
                    console.log($ball1Coords.x)
                }else if($ballSlot2){
                    ball2Coords.update($ball2Coords => ({
                        x: $coords.x,
                        y: $coords.y
                    }));
                    $ballSlot2=false;
                }else if($ballSlot3) {
                    ball3Coords.update($ball3Coords => ({
                        x: $coords.x,
                        y: $coords.y
                    }));
                    $ballSlot3=false;
                }else if($ballSlot4){
                    ball4Coords.update($ball4Coords => ({
                        x: $coords.x,
                        y: $coords.y
                    }));
                    $ballSlot4=false;
                }

                event.preventDefault();
                break;
        }
    }

</script>

<svelte:window
        on:keydown={on_key_down}
        on:keyup={on_key_up}
/>
<div class="fixed z-40">
    {Math.atan2( window.innerHeight/2-$coords.y-50, window.innerWidth/2 -$coords.x-50) * ( 180 / Math.PI)+90}
    {window.innerWidth}
    {window.innerHeight}
</div>

<div class="box grid h-screen place-items-center" style="transform:
		translate({$coords.x}px,{$coords.y}px)
        rotate({rot}deg)">

    <svg xmlns="http://www.w3.org/2000/svg" class="h-[90px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" style="transform: rotate({rot*-1+Math.atan2( window.innerHeight/2-$coords.y-50, window.innerWidth/2 -$coords.x-50) * ( 180 / Math.PI )+90}deg)">
        <path stroke-linecap="round" stroke-linejoin="round" d="M9 11l3-3m0 0l3 3m-3-3v8m0-13a9 9 0 110 18 9 9 0 010-18z" />
    </svg>

</div>
{#if !$ballSlot1}
    <ShotCargo startX={$ball1Coords.x} startY={$ball1Coords.y} endX={$centerCoords.x} endY="{$centerCoords.y}" miss={false} ballSlot={1}/>
    {/if}
{#if !$ballSlot2}
    <ShotCargo startX={$ball2Coords.x} startY={$ball2Coords.y} endX={$centerCoords.x} endY="{$centerCoords.y}" miss={false} ballSlot={2}/>
{/if}
{#if !$ballSlot3}
    <ShotCargo startX={$ball3Coords.x} startY={$ball3Coords.y} endX={$centerCoords.x} endY="{$centerCoords.y}" miss={false} ballSlot={3}/>
{/if}
{#if !$ballSlot4}
    <ShotCargo startX={$ball4Coords.x} startY={$ball4Coords.y} endX={$centerCoords.x} endY="{$centerCoords.y}" miss={false} ballSlot={4}/>
{/if}

<style>
    .box {
        --width: 130px;
        --height: 130px;
        position: fixed;
        width: var(--width);
        height: var(--height);
        border-radius: 4px;
        background-color: #ff3e00;

    }
</style>