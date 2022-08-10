<script>
    import {onInterval} from './utils.js';
    import {
        reset,
        fieldWidth,
        fieldHeight,
        vizRingSize,
        vizRing,
        robotDatas
    } from "./stores";
    import {writable} from "svelte/store";
    import ShotCargo from "./ShotCargo.svelte";

    export let dataIndex;
    let x = $robotDatas[dataIndex].robotCoords.x;
    let y = $robotDatas[dataIndex].robotCoords.y;
    let rot = $robotDatas[dataIndex].robotAngle;
    let turretAngle = $robotDatas[dataIndex].turretAngle;
    let balls = $robotDatas[dataIndex].ballsInRobot;
    let intakeCoords = $robotDatas[dataIndex].intake;
    let ballBox = $robotDatas[dataIndex].robotBallBox;
    let speeds = $robotDatas[dataIndex].robotSpeeds;
    let color = $robotDatas[dataIndex].color;
    let config = $robotDatas[dataIndex].config;

    console.log(dataIndex)

    let speedModifier = 0.3;
    let shiftDown = false, wDown = false, aDown = false, sDown = false, dDown = false, jDown = false, lDown = false,
        spaceDown = false;
    let yValue = 0, xValue = 0;
    const coords = writable({x: x, y: y});
    let centerCoords = writable({x: $fieldWidth / 2, y: $fieldHeight / 2})
    let maxYAcc = 100, maxXAcc = 100;
    let maxRotAcc = 8, maxRotSpeed = 700, rotAcc = 0, rotDecay = 0.3, rotPace = 0.5;
    let yDecay = 1, xDecay = 1;
    let milliCount = 0;
    let ballSize = 55;
    let turretSpeed = 3;
    let turretGoal = 0;
    let turretLockedOn = false;
    let turretSecretLockedOn = false;
    let ballShotPace = 18;
    let lastBallShot = -1000;
    let ballsShot = [];
    let activeBallID = 0;
    const countUp = () => (milliCount += 1);
    onInterval(countUp, 15);
    $ : {
        resetBot($reset)
        retrieveData($robotDatas[dataIndex])
        calcMovement(milliCount)
        calcRotation(milliCount)
        manageIntake(milliCount)
        manageTurret(milliCount)
        updateData(x, y, rot, turretAngle, balls, speeds)
        console.log(dataIndex)
    }


    function resetBot() {
        if ($reset) {
            turretAngle = 0;
            x = 100;
            y = 100;
            yValue = 0;
            xValue = 0;
            rot = 0;
        }
        $reset = false;
    }

    function calcRotation() {
        console.log("rotatin")
        if (jDown) {
            if (rotAcc - rotPace >= maxRotAcc * -1) {
                rotAcc -= rotPace;
            }
        }
        if (lDown) {
            if (rotAcc + rotPace <= maxRotAcc) {
                rotAcc += rotPace;
            }
        }
        if (Math.abs(rotAcc) < rotDecay) {
            rotAcc = 0;
        }
        if (rotAcc > 0) {
            rotAcc -= rotDecay
        }
        if (rotAcc < 0) {
            rotAcc += rotDecay
        }
        rot += rotAcc;
    }

    function calcMovement() {
        let xPlacement = $coords.x > $fieldWidth / 2;
        let yPlacement = $coords.y > $fieldHeight / 2
        if (!checkMoveValid($coords.x, $coords.y)) {
            coords.update($coords => ({
                x: ((xPlacement) ? $coords.x + 10 : $coords.x - 10),
                y: ((yPlacement) ? $coords.y + 10 : $coords.y)
            }));

        }
        if (wDown) {
            if (yValue + 2.5 <= maxYAcc) {
                yValue += 2.5;
            }
        }
        if (sDown) {
            if (yValue - 2.5 >= maxYAcc * -1) {
                yValue -= 2.5;
            }
        }
        if (aDown) {
            if (xValue - 2.5 >= maxXAcc * -1) {
                xValue -= 2.5;
            }
        }
        if (dDown) {
            if (xValue + 2.5 <= maxXAcc) {
                xValue += 2.5;
            }
        }
        if (spaceDown) {
            yValue = Math.sign(yValue) * yDecay + yValue * 0.8;
            xValue = Math.sign(xValue) * xDecay + xValue * 0.8;
        }
        if (Math.abs(yValue) < yDecay) {
            yValue = 0;
        }
        if (Math.abs(xValue) < xDecay) {
            xValue = 0;
        }
        if (yValue > 0) {
            yValue -= yDecay;
        }
        if (yValue < 0) {
            yValue += yDecay;
        }
        if (xValue > 0) {
            xValue -= xDecay;
        }
        if (xValue < 0) {
            xValue += xDecay;
        }
        x += xValue * speedModifier;
        y -= yValue * speedModifier;
        if (x > $fieldWidth - 65) {
            x = $fieldWidth - 65
        }
        if (y > $fieldHeight - 65) {
            y = $fieldHeight - 65
        }
        if (x - 65 < 0) {
            x = 65;
        }
        if (y - 65 < 0) {
            y = 65;
        }
        let xValid = false, yValid = false;
        if (checkMoveValid($coords.x, y)) {
            xValid = true;
        }
        if (checkMoveValid(x, $coords.y)) {
            yValid = true;
        }
        if (!checkMoveValid(x, y)) {
            xValid = false;
            yValid = false;
        }
        coords.update($coords => ({
            x: ((xValid) ? x : $coords.x),
            y: ((yValid) ? y : $coords.y)
        }));
        if (!xValid) {
            xValue = 0;
        }
        if (!yValid) {
            yValue = 0;
        }
        x = $coords.x
        y = $coords.y
        let ballGap = ballSize / 2;
        ballBox = {
            x1: rotate(x, y, x - 65 - ballGap, y - 65 - ballGap, rot * -1)[0],
            x2: rotate(x, y, x + 65 + ballGap, y - 65 - ballGap, rot * -1)[0],
            x3: rotate(x, y, x + 65 + ballGap, y + 65 + ballGap, rot * -1)[0],
            x4: rotate(x, y, x - 65 - ballGap, y + 65 + ballGap, rot * -1)[0],
            y1: rotate(x, y, x - 65 - ballGap, y - 65 - ballGap, rot * -1)[1],
            y2: rotate(x, y, x + 65 + ballGap, y - 65 - ballGap, rot * -1)[1],
            y3: rotate(x, y, x + 65 + ballGap, y + 65 + ballGap, rot * -1)[1],
            y4: rotate(x, y, x - 65 - ballGap, y + 65 + ballGap, rot * -1)[1]
        }
        x=x;
        y=y;
    }

    function checkMoveValid(x, y) {
        // console.log(Math.sqrt(Math.abs($fieldWidth/2 - x-65) ** 2 + Math.abs($fieldHeight/2 - y-65) ** 2))
        return Math.sqrt(Math.abs($fieldWidth / 2 - x) ** 2 + Math.abs($fieldHeight / 2 - y) ** 2) >= 180;

    }

    function updateData(){
        $robotDatas[dataIndex].robotCoords.x = x;
        $robotDatas[dataIndex].robotCoords.y = y;
        $robotDatas[dataIndex].robotAngle = rot;
        $robotDatas[dataIndex].turretAngle = turretAngle;
        $robotDatas[dataIndex].ballsInRobot = balls;
        $robotDatas[dataIndex].intake = intakeCoords;
        $robotDatas[dataIndex].robotBallBox = ballBox;
        $robotDatas[dataIndex].robotSpeeds.x = xValue*speedModifier;
        $robotDatas[dataIndex].robotSpeeds.y = yValue*speedModifier;
        $robotDatas[dataIndex].color = color;
        $robotDatas[dataIndex].config = config;
    }

    function retrieveData(){
        x = $robotDatas[dataIndex].robotCoords.x;
        y = $robotDatas[dataIndex].robotCoords.y;
        rot = $robotDatas[dataIndex].robotAngle;
        turretAngle = $robotDatas[dataIndex].turretAngle;
        balls = $robotDatas[dataIndex].ballsInRobot;
        intakeCoords = $robotDatas[dataIndex].intake;
        ballBox = $robotDatas[dataIndex].robotBallBox;
        speeds = $robotDatas[dataIndex].robotSpeeds;
        color = $robotDatas[dataIndex].color;
        config = $robotDatas[dataIndex].config;
    }

    function manageIntake() {
        intakeCoords={
            x1: rotate($coords.x, $coords.y, $coords.x - 60 - ballSize / 2, $coords.y - 120 - ballSize / 2, rot * -1)[0], //top left
            y1: rotate($coords.x, $coords.y, $coords.x - 60 - ballSize / 2, $coords.y - 120 - ballSize / 2, rot * -1)[1],
            x2: rotate($coords.x, $coords.y, $coords.x + 60 + ballSize / 2, $coords.y - 120 - ballSize / 2, rot * -1)[0], //top right
            y2: rotate($coords.x, $coords.y, $coords.x + 60 + ballSize / 2, $coords.y - 120 - ballSize / 2, rot * -1)[1],
            x3: rotate($coords.x, $coords.y, $coords.x + 60 + ballSize / 2, $coords.y - 65, rot * -1)[0], //bottom right
            y3: rotate($coords.x, $coords.y, $coords.x + 60 + ballSize / 2, $coords.y - 65, rot * -1)[1],
            x4: rotate($coords.x, $coords.y, $coords.x - 60 - ballSize / 2, $coords.y - 65, rot * -1)[0], //bottom left
            y4: rotate($coords.x, $coords.y, $coords.x - 60 - ballSize / 2, $coords.y - 65, rot * -1)[1]
        };
    }

    function manageTurret() {
        let distanceFromGoal = Math.sqrt(($coords.x - $fieldWidth / 2) ** 2 + ($coords.y - $fieldHeight / 2) ** 2);
        turretGoal = (rot * -1 + Math.atan2($fieldHeight / 2 - $coords.y, $fieldWidth / 2 - $coords.x) * (180 / Math.PI) + 90) % 360;
        if (turretGoal < 0) {
            turretGoal += 360;
        }
        if (distanceFromGoal < $vizRingSize / 2) {
            $vizRing = true;
            if (calcTurretDirection(turretGoal, turretAngle)) {
                turretAngle += turretSpeed;
                if (spaceDown) {
                    turretAngle += turretSpeed;
                }
            } else {
                turretAngle -= turretSpeed;
                if (spaceDown) {
                    turretAngle -= turretSpeed;
                }
            }
        } else {
            if (!shiftDown) {
                $vizRing = false;
            }
            // turretAngle += turretSpeed * 1.5;
        }
        if (turretAngle < 0) {
            turretAngle += 360;
        }
        turretAngle = turretAngle % 360;
        if (Math.min(Math.abs(turretAngle - turretGoal), Math.abs(360 - turretGoal + turretAngle)) < turretSpeed * 3 && distanceFromGoal < $vizRingSize / 2) {
            turretAngle = turretGoal;
            turretLockedOn = true;
        } else {
            turretLockedOn = false;
        }
        //Enable to allow for shooting from range if turret is aligned, even if out of range
        turretSecretLockedOn = Math.min(Math.abs(turretAngle - turretGoal), Math.abs(360 - turretGoal + turretAngle)) < turretSpeed * 3 && distanceFromGoal < $vizRingSize / 2 + 100;
        if (distanceFromGoal > $vizRingSize / 2) {
            turretLockedOn = false;
        }
    }

    function calcTurretDirection(to, from) {
        let aboveInside = 99999, belowInside = 9999, overTop = 9999, overBottom = 9999;
        if (from > to) {
            aboveInside = from - to;
            overTop = 360 - from + to;
        }
        if (from < to) {
            belowInside = to - from;
            overBottom = 360 - to + from;
        }
        let minValue = Math.min(aboveInside, belowInside, overTop, overBottom);
        if (minValue === aboveInside) {
            return false;
        }
        if (minValue === belowInside) {
            return true;
        }
        if (minValue === overTop) {
            return true;
        }
        if (minValue === overBottom) {
            return false;
        }
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
        let key = event.key.toLowerCase();
        // if (event.repeat) return;
        switch (key) {
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
            case " ":
                spaceDown = true;
                event.preventDefault();
                break;
            case "shift":
                shiftDown = true;
                $vizRing = true
                event.preventDefault();
                break;
        }
    }

    function on_key_up(event) {
        let key = event.key.toLowerCase();
        // if (event.repeat) return;
        switch (key) {
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
            case " ":
                spaceDown = false;
                if (balls > 0 && milliCount - lastBallShot > ballShotPace) {
                    lastBallShot = milliCount;

                    ballsShot.push({
                        startX: $coords.x,
                        startY: $coords.y,
                        endX: $centerCoords.x,
                        endY: $centerCoords.y,
                        miss: !(turretLockedOn || turretSecretLockedOn),
                        id: activeBallID
                    });
                    activeBallID++;
                    ballsShot = ballsShot
                }

                event.preventDefault();
                break;
            case "shift":
                shiftDown = false;
                $vizRing = false
                event.preventDefault();
                break;
        }
    }

    function cargoScored(event) {
        for (let i = 0; i < ballsShot.length; i++) {
            if (ballsShot[i].id === event.detail.id) {
                ballsShot.splice(i, 1);
                ballsShot = ballsShot;
            }
        }

    }
