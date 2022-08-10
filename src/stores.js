import {writable} from "svelte/store";
export const numberOfRobots=writable(5);
export const matchTime= writable(150);
export const fieldWidth=writable(1800);
export const fieldHeight=writable(900);
// export const ballsInRobot= writable(0);
export const reset=writable(false);
// export const intake= writable({ x1: 0, x2: 0, x3: 0, x4:0, y1: 0, y2: 0, y3: 0, y4: 0});
export const score=writable(0);
export const vizRing=writable(false);
export const vizRingSize=writable(900);
// export const storeTurretAngle=writable(0);
export const fieldBallCount=writable(0);
// export const robotCoord=writable({x:100, y:100})
// export const globalAngle=writable(0);
// export const robotBallBox=writable({x1:0,x2:0,x3:0,x4:0,y1:0,y2:0,y3:0,y4:0});
// export const globalSpeedX=writable(0);
// export const globalSpeedY=writable(0);
// export const robotSpeed=writable({x:0, y:0})


//---------------------------------------------------
//Generic Robot
export const robotDatas=writable([])





