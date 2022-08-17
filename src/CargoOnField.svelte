<script>

import Cargo from "./Cargo.svelte";
import {
    robotDatas,
    fieldHeight,
    fieldWidth,
    fieldBallCount,
    reset
} from "./stores";
import {onInterval} from "./utils";

let floorBalls = [];
let milliCount = 0;
const countUp = () => (milliCount += 1);
onInterval(countUp, 10);


let numberOfBallOnField=8;
$: {
    resetBalls($reset)
    occupyField(milliCount);
    clearIllegalBalls(floorBalls);
}

function resetBalls(){
    if($reset){
        floorBalls=[];
    }
}

function handleIntake(event){
    for(let i = 0; i < floorBalls.length; i++){
        if(floorBalls[i][0]===event.detail.x && floorBalls[i][1]===event.detail.y){
            floorBalls[i][0]=-100;
            floorBalls[i][1]=-100;
            $robotDatas[event.detail.robotIndex].ballsInRobot+=1;
            floorBalls=floorBalls;
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

function clearIllegalBalls(){
    for(let i = 0; i < floorBalls.length; i++){
        let splice=false;
        if(floorBalls[i][0]===-100 && floorBalls[i][1]===-100){
            splice=true;
        }
        if(splice){
            floorBalls.splice(i,1);
            floorBalls=floorBalls
        }
        // for(let k=i+1; k< floorBalls.length; k++){
        //     if(Math.sqrt((floorBalls[i][0]-floorBalls[k][0])**2+(floorBalls[i][1]-floorBalls[k][1])**2)<55/2){
        //
        //     }
        // }
    }
}

function occupyField(){
    let ballSum=0;
    for(let i=0;i<$robotDatas.length;i++){
        ballSum+=$robotDatas[i].ballsInRobot
    }
    while($fieldBallCount+ballSum<numberOfBallOnField){
        let x = Math.floor(Math.random()*$fieldWidth);
        let y = Math.floor(Math.random()*$fieldHeight);
        let ball = [x,y];
        if(!floorBalls.includes(ball) && Math.sqrt((ball[0]-$fieldWidth/2)**2+(ball[1]-$fieldHeight/2)**2)>150){
            $fieldBallCount++
            floorBalls.push(ball);
            floorBalls=floorBalls;
        }
    }
}
</script>

{#each floorBalls as ball (ball)}
    <Cargo coords={ball} on:intake={handleIntake}/>
{/each}
