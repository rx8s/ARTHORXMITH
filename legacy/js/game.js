import {
    cards
}
from "./cards.js";

import {
    attack
}
from "./battle.js";

window.startBattle = () =>
{
    const playerTeam = [

        cards[0],

        cards[1],

        cards[2]

    ];

    const enemyTeam = [

        cards[2],

        cards[1],

        cards[0]

    ];

    let log = "";

    for(
        let i=0;
        i<3;
        i++
    )
    {
        const result =
            attack(
                playerTeam[i],
                enemyTeam[i]
            );

        log +=
            playerTeam[i].name +
            " -> " +
            enemyTeam[i].name +
            " : " +
            result.damage +
            "\\n";
    }

    document
    .getElementById(
        "battleLog"
    )
    .innerText = log;
};