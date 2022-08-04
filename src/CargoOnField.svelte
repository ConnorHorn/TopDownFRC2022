<script>

import Cargo from "./Cargo.svelte";
import {ballsInRobot, fieldHeight, fieldWidth} from "./stores";

let floorBalls = [[500,200]];



let numberOfBallOnField=5;
$: {
    clearIllegalBalls(floorBalls);
    occupyField(floorBalls);
}
console.log(floorBalls);
function handleIntake(event){
    console.log("lol")
    for(let i = 0; i < floorBalls.length; i++){
        if(floorBalls[i][0]===event.detail.x && floorBalls[i][1]===event.detail.y){
            console.log("delete")
            floorBalls[i][0]=-100;
            floorBalls[i][1]=-100;
            $ballsInRobot++;
        }
    }
    console.log("array"+floorBalls)
}

function clearIllegalBalls(){
    for(let i = 0; i < floorBalls.length; i++){
        if(floorBalls[i][0]===-100 && floorBalls[i][1]===-100){
            floorBalls.splice(i,1);
        }
    }
}

function occupyField(){
    while(floorBalls.length<numberOfBallOnField){
        let x = Math.floor(Math.random()*$fieldWidth);
        let y = Math.floor(Math.random()*$fieldHeight);
        let ball = [x,y];
        if(!floorBalls.includes(ball)){
            floorBalls.push(ball);
        }
    }
}
</script>

{#each floorBalls as ball}
    <Cargo coords={ball} on:intake={handleIntake}/>
{/each}
