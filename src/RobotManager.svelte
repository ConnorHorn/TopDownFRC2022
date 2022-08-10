<script>

    import {fieldHeight, fieldWidth, numberOfRobots, robotDatas} from "./stores";
    import {robotData} from "./robotData";
    import TeleRobot from "./TeleRobot.svelte";
    let defaultBallsInRobot = 1;
    let defaultIntake = {x1: 0, x2: 0, x3: 0, x4: 0, y1: 0, y2: 0, y3: 0, y4: 0};
    let defaultTurretAngle = 0;
    let defaultRobotCoords = {x: 100, y: 100};
    let defaultRobotAngle = 0;
    let defaultRobotBallBox = {x1: 0, x2: 0, x3: 0, x4: 0, y1: 0, y2: 0, y3: 0, y4: 0};
    let defaultRobotSpeeds = {x: 0, y: 0};
    let defaultRobotColor = "red";
    let defaultRobotConfig = "turret"
    $robotDatas.push(new robotData(defaultBallsInRobot, defaultIntake, defaultTurretAngle, defaultRobotCoords, defaultRobotAngle, defaultRobotBallBox, defaultRobotSpeeds, defaultRobotColor, defaultRobotConfig))
    $: rePopulate($numberOfRobots)
    function rePopulate() {
        if($robotDatas.length<$numberOfRobots){
            $robotDatas.push(new robotData(defaultBallsInRobot, defaultIntake, defaultTurretAngle, defaultRobotCoords, defaultRobotAngle, defaultRobotBallBox, defaultRobotSpeeds, defaultRobotColor, defaultRobotConfig))
        }
        console.log("repop")
        if($robotDatas.length>$numberOfRobots){
            $robotDatas.pop();
        }
    }
</script>

<div class="fixed grow" style="width: {$fieldWidth} height: {fieldHeight} ">
{#each Array($robotDatas.length) as _, dataIndex (dataIndex)}
    <TeleRobot dataIndex={dataIndex}/>
    {/each}
</div>
