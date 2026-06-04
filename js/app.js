
import {cards} from './cards.js';
import {battle} from './battle.js';

document.getElementById('loginBtn').onclick=()=>{
 document.getElementById('user').textContent='ใส่ Firebase Auth ตาม README';
};

document.getElementById('battleBtn').onclick=()=>{
 const dmg=battle(cards[0],cards[1]);
 document.getElementById('log').textContent=
 `${cards[0].name} โจมตี ${cards[1].name}\nDamage=${dmg}`;
};
