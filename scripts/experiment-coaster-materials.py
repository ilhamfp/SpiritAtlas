"""Isolated passive-coaster controls for the saved clean Somma interface scene.

No drink geometry, liquid material, light, camera, world or exposure is changed.
The optional ink pattern is explicitly inferred, with no branding reconstruction.
"""
import bpy,argparse,sys,json,hashlib,struct
from pathlib import Path
P=Path(__file__).resolve().parents[1]
p=argparse.ArgumentParser();p.add_argument('--material',choices=['white','inferred-ink'],required=True)
a=p.parse_args(sys.argv[sys.argv.index('--')+1:] if '--' in sys.argv else [])
source=P/'assets/blender/experiments/negroni-express-v012-interfaces-clean-red-d055-hero.blend'
sha=lambda path:hashlib.sha256(path.read_bytes()).hexdigest()
source_hash=sha(source);bpy.ops.wm.open_mainfile(filepath=str(source));scene=bpy.context.scene
def geometry_hash():
    h=hashlib.sha256()
    for ob in sorted(scene.objects,key=lambda item:item.name):
        if ob.type!='MESH':continue
        h.update(ob.name.encode());h.update(struct.pack('<16f',*(v for row in ob.matrix_world for v in row)))
        for vertex in ob.data.vertices:h.update(struct.pack('<3f',*vertex.co))
        for face in ob.data.polygons:h.update(struct.pack('<'+'I'*len(face.vertices),*face.vertices))
        for normal in ob.data.corner_normals:h.update(struct.pack('<3f',*normal.vector))
    return h.hexdigest()
before=geometry_hash();coaster=scene.objects['stage_square_coaster'];original=coaster.data.materials[0]
paper=original.copy();paper.name='Coaster '+a.material+' isolated control'
coaster.data.materials[0]=paper;nodes=paper.node_tree.nodes;links=paper.node_tree.links
bsdf=nodes.get('Principled BSDF');base=bsdf.inputs['Base Color']
for link in list(base.links):links.remove(link)
base.default_value=(1,1,1,1)
settings=dict(material=a.material,whiteControl=[1,1,1],roughness=bsdf.inputs['Roughness'].default_value,emission=0,pattern=None)
if a.material=='inferred-ink':
    coordinate=nodes.new('ShaderNodeTexCoord');coordinate.name='Coaster local coordinates'
    separate=nodes.new('ShaderNodeSeparateXYZ');links.new(coordinate.outputs['Generated'],separate.inputs[0])
    combine=nodes.new('ShaderNodeCombineXYZ');links.new(separate.outputs['X'],combine.inputs['X']);links.new(separate.outputs['Y'],combine.inputs['Y'])
    noise=nodes.new('ShaderNodeTexNoise');noise.inputs['Scale'].default_value=18;noise.inputs['Detail'].default_value=1.2;noise.inputs['Roughness'].default_value=.55
    links.new(combine.outputs[0],noise.inputs['Vector'])
    ramp=nodes.new('ShaderNodeValToRGB');ramp.color_ramp.interpolation='EASE'
    ramp.color_ramp.elements[0].position=.465;ramp.color_ramp.elements[0].color=(.012,.014,.011,1)
    ramp.color_ramp.elements[1].position=.515;ramp.color_ramp.elements[1].color=(.84,.79,.66,1)
    links.new(noise.outputs['Fac'],ramp.inputs[0])
    distances=[]
    for axis in ['X','Y']:
        subtract=nodes.new('ShaderNodeMath');subtract.operation='SUBTRACT';subtract.inputs[1].default_value=.5;links.new(separate.outputs[axis],subtract.inputs[0])
        absolute=nodes.new('ShaderNodeMath');absolute.operation='ABSOLUTE';links.new(subtract.outputs[0],absolute.inputs[0]);distances.append(absolute)
    maximum=nodes.new('ShaderNodeMath');maximum.operation='MAXIMUM'
    for index,node in enumerate(distances):links.new(node.outputs[0],maximum.inputs[index])
    border=nodes.new('ShaderNodeMath');border.operation='GREATER_THAN';border.inputs[1].default_value=.482;links.new(maximum.outputs[0],border.inputs[0])
    mix=nodes.new('ShaderNodeMixRGB');mix.blend_type='MIX';mix.inputs[2].default_value=(.84,.79,.66,1)
    links.new(border.outputs[0],mix.inputs[0]);links.new(ramp.outputs[0],mix.inputs[1]);links.new(mix.outputs[0],base)
    settings['pattern']=dict(representation='inferred-unbranded-ivory-ink',source='Native t114 hero shows a high-contrast dark/ivory print and a narrow pale edge; exact artwork/branding is unresolved.',linearInk=[.012,.014,.011],linearPaper=[.84,.79,.66],noiseScale=18,detail=1.2,roughness=.55,thresholds=[.465,.515],borderFraction=.018,coasterSizeAuthoredUnits=[2.47,2.47],noExactPatternClaim=True)
assert geometry_hash()==before
label='coaster-'+a.material
out=P/f'assets/blender/experiments/negroni-express-v012-{label}-hero.blend'
scene.render.filepath=str(P/f'qa/evidence/blender/negroni-express-hero-v012-{label}.png')
bpy.ops.wm.save_as_mainfile(filepath=str(out))
record=dict(source=str(source.relative_to(P)),sourceSha256=source_hash,scene=str(out.relative_to(P)),sceneSha256=sha(out),scriptSha256=sha(Path(__file__)),geometryAndNormalsSha256=before,geometryAndNormalsUnchanged=True,treatment=settings,controls='Only the coaster Base Color graph changes. Same source interface geometry, liquid density0.55, original ice materials, camera, world, direct lighting, roughness, exposure and sample/denoise settings.',renderCompleted=False)
out.with_suffix('.json').write_text(json.dumps(record,indent=2));assert sha(source)==source_hash;print(json.dumps(record))
