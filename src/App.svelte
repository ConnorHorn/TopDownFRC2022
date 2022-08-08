<script>
    import 'firebase/auth' ;
    import 'firebase/firestore'
    import Field from "./Field.svelte";
    import {fieldHeight, fieldWidth} from "./stores";
    import {addDoc, collection, getDocs} from "firebase/firestore";
    import {db} from "./firebase";
    import TimeKeeper from "./TimeKeeper.svelte";
    let yOff = (innerHeight-$fieldHeight)/2
    let xOff = (innerWidth-$fieldWidth)/2

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

<div class=" fixed" style=" transform:
     translate({xOff}px,{yOff}px)">
<Field/>
</div>
<TimeKeeper/>
