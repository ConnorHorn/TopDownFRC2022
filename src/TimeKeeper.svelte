<script>
    import {onInterval} from "./utils";
    import {matchTime} from "./stores";

    let secondsElapsed=0;
    const countUp = () => (secondsElapsed += 1);
    onInterval(countUp, 1000);

    $ : countDown(secondsElapsed);

    function countDown(){
        $matchTime--;
    }
</script>