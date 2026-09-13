"""One physical environment-radiance region; no ray-type visibility branches."""
import math,json,hashlib
from pathlib import Path

def basis(config):
    az,el=map(math.radians,[config['centerAzimuthDegrees'],config['centerElevationDegrees']])
    sh,sv=map(math.radians,[config['localHorizontalSigmaDegrees'],config['localVerticalSigmaDegrees']])
    a,b=1/(2*sh*sh),1/(2*sv*sv)
    return {'n':[math.cos(el)*math.cos(az),math.cos(el)*math.sin(az),math.sin(el)],'h':[-math.sin(az),math.cos(az),0],'v':[-math.sin(el)*math.cos(az),-math.sin(el)*math.sin(az),math.cos(el)],'kappa':a+b,'beta':(b-a)/2}

def multiplier(direction,config):
    b=basis(config);dot=lambda v:sum(x*y for x,y in zip(direction,v))
    return config['baselineMultiplier']+config['peakExtraMultiplier']*math.exp(b['kappa']*(dot(b['n'])-1)+b['beta']*(dot(b['h'])**2-dot(b['v'])**2))

def install(world,config):
    b=basis(config);nodes=world.node_tree.nodes;links=world.node_tree.links;background=nodes.get('Background')
    assert not background.inputs['Color'].is_linked and not background.inputs['Strength'].is_linked
    strength=background.inputs['Strength'].default_value
    geometry=nodes.new('ShaderNodeNewGeometry');geometry.name='Environment ray travel direction: installed Cycles background P=ray_D'
    normalize=nodes.new('ShaderNodeVectorMath');normalize.operation='NORMALIZE';links.new(geometry.outputs['Position'],normalize.inputs[0])
    def dot(name,vector):
        node=nodes.new('ShaderNodeVectorMath');node.operation='DOT_PRODUCT';node.name=name;node.inputs[1].default_value=vector;links.new(normalize.outputs['Vector'],node.inputs[0]);return node.outputs['Value']
    def math_node(operation,a,b=None):
        node=nodes.new('ShaderNodeMath');node.operation=operation
        for index,value in enumerate([a,b]):
            if value is None:continue
            if isinstance(value,(int,float)):node.inputs[index].default_value=value
            else:links.new(value,node.inputs[index])
        return node.outputs[0]
    dn=dot('Broad source center direction',b['n']);dh=dot('Broad source horizontal tangent',b['h']);dv=dot('Broad source vertical tangent',b['v'])
    center=math_node('MULTIPLY',math_node('SUBTRACT',dn,1),b['kappa'])
    ellipse=math_node('MULTIPLY',math_node('SUBTRACT',math_node('MULTIPLY',dh,dh),math_node('MULTIPLY',dv,dv)),b['beta'])
    exponent=math_node('ADD',center,ellipse);lobe=math_node('EXPONENT',exponent)
    scale=math_node('ADD',math_node('MULTIPLY',lobe,config['peakExtraMultiplier']),config['baselineMultiplier'])
    links.new(math_node('MULTIPLY',scale,strength),background.inputs['Strength'])
    assert not any(n.type=='LIGHT_PATH' for n in nodes)
    return {'config':config,'derivedBasis':b,'originalWorldStrength':strength,'directionNode':'Geometry.Position, normalized: installed Cycles background shader sd->P=ray_D','allRayTypesShareOneWorldGraph':True,'usesLightPathBranches':False,'sourceCode':'https://github.com/blender/blender/blob/9e2066aef7ef/intern/cycles/kernel/geom/shader_data.h#L357','moduleSha256':hashlib.sha256(Path(__file__).read_bytes()).hexdigest()}
