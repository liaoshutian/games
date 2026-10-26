(()=>{"use strict";
const $=id=>document.getElementById(id);
const worlds={
 bakery:{icon:"🧁",name:"甜品王国",color:"#ffe3ee",goal:3},
 forest:{icon:"🌳",name:"星光森林",color:"#d9f3df",goal:7},
 ocean:{icon:"🐬",name:"梦幻海洋",color:"#c9efff",goal:6},
 garden:{icon:"🌷",name:"四季花园",color:"#dff6e4",goal:3},
 dress:{icon:"👗",name:"星光衣橱",color:"#ece2ff",goal:3},
 toy:{icon:"🧸",name:"奇想玩具城",color:"#fff0c9",goal:5}
};
const order=Object.keys(worlds);
let mode="town",currentWorld="",renderer,scene,camera,root,raycaster,mouse,clock;
let mascot=null,guest=null,targets=[],targetMeshes=[],particles=[],butterflies=[],movingThings=[],stars=0;
let soundOn=true,audioCtx=null,selectedBase="cake",ingredients=[],dish=null,dishGroup=null,guestType="bear";
let gardenPlots=[],gardenTool="seed",foundItems=0,shapeType="block",toyPieces=[],toyMarble=null,worldRun=0,worldTimer=null,accessoryType="",outfitType="fairy";
let actorList=[],townPortals=[],lastTap=0,dragIngredient=null;
const saved={stars:"candyPlanetStarsV2",collection:"candyPlanetCollectionV2"};
let collection={};
try{stars=Number(localStorage.getItem(saved.stars)||0);collection=JSON.parse(localStorage.getItem(saved.collection)||"{}")||{}}catch(e){}
$("starCount").textContent=stars;
const MAT=(c,extra={})=>new THREE.MeshStandardMaterial({color:c,roughness:.57,metalness:0,...extra});
function ball(p,x,y,z,sx,sy,sz,c,extra={}){const m=new THREE.Mesh(new THREE.SphereGeometry(1,24,18),MAT(c,extra));m.position.set(x,y,z);m.scale.set(sx,sy,sz);m.castShadow=true;m.receiveShadow=true;p.add(m);return m}
function box(p,x,y,z,sx,sy,sz,c,extra={}){const m=new THREE.Mesh(new THREE.BoxGeometry(sx,sy,sz),MAT(c,extra));m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;p.add(m);return m}
function cyl(p,x,y,z,rt,rb,h,c,n=24){const m=new THREE.Mesh(new THREE.CylinderGeometry(rt,rb,h,n),MAT(c));m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;p.add(m);return m}
function cone(p,x,y,z,r,h,c,n=20){const m=new THREE.Mesh(new THREE.ConeGeometry(r,h,n),MAT(c));m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;p.add(m);return m}
function torus(p,x,y,z,r,t,c,rx=Math.PI/2){const m=new THREE.Mesh(new THREE.TorusGeometry(r,t,12,40),MAT(c));m.position.set(x,y,z);m.rotation.x=rx;m.castShadow=true;p.add(m);return m}
function starShape(){const s=new THREE.Shape();for(let i=0;i<10;i++){const a=Math.PI/2+i*Math.PI/5,r=i%2===0?.5:.23,x=Math.cos(a)*r,y=Math.sin(a)*r;if(i===0)s.moveTo(x,y);else s.lineTo(x,y)}s.closePath();return new THREE.ExtrudeGeometry(s,{depth:.14,bevelEnabled:true,bevelSegments:2,steps:1,bevelSize:.04,bevelThickness:.035})}
function starMesh(p,x,y,z,size,c="#ffd56e"){const m=new THREE.Mesh(starShape(),MAT(c,{emissive:c,emissiveIntensity:.22,roughness:.3}));m.position.set(x,y,z);m.scale.setScalar(size);m.castShadow=true;p.add(m);return m}
function addTarget(g,type,id,extra={}){g.userData.targetType=type;g.userData.targetId=id;Object.assign(g.userData,extra);g.traverse(o=>{if(o.isMesh){o.userData.targetType=type;o.userData.targetId=id;targetMeshes.push(o)}});targets.push(g);return g}
function clearTargets(){targets=[];targetMeshes=[]}
function disposeGroup(g){if(!g)return;g.traverse(o=>{if(o.geometry)o.geometry.dispose?.();if(o.material){if(Array.isArray(o.material))o.material.forEach(m=>m.dispose?.());else o.material.dispose?.()}});if(g.parent)g.parent.remove(g)}
function addLights(){scene.add(new THREE.HemisphereLight("#ffffff","#b9a3d5",2.1));const sun=new THREE.DirectionalLight("#fff5df",3.2);sun.position.set(-5,10,7);sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);sun.shadow.camera.left=-12;sun.shadow.camera.right=12;sun.shadow.camera.top=12;sun.shadow.camera.bottom=-12;scene.add(sun);const fill=new THREE.PointLight("#ffbfe2",1.1,30);fill.position.set(4,4,4);scene.add(fill)}
function init3D(){if(renderer)return;renderer=new THREE.WebGLRenderer({canvas:$("scene"),antialias:true,alpha:false,powerPreference:"high-performance"});renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.65));renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.08;raycaster=new THREE.Raycaster();mouse=new THREE.Vector2();clock=new THREE.Clock();scene=new THREE.Scene();camera=new THREE.PerspectiveCamera(36,1,.1,100);addLights();resize();window.addEventListener("resize",resize);window.addEventListener("orientationchange",()=>setTimeout(resize,120));document.addEventListener("fullscreenchange",()=>setTimeout(resize,100));}
function resize(){if(!renderer||!camera)return;const w=innerWidth,h=innerHeight;renderer.setSize(w,h,false);camera.aspect=w/h;camera.fov=w>h?35:43;camera.updateProjectionMatrix()}
function useCamera(pos,look,fov){camera.position.set(...pos);camera.fov=fov||camera.fov;camera.lookAt(...look);camera.updateProjectionMatrix()}
function newRoot(bg,fog){if(root)disposeGroup(root);root=new THREE.Group();scene.add(root);scene.background=new THREE.Color(bg);scene.fog=new THREE.Fog(bg,fog||17,42);clearTargets();particles=[];butterflies=[];movingThings=[];actorList=[];mascot=null;guest=null;gardenPlots=[];toyPieces=[];toyMarble=null;dishGroup=null;dish=null;worldRun++;useCamera([0,7.2,13],[0,1,0]);}
function ground(c="#bcebd9",r=11){const g=new THREE.Mesh(new THREE.CircleGeometry(r,64),MAT(c));g.rotation.x=-Math.PI/2;g.position.y=-.12;g.receiveShadow=true;root.add(g);return g}
function addCloud(p,x,y,z,s=1,c="#fff"){const g=new THREE.Group();g.position.set(x,y,z);g.scale.setScalar(s);p.add(g);ball(g,-.32,0,0,.48,.28,.32,c);ball(g,0,.13,0,.53,.4,.38,c);ball(g,.4,0,0,.42,.28,.3,c);return g}
function addTree(p,x,z,s=1,c="#78cba4"){const g=new THREE.Group();g.position.set(x,0,z);g.scale.setScalar(s);p.add(g);cyl(g,0,.48,0,.14,.19,.95,"#bc8b69",12);ball(g,0,1.18,0,.62,.65,.58,c);ball(g,-.3,1.25,.12,.36,.4,.34,c);ball(g,.29,1.35,.05,.38,.39,.36,c);return g}
function addFlower(p,x,z,c="#ff9fc9",s=1){const g=new THREE.Group();g.position.set(x,0,z);g.scale.setScalar(s);p.add(g);cyl(g,0,.25,0,.04,.05,.5,"#67c99b",10);for(let i=0;i<5;i++){const a=i*Math.PI*2/5;ball(g,Math.cos(a)*.17,.52,Math.sin(a)*.17,.16,.16,.13,c)}ball(g,0,.52,0,.12,.12,.12,"#ffdc78");return g}
