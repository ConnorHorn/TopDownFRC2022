<script>

import Cargo from "./Cargo.svelte";
import {
    ballsInRobot,
    fieldHeight,
    fieldWidth,
    fieldBallCount,
    globalX,
    globalY,
    globalAngle,
    ballBoxFrontLeft, ballBoxFrontRight, ballBoxBackRight, ballBoxBackLeft
} from "./stores";
import {onInterval} from "./utils";

let floorBalls = [[$fieldWidth/2, $fieldHeight/2]];
let milliCount = 0;
const countUp = () => (milliCount += 1);
onInterval(countUp, 10);


let numberOfBallOnField=6;
$: {
    occupyField(milliCount);
    clearIllegalBalls(floorBalls);
}
function handleIntake(event){
    for(let i = 0; i < floorBalls.length; i++){
        if(floorBalls[i][0]===event.detail.x && floorBalls[i][1]===event.detail.y){
            floorBalls[i][0]=-100;
            floorBalls[i][1]=-100;
            $ballsInRobot++;
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
        if(Math.sqrt((floorBalls[i][0]-$fieldWidth/2)**2+(floorBalls[i][1]-$fieldHeight/2)**2)<135){
            $fieldBallCount--
            splice=true;
        }
        if(splice){
            floorBalls.splice(i,1);
            floorBalls=floorBalls
        }
    }
}

function occupyField(){
    while($fieldBallCount<numberOfBallOnField-1){
        let x = Math.floor(Math.random()*$fieldWidth);
        let y = Math.floor(Math.random()*$fieldHeight);
        let ball = [x,y];
        if(!floorBalls.includes(ball)  && !inside(ball,[[$ballBoxFrontLeft.x, $ballBoxFrontLeft.y], [$ballBoxFrontRight.x, $ballBoxFrontRight.y], [$ballBoxBackRight.x, $ballBoxBackRight.y], [$ballBoxBackLeft.x, $ballBoxBackLeft.y]])){
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
