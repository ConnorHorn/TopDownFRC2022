<script>
    import 'firebase/auth' ;
    import 'firebase/firestore'
    import Field from "./Field.svelte";
    import {fieldHeight, fieldWidth} from "./stores";
    import {addDoc, collection, getDocs} from "firebase/firestore";
    import {db} from "./firebase";
    import TimeKeeper from "./TimeKeeper.svelte";
    let scale = Math.min(innerWidth/$fieldWidth, innerHeight/$fieldHeight)*0.98
    let yOff = (innerHeight-$fieldHeight*scale)/2
    let xOff = (innerWidth-$fieldWidth*scale)/2
    $: innerWidth = 0
    $: innerHeight = 0
    $: rescale(innerWidth, innerHeight)

    function rescale(){
        scale = Math.min(innerWidth/$fieldWidth, innerHeight/$fieldHeight)*0.98
        yOff = (innerHeight-$fieldHeight*scale)/2
        xOff = (innerWidth-$fieldWidth*scale)/2
    }

    // try {
    //    addDoc(collection(db, "leaderboard"), {
    //         first: "Alan",
    //         middle: "Mathison",
    //         last: "Turing",
    //         born: 1912
    //     });
    //     (async () => {
    //     const querySnapshot = await getDocs(collection(db, "leaderboard"));
    //     querySnapshot.forEach((doc) => {
    //         console.log(`${doc.data()}`);
    //     });
    //     })();
    // } catch (e) {
    //     console.error("Error adding document: ", e);
    // }

</script>

<svelte:window bind:innerWidth bind:innerHeight/>

<div class="fixed" style="transform: translate({xOff}px,{yOff}px) scale({scale})">
<Field/>
</div>
<TimeKeeper/>