</script>

<svelte:window
        on:keydown={on_key_down}
        on:keyup={on_key_up}
/>

<div class="fixed z-40">
    <!--{turretGoal}-->
    <!--{turretAngle}-->
</div>

<div class="box grid h-screen place-items-center" id="robot" style="transform:
		translate({x-65}px,{y-65}px)
        rotate({rot}deg)">

    <svg xmlns="http://www.w3.org/2000/svg" class="h-[90px] fixed" fill="none" viewBox="0 0 24 24"
         stroke={((turretLockedOn) ? "green" : "white")} stroke-width="2" style="transform: rotate({turretAngle}deg)">
        <path stroke-linecap="round" stroke-linejoin="round"
              d="M9 11l3-3m0 0l3 3m-3-3v8m0-13a9 9 0 110 18 9 9 0 010-18z"/>
    </svg>
    <svg class="fixed ml-[100px] mt-[100px]"
         width="30px" height="30px"
         viewBox="0 0 21 21" stroke-width="3" xmlns="http://www.w3.org/2000/svg">
        <circle cx="10.5" cy="10.5" fill={((balls>0) ? ((balls>1) ? "green" : "yellow") : "none")} r="7"
                stroke="currentColor" stroke-linecap="round"
                stroke-linejoin="round"/>
    </svg>


    <intake>
        <svg id="intake" xmlns="http://www.w3.org/2000/svg" class="fixed -mt-[158px] w-[160px] -ml-[80px]"
             viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round"
                  d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"/>
        </svg>
    </intake>

</div>

{#each ballsShot as ball (ball.id)}
    <ShotCargo startX={ball.startX} dataIndex={dataIndex} startY={ball.startY} endX={ball.endX} endY="{ball.endY}" miss={ball.miss}
               id="{ball.id}" on:scored={cargoScored}/>
{/each}


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