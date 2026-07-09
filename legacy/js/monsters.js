import { db } from "./firebase.js";

import { ref, push, set, remove, onValue, runTransaction, get } 
from "https://www.gstatic.com/firebasejs/12.2.1/firebase-database.js";



const ELEMENTS = [

    "Neutral",
    "Water",
    "Earth",
    "Fire",
    "Wind",
    "Poison",
    "Holy",
    "Shadow",
    "Ghost",
    "Undead"

];

const RACES = [

    "Formless",
    "Undead",
    "Brute",
    "Plant",
    "Insect",
    "Fish",
    "Demon",
    "Demi-Human",
    "Angel",
    "Dragon"

];

document.getElementById("saveBtn").addEventListener( "click", createManualMonster );
document.getElementById("randomBtn").addEventListener( "click", createRandomMonster );

function randomStat() { return Math.floor( Math.random()*255 ) + 1; }
function randomHp() { return Math.floor( Math.random()*10000 ) + 1; }
function randomSp(){ return Math.floor( Math.random()*10000 ) + 1; }
function random100(){ return Math.floor( Math.random()*100 ) + 1; }
function randomRank(){ return Math.floor( Math.random()*5 ) + 1; }


async function generateMonsterId()
{
    const counterRef = ref(db, "counters/monsterId");

    const result = await runTransaction(counterRef, (current) => {
        return (current || 0) + 1;
    });

    const num = result.snapshot.val();

    return "monster_" + String(num).padStart(6, "0");
}




async function createManualMonster()
{
    const data = {
        name: document.getElementById("name").value,
        element: document.getElementById("element").value,
        race: document.getElementById("race").value,
        str: Number( document.getElementById("str").value),
        agi: Number(document.getElementById("agi").value),
        vit: Number(document.getElementById("vit").value),
        int: Number(document.getElementById("int").value),
        dex: Number(document.getElementById("dex").value),
        luk: Number(document.getElementById("luk").value),
        createdAt: Date.now(),
        img: document.getElementById("img").value,
        hp: randomHp(),
        sp: randomSp(),
        def: random100(),
        mdef: random100(),
        atk: random100(),
        matk: random100(),
        hit: random100(),
        flee: random100(),
        crit: random100(),
        montype: 'mini'
    };

    const id = await generateMonsterId();
    const monsterRef = ref(db, "monsters/" + id);
    //const monsterRef = push( ref( db, "monsters" ) );
    await set( monsterRef, data );
    alert("Saved");
}



async function createRandomMonster()
{
    const id = await generateMonsterId();
    const monsterRef = ref(db, "monsters/" + id);

    // const monsterRef = push( ref( db, "monsters" ));

    const data = {
        name: "Monster_" + Date.now(),
        element: ELEMENTS[ Math.floor( Math.random() * ELEMENTS.length) ],
        race: RACES[ Math.floor( Math.random() * RACES.length) ],
        str: randomStat(),
        agi: randomStat(),
        vit: randomStat(),
        int: randomStat(),
        dex: randomStat(),
        luk: randomStat(),
        createdAt: Date.now(),
        img: 'null',
        hp: randomHp(),
        sp: randomSp(),
        def: random100(),
        mdef: random100(),
        atk: random100(),
        matk: random100(),
        hit: random100(),
        flee: random100(),
        crit: random100(),
        montype: 'mini'
    };


    await set( monsterRef, data);
    alert("Random Created");
}

const monsterList = document.getElementById( "monsterList");

onValue(ref(db,"monsters"),snapshot =>{
    monsterList.innerHTML = "";

    const monsters =
        snapshot.val();

    if(!monsters)
    {
        return;
    }

    Object.entries( monsters ).forEach(([id,m]) => {
        const div = document.createElement("div");

        div.className = "col-12 col-md-2";
        div.innerHTML =
        `
            <div class="card monster-card shadow-sm">
                <div class="card-body">
                    <div class="row">
                        <div class="col text-center">
                            <img class="img-fluid" src="${m.img}" style="width:100%; aspect-ratio:1/1; object-fit:contain;">
                            <span style="font-size: 8px;">${id}</span>
                            <div>
                                ${"⭐️".repeat(m.rank)} 
                                <b>${m.name}</b>
                            </div>
                            <div>
                                ${m.element} / ${m.race}
                            </div>
                        </div>
                    </div>
                    <div class="row mt-2">
                        <div class="col">
                            HP: ${m.hp}<br>
                        </div>
                        <div class="col">
                            SP: ${m.sp}<br>
                        </div>
                    </div>
                    <div class="row mt-2">
                        <div class="col-6">
                            STR : ${m.str} <br>
                            AGI : ${m.agi} <br>
                            VIT : ${m.vit} <br>
                            INT : ${m.int} <br>
                            DEX : ${m.dex} <br>
                            LUK : ${m.luk} <br>

                        </div>
                        <div class="col-6">
                            Def: ${m.def}<br>
                            MDef: ${m.mdef}<br>
                            ATK: ${m.atk}<br>
                            MATK: ${m.matk}<br>
                            HIT: ${m.hit}<br>
                            FLEE: ${m.flee}<br>
                            CRIT: ${m.crit}<br>
                        </div>
                    </div>  
                    <div class="row mt-2">
                        <div class="col">
                            BOSS : ${m.montype === "MVP" ? '<img src="https://ratemyserver.net/images/mob_mvp.gif">' : ''}
                        </div>
                    </div>      
                <br>

                <button class="btn btn-outline-danger" data-id="${id}">
                    Delete
                </button>
                </div>
            </div>
        `;

        div.querySelector("button").onclick = async () => {
            if( confirm( "Delete?" )){
                await remove( ref( db,"monsters/" + id ) );
            }
        };
        monsterList.appendChild(div);
    });
});