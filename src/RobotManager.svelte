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
    let one=1;
    let two=2;
    let liveX=300;
    $robotDatas.push(new robotData(
        0,//defaultBallsInRobot
        {x1: 0, x2: 0, x3: 0, x4: 0, y1: 0, y2: 0, y3: 0, y4: 0}, //intake,
        0,//defaultTurretAngle
        {x: 100, y: 100}, //default coords
        0,//defaultRobotAngle
        {x1: 0, x2: 0, x3: 0, x4: 0, y1: 0, y2: 0, y3: 0, y4: 0},//defaultRobotBallBox
        {x: 0, y: 0},//defaultRobotSpeeds
        "red",//defaultRobotColor
        "turret",defaultRobotConfig
    ))
    $: rePopulate($numberOfRobots)
    function rePopulate() {
        console.log($robotDatas.length+" "+$numberOfRobots)
        if($robotDatas.length<$numberOfRobots){
            console.log($robotDatas.length)
            $robotDatas.push(new robotData(
                0,//defaultBallsInRobot
                {x1: 0, x2: 0, x3: 0, x4: 0, y1: 0, y2: 0, y3: 0, y4: 0}, //intake,
                0,//defaultTurretAngle
                {x: liveX, y: 100}, //default coords
                0,//defaultRobotAngle
                {x1: 0, x2: 0, x3: 0, x4: 0, y1: 0, y2: 0, y3: 0, y4: 0},//defaultRobotBallBox
                {x: 0, y: 0},//defaultRobotSpeeds
                "red",//defaultRobotColor
                "turret",defaultRobotConfig
            ))
            liveX+=200
            rePopulate();
        }
        console.log("repop")
        if($robotDatas.length>$numberOfRobots){
            console.log("too many")
            $robotDatas.pop();
            rePopulate();
        }
    }
</script>

<div class="fixed grow" style="width: {$fieldWidth} height: {fieldHeight} ">
{#each Array($robotDatas.length) as _, dataIndex (dataIndex)}
    <TeleRobot dataIndex={dataIndex}/>
    {/each}


</div>
