<script>
    import {
        fieldHeight,
        fieldWidth,
        matchTime,
        score,
        vizRing,
        vizRingSize,
        reset,
        fieldBallCount,
        robotDatas
    } from "./stores";
    import Robot from "./Robot.svelte";
    import CargoOnField from "./CargoOnField.svelte";
    import TeleRobot from "./TeleRobot.svelte";
    import RobotManager from "./RobotManager.svelte";
    import {robotData} from "./robotData";

    let maxTime = $matchTime;
    let liveTime = $matchTime;
    let matchPercent = 100;
    let hubSize = 120;

    $:countDown($matchTime);

    function countDown() {
        if (matchPercent > 0) {
            liveTime = $matchTime;
            matchPercent = liveTime / maxTime * 100;
        }
    }

    function resetAll() {
        $matchTime = 150
        matchPercent = 100
        $reset = true;
        $fieldBallCount = 0;
        $score = 0;
        for (let i = 0; i < $robotDatas.length; i++) {
            $robotDatas[i].ballsInRobot = 0;
        }
    }
</script>

<div class="fixed text-center overflow-hidden" style="width: {$fieldWidth} height: {fieldHeight} ">
    <svg width={$fieldWidth} height={$fieldHeight} class="fixed">
        <rect width={$fieldWidth} height={$fieldHeight} style="fill:black;stroke-width:3;stroke:white"/>
    </svg>
    <div class="fixed z-20 text-8xl text-white font-bold" style=" transform:
     translate({$fieldWidth/2}px,{$fieldHeight/2}px)">
        <div class="fixed" style=" transform:
     translate({($score.toString().length*-29)+2}px,-85px)">
            {$score}
        </div>
        <div class="fixed z-30" style=" transform:
     translate(-70px,-1px)" on:click={resetAll}>
            <button class="btn btn-circle btn-accent btn-lg">
                <svg xmlns="http://www.w3.org/2000/svg" class="" fill="none" viewBox="0 0 24 24" stroke="white"
                     stroke-width="3">
                    <path stroke-linecap="round" stroke-linejoin="round"
                          d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
                </svg>
            </button>
        </div>

        <div class="fixed z-30" style=" transform:
     translate(10px,-1px)">
            <button class="btn btn-circle btn-accent btn-lg">
                <svg xmlns="http://www.w3.org/2000/svg" class="" fill="none" viewBox="0 0 24 24" stroke="white"
                     stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round"
                          d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"/>
                </svg>
            </button>
        </div>


        <svg xmlns="http://www.w3.org/2000/svg" class="fixed overflow-visible z-10">
            <circle fill="none" r="{hubSize}" stroke="white" stroke-linecap="round" stroke-width="8"
                    stroke-linejoin="round"/>
        </svg>
        {#if matchPercent > 0}
            <div class="radial-progress z-20 fixed text-green-600 -ml-[127px] -mt-[127px]"
                 style="--value:{matchPercent}; --size:16rem; --thickness: 15px;"></div>

        {/if}
    </div>
    <div class="z-50 fixed">
        <CargoOnField/>
        <RobotManager />
    </div>
    {#if $vizRing}
        <div class="rounded-full border-green-500 border-4 border-dotted fixed z-90 ml-[450px]"
             style="height:{$vizRingSize}px; width:{$vizRingSize}px">
        </div>
    {/if}
</div>


