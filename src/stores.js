import {writable} from "svelte/store";

export const test= writable(0);
export const fieldWidth=writable(1800);
export const fieldHeight=writable(900);
export const ballsInRobot= writable(0);
export const ballSlot1=writable(true);
export const ballSlot2=writable(true);
export const ballSlot3=writable(true);
export const ballSlot4=writable(true);
export const intake= writable({ x1: 0, x2: 0, x3: 0, x4:0, y1: 0, y2: 0, y3: 0, y4: 0});