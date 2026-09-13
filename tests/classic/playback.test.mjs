import test from 'node:test';
import assert from 'node:assert/strict';
import {createClassicPlayback} from '../../src/animation/classic/playback.js';
import {idleSampleProgress} from '../../src/animation/classic/core/liquid-idle.js';
import {activateSpecialtyControl} from '../../src/animation/specialty-controls.js';
const id='ichigo-negroni';
test('7.2 second transition enters continuous 2.4 second idle, pause is exact, reverse uses visible sample',()=>{
 const p=createClassicPlayback({id});p.explode();for(let i=0;i<432;i++)p.update(1/60);
 assert.equal(p.state.progress,1);assert.equal(p.state.looping,true);assert.equal(p.state.sampleProgress,1);
 for(let i=0;i<36;i++)p.update(1/60);assert.ok(p.state.sampleProgress<1);assert.equal(p.state.rigProgress,1);
 const snapshot=p.read();p.pause();p.update(2);assert.equal(p.state.sampleProgress,snapshot.sampleProgress);
 p.assemble();assert.equal(p.state.sampleProgress,snapshot.sampleProgress);p.update(1/60);assert.ok(p.state.sampleProgress<snapshot.sampleProgress);
 for(let i=0;i<432;i++)p.update(1/60);assert.equal(p.state.progress,0);assert.equal(p.state.playing,false);
});
test('full state handoff preserves reversed transitions and paused idle, rejecting invalid input atomically',()=>{
 const a=createClassicPlayback({id}),b=createClassicPlayback({id});
 a.seek(.6);a.assemble();a.update(.13);b.restorePlayback(a.read());assert.deepEqual(b.read(),a.read());
 const idle={id,progress:1,sampleProgress:idleSampleProgress(.47),looping:true,idleTime:.47,direction:1,speed:.8,playing:false,target:1};
 b.restorePlayback(idle);assert.equal(b.state.sampleProgress,idle.sampleProgress);b.play();b.update(.1);assert.ok(b.state.idleTime>.47);
 const before=b.read();assert.throws(()=>b.restorePlayback({...before,id:'bbf-negroni'}));assert.deepEqual(b.read(),before);
 assert.throws(()=>b.restorePlayback({...before,sampleProgress:0}));assert.deepEqual(b.read(),before);
});
test('scrub direction drives resume target, reduced motion does not autoanimate, clocks are isolated',()=>{
 const a=createClassicPlayback({id}),b=createClassicPlayback({id:'bbf-negroni'}),targets=[];
 a.seek(.6);a.seek(.4);activateSpecialtyControl(a,n=>targets.push(n));assert.deepEqual(targets,[0]);a.update(.1);assert.ok(a.state.progress<.4);assert.equal(b.state.progress,0);
 a.setReducedMotion(true);a.explode();assert.equal(a.state.progress,1);assert.equal(a.state.playing,false);a.play();assert.equal(a.state.playing,false);
 a.setReducedMotion(false);a.play();a.update(.2);assert.equal(a.state.looping,true);a.dispose();assert.equal(a.update(1),false);
});
