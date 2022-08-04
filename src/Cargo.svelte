<script>
    import {onInterval} from "./utils";
    import {ballsInRobot, intake} from "./stores";
    import { createEventDispatcher } from 'svelte';

    const dispatch = createEventDispatcher();

    export let coords;
    let milliCount=0;
    let ballSize=55;
    const countUp = () => (milliCount += 1.8);
    let insideIntake=false;
    onInterval(countUp, 1);
    $: {
        checkInside(milliCount)
    }

    function intook() {
        dispatch('intake', {
            x: coords[0],
            y: coords[1]
        });
    }

    function checkInside(){
        let polygon = [[$intake.x1,$intake.y1],[$intake.x2,$intake.y2],[$intake.x3,$intake.y3],[$intake.x4,$intake.y4]]
        insideIntake=inside(coords,polygon)
        if(insideIntake && $ballsInRobot<2){
            intook();
        }
    }

    function inside(point, vs) {
        // ray-casting algorithm based on
        // https://wrf.ecse.rpi.edu/Research/Short_Notes/pnpoly.html/pnpoly.html

        let x = point[0], y = point[1];

        let inside = false;
        for (let i = 0, j = vs.length - 1; i < vs.length; j = i++) {
            let xi = vs[i][0], yi = vs[i][1];
            let xj = vs[j][0], yj = vs[j][1];

            let intersect = ((yi > y) !== (yj > y))
                && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
            if (intersect) inside = !inside;
        }

        return inside;
    }


</script>




<div class="fixed" style="transform:
		translate({coords[0]-ballSize/2}px,{coords[1]-ballSize/2}px)">

    <svg id="Layer_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"
         width="{ballSize}px" height="{ballSize}px" viewBox="0 0 120 120" enable-background="new 0 0 120 120" xml:space="preserve">
<circle cx="60" cy="60.834" r="{ballSize}" style="fill:red"/>
</svg>

</div>