"""Offline texture reprojection for bake-gate-lod.mjs (Blender 4.3, NumPy, Pillow)."""
import io
import json
import struct
import sys
from math import cos, radians
from pathlib import Path

import bpy
import numpy as np
from mathutils.bvhtree import BVHTree
from PIL import Image

source_dir, output = map(Path, sys.argv[-2:])
meta = json.loads((source_dir / "source.json").read_text())
xyz = np.fromfile(source_dir / "xyz.bin", "<f4").reshape(-1, 3)
original = np.fromfile(source_dir / "topology.bin", "<u4").reshape(-1, 3)
reduced = np.fromfile(source_dir / "reduced.bin", "<u4").reshape(-1, 3)
source_indices = np.fromfile(source_dir / "sourceIndex.bin", "<u4").reshape(-1, 3)
transform = meta["material"]["pbrMetallicRoughness"]["baseColorTexture"]["extensions"]["KHR_texture_transform"]
source_uv = np.fromfile(source_dir / "uv.bin", "<u2").reshape(-1, 2) / 65535
source_uv = source_uv * transform["scale"] + transform["offset"]
texture = np.array(Image.open(source_dir / "source.webp").convert("RGB"))


def unwrap():
    used, compact = np.unique(reduced, return_inverse=True)
    mesh = bpy.data.meshes.new("Distance model")
    mesh.from_pydata(xyz[used].tolist(), [], compact.reshape(-1, 3).tolist())
    mesh.update()
    model = bpy.data.objects.new(mesh.name, mesh)
    bpy.context.collection.objects.link(model)
    bpy.ops.object.select_all(action="DESELECT")
    model.select_set(True)
    bpy.context.view_layer.objects.active = model
    bpy.ops.object.mode_set(mode="EDIT")
    bpy.ops.mesh.select_all(action="SELECT")
    bpy.ops.uv.smart_project(angle_limit=radians(64), island_margin=.0015, margin_method="ADD")
    bpy.ops.object.mode_set(mode="OBJECT")
    flat = np.empty(len(mesh.loops) * 2, np.float32)
    mesh.uv_layers.active.data.foreach_get("uv", flat)
    uv = flat.reshape(-1, 3, 2).copy()
    uv[:, :, 1] = 1 - uv[:, :, 1]
    return uv


def unit_rows(rows):
    return rows / np.maximum(np.linalg.norm(rows, axis=-1, keepdims=True), 1e-20)


def corner_normals(faces):
    # Match the near model's area-weighted 48 degree crease, including UV seams.
    tri = xyz[faces]
    area = np.cross(tri[:, 1] - tri[:, 0], tri[:, 2] - tri[:, 0])
    normal = unit_rows(area)
    flat = faces.ravel()
    by_vertex = np.argsort(flat, kind="stable")
    groups = np.split(by_vertex, np.flatnonzero(np.diff(flat[by_vertex])) + 1)
    result = np.empty((flat.size, 3), np.float32)
    for corners in groups:
        triangle_ids = corners // 3
        neighbors = normal[triangle_ids]
        matching = (neighbors @ neighbors.T) >= cos(radians(48))
        result[corners] = unit_rows(matching @ area[triangle_ids])
    return result


