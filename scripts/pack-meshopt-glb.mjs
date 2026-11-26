export function packMeshoptGlb(MeshoptEncoder,doc,streams,image){
  const parts=[],views=[];
  let physical=0,virtual=0;
  for(const {bytes,count,stride,mode} of streams){
    const compressed=MeshoptEncoder.encodeGltfBuffer(bytes,count,stride,mode);
    const pad=Buffer.alloc((4-compressed.length%4)%4), attributes=mode==="ATTRIBUTES";
    views.push({buffer:1,byteOffset:virtual,byteLength:bytes.length,target:attributes?34962:34963,
      ...(attributes?{byteStride:stride}:{}),extensions:{EXT_meshopt_compression:{
        buffer:0,byteOffset:physical,byteLength:compressed.length,byteStride:stride,mode,count
      }}});
    virtual+=Math.ceil(bytes.length/4)*4;
    physical+=compressed.length+pad.length;
    parts.push(compressed,pad);
  }
  doc.extensionsUsed=doc.extensionsRequired=["EXT_meshopt_compression","KHR_mesh_quantization"];
  if(image){
    doc.images=[{mimeType:"image/webp",bufferView:views.length}];
    doc.textures=[{extensions:{EXT_texture_webp:{source:0}}}];
    doc.extensionsUsed.push("EXT_texture_webp");
    views.push({buffer:0,byteOffset:physical,byteLength:image.length});
    const padding=Buffer.alloc((4-image.length%4)%4);
    parts.push(image,padding);physical+=image.length+padding.length;
  }
  doc.bufferViews=views;
  doc.buffers=[{byteLength:physical},{byteLength:virtual,extensions:{EXT_meshopt_compression:{fallback:true}}}];
  const json=Buffer.from(JSON.stringify(doc)), padding=Buffer.alloc((4-json.length%4)%4,32);
  const header=Buffer.alloc(20), binaryHeader=Buffer.alloc(8);
  header.write("glTF");header.writeUInt32LE(2,4);header.writeUInt32LE(28+json.length+padding.length+physical,8);
  header.writeUInt32LE(json.length+padding.length,12);header.write("JSON",16);
  binaryHeader.writeUInt32LE(physical);binaryHeader.write("BIN",4);
  return Buffer.concat([header,json,padding,binaryHeader,...parts]);
}
