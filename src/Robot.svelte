<script>
    import { onInterval } from './utils.js';
    import {fieldWidth, fieldHeight, ballSlot1, ballSlot2, ballSlot3, ballSlot4, intake, ballsInRobot} from "./stores";
    import { spring } from 'svelte/motion';
    import {writable} from "svelte/store";
    import ShotCargo from "./ShotCargo.svelte";
    import Cargo from "./Cargo.svelte";
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
    let centerCoords = writable({x: $fieldWidth/2, y: $fieldHeight/2})
    let maxYAcc=100, maxXAcc=100;
    let maxRotAcc=8, maxRotSpeed=700, rotAcc=0, rot=0, rotDecay=0.3, rotPace=0.5;
    let yDecay=1, xDecay=1;
    let milliCount=0;
    let ballSize=55;
    const countUp = () => (milliCount += 1);
    onInterval(countUp, 15);

    $ : {
        calcMovement(milliCount)
        calcRotation(milliCount)
        manageIntake(milliCount)
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
        if(rotAcc<0) {
            rotAcc += rotDecay
        }
        rot+=rotAcc;
    }

    function calcMovement() {
        let xPlacement=$coords.x>$fieldWidth/2;
        let yPlacement=$coords.y>$fieldHeight/2
        if(!checkMoveValid($coords.x, $coords.y)){
            coords.update($coords => ({
                x: ((xPlacement) ? $coords.x+10 : $coords.x-10),
                y: ((yPlacement) ? $coords.y+10 : $coords.y)
            }));

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
        if(spaceDown){
            yValue=Math.sign(yValue)*yDecay+yValue*0.8;
            xValue=Math.sign(xValue)*xDecay+xValue*0.8;
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
        if(x>$fieldWidth-65){
            x=$fieldWidth-65
        }
        if(y>$fieldHeight-65){
            y=$fieldHeight-65
        }
        if(x-65<0){
            x=65;
        }
        if(y-65<0){
            y=65;
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
       // console.log(Math.sqrt(Math.abs($fieldWidth/2 - x-65) ** 2 + Math.abs($fieldHeight/2 - y-65) ** 2))
        return Math.sqrt(Math.abs($fieldWidth/2 - x) ** 2 + Math.abs($fieldHeight/2 - y) ** 2) >= 180;

    }

    function manageIntake(){
        intake.update($intake => ({
            x1: rotate($coords.x,$coords.y,$coords.x-60-ballSize/2,$coords.y-120-ballSize/2,rot*-1)[0],
            y1: rotate($coords.x,$coords.y,$coords.x-60-ballSize/2,$coords.y-120-ballSize/2,rot*-1)[1],
            x2: rotate($coords.x,$coords.y,$coords.x+60+ballSize/2,$coords.y-120-ballSize/2,rot*-1)[0],
            y2: rotate($coords.x,$coords.y,$coords.x+60+ballSize/2,$coords.y-120-ballSize/2,rot*-1)[1],
            x3: rotate($coords.x,$coords.y,$coords.x+60+ballSize/2,$coords.y-65,rot*-1)[0],
            y3: rotate($coords.x,$coords.y,$coords.x+60+ballSize/2,$coords.y-65,rot*-1)[1],
            x4: rotate($coords.x,$coords.y,$coords.x-60-ballSize/2,$coords.y-65,rot*-1)[0],
            y4: rotate($coords.x,$coords.y,$coords.x-60-ballSize/2,$coords.y-65,rot*-1)[1]
        }));
    }

    function rotate(cx, cy, x, y, angle) {
        let radians = (Math.PI / 180) * angle,
            cos = Math.cos(radians),
            sin = Math.sin(radians),
            nx = (cos * (x - cx)) + (sin * (y - cy)) + cx,
            ny = (cos * (y - cy)) - (sin * (x - cx)) + cy;
        return [nx, ny];
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
                spaceDown = false;
                if($ballsInRobot>0) {
                    if ($ballSlot1) {
                        ball1Coords.update($ball1Coords => ({
                            x: $coords.x,
                            y: $coords.y
                        }));
                        $ballSlot1 = false;
                    } else if ($ballSlot2) {
                        ball2Coords.update($ball2Coords => ({
                            x: $coords.x,
                            y: $coords.y
                        }));
                        $ballSlot2 = false;
                    } else if ($ballSlot3) {
                        ball3Coords.update($ball3Coords => ({
                            x: $coords.x,
                            y: $coords.y
                        }));
                        $ballSlot3 = false;
                    } else if ($ballSlot4) {
                        ball4Coords.update($ball4Coords => ({
                            x: $coords.x,
                            y: $coords.y
                        }));
                        $ballSlot4 = false;
                    }
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
    {Math.atan2( $fieldHeight/2-$coords.y-50, $fieldWidth/2 -$coords.x-50) * ( 180 / Math.PI)+90}
    {$fieldWidth}
    {$fieldHeight}
</div>

<div class="box grid h-screen place-items-center" id="robot" style="transform:
		translate({$coords.x-65}px,{$coords.y-65}px)
        rotate({rot}deg)">

    <svg xmlns="http://www.w3.org/2000/svg" class="h-[90px] fixed" fill="none" viewBox="0 0 24 24" stroke={(($ballsInRobot===2) ? "green" : "white")} stroke-width="2" style="transform: rotate({rot*-1+Math.atan2( $fieldHeight/2-$coords.y-50, $fieldWidth/2 -$coords.x-50) * ( 180 / Math.PI )+90}deg)">
        <path stroke-linecap="round" stroke-linejoin="round" d="M9 11l3-3m0 0l3 3m-3-3v8m0-13a9 9 0 110 18 9 9 0 010-18z" />
    </svg>

    <intake>
    <svg id="intake" xmlns="http://www.w3.org/2000/svg" class="fixed -mt-[158px] w-[160px] -ml-[80px]" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
        <path stroke-linecap="round" stroke-linejoin="round" d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
    </svg>
    </intake>

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