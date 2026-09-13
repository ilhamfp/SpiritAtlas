"""Check that source planar optical normals survive actual GLB export."""
from pathlib import Path
import argparse,hashlib,json,math,struct
P=Path(__file__).resolve().parents[1]
p=argparse.ArgumentParser();p.add_argument('--source-tag',default='v012');p.add_argument('--drink',default='all');p.add_argument('--model-suffix',default='');a=p.parse_args()
results=[]
for drink in (['bbf-negroni','ichigo-negroni','negroni-express'] if a.drink=='all' else [a.drink]):
    path=P/'public/models/candidates'/a.source_tag/f'{drink}{a.model_suffix}.glb';raw=path.read_bytes()
    length=struct.unpack_from('<I',raw,12)[0];doc=json.loads(raw[20:20+length]);binary=raw[28+length:]
    def access(i):
        acc=doc['accessors'][i];view=doc['bufferViews'][acc['bufferView']]
        count={'SCALAR':1,'VEC3':3}[acc['type']];fmt={5123:'H',5125:'I',5126:'f'}[acc['componentType']]
        size=struct.calcsize('<'+fmt*count);stride=view.get('byteStride',size);start=view.get('byteOffset',0)+acc.get('byteOffset',0)
        return [struct.unpack_from('<'+fmt*count,binary,start+k*stride) for k in range(acc['count'])]
    parts={}
    for node in doc['nodes']:
        part=node.get('extras',{}).get('scenePartId')
        if part not in ['glass','liquid']:continue
        angles=[];face_count=0
        for primitive in doc['meshes'][node['mesh']]['primitives']:
            positions=access(primitive['attributes']['POSITION']);normals=access(primitive['attributes']['NORMAL']);indices=[v[0] for v in access(primitive['indices'])]
            for i in range(0,len(indices),3):
                tri=indices[i:i+3];ys=[positions[k][1] for k in tri]
                if max(ys)-min(ys)>1e-6:continue
                face_count+=1
                for k in tri:
                    n=normals[k];angles.append(math.degrees(math.acos(min(1,abs(n[1])/math.sqrt(sum(x*x for x in n))))))
        parts[part]=dict(horizontalTriangleCount=face_count,maxExportedNormalDeviationDegrees=max(angles),planarNormalsPreserved=max(angles)<.05)
    results.append(dict(drink=drink,glb=str(path.relative_to(P)),sha256=hashlib.sha256(raw).hexdigest(),parts=parts))
out=P/f'qa/evidence/blender/{a.source_tag}{a.model_suffix}-exported-normal-audit.json';out.write_text(json.dumps(results,indent=2));print(json.dumps(results))
