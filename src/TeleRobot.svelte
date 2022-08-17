<script>
    import {onInterval} from './utils.js';
    import {
        reset,
        fieldWidth,
        fieldHeight,
        vizRingSize,
        vizRing,
        robotDatas, controls
    } from "./stores";
    import {writable} from "svelte/store";
    import ShotCargo from "./ShotCargo.svelte";

    export let dataIndex;

    let speedModifier = 0.3;
    let shiftDown = false, wDown = false, aDown = false, sDown = false, dDown = false, jDown = false, lDown = false,
        spaceDown = false;
    let yValue = 0, xValue = 0;
    const coords = writable({x: $robotDatas[dataIndex].robotCoords.x, y: $robotDatas[dataIndex].robotCoords.y});
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
    let startX = $robotDatas[dataIndex].robotCoords.x
    const countUp = () => (milliCount += 1);
    onInterval(countUp, 15);
    $ : {
        resetBot($reset)
        // retrieveData($robotDatas[dataIndex])
        calcMovement(milliCount)
        calcRotation(milliCount)
        manageIntake(milliCount)
        manageTurret(milliCount)
        // updateData(x, y, rot, turretAngle, balls, speeds)
    }


    function resetBot() {
        if ($reset) {
            $robotDatas[dataIndex].turretAngle = 0;
            $robotDatas[dataIndex].robotCoords.x = startX;
            $robotDatas[dataIndex].robotCoords.y = 100;
            yValue = 0;
            xValue = 0;
            $robotDatas[dataIndex].robotAngle = 0;
        }
    }

    function calcRotation() {
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
        $robotDatas[dataIndex].robotAngle += rotAcc;
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
            if (yValue + 2.8 <= maxYAcc) {
                yValue += 2.8;
            }
        }
        if (sDown) {
            if (yValue - 2.8 >= maxYAcc * -1) {
                yValue -= 2.8;
            }
        }
        if (aDown) {
            if (xValue - 2.8 >= maxXAcc * -1) {
                xValue -= 2.8;
            }
        }
        if (dDown) {
            if (xValue + 2.8 <= maxXAcc) {
                xValue += 2.8;
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
        $robotDatas[dataIndex].robotCoords.x += xValue * speedModifier;
        $robotDatas[dataIndex].robotCoords.y -= yValue * speedModifier;
        if ($robotDatas[dataIndex].robotCoords.x > $fieldWidth - 65) {
            $robotDatas[dataIndex].robotCoords.x = $fieldWidth - 65
        }
        if ($robotDatas[dataIndex].robotCoords.y > $fieldHeight - 65) {
            $robotDatas[dataIndex].robotCoords.y = $fieldHeight - 65
        }
        if ($robotDatas[dataIndex].robotCoords.x - 65 < 0) {
            $robotDatas[dataIndex].robotCoords.x = 65;
        }
        if ($robotDatas[dataIndex].robotCoords.y - 65 < 0) {
            $robotDatas[dataIndex].robotCoords.y = 65;
        }
        let xValid = false, yValid = false;
        if (checkMoveValid($coords.x, $robotDatas[dataIndex].robotCoords.y)) {
            xValid = true;
        }
        if (checkMoveValid($robotDatas[dataIndex].robotCoords.x, $coords.y)) {
            yValid = true;
        }
        if (!checkMoveValid($robotDatas[dataIndex].robotCoords.x, $robotDatas[dataIndex].robotCoords.y)) {
            xValid = false;
            yValid = false;
        }
        coords.update($coords => ({
            x: ((!checkRobotCollide() && xValid) ? $robotDatas[dataIndex].robotCoords.x : $coords.x),
            y: ((!checkRobotCollide() && yValid) ? $robotDatas[dataIndex].robotCoords.y : $coords.y)
        }));
        if (!xValid) {
            xValue = 0;
        }
        if (!yValid) {
            yValue = 0;
        }
            $robotDatas[dataIndex].robotCoords.x = $coords.x
            $robotDatas[dataIndex].robotCoords.y = $coords.y

        let ballGap = ballSize / 2;
        $robotDatas[dataIndex].robotBallBox = {
            x1: rotate($robotDatas[dataIndex].robotCoords.x, $robotDatas[dataIndex].robotCoords.y, $robotDatas[dataIndex].robotCoords.x - 65 - ballGap, $robotDatas[dataIndex].robotCoords.y - 65 - ballGap, $robotDatas[dataIndex].robotAngle * -1)[0],
            x2: rotate($robotDatas[dataIndex].robotCoords.x, $robotDatas[dataIndex].robotCoords.y, $robotDatas[dataIndex].robotCoords.x + 65 + ballGap, $robotDatas[dataIndex].robotCoords.y - 65 - ballGap, $robotDatas[dataIndex].robotAngle * -1)[0],
            x3: rotate($robotDatas[dataIndex].robotCoords.x, $robotDatas[dataIndex].robotCoords.y, $robotDatas[dataIndex].robotCoords.x + 65 + ballGap, $robotDatas[dataIndex].robotCoords.y + 65 + ballGap, $robotDatas[dataIndex].robotAngle * -1)[0],
            x4: rotate($robotDatas[dataIndex].robotCoords.x, $robotDatas[dataIndex].robotCoords.y, $robotDatas[dataIndex].robotCoords.x - 65 - ballGap, $robotDatas[dataIndex].robotCoords.y + 65 + ballGap, $robotDatas[dataIndex].robotAngle * -1)[0],
            y1: rotate($robotDatas[dataIndex].robotCoords.x, $robotDatas[dataIndex].robotCoords.y, $robotDatas[dataIndex].robotCoords.x - 65 - ballGap, $robotDatas[dataIndex].robotCoords.y - 65 - ballGap, $robotDatas[dataIndex].robotAngle * -1)[1],
            y2: rotate($robotDatas[dataIndex].robotCoords.x, $robotDatas[dataIndex].robotCoords.y, $robotDatas[dataIndex].robotCoords.x + 65 + ballGap, $robotDatas[dataIndex].robotCoords.y - 65 - ballGap, $robotDatas[dataIndex].robotAngle * -1)[1],
            y3: rotate($robotDatas[dataIndex].robotCoords.x, $robotDatas[dataIndex].robotCoords.y, $robotDatas[dataIndex].robotCoords.x + 65 + ballGap, $robotDatas[dataIndex].robotCoords.y + 65 + ballGap, $robotDatas[dataIndex].robotAngle * -1)[1],
            y4: rotate($robotDatas[dataIndex].robotCoords.x, $robotDatas[dataIndex].robotCoords.y, $robotDatas[dataIndex].robotCoords.x - 65 - ballGap, $robotDatas[dataIndex].robotCoords.y + 65 + ballGap, $robotDatas[dataIndex].robotAngle * -1)[1]
        }
        $robotDatas[dataIndex].robotBox = {
            x1: rotate($robotDatas[dataIndex].robotCoords.x, $robotDatas[dataIndex].robotCoords.y, $robotDatas[dataIndex].robotCoords.x - 65, $robotDatas[dataIndex].robotCoords.y - 65, $robotDatas[dataIndex].robotAngle * -1)[0],
            x2: rotate($robotDatas[dataIndex].robotCoords.x, $robotDatas[dataIndex].robotCoords.y, $robotDatas[dataIndex].robotCoords.x + 65, $robotDatas[dataIndex].robotCoords.y - 65, $robotDatas[dataIndex].robotAngle * -1)[0],
            x3: rotate($robotDatas[dataIndex].robotCoords.x, $robotDatas[dataIndex].robotCoords.y, $robotDatas[dataIndex].robotCoords.x + 65, $robotDatas[dataIndex].robotCoords.y + 65, $robotDatas[dataIndex].robotAngle * -1)[0],
            x4: rotate($robotDatas[dataIndex].robotCoords.x, $robotDatas[dataIndex].robotCoords.y, $robotDatas[dataIndex].robotCoords.x - 65, $robotDatas[dataIndex].robotCoords.y + 65, $robotDatas[dataIndex].robotAngle * -1)[0],
            y1: rotate($robotDatas[dataIndex].robotCoords.x, $robotDatas[dataIndex].robotCoords.y, $robotDatas[dataIndex].robotCoords.x - 65, $robotDatas[dataIndex].robotCoords.y - 65, $robotDatas[dataIndex].robotAngle * -1)[1],
            y2: rotate($robotDatas[dataIndex].robotCoords.x, $robotDatas[dataIndex].robotCoords.y, $robotDatas[dataIndex].robotCoords.x + 65, $robotDatas[dataIndex].robotCoords.y - 65, $robotDatas[dataIndex].robotAngle * -1)[1],
            y3: rotate($robotDatas[dataIndex].robotCoords.x, $robotDatas[dataIndex].robotCoords.y, $robotDatas[dataIndex].robotCoords.x + 65, $robotDatas[dataIndex].robotCoords.y + 65, $robotDatas[dataIndex].robotAngle * -1)[1],
            y4: rotate($robotDatas[dataIndex].robotCoords.x, $robotDatas[dataIndex].robotCoords.y, $robotDatas[dataIndex].robotCoords.x - 65, $robotDatas[dataIndex].robotCoords.y + 65, $robotDatas[dataIndex].robotAngle * -1)[1]
        }
        $robotDatas[dataIndex].robotCoords.x = $robotDatas[dataIndex].robotCoords.x;
        $robotDatas[dataIndex].robotCoords.y = $robotDatas[dataIndex].robotCoords.y;
    }

    function checkMoveValid(x, y) {
        // console.log(Math.sqrt(Math.abs($fieldWidth/2 - x-65) ** 2 + Math.abs($fieldHeight/2 - y-65) ** 2))

        return Math.sqrt(Math.abs($fieldWidth / 2 - $robotDatas[dataIndex].robotCoords.x) ** 2 + Math.abs($fieldHeight / 2 - y) ** 2) >= 180;

    }

    function checkRobotCollide(){
        for (let p = 0; p < $robotDatas.length - 1; p++) {
            if (
                intersects($robotDatas[dataIndex].robotBox.x1, $robotDatas[dataIndex].robotBox.y1, $robotDatas[dataIndex].robotBox.x2, $robotDatas[dataIndex].robotBox.y2, $robotDatas[p].robotBox.x1, $robotDatas[p].robotBox.y1, $robotDatas[p].robotBox.x2, $robotDatas[p].robotBox.y2) ||
                intersects($robotDatas[dataIndex].robotBox.x2, $robotDatas[dataIndex].robotBox.y2, $robotDatas[dataIndex].robotBox.x3, $robotDatas[dataIndex].robotBox.y3, $robotDatas[p].robotBox.x1, $robotDatas[p].robotBox.y1, $robotDatas[p].robotBox.x2, $robotDatas[p].robotBox.y2) ||
                intersects($robotDatas[dataIndex].robotBox.x3, $robotDatas[dataIndex].robotBox.y3, $robotDatas[dataIndex].robotBox.x4, $robotDatas[dataIndex].robotBox.y4, $robotDatas[p].robotBox.x1, $robotDatas[p].robotBox.y1, $robotDatas[p].robotBox.x2, $robotDatas[p].robotBox.y2) ||
                intersects($robotDatas[dataIndex].robotBox.x4, $robotDatas[dataIndex].robotBox.y4, $robotDatas[dataIndex].robotBox.x1, $robotDatas[dataIndex].robotBox.y1, $robotDatas[p].robotBox.x1, $robotDatas[p].robotBox.y1, $robotDatas[p].robotBox.x2, $robotDatas[p].robotBox.y2) ||
                intersects($robotDatas[dataIndex].robotBox.x1, $robotDatas[dataIndex].robotBox.y1, $robotDatas[dataIndex].robotBox.x2, $robotDatas[dataIndex].robotBox.y2, $robotDatas[p].robotBox.x2, $robotDatas[p].robotBox.y2, $robotDatas[p].robotBox.x3, $robotDatas[p].robotBox.y3) ||
                intersects($robotDatas[dataIndex].robotBox.x2, $robotDatas[dataIndex].robotBox.y2, $robotDatas[dataIndex].robotBox.x3, $robotDatas[dataIndex].robotBox.y3, $robotDatas[p].robotBox.x2, $robotDatas[p].robotBox.y2, $robotDatas[p].robotBox.x3, $robotDatas[p].robotBox.y3) ||
                intersects($robotDatas[dataIndex].robotBox.x3, $robotDatas[dataIndex].robotBox.y3, $robotDatas[dataIndex].robotBox.x4, $robotDatas[dataIndex].robotBox.y4, $robotDatas[p].robotBox.x2, $robotDatas[p].robotBox.y2, $robotDatas[p].robotBox.x3, $robotDatas[p].robotBox.y3) ||
                intersects($robotDatas[dataIndex].robotBox.x4, $robotDatas[dataIndex].robotBox.y4, $robotDatas[dataIndex].robotBox.x1, $robotDatas[dataIndex].robotBox.y1, $robotDatas[p].robotBox.x2, $robotDatas[p].robotBox.y2, $robotDatas[p].robotBox.x3, $robotDatas[p].robotBox.y3) ||
                intersects($robotDatas[dataIndex].robotBox.x1, $robotDatas[dataIndex].robotBox.y1, $robotDatas[dataIndex].robotBox.x2, $robotDatas[dataIndex].robotBox.y2, $robotDatas[p].robotBox.x3, $robotDatas[p].robotBox.y3, $robotDatas[p].robotBox.x4, $robotDatas[p].robotBox.y4) ||
                intersects($robotDatas[dataIndex].robotBox.x2, $robotDatas[dataIndex].robotBox.y2, $robotDatas[dataIndex].robotBox.x3, $robotDatas[dataIndex].robotBox.y3, $robotDatas[p].robotBox.x3, $robotDatas[p].robotBox.y3, $robotDatas[p].robotBox.x4, $robotDatas[p].robotBox.y4) ||
                intersects($robotDatas[dataIndex].robotBox.x3, $robotDatas[dataIndex].robotBox.y3, $robotDatas[dataIndex].robotBox.x4, $robotDatas[dataIndex].robotBox.y4, $robotDatas[p].robotBox.x3, $robotDatas[p].robotBox.y3, $robotDatas[p].robotBox.x4, $robotDatas[p].robotBox.y4) ||
                intersects($robotDatas[dataIndex].robotBox.x4, $robotDatas[dataIndex].robotBox.y4, $robotDatas[dataIndex].robotBox.x1, $robotDatas[dataIndex].robotBox.y1, $robotDatas[p].robotBox.x3, $robotDatas[p].robotBox.y3, $robotDatas[p].robotBox.x4, $robotDatas[p].robotBox.y4) ||
                intersects($robotDatas[dataIndex].robotBox.x1, $robotDatas[dataIndex].robotBox.y1, $robotDatas[dataIndex].robotBox.x2, $robotDatas[dataIndex].robotBox.y2, $robotDatas[p].robotBox.x4, $robotDatas[p].robotBox.y4, $robotDatas[p].robotBox.x1, $robotDatas[p].robotBox.y1) ||
                intersects($robotDatas[dataIndex].robotBox.x2, $robotDatas[dataIndex].robotBox.y2, $robotDatas[dataIndex].robotBox.x3, $robotDatas[dataIndex].robotBox.y3, $robotDatas[p].robotBox.x4, $robotDatas[p].robotBox.y4, $robotDatas[p].robotBox.x1, $robotDatas[p].robotBox.y1) ||
                intersects($robotDatas[dataIndex].robotBox.x3, $robotDatas[dataIndex].robotBox.y3, $robotDatas[dataIndex].robotBox.x4, $robotDatas[dataIndex].robotBox.y4, $robotDatas[p].robotBox.x4, $robotDatas[p].robotBox.y4, $robotDatas[p].robotBox.x1, $robotDatas[p].robotBox.y1) ||
                intersects($robotDatas[dataIndex].robotBox.x4, $robotDatas[dataIndex].robotBox.y4, $robotDatas[dataIndex].robotBox.x1, $robotDatas[dataIndex].robotBox.y1, $robotDatas[p].robotBox.x4, $robotDatas[p].robotBox.y4, $robotDatas[p].robotBox.x1, $robotDatas[p].robotBox.y1)
            ) {
                console.log("collide")
                return true;
            }

        }
    }

    // returns true if the line from (a,b)->(c,d) intersects with (p,q)->(r,s)
    function intersects(a, b, c, d, p, q, r, s) {
        let det, gamma, lambda;
        det = (c - a) * (s - q) - (r - p) * (d - b);
        if (det === 0) {
            return false;
        } else {
            lambda = ((s - q) * (r - a) + (p - r) * (s - b)) / det;
            gamma = ((b - d) * (r - a) + (c - a) * (s - b)) / det;
            return (0 < lambda && lambda < 1) && (0 < gamma && gamma < 1);
        }
    }


    function manageIntake() {
        $robotDatas[dataIndex].intake = {
            x1: rotate($coords.x, $coords.y, $coords.x - 60 - ballSize / 2, $coords.y - 120 - ballSize / 2, $robotDatas[dataIndex].robotAngle * -1)[0], //top left
            y1: rotate($coords.x, $coords.y, $coords.x - 60 - ballSize / 2, $coords.y - 120 - ballSize / 2, $robotDatas[dataIndex].robotAngle * -1)[1],
            x2: rotate($coords.x, $coords.y, $coords.x + 60 + ballSize / 2, $coords.y - 120 - ballSize / 2, $robotDatas[dataIndex].robotAngle * -1)[0], //top right
            y2: rotate($coords.x, $coords.y, $coords.x + 60 + ballSize / 2, $coords.y - 120 - ballSize / 2, $robotDatas[dataIndex].robotAngle * -1)[1],
            x3: rotate($coords.x, $coords.y, $coords.x + 60 + ballSize / 2, $coords.y - 65, $robotDatas[dataIndex].robotAngle * -1)[0], //bottom right
            y3: rotate($coords.x, $coords.y, $coords.x + 60 + ballSize / 2, $coords.y - 65, $robotDatas[dataIndex].robotAngle * -1)[1],
            x4: rotate($coords.x, $coords.y, $coords.x - 60 - ballSize / 2, $coords.y - 65, $robotDatas[dataIndex].robotAngle * -1)[0], //bottom left
            y4: rotate($coords.x, $coords.y, $coords.x - 60 - ballSize / 2, $coords.y - 65, $robotDatas[dataIndex].robotAngle * -1)[1]
        };
    }

    function manageTurret() {
        let distanceFromGoal = Math.sqrt(($coords.x - $fieldWidth / 2) ** 2 + ($coords.y - $fieldHeight / 2) ** 2);
        turretGoal = ($robotDatas[dataIndex].robotAngle * -1 + Math.atan2($fieldHeight / 2 - $coords.y, $fieldWidth / 2 - $coords.x) * (180 / Math.PI) + 90) % 360;
        if (turretGoal < 0) {
            turretGoal += 360;
        }
        if (distanceFromGoal < $vizRingSize / 2) {
            $vizRing = true;
            if (calcTurretDirection(turretGoal, $robotDatas[dataIndex].turretAngle)) {
                $robotDatas[dataIndex].turretAngle += turretSpeed;
                if (spaceDown) {
                    $robotDatas[dataIndex].turretAngle += turretSpeed;
                }
            } else {
                $robotDatas[dataIndex].turretAngle -= turretSpeed;
                if (spaceDown) {
                    $robotDatas[dataIndex].turretAngle -= turretSpeed;
                }
            }
        } else {
            if (!shiftDown) {
                $vizRing = false;
            }
            // turretAngle += turretSpeed * 1.5;
        }
        if ($robotDatas[dataIndex].turretAngle < 0) {
            $robotDatas[dataIndex].turretAngle += 360;
        }
        $robotDatas[dataIndex].turretAngle = $robotDatas[dataIndex].turretAngle % 360;
        if (Math.min(Math.abs($robotDatas[dataIndex].turretAngle - turretGoal), Math.abs(360 - turretGoal + $robotDatas[dataIndex].turretAngle)) < turretSpeed * 3 && distanceFromGoal < $vizRingSize / 2) {
            $robotDatas[dataIndex].turretAngle = turretGoal;
            turretLockedOn = true;
        } else {
            turretLockedOn = false;
        }
        //Enable to allow for shooting from range if turret is aligned, even if out of range
        turretSecretLockedOn = Math.min(Math.abs($robotDatas[dataIndex].turretAngle - turretGoal), Math.abs(360 - turretGoal + $robotDatas[dataIndex].turretAngle)) < turretSpeed * 3 && distanceFromGoal < $vizRingSize / 2 + 100;
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
            case $controls[dataIndex].up:
                wDown = true;

                event.preventDefault();
                break;
            case $controls[dataIndex].left:
                aDown = true;

                event.preventDefault();
                break;
            case $controls[dataIndex].down:
                sDown = true;

                event.preventDefault();
                break;
            case $controls[dataIndex].right:
                dDown = true;

                event.preventDefault();
                break;
            case $controls[dataIndex].turnLeft:
                jDown = true;

                event.preventDefault();
                break;
            case $controls[dataIndex].turnRight:
                lDown = true;

                event.preventDefault();
                break;
            case $controls[dataIndex].shoot:
                spaceDown = true;
                event.preventDefault();
                break;
            case $controls[dataIndex].viz:
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
            case $controls[dataIndex].up:
                wDown = false

                event.preventDefault();
                break;
            case $controls[dataIndex].left:
                aDown = false;

                event.preventDefault();
                break;
            case $controls[dataIndex].down:
                sDown = false;

                event.preventDefault();
                break;
            case $controls[dataIndex].right:
                dDown = false;

                event.preventDefault();
                break;
            case $controls[dataIndex].turnLeft:
                jDown = false;

                event.preventDefault();
                break;
            case $controls[dataIndex].turnRight:
                lDown = false;

                event.preventDefault();
                break;
            case $controls[dataIndex].shoot:
                spaceDown = false;
                if ($robotDatas[dataIndex].ballsInRobot > 0 && milliCount - lastBallShot > ballShotPace) {
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
            case $controls[dataIndex].viz:
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
		translate({$robotDatas[dataIndex].robotCoords.x-65}px,{$robotDatas[dataIndex].robotCoords.y-65}px)
        rotate({$robotDatas[dataIndex].robotAngle}deg)">

    <svg xmlns="http://www.w3.org/2000/svg" class="h-[90px] fixed" fill="none" viewBox="0 0 24 24"
         stroke={((turretLockedOn) ? "green" : "white")} stroke-width="2"
         style="transform: rotate({$robotDatas[dataIndex].turretAngle}deg)">
        <path stroke-linecap="round" stroke-linejoin="round"
              d="M9 11l3-3m0 0l3 3m-3-3v8m0-13a9 9 0 110 18 9 9 0 010-18z"/>
    </svg>
    <svg class="fixed ml-[100px] mt-[100px]"
         width="30px" height="30px"
         viewBox="0 0 21 21" stroke-width="3" xmlns="http://www.w3.org/2000/svg">
        <circle cx="10.5" cy="10.5"
                fill={(($robotDatas[dataIndex].ballsInRobot>0) ? (($robotDatas[dataIndex].ballsInRobot>1) ? "green" : "yellow") : "none")}
                r="7"
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
    <ShotCargo startX={ball.startX} dataIndex={dataIndex} startY={ball.startY} endX={ball.endX} endY="{ball.endY}"
               miss={ball.miss}
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