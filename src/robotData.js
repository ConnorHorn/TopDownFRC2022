import {writable} from "svelte/store";

export class robotData {
    constructor(ballsInRobot, intake, turretAngle, robotCoords, robotAngle, robotBallBox, robotSpeeds, robotColor, robotConfig) {
        this.intake = intake;
        this.ballsInRobot = ballsInRobot;
        this.turretAngle = turretAngle;
        this.robotCoords = robotCoords;
        this.robotAngle = robotAngle;
        this.robotBallBox = robotBallBox;
        this.robotSpeeds = robotSpeeds;
        this.robotColor = robotColor;
        this.robotConfig = robotConfig;
    }


}
