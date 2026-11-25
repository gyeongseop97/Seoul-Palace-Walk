import * as T from "three";
import {gyeongjuBikeDocks} from "./gyeongju-bike.js";
import {buildBikeDocks} from "./sejong-bike-model.js";

export function drawGyeongjuBikeDocks(meshes,kit){
 const racks=new T.Group();
 buildBikeDocks(T,racks,kit,{docks:gyeongjuBikeDocks,register:false,signName:"타실라"});
 meshes.staticModel(racks);
}
