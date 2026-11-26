import * as T from "three";
import {gyeongjuBikeDocks} from "./gyeongju-bike.js";
import {registerDistrictLod} from "./gyeongju-mesh.js";
import {buildBikeDocks,prepareParkedBikes} from "./sejong-bike-model.js";

export function* drawGyeongjuBikeDockSteps(meshes,kit,dock){
 yield* prepareParkedBikes(T);
 drawGyeongjuBikeDocks(meshes,kit,[dock]);
}

export function drawGyeongjuBikeDocks(meshes,kit,docks=gyeongjuBikeDocks){
 const racks=new T.Group();
 buildBikeDocks(T,racks,kit,{docks,register:false,signName:"타실라",registerLod:registerDistrictLod});
 meshes.staticModel(racks);
}