def bake(uv, size):
    tree = BVHTree.FromPolygons(xyz.tolist(), original.tolist(), all_triangles=True)
    original_tri = xyz[original]
    edge1 = original_tri[:, 1] - original_tri[:, 0]
    edge2 = original_tri[:, 2] - original_tri[:, 0]
    face_uv = source_uv[source_indices]
    tri = xyz[reduced]
    norm = unit_rows(np.cross(tri[:, 1] - tri[:, 0], tri[:, 2] - tri[:, 0]))
    tex = Image.fromarray(texture)
    # Each set of samples from one triangle uses its projected texel footprint.
    mips = [texture]
    while min(tex.size) > 1:
        tex = tex.resize(tuple(max(1, n // 2) for n in tex.size), Image.Resampling.BOX)
        mips.append(np.array(tex))
    atlas = np.zeros((size, size, 3), np.uint8)
    painted = np.zeros((size, size), bool)
    area = np.cross(edge1, edge2)
    norm2 = np.maximum((area * area).sum(axis=1), 1.e-15)
    # Unit change in position projected onto world-space UV gradients.
    grad1 = np.cross(edge2, area) / norm2[:, None]
    grad2 = np.cross(area, edge1) / norm2[:, None]
    grad_uv = ((face_uv[:, 1] - face_uv[:, 0])[:, :, None] * grad1[:, None, :] +
               (face_uv[:, 2] - face_uv[:, 0])[:, :, None] * grad2[:, None, :])
    for i, pixels in enumerate(uv * size - .5):
        p, q, r = pixels
        matrix = np.stack([q - p, r - p], axis=1)
        if abs(np.linalg.det(matrix)) < 1e-8:
            continue
        inv = np.linalg.inv(matrix)
        lo, hi = np.maximum(0, np.ceil(pixels.min(axis=0)).astype(int)), np.minimum(size-1, np.floor(pixels.max(axis=0)).astype(int))
        rows, cols = np.mgrid[lo[1]:hi[1]+1, lo[0]:hi[0]+1]
        xy = np.stack([cols.ravel(), rows.ravel()], axis=1)
        bary = (xy - p) @ inv.T
        inside = (bary.min(axis=1) >= -1e-5) & (bary.sum(axis=1) <= 1.00001)
        if not np.any(inside):
            xy = np.clip(np.round(pixels.mean(axis=0)).astype(int), 0, size-1)[None, :]
            if painted[xy[0, 1], xy[0, 0]]:
                continue
            bary = np.array([[1/3, 1/3]])
        else:
            xy, bary = xy[inside], bary[inside]
        sides = tri[i, 1:] - tri[i, 0]
        world = tri[i, 0] + bary @ sides
        ids = []
        for coord in world:
            hit, facing, face, distance = tree.find_nearest(coord)
            if facing.dot(norm[i]) < .4:
                # At a thin eave, look along its own normal before accepting an underside texel.
                cast = tree.ray_cast(coord + norm[i] * 6, -norm[i], 12)
                if cast[2] is not None and cast[1].dot(norm[i]) >= .4:
                    face = cast[2]
            ids.append(face)
        ids = np.asarray(ids)
        sample_uv = face_uv[ids, 0] + np.einsum("ijk,ik->ij", grad_uv[ids], world - original_tri[ids, 0])
        footprint = (grad_uv[ids] @ sides.T @ inv) * np.array(texture.shape[1::-1])[None, :, None]
        lod = np.log2(np.maximum(1, np.linalg.norm(footprint, axis=1).min(axis=1)))
        levels = np.clip(np.rint(lod).astype(int), 0, len(mips)-1)
        for level in np.unique(levels):
            selected = levels == level
            mip = mips[level]
            uv_pixels = sample_uv[selected] * np.array(mip.shape[1::-1]) - .5
            base = np.floor(uv_pixels).astype(int)
            weights = uv_pixels - base
            rgb = np.zeros((len(base), 3))
            for dx, dy in [(0,0), (0,1), (1,0), (1,1)]:
                w = (weights[:,0] if dx else 1-weights[:,0]) * (weights[:,1] if dy else 1-weights[:,1])
                rgb += w[:,None] * mip[(base[:,1]+dy)%mip.shape[0], (base[:,0]+dx)%mip.shape[1]]
            xx, yy = xy[selected].T
            atlas[yy, xx] = rgb.round().astype(np.uint8)
            painted[yy, xx] = True
    # Fill atlas gutters with the nearest painted neighborhood for mipmapping.
    for _ in range(9):
        total = np.zeros_like(atlas, dtype=np.uint16)
        count = np.zeros_like(painted, dtype=np.uint8)
        for axis, delta in [(0,1),(0,-1),(1,1),(1,-1)]:
            mask = np.roll(painted, delta, axis)
            total += np.roll(atlas, delta, axis) * mask[:, :, None]
            count += mask
        new = ~painted & (count > 0)
        atlas[new] = total[new] // count[new, None]
        painted |= new
    encoded = io.BytesIO()
    Image.fromarray(atlas).save(encoded, format="WEBP", quality=90, method=5)
    return encoded.getvalue()


def export(uv, image):
    position = xyz[reduced].reshape(-1, 3).astype("<u2")
    normal = np.rint(corner_normals(reduced)*127).astype("i1")
    texcoords = np.rint(np.clip(uv.reshape(-1, 2), 0, 1)*65535).astype("<u2")
    corners = np.concatenate([position.view("u1"), normal.view("u1"), texcoords.view("u1")], axis=1)
    _, first, indices = np.unique(corners, axis=0, return_index=True, return_inverse=True)
    bounds = [position.min(axis=0).tolist(), position.max(axis=0).tolist()]
    payload = bytearray()
    views = []
    def add(data, **fields):
        views.append(dict(buffer=0, byteOffset=len(payload), byteLength=len(data), **fields))
        payload.extend(data)
        payload.extend(bytes(-len(payload)%4))
        return len(views)-1
    n = len(first)
    padded_pos = np.pad(position[first], ((0,0),(0,1)))
    padded_norm = np.pad(normal[first], ((0,0),(0,1)))
    add(padded_pos.tobytes(), target=34962, byteStride=8)
    add(padded_norm.tobytes(), target=34962, byteStride=4)
    add(texcoords[first].tobytes(), target=34962, byteStride=4)
    wide = n > 65535
    add(indices.astype("<u4" if wide else "<u2").tobytes(), target=34963)
    add(image)
    doc = dict(asset=dict(version="2.0"), extensionsUsed=["KHR_mesh_quantization","EXT_texture_webp"],
               extensionsRequired=["KHR_mesh_quantization","EXT_texture_webp"], scene=0, scenes=[dict(nodes=[0])],
               nodes=[meta["node"]], meshes=[dict(primitives=[dict(attributes=dict(POSITION=0,NORMAL=1,TEXCOORD_0=2), indices=3,material=0)])],
               materials=[dict(pbrMetallicRoughness=dict(baseColorTexture=dict(index=0), metallicFactor=0,roughnessFactor=.92))],
               textures=[dict(extensions=dict(EXT_texture_webp=dict(source=0)))], images=[dict(bufferView=4,mimeType="image/webp")],
               accessors=[dict(bufferView=0,componentType=5123,count=n,type="VEC3",min=bounds[0],max=bounds[1]),
                          dict(bufferView=1,componentType=5120,count=n,type="VEC3",normalized=True),
                          dict(bufferView=2,componentType=5123,count=n,type="VEC2",normalized=True),
                          dict(bufferView=3,componentType=5125 if wide else 5123,count=indices.size,type="SCALAR")],
               buffers=[dict(byteLength=len(payload))], bufferViews=views)
    desc = json.dumps(doc,separators=(",",":")).encode()
    desc += b" " * (-len(desc)%4)
    output.write_bytes(struct.pack("<4sII",b"glTF",2,28+len(desc)+len(payload)) +
                       struct.pack("<I4s",len(desc),b"JSON")+desc+struct.pack("<I4s",len(payload),b"BIN\0")+payload)
    print("Distance mesh:",n,"vertices,",len(reduced),"triangles,",len(image),"bytes of baked color",flush=True)


uvs = unwrap()
print("Reprojecting original diffuse onto the distance mesh", flush=True)
export(uvs, bake(uvs, 1536))
