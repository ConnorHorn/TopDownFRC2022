<script>
    import { onInterval } from './utils.js';
    import {test} from "./stores";
    import { spring } from 'svelte/motion';
    import {writable} from "svelte/store";
    let key
    let x=100;
    let y=100;
    let speedModifier = 0.3;
    let wDown=false,aDown=false, sDown=false, dDown = false, jDown=false, lDown=false;
    let yValue=0, xValue=0;
    const coords = writable({ x: x, y: y});
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
        console.log("hi")
        if(wDown){
            console.log("hi2")
            if(yValue+2.5<=maxYAcc) {
                yValue+=2.5;
            }
        }
        if(sDown){
            console.log("hi3")
            if(yValue-2.5>=maxYAcc*-1) {
                yValue-=2.5;
            }
        }
        if(aDown){
            console.log("hi3")
            if(xValue-2.5>=maxXAcc*-1) {
                xValue-=2.5;
            }
        }
        if(dDown){
            console.log("hi3")
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
        console.log(xValue)
        x+=xValue*speedModifier;
        y-=yValue*speedModifier;
        if(x>window.innerWidth-100){
            x=window.innerWidth-100
        }
        if(y>window.innerHeight-100){
            y=window.innerHeight-100
        }
        if(x<0){
            x=0;
        }
        if(y<0){
            y=0;
        }
        coords.update($coords => ({
            x: x,
            y: y
        }));
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

    <svg xmlns="http://www.w3.org/2000/svg" class="h-[70px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" style="transform: rotate({rot*-1+Math.atan2( window.innerHeight/2-$coords.y-50, window.innerWidth/2 -$coords.x-50) * ( 180 / Math.PI )+90}deg)">
        <path stroke-linecap="round" stroke-linejoin="round" d="M9 11l3-3m0 0l3 3m-3-3v8m0-13a9 9 0 110 18 9 9 0 010-18z" />
    </svg>

</div>

<style>
    .box {
        --width: 100px;
        --height: 100px;
        position: fixed;
        width: var(--width);
        height: var(--height);
        border-radius: 4px;
        background-color: #ff3e00;

    }
</style>