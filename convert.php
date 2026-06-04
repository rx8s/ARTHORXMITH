<?php
$yaml = file_get_contents("https://raw.githubusercontent.com/rathena/rathena/refs/heads/master/db/pre-re/mob_db.yml");
$data = yaml_parse($yaml);
$json = $data["Body"];

for($row = 0; $row <= 5; $row++)
{
  // foreach ($json as $k => $v) {

  //   $ch = curl_init();
  //   curl_setopt($ch, CURLOPT_URL, "https://ragnapi.com/api/v1/old-times/monsters/1001");
  //   curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
  //   $response = curl_exec($ch);
  //   $data = json_decode($response, true);
  //   $mons['id']   = $data['monster_id'];
  //   $mons['name'] = $data['monster_info'];
  //   $mons['img']  = $data['gif'];
  //   $mons['str']  = $data['main_atb']['str'] ?? rand(1,255);
  //   $mons['agi']  = $data['main_atb']['agi'] ?? rand(1,255);
  //   $mons['vit']  = $data['main_atb']['vit'] ?? rand(1,255);
  //   $mons['int']  = $data['main_atb']['int'] ?? rand(1,255);
  //   $mons['dex']  = $data['main_atb']['dex'] ?? rand(1,255);
  //   $mons['luk']  = $data['main_atb']['luk'] ?? rand(1,255);
  //   $mons['hp']   = $data['main_stats']['hp'];
  //   $mons['sp']   = $data['main_stats']['sp'] ?? rand(1,255);
  //   $mons['def']  = $data['main_stats']['def'];
  //   $mons['mdef']  = $data['main_stats']['m_def'];
  //   $mons['attack']  = $data['main_stats']['attack'];
  //   $mons['magic_attack']  = $data['main_stats']['magic_attack'];
  //   $mons['flee']  = $data['main_stats']['flee'];
  //   $mons['hit']  = $data['main_stats']['hit'];
  //   $mons['element'] = $data['type'];
  //   $mons['race'] = $data['race'];
  //   $mons['crit'] = rand(1,100);
  // }
}


print_r($mons);



// file_put_contents("mob_db.json", json_encode($mons, JSON_PRETTY_PRINT));

echo "done";