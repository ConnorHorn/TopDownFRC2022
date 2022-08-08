import {writable} from "svelte/store";

export const matchTime= writable(150);
export const fieldWidth=writable(1800);
export const fieldHeight=writable(900);
export const ballsInRobot= writable(0);

export const intake= writable({ x1: 0, x2: 0, x3: 0, x4:0, y1: 0, y2: 0, y3: 0, y4: 0});
export const score=writable(0);
export const vizRing=writable(false);
export const vizRingSize=writable(900);
export const storeTurretAngle=writable(0);
export const fieldBallCount=writable(0);
export const globalX=writable(100);
export const globalY=writable(100);
export const globalAngle=writable(0);
export const ballBoxFrontLeft=writable({x:0,y:0});
export const ballBoxFrontRight=writable({x:0,y:0});
export const ballBoxBackLeft=writable({x:0,y:0});
export const ballBoxBackRight=writable({x:0,y:0});
export const globalSpeedX=writable(0);
export const globalSpeedY=writable(0);
