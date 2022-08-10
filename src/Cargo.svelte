<script>
    import {onInterval} from "./utils";
    import {
        fieldHeight, fieldWidth, robotDatas
    } from "./stores";
    import { createEventDispatcher } from 'svelte';

    const dispatch = createEventDispatcher();
    export let coords;
    let milliCount=0;
    let ballSize=55;
   export let speedX=0;
   export let speedY=0;
    let speedDecay=0.15;
    const countUp = () => (milliCount += 1.8);
    let insideIntake=false;
    let insideRobot=false;
    onInterval(countUp, 15);
    $: {
        checkInside(milliCount)
        pushBall(milliCount)
    }
    function intook(i) {
        speedX=0;
        speedY=0;
        dispatch('intake', {
            x: coords[0],
            y: coords[1],
            robotIndex: i
        });
    }

    function checkInside(){
        for(let i=0; i<$robotDatas.length; i++) {
            let polygon = [[$robotDatas[i].intake.x1, $robotDatas[i].intake.y1], [$robotDatas[i].intake.x2, $robotDatas[i].intake.y2], [$robotDatas[i].intake.x3, $robotDatas[i].intake.y3], [$robotDatas[i].intake.x4, $robotDatas[i].intake.y4]]
            insideIntake = inside(coords, polygon)
            if (insideIntake && $robotDatas[i].ballsInRobot < 2) {
                intook(i);
            }
        }
    }

    function inside(point, vs) {
        let x = point[0], y = point[1];

        let inside = false;
        for (let i = 0, j = vs.length - 1; i < vs.length; j = i++) {
            let xi = vs[i][0], yi = vs[i][1];
            let xj = vs[j][0], yj = vs[j][1];

            let intersect = ((yi > y) !== (yj > y))
                && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
            if (intersect) inside = !inside;
        }

        return inside;
    }

    function pushBall() {
        for(let y=0;y<$robotDatas.length;y++) {
            let robotPolygon = [[$robotDatas[y].robotBallBox.x1, $robotDatas[y].robotBallBox.y1], [$robotDatas[y].robotBallBox.x2, $robotDatas[y].robotBallBox.y2], [$robotDatas[y].robotBallBox.x3, $robotDatas[y].robotBallBox.y3], [$robotDatas[y].robotBallBox.x4, $robotDatas[y].robotBallBox.y4]]
            insideRobot = inside(coords, robotPolygon)
            if (insideRobot) {
                if (Math.abs($robotDatas[y].robotSpeeds.x) > Math.abs(speedX) || Math.sign($robotDatas[y].robotSpeeds.x) !== Math.sign(speedX)) {
                    speedX = $robotDatas[y].robotSpeeds.x;
                }
                if (Math.abs($robotDatas[y].robotSpeeds.y) > Math.abs(speedY) || Math.sign($robotDatas[y].robotSpeeds.y) !== Math.sign(speedY)) {
                    speedY = $robotDatas[y].robotSpeeds.y;
                }
            }
        }
        // if(!inside([[coords[0]+speedX],[coords[1]-speedY]],robotPolygon)) {
            coords[0] += speedX;
            coords[1] -= speedY;
        // }
        if(speedX>0){
            speedX-=speedDecay;
        }
        if(speedX<0){
            speedX+=speedDecay;
        }
        if(speedY>0){
            speedY-=speedDecay;
        }
        if(speedY<0){
            speedY+=speedDecay;
        }
        isWhereItShouldntBe();
    }

    function isWhereItShouldntBe(){
        if(coords[0]<=ballSize/2 && coords[0]!==-100){
            coords[0]=ballSize/2;
            speedX*=-1;
        }
        if(coords[0]>=$fieldWidth-ballSize/2){
            coords[0]=$fieldWidth-ballSize/2;
            speedX*=-1;
        }
        if(coords[1]<=ballSize/2 && coords[1]!==-100){
            coords[1]=ballSize/2;
            speedY*=-1;
        }
        if(coords[1]>=$fieldHeight-ballSize/2){
            coords[1]=$fieldHeight-ballSize/2;
            speedY*=-1;
        }
        if(Math.sqrt((coords[0]-$fieldWidth/2)**2+(coords[1]-$fieldHeight/2)**2)<120+ballSize/2){

            speedX*=-1;
            speedY*=-1;
            if(speedX>0){
                speedX-=speedDecay;
            }
            if(speedX<0){
                speedX+=speedDecay;
            }
            if(speedY>0){
                speedY-=speedDecay;
            }
            if(speedY<0){
                speedY+=speedDecay;
            }
        }
    }

</script>




<div class="fixed" style="transform:
		translate({coords[0]-ballSize/2}px,{coords[1]-ballSize/2}px)">

    <svg id="Layer_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"
         width="{ballSize}px" height="{ballSize}px" viewBox="0 0 120 120" enable-background="new 0 0 120 120" xml:space="preserve">
<circle cx="60" cy="60.834" r="{ballSize}" style="fill:red"/>
</svg>

</div>