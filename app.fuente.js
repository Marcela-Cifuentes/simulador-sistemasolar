
/* =====================================================================
   OBSERVATORIO 3D · Sistema Solar
   Estructura: 1) Constantes editables  2) Datos astronómicos  3) Shaders
   4) Escena  5) Cuerpos  6) Cámara y modos  7) Entrada  8) Interfaz  9) Bucle
   ===================================================================== */
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

/* ---------- 1) CONSTANTES EDITABLES ---------- */
const URL_RECORRIDO = 'https://mauricioantonioa29.sg-host.com/';   // enlace "Volver al recorrido"
const COLORES = { fondo:'#04061a', cian:'#5ad7ff', oro:'#f2c14e' }; // paleta de la interfaz
// Texturas reales opcionales de la Tierra. Pon null para usar solo la versión generada por código.
const TEXTURAS_TIERRA = { dia:'texturas/tierra_dia.jpg', noche:'texturas/tierra_noche.jpg', relieveNubes:'texturas/tierra_relieve_nubes.jpg' };
const HORAS_POR_SEGUNDO = 1;        // "Giro real": 1 segundo de pantalla = 1 hora real
const PIXEL_RATIO_MAX = 2;

/* ---------- 2) DATOS ASTRONÓMICOS (separados de la lógica) ----------
   R: radio en la escena (escala didáctica comprimida) · km: radio real · a: radio de la órbita en la escena
   per: periodo orbital (años en planetas, días en lunas; negativo = retrógrado) · rot: horas por giro
   tilt: inclinación del eje en grados · modo: 0 roca, 1 Tierra, 2 gas, 3 hielo, 4 Ío
   marcas: rasgos con nombre {n, lat, lon, tam (radianes), tipo: 1 mancha oscura, 2 montaña, 3 zona clara}
   capas: interior, de afuera hacia adentro [nombre, radio exterior (0-1), color, texto de una línea]        */
const CUERPOS = [
 { id:'sol', nombre:'Sol', R:10, km:695700, rot:609, tilt:7.25, c:['#ffb347','#ff7a1a','#fff3c4'],
   unico:'Es la única estrella del sistema y guarda el 99,8 % de toda su masa.',
   lugar:'El centro: todo lo demás gira a su alrededor.',
   capas:[['Zona convectiva',1,'#ff9a3c','El gas caliente sube y baja como agua hirviendo.'],
          ['Zona radiativa',.7,'#ffc45e','La luz tarda miles de años en atravesarla.'],
          ['Núcleo',.25,'#fff6d6','Fusiona hidrógeno en helio a unos 15 millones de °C.']] },
 { id:'mercurio', nombre:'Mercurio', R:.8, km:2440, a:20, per:.241, rot:1407.6, tilt:.03, modo:0, c:['#8c8580','#5e5955','#c9c0b6'], crater:1,
   marcas:[{n:'Cuenca Caloris',lat:30,lon:-170,tam:.3,tipo:3}],
   unico:'Su núcleo de hierro es tan grande que ocupa casi todo el planeta.',
   lugar:'1.er planeta desde el Sol: el más pequeño y el más veloz.',
   capas:[['Corteza',1,'#8f8a86','Roca llena de cráteres, sin aire que la proteja.'],
          ['Manto',.94,'#b0703c','Capa delgada de roca caliente.'],
          ['Núcleo',.83,'#f0b45a','Hierro, en parte líquido: genera un campo magnético débil.']] },
 { id:'venus', nombre:'Venus', R:1.4, km:6052, a:28, per:.615, rot:-5832.5, tilt:2.6, modo:0, c:['#b5651d','#7d4317','#d99a4e'], crater:.2,
   nubes:{col:'#ead9a6',cover:1,swirl:1}, atmo:{col:'#f5d58a',f:1},
   marcas:[{n:'Montes Maxwell (bajo las nubes)',lat:65,lon:3,tam:.2,tipo:2}],
   unico:'Es el planeta más caliente: sus nubes atrapan el calor como un invernadero.',
   lugar:'2.º planeta desde el Sol, casi del mismo tamaño que la Tierra.',
   capas:[['Corteza',1,'#b5651d','Roca volcánica a unos 465 °C.'],
          ['Manto',.95,'#c2552d','Roca caliente que se deforma lentamente.'],
          ['Núcleo',.52,'#f0a04b','Hierro y níquel, parecido al de la Tierra.']] },
 { id:'tierra', nombre:'Tierra', R:1.5, km:6371, a:38, per:1, rot:23.93, tilt:23.44, modo:1, c:['#2f6fb5','#3c7a3a','#ffffff'],
   nubes:{col:'#ffffff',cover:.5,swirl:.2}, atmo:{col:'#5aa9ff',f:1.2},
   marcas:[{n:'Colombia',lat:4.6,lon:-74.1},{n:'Cordillera de los Andes',lat:-22,lon:-68},{n:'Desierto del Sahara',lat:23,lon:13},
           {n:'Océano Pacífico',lat:0,lon:-150},{n:'Himalaya',lat:28,lon:87},{n:'Antártida',lat:-82,lon:30}],
   unico:'El único mundo conocido con agua líquida en la superficie y con vida.',
   lugar:'3.er planeta desde el Sol, en la zona habitable.',
   capas:[['Corteza',1,'#6b8f5a','La capa delgada y fría donde vivimos.'],
          ['Manto',.97,'#c2552d','Roca caliente que se mueve muy despacio.'],
          ['Núcleo externo',.55,'#f08a24','Hierro líquido: crea el campo magnético.'],
          ['Núcleo interno',.19,'#ffe08a','Esfera sólida de hierro, tan caliente como la superficie del Sol.']] },
 { id:'luna', nombre:'Luna', padre:'tierra', R:.4, km:1737, a:3.6, per:27.32, rot:655.7, tilt:1.5, modo:0, c:['#a9a7a2','#6e6d6a','#d6d4cf'], crater:1,
   marcas:[{n:'Mar de las Lluvias',lat:33,lon:-16,tam:.3,tipo:1},{n:'Mar de la Serenidad',lat:28,lon:17,tam:.2,tipo:1},
           {n:'Mar de la Tranquilidad',lat:9,lon:31,tam:.22,tipo:1},{n:'Cráter Tycho',lat:-43,lon:-11,tam:.12,tipo:3}],
   unico:'Es el único mundo, además de la Tierra, que han pisado seres humanos.',
   lugar:'El satélite natural de la Tierra.',
   capas:[['Corteza',1,'#a9a7a2','Roca gris marcada por impactos.'],
          ['Manto',.97,'#8a6a55','Roca sólida que ya casi se enfrió.'],
          ['Núcleo',.2,'#e0a860','Un núcleo pequeño de hierro.']] },
 { id:'marte', nombre:'Marte', R:1, km:3390, a:48, per:1.881, rot:24.62, tilt:25.19, modo:0, c:['#b5532a','#74301a','#dc9360'], crater:.45, caps:.9,
   atmo:{col:'#e8a070',f:.5},
   marcas:[{n:'Monte Olimpo',lat:18.6,lon:-134,tam:.17,tipo:2},{n:'Valles Marineris',lat:-14,lon:-59,tam:.2,tipo:1},{n:'Casquete polar norte',lat:87,lon:0}],
   unico:'Tiene el volcán más alto que se conoce: el Monte Olimpo, casi tres veces el Everest.',
   lugar:'4.º planeta desde el Sol, el último de los rocosos.',
   capas:[['Corteza',1,'#b5532a','Roca rojiza: el color viene del hierro oxidado.'],
          ['Manto',.97,'#8a3a22','Roca caliente, hoy casi quieta.'],
          ['Núcleo',.5,'#f0a04b','Hierro y azufre, en buena parte líquido.']] },
 { id:'fobos', nombre:'Fobos', padre:'marte', R:.15, km:11.3, a:1.9, per:.319, rot:7.65, tilt:0, modo:0, c:['#7a6f66','#4f463f','#a3978b'], crater:1.3, forma:[1,.82,.72],
   marcas:[{n:'Cráter Stickney',lat:0,lon:50,tam:.4,tipo:3}],
   unico:'Orbita tan cerca que le da la vuelta a Marte tres veces al día.',
   lugar:'La luna interior de Marte.',
   capas:[['Roca porosa',1,'#7a6f66','Un montón de roca y polvo con huecos por dentro.']] },
 { id:'deimos', nombre:'Deimos', padre:'marte', R:.12, km:6.2, a:2.7, per:1.263, rot:30.3, tilt:0, modo:0, c:['#8a7f74','#5a5048','#b0a497'], crater:.7, forma:[1,.8,.68],
   unico:'Es una de las lunas más pequeñas que se conocen: mide apenas unos 12 km.',
   lugar:'La luna exterior de Marte.',
   capas:[['Roca y polvo',1,'#8a7f74','Roca cubierta por una capa gruesa de polvo fino.']] },
 { id:'jupiter', nombre:'Júpiter', R:5, km:69911, a:85, per:11.86, rot:9.93, tilt:3.13, modo:2, c:['#e2c7a2','#a8683f','#f4e8d6'], gas:[11,1],
   spot:{lat:-22,lon:-60,tam:.17,col:'#c1502e'}, atmo:{col:'#e8c9a0',f:.6}, anillo:{r1:1.4,r2:1.8,estilo:2,col:'#bfa58a',op:.12},
   marcas:[{n:'Gran Mancha Roja',lat:-22,lon:-60}],
   unico:'Es tan grande que dentro cabrían más de 1 300 Tierras.',
   lugar:'5.º planeta desde el Sol, el primero de los gigantes gaseosos.',
   capas:[['Atmósfera',1,'#e2c7a2','Nubes de amoníaco empujadas por vientos enormes.'],
          ['Hidrógeno líquido',.93,'#b89a6e','El gas se aprieta tanto que se vuelve líquido.'],
          ['Hidrógeno metálico',.78,'#7d8fb3','Tan comprimido que conduce electricidad.'],
          ['Núcleo',.2,'#f3d9a4','Roca y hielo; todavía se conoce poco.']] },
 { id:'io', nombre:'Ío', padre:'jupiter', R:.45, km:1822, a:7.5, per:1.769, rot:42.5, tilt:0, modo:4, c:['#e8d36a','#d98e2b','#f4efc9'],
   marcas:[{n:'Volcán Loki',lat:13,lon:51,tam:.12,tipo:1}],
   unico:'Es el mundo con más volcanes activos de todo el sistema solar.',
   lugar:'La más cercana de las cuatro grandes lunas de Júpiter.',
   capas:[['Corteza',1,'#e8d36a','Superficie cubierta de azufre de colores.'],
          ['Manto',.96,'#d9622b','Roca fundida que alimenta cientos de volcanes.'],
          ['Núcleo',.5,'#f0c070','Hierro y azufre.']] },
 { id:'europa', nombre:'Europa', padre:'jupiter', R:.4, km:1561, a:9, per:3.551, rot:85.2, tilt:0, modo:3, c:['#ddd6c4','#b89f84','#8a5a3c'],
   marcas:[{n:'Grietas del hielo',lat:10,lon:-30}],
   unico:'Bajo su hielo esconde un océano que podría albergar vida.',
   lugar:'La 2.ª de las grandes lunas de Júpiter.',
   capas:[['Corteza de hielo',1,'#dfe9f2','Hielo agrietado de varios kilómetros.'],
          ['Océano',.95,'#2f6fb5','Agua salada: más que en todos los mares de la Tierra.'],
          ['Manto rocoso',.88,'#8a6a55','Roca que calienta el océano desde abajo.'],
          ['Núcleo',.4,'#f0b060','Hierro.']] },
 { id:'ganimedes', nombre:'Ganimedes', padre:'jupiter', R:.6, km:2634, a:11, per:7.155, rot:171.7, tilt:0, modo:3, c:['#a59a8c','#6b6259','#d0c9bd'], crater:.5,
   marcas:[{n:'Galileo Regio',lat:47,lon:-129,tam:.38,tipo:1}],
   unico:'Es la luna más grande del sistema solar: supera en tamaño a Mercurio.',
   lugar:'La 3.ª de las grandes lunas de Júpiter.',
   capas:[['Corteza de hielo',1,'#cfd8e0','Hielo duro mezclado con roca.'],
          ['Océano',.93,'#2f6fb5','Agua salada atrapada entre capas de hielo.'],
          ['Manto',.8,'#8a7a6a','Hielo a alta presión y roca.'],
          ['Núcleo',.3,'#f0b060','Hierro que crea un campo magnético propio.']] },
 { id:'calisto', nombre:'Calisto', padre:'jupiter', R:.55, km:2410, a:13.5, per:16.69, rot:400.5, tilt:0, modo:0, c:['#5c5247','#3d362f','#b5ab9c'], crater:1.4,
   marcas:[{n:'Cuenca Valhalla',lat:15,lon:-56,tam:.32,tipo:3}],
   unico:'Tiene la superficie con más cráteres: casi no ha cambiado en 4 000 millones de años.',
   lugar:'La más lejana de las cuatro grandes lunas de Júpiter.',
   capas:[['Corteza',1,'#5c5247','Hielo sucio y roca cubiertos de cráteres.'],
          ['Posible océano',.92,'#2f5f95','Podría haber agua salada a gran profundidad.'],
          ['Interior',.85,'#7a6f66','Roca y hielo mezclados, sin capas claras.']] },
 { id:'saturno', nombre:'Saturno', R:4.2, km:58232, a:115, per:29.46, rot:10.7, tilt:26.73, modo:2, c:['#ead9ad','#c2a36b','#f6eed8'], gas:[6,.5], hex:1,
   atmo:{col:'#f0deb0',f:.6}, anillo:{r1:1.25,r2:2.3,estilo:1,col:'#dccba2',op:.95},
   marcas:[{n:'Hexágono polar',lat:80,lon:0},{n:'División de Cassini',anillo:.61}],
   unico:'Sus anillos de hielo son los más grandes y brillantes, y es tan liviano que flotaría en agua.',
   lugar:'6.º planeta desde el Sol.',
   capas:[['Atmósfera',1,'#ead9ad','Nubes doradas de amoníaco.'],
          ['Hidrógeno líquido',.92,'#b8a070','Gas comprimido hasta volverse líquido.'],
          ['Hidrógeno metálico',.5,'#7d8fb3','Conduce electricidad como un metal.'],
          ['Núcleo',.2,'#f3d9a4','Roca y hielo.']] },
 { id:'encelado', nombre:'Encélado', padre:'saturno', R:.25, km:252, a:10.6, per:1.37, rot:32.9, tilt:0, modo:3, c:['#f4f8fb','#cfe0ea','#7fb2d6'],
   marcas:[{n:'Rayas de tigre',lat:-78,lon:0}],
   unico:'Lanza al espacio chorros de agua desde un océano oculto bajo el hielo.',
   lugar:'Una luna pequeña y muy brillante de Saturno.',
   capas:[['Corteza de hielo',1,'#f4f8fb','El hielo más blanco y reflectante del sistema.'],
          ['Océano',.88,'#2f6fb5','Agua salada que escapa por las grietas del polo sur.'],
          ['Núcleo rocoso',.75,'#8a6a55','Roca porosa y tibia.']] },
 { id:'titan', nombre:'Titán', padre:'saturno', R:.6, km:2575, a:12.5, per:15.95, rot:382.7, tilt:0, modo:0, c:['#6b4a2a','#33230f','#9a7446'], crater:.12,
   nubes:{col:'#d9953d',cover:1,swirl:.25}, atmo:{col:'#f0a040',f:1.1},
   marcas:[{n:'Mar Kraken (bajo la neblina)',lat:68,lon:-50,tam:.28,tipo:1}],
   unico:'Es la única luna con atmósfera densa, y tiene ríos y mares de metano líquido.',
   lugar:'La luna más grande de Saturno.',
   capas:[['Corteza de hielo',1,'#b8a58a','Hielo de agua duro como roca.'],
          ['Océano',.96,'#2f6fb5','Agua con amoníaco bajo la superficie.'],
          ['Hielo a presión',.9,'#8fa5b8','Hielo aplastado por el peso de arriba.'],
          ['Núcleo rocoso',.78,'#8a6a55','Roca con agua en su interior.']] },
 { id:'urano', nombre:'Urano', R:2.8, km:25362, a:142, per:84.01, rot:17.24, tilt:97.77, modo:2, c:['#b4e6ea','#8fd0da','#d6f3f5'], gas:[3,.15],
   atmo:{col:'#b8f0f5',f:.7}, anillo:{r1:1.6,r2:2.05,estilo:2,col:'#aebfc7',op:.45},
   marcas:[{n:'Polo norte',lat:90,lon:0}],
   unico:'Gira acostado: su eje está inclinado casi 98°, como si rodara por su órbita.',
   lugar:'7.º planeta desde el Sol, un gigante de hielo.',
   capas:[['Atmósfera',1,'#b4e6ea','Hidrógeno, helio y metano, que le da el color azul verdoso.'],
          ['Manto de hielos',.8,'#3d7fa6','Agua, amoníaco y metano calientes y muy densos.'],
          ['Núcleo',.2,'#c9a878','Un núcleo rocoso pequeño.']] },
 { id:'neptuno', nombre:'Neptuno', R:2.7, km:24622, a:165, per:164.8, rot:16.11, tilt:28.32, modo:2, c:['#4a7cf0','#2a4fb8','#8fb4ff'], gas:[4,.4],
   spot:{lat:-20,lon:30,tam:.13,col:'#1c2f7a'}, atmo:{col:'#6f9bff',f:.8}, anillo:{r1:1.7,r2:2.5,estilo:2,col:'#8a9ab8',op:.18},
   marcas:[{n:'Gran Mancha Oscura',lat:-20,lon:30}],
   unico:'Tiene los vientos más veloces del sistema solar: más de 2 000 km/h.',
   lugar:'8.º y último planeta desde el Sol.',
   capas:[['Atmósfera',1,'#4a7cf0','Hidrógeno, helio y metano azul.'],
          ['Manto de hielos',.82,'#2d5f8f','Agua, amoníaco y metano muy calientes.'],
          ['Núcleo',.25,'#c9a878','Roca y hielo.']] },
 { id:'triton', nombre:'Tritón', padre:'neptuno', R:.4, km:1353, a:8, per:-5.877, rot:141, tilt:0, modo:3, c:['#d8c9c0','#b59a94','#7d8a99'], crater:.2,
   marcas:[{n:'Géiseres de nitrógeno',lat:-50,lon:20}],
   unico:'Orbita al revés que su planeta: seguramente fue capturada del cinturón de Kuiper.',
   lugar:'La luna más grande de Neptuno.',
   capas:[['Hielo de nitrógeno',1,'#d8c9c0','Una de las superficies más frías: unos −235 °C.'],
          ['Manto de hielo',.95,'#9fb5c8','Hielo de agua, quizá con un océano.'],
          ['Núcleo rocoso',.65,'#8a6a55','Roca y metal.']] },
 { id:'pluton', nombre:'Plutón', R:.6, km:1188, a:185, per:248, rot:153.3, tilt:122.5, modo:0, c:['#b89a7a','#6e4a35','#efe4d3'], crater:.35,
   atmo:{col:'#9fc4ff',f:.3},
   marcas:[{n:'Tombaugh Regio (el corazón)',lat:20,lon:180,tam:.45,tipo:3}],
   unico:'Tiene una enorme llanura de hielo con forma de corazón.',
   lugar:'Planeta enano del cinturón de Kuiper, más allá de Neptuno.',
   capas:[['Hielo de nitrógeno',1,'#efe4d3','Hielos de nitrógeno y metano en la superficie.'],
          ['Hielo de agua',.96,'#9fb5c8','Hielo duro; debajo podría haber un océano.'],
          ['Núcleo rocoso',.7,'#8a6a55','Roca: ocupa la mayor parte del interior.']] },
 { id:'caronte', nombre:'Caronte', padre:'pluton', R:.3, km:606, a:1.8, per:6.387, rot:153.3, tilt:0, modo:0, c:['#8f8a86','#5a4a45','#b9b2ab'], crater:.7,
   marcas:[{n:'Mordor Macula',lat:84,lon:0,tam:.38,tipo:1}],
   unico:'Es tan grande frente a Plutón que los dos giran uno alrededor del otro, como un planeta doble.',
   lugar:'La luna más grande de Plutón.',
   capas:[['Corteza de hielo',1,'#8f8a86','Hielo de agua con grietas enormes.'],
          ['Manto de hielo',.9,'#9fb5c8','Hielo que alguna vez fue un océano.'],
          ['Núcleo rocoso',.6,'#8a6a55','Roca.']] },
];
const CINTURON = { r1:57, r2:70, cantidad:1600 };

/* ---------- utilidades ---------- */
const $ = id => document.getElementById(id);
const rad = g => g * Math.PI / 180;
const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
const V3 = THREE.Vector3;
// Dirección sobre la esfera a partir de latitud y longitud (longitud este positiva)
const dirLL = (lat, lon) => new V3(Math.cos(rad(lat)) * Math.cos(rad(lon)), Math.sin(rad(lat)), -Math.cos(rad(lat)) * Math.sin(rad(lon)));
const movil = matchMedia('(pointer:coarse)').matches || innerWidth < 760;
const reducir = matchMedia('(prefers-reduced-motion: reduce)').matches;
const porId = Object.fromEntries(CUERPOS.map(b => [b.id, b]));

document.documentElement.style.setProperty('--fondo', COLORES.fondo);
document.documentElement.style.setProperty('--cian', COLORES.cian);
document.documentElement.style.setProperty('--oro', COLORES.oro);
$('volverRec').href = $('volverRec2').href = URL_RECORRIDO;

/* ---------- 3) SHADERS ---------- */
const GL_RUIDO = /* glsl */`
float hash(vec3 p){ p=fract(p*.3183099+.1); p*=17.; return fract(p.x*p.y*p.z*(p.x+p.y+p.z)); }
vec3 hash3(vec3 p){ p=vec3(dot(p,vec3(127.1,311.7,74.7)),dot(p,vec3(269.5,183.3,246.1)),dot(p,vec3(113.5,271.9,124.6))); return fract(sin(p)*43758.5453); }
float noise(vec3 x){ vec3 i=floor(x),f=fract(x); f=f*f*(3.-2.*f);
  return mix(mix(mix(hash(i),hash(i+vec3(1,0,0)),f.x),mix(hash(i+vec3(0,1,0)),hash(i+vec3(1,1,0)),f.x),f.y),
             mix(mix(hash(i+vec3(0,0,1)),hash(i+vec3(1,0,1)),f.x),mix(hash(i+vec3(0,1,1)),hash(i+vec3(1,1,1)),f.x),f.y),f.z); }
// fbm con número de octavas fraccionario: la última octava entra de forma gradual (transición de nivel de detalle)
float fbm(vec3 p,float o){ float a=.5,s=0.; for(int i=0;i<8;i++){ float w=clamp(o-float(i),0.,1.); if(w<=0.)break; s+=a*w*noise(p); p=p*2.03+vec3(1.7,9.2,3.1); a*=.5; } return s; }
// Cráteres: cuenco hundido + borde levantado, sobre celdas aleatorias
float crat(vec3 p){ vec3 b=floor(p-.5); float h=0.;
  for(int x=0;x<2;x++)for(int y=0;y<2;y++)for(int z=0;z<2;z++){ vec3 c=b+vec3(x,y,z); vec3 o=hash3(c);
    float r=.14+.34*o.x*o.y; float d=length(c+o-p)/r;
    if(d<1.6){ h+=((d<1.)?(d*d-1.)*.7:0.)+exp(-pow((d-1.)*5.,2.))*.35; } }
  return h; }
float ringDens(float x,float st){ if(x<0.||x>1.)return 0.;
  if(st<1.5){ float d=mix(.28,.95,smoothstep(.2,.24,x)); d=mix(d,.03,smoothstep(.575,.585,x)); d=mix(d,.72,smoothstep(.63,.64,x));
    d*=1.-.85*exp(-pow((x-.86)*150.,2.)); d*=smoothstep(1.,.96,x)*smoothstep(0.,.03,x); d*=.78+.22*sin(x*210.)*sin(x*37.); return d; }
  float d=pow(max(0.,sin(x*28.)),24.)+.35*pow(max(0.,sin(x*9.+1.)),8.); return clamp(d,0.,1.)*smoothstep(0.,.02,x)*smoothstep(1.,.98,x); }
`;
const GL_VERT = /* glsl */`
varying vec3 vObj,vWPos,vWN; varying vec2 vUv;
void main(){ vObj=position; vUv=uv; vec4 w=modelMatrix*vec4(position,1.); vWPos=w.xyz; vWN=normalize(mat3(modelMatrix)*normal); gl_Position=projectionMatrix*viewMatrix*w; }`;
// Descarta la cuña del corte interior (en longitudes alrededor de uCutLon)
const GL_CORTE = /* glsl */`
uniform float uCut,uCutLon;
void corte(vec3 p){ if(uCut>.001){ float dl=atan(-p.z,p.x)-uCutLon; dl=atan(sin(dl),cos(dl)); if(abs(dl)<uCut*.5)discard; } }`;

const GL_PLANETA = /* glsl */`
uniform int uMode; uniform vec3 uC1,uC2,uC3,uLightDir,uAtmoCol,uSpotCol,uAxis,uCenter;
uniform float uSeed,uTime,uDetail,uOct,uRadius,uBump,uDayNight,uGrid,uAtmoOn,uAtmo,uCaps,uCrater,uHex,uUseMap;
uniform vec2 uGas; uniform vec4 uSpot,uRing; uniform vec4 uMarks[4]; uniform float uMarkK[4]; uniform vec4 uImp[4];
uniform sampler2D uMap,uNight,uPack;
varying vec3 vObj,vWPos,vWN; varying vec2 vUv;
${GL_RUIDO}${GL_CORTE}
vec3 relieve(vec3 N,vec3 P,float h,float k){ vec3 dx=dFdx(P),dy=dFdy(P); float hx=dFdx(h),hy=dFdy(h);
  vec3 r1=cross(dy,N),r2=cross(N,dx); float det=dot(dx,r1); vec3 g=sign(det)*(hx*r1+hy*r2); return normalize(abs(det)*N-k*g); }
void main(){
  vec3 p=normalize(vObj); corte(p);
  vec3 col=uC1,nightL=vec3(0.),emis=vec3(0.); float h=0.,spec=0.;
  if(uMode==0){                                   // --- roca con cráteres ---
    vec3 q=p*2.2+uSeed; float n=fbm(q,uOct),n2=fbm(q*2.7+5.,uOct);
    float cr=0.; if(uCrater>0.){ cr=crat(p*3.5+uSeed)+.5*crat(p*8.+uSeed*2.)+uDetail*.3*crat(p*19.+uSeed); cr*=uCrater; }
    h=n*.5+cr*.35+uDetail*.06*fbm(q*22.,4.);
    col=mix(uC2,uC1,smoothstep(.35,.65,n)); col=mix(col,uC3,smoothstep(.55,.8,n2)*.6); col*=1.+clamp(cr,-.6,.4)*.5;
    if(uCaps>0.){ float ic=smoothstep(uCaps,uCaps+.04,abs(p.y)+(n2-.5)*.1); col=mix(col,vec3(.95),ic); }
  } else if(uMode==1){                            // --- Tierra ---
    if(uUseMap>.5){ col=texture2D(uMap,vUv).rgb; vec3 pk=texture2D(uPack,vUv).rgb; h=pk.r*.5+uDetail*.03*fbm(p*70.,3.);
      col*=1.+uDetail*.25*(fbm(p*90.,3.)-.45); spec=1.-pk.g; nightL=texture2D(uNight,vUv).rgb*1.4; }
    else { float e=fbm(p*1.6+uSeed,uOct)+.3*fbm(p*4.+2.,uOct)-.15; float land=smoothstep(.5,.52,e); float la=abs(p.y);
      vec3 oc=mix(vec3(.01,.05,.2),vec3(.03,.2,.4),smoothstep(.3,.5,e));
      vec3 ld=mix(vec3(.08,.3,.08),vec3(.5,.42,.25),smoothstep(.35,.6,fbm(p*3.+7.,4.)-la*.2+.1)); ld=mix(ld,vec3(.4,.36,.33),smoothstep(.62,.75,e));
      float ice=smoothstep(.82,.88,la+(e-.5)*.2); col=mix(mix(oc,ld,land),vec3(.92),ice); h=land*(e-.5)*1.5; spec=(1.-land)*(1.-ice);
      nightL=vec3(1.,.75,.4)*land*smoothstep(.62,.7,fbm(p*14.,4.))*(1.-ice); }
  } else if(uMode==2){                            // --- gigante gaseoso: bandas y turbulencia ---
    vec3 q=vec3(p.x*1.5,p.y*5.,p.z*1.5)+uSeed;
    float t1=fbm(q+vec3(0.,0.,uTime*.01),uOct); float t2=fbm(q*3.+t1*2.+vec3(uTime*.02,0.,0.),uOct);
    float lat=p.y+((t1-.5)*.12+(t2-.5)*.04)*uGas.y;
    float b=sin(lat*uGas.x*3.14159)*.5+.5; b=mix(b,smoothstep(.2,.8,b),.6);
    col=mix(uC2,uC1,b); col=mix(col,uC3,smoothstep(.55,.9,sin(lat*uGas.x*1.7+2.)*.5+.5)*.6); col*=.85+.3*t2; h=t2*.15;
    if(uSpot.w>0.){ vec3 sd=uSpot.xyz; vec3 nor=normalize(vec3(0.,1.,0.)-sd*sd.y); vec3 est=cross(nor,sd); vec3 d3=p-sd;
      float e=dot(d3,est),n=dot(d3,nor); float dd=length(vec2(e/1.7,n))/uSpot.w; float a=atan(n,e/1.7);
      float sw=fbm(vec3(cos(a+dd*4.-uTime*.05),sin(a+dd*4.-uTime*.05),dd)*3.,4.);
      col=mix(col,uC3,exp(-pow((dd-1.15)*5.,2.))*.5); col=mix(col,uSpotCol*(.7+.6*sw),smoothstep(1.,.7,dd)); }
    if(uHex>0.&&p.y>.9){ float co=acos(p.y),a=atan(p.z,p.x); float hr=.2*cos(.5236)/cos(mod(a,1.0472)-.5236);
      col=mix(col,col*.62,smoothstep(hr,hr-.015,co)); col+=uC3*.15*exp(-pow((co-hr)*90.,2.)); }
  } else if(uMode==3){                            // --- mundo helado con grietas ---
    float n=fbm(p*2.+uSeed,uOct); col=mix(uC1,uC2,smoothstep(.3,.7,n));
    float r1=1.-abs(2.*noise(p*5.+uSeed)-1.),r2=1.-abs(2.*noise(p*11.+uSeed*3.)-1.);
    float ln=clamp(smoothstep(.9,.985,r1)+.6*smoothstep(.92,.99,r2)+uDetail*.5*smoothstep(.93,.99,1.-abs(2.*noise(p*27.)-1.)),0.,1.);
    float cr=uCrater>0.?(crat(p*4.+uSeed)+.5*crat(p*9.))*uCrater:0.;
    col=mix(col,uC3,ln*.8); col*=1.+clamp(cr,-.6,.4)*.4; h=n*.2-ln*.25+cr*.3;
  } else {                                        // --- Ío: azufre y volcanes ---
    float n=fbm(p*3.+uSeed,uOct); col=mix(uC1,uC2,smoothstep(.4,.7,n)); col=mix(col,uC3,smoothstep(.6,.8,fbm(p*6.+3.,uOct)));
    float v=crat(p*3.+uSeed); col=mix(col,vec3(.12,.07,.04),smoothstep(-.15,-.5,v)); col=mix(col,vec3(.8,.25,.1),smoothstep(.1,.25,v)*.6); h=n*.2+v*.2;
  }
  // Rasgos con nombre que sí se dibujan (mares, montañas, zonas claras)
  float nm=noise(p*7.+uSeed);
  for(int i=0;i<4;i++){ float w=uMarks[i].w; if(w>0.){ float d=acos(clamp(dot(p,uMarks[i].xyz),-1.,1.))/w; float k=uMarkK[i];
    if(k<1.5){ float m=smoothstep(1.,.6,d+(nm-.5)*.6); col=mix(col,uC2*.55,m*.85); h-=m*.15; }
    else if(k<2.5){ float m=smoothstep(1.,0.,d); h+=m*m*1.4-smoothstep(.14,0.,d)*.35; col=mix(col,uC3,m*.45); }
    else { float m=smoothstep(1.,.5,d+(nm-.5)*.3); col=mix(col,uC3*1.1,m*.8); h-=m*.1; } } }
  // Impactos de meteorito lanzados por el estudiante
  for(int i=0;i<4;i++){ float w=uImp[i].w; if(w>=0.){ float d=acos(clamp(dot(p,uImp[i].xyz),-1.,1.)); float rc=.07;
    if(uMode==2){ col=mix(col,col*.22,smoothstep(rc*1.8,rc*.4,d)*.9); }
    else { float bw=smoothstep(rc,0.,d); h-=bw*.5; h+=exp(-pow((d-rc)*60.,2.))*.25; col=mix(col,col*.55,bw); col+=uC3*.25*exp(-d*13.)*(1.-bw); }
    emis+=vec3(1.,.6,.2)*(exp(-d*d*300.)*exp(-w*2.5)*6.+exp(-pow((d-w*.25)*30.,2.))*max(0.,1.-w*.5)*1.5); } }
  // Relieve por derivadas en pantalla (se atenúa de lejos para que no parpadee)
  vec3 N0=normalize(vWN); float fw=length(fwidth(p));
  vec3 N=relieve(N0,vWPos,h,uBump*uRadius*smoothstep(.06,.008,fw));
  vec3 V=normalize(cameraPosition-vWPos); vec3 L=normalize(uLightDir);
  float ndl0=dot(N0,L),lit,sombra=1.;
  if(uDayNight>.5){ lit=max(dot(N,L),0.)*smoothstep(-.05,.12,ndl0);
    if(uRing.z>0.){ float den=dot(L,uAxis); if(abs(den)>1e-4){ float t=dot(uCenter-vWPos,uAxis)/den;
      if(t>0.){ float r=length(vWPos+L*t-uCenter)/uRadius; sombra=1.-ringDens((r-uRing.x)/(uRing.y-uRing.x),uRing.z)*uRing.w*.8; } } }
    lit*=sombra;
  } else { lit=.3+.7*max(dot(N,V),0.); }
  vec3 c=col*(lit+.02);
  if(uDayNight>.5){ c+=vec3(1.,.95,.85)*pow(max(dot(reflect(-L,N),V),0.),40.)*spec*.6*sombra*step(0.,ndl0);
    c+=nightL*(1.-smoothstep(-.12,.12,ndl0));
    c+=uAtmoCol*uAtmo*uAtmoOn*.12*smoothstep(-.25,.05,ndl0)*(1.-smoothstep(.05,.5,ndl0)); }
  float fres=pow(1.-max(dot(N0,V),0.),3.);
  c+=uAtmoCol*fres*uAtmo*uAtmoOn*(uDayNight>.5?smoothstep(-.2,.3,ndl0):.7)*.55;
  if(uGrid>.5){ float la=asin(clamp(p.y,-1.,1.)),lo=atan(-p.z,p.x); float st=.261799;
    float gl=abs(fract(la/st-.5)-.5)/fwidth(la/st),go=abs(fract(lo/st-.5)-.5)/min(fwidth(lo/st),.5);
    float ln=max(1.-min(gl,1.),(1.-min(go,1.))*smoothstep(.08,.2,cos(la)));
    float eq=1.-min(abs(la)/fwidth(la)*.5,1.);
    c=mix(c,vec3(.35,.85,1.),ln*.55); c=mix(c,vec3(.95,.76,.3),eq*.9); }
  gl_FragColor=vec4(c+emis,1.);
}`;

const GL_NUBES = /* glsl */`
uniform vec3 uCol,uLightDir; uniform float uCover,uSwirl,uTime,uSeed,uOct,uDayNight,uUseMap; uniform sampler2D uPack;
varying vec3 vObj,vWPos,vWN; varying vec2 vUv;
${GL_RUIDO}${GL_CORTE}
void main(){ vec3 p=normalize(vObj); corte(p); float a; vec3 c=uCol;
  if(uUseMap>.5){ a=smoothstep(.12,.7,texture2D(uPack,vUv).b); }
  else { vec3 q=vec3(p.x,p.y*(1.+2.*uSwirl),p.z)*2.5+uSeed; float w=fbm(q+vec3(uTime*.008,0.,0.),uOct); float n=fbm(q*2.+w*1.5*(1.+uSwirl),uOct);
    if(uCover>.9){ a=.97; c*=.78+.35*n+.08*sin(p.y*9.+w*7.); } else { a=smoothstep(1.-uCover-.1,1.-uCover+.3,n+.1); c*=.85+.3*n; } }
  float ndl=dot(normalize(vWN),normalize(uLightDir)); float lit=uDayNight>.5?smoothstep(-.1,.45,ndl):.85;
  gl_FragColor=vec4(c*(.02+lit),a); }`;

const GL_ATMO = /* glsl */`
uniform vec3 uCol,uLightDir; uniform float uFall,uInt,uDayNight;
varying vec3 vWPos,vWN;
void main(){ vec3 V=normalize(cameraPosition-vWPos); vec3 N=normalize(vWN);
  float i=pow(clamp(-dot(N,V)/uFall,0.,1.),2.2);
  float l=uDayNight>.5?smoothstep(-.35,.35,dot(N,normalize(uLightDir))):.7;
  gl_FragColor=vec4(uCol*i*l*uInt,1.); }`;

const GL_ANILLO = /* glsl */`
uniform vec3 uCol,uLightDir,uCenter,uAxis; uniform vec4 uRing; uniform float uRadius,uDetail,uDayNight;
varying vec3 vObj,vWPos;
${GL_RUIDO}
void main(){ float r=length(vObj.xy); float x=(r-uRing.x)/(uRing.y-uRing.x); float d=ringDens(x,uRing.z);
  float g=hash(vec3(floor(r*260.),floor(atan(vObj.y,vObj.x)*500.),3.)); d*=mix(1.,.55+.9*g,uDetail);   // partículas al acercarse
  vec3 c=uCol*(.8+.25*sin(x*46.)+.1*sin(x*13.)); vec3 L=normalize(uLightDir); float lit=1.;
  if(uDayNight>.5){ vec3 oc=vWPos-uCenter; float b=dot(oc,L); float disc=b*b-(dot(oc,oc)-uRadius*uRadius);
    float sh=b<0.?smoothstep(0.,uRadius*uRadius*.03,disc):0.; lit=(1.-sh*.93)*(.6+.4*abs(dot(uAxis,L))); }   // sombra del planeta
  gl_FragColor=vec4(c*lit,d*uRing.w); }`;

const GL_SOL = /* glsl */`
uniform float uTime,uGain; varying vec3 vObj,vWPos,vWN;
${GL_RUIDO}${GL_CORTE}
void main(){ vec3 p=normalize(vObj); corte(p);
  float n=fbm(p*5.+vec3(0.,uTime*.06,0.),5.); float g=fbm(p*18.+n*2.+uTime*.1,4.);
  float s=smoothstep(.64,.7,fbm(p*4.5+9.+uTime*.004,4.));                         // manchas solares
  vec3 c=mix(vec3(1.,.33,.04),vec3(1.,.78,.3),n*1.3); c=mix(c,vec3(1.,.97,.8),g*g); c*=1.-.7*s;
  float mu=max(dot(normalize(vWN),normalize(cameraPosition-vWPos)),0.); c*=.55+.6*mu;
  gl_FragColor=vec4(c*uGain,1.); }`;

const GL_CORONA = /* glsl */`
uniform float uTime,uGain; varying vec2 vUv;
${GL_RUIDO}
void main(){ vec2 q=vUv*2.-1.; float d=length(q)*4.; if(d<.97)discard; float a=atan(q.y,q.x);
  float glow=exp(-(d-1.)*3.2)*.7+exp(-(d-1.)*1.2)*.12;
  float rays=fbm(vec3(cos(a)*3.,sin(a)*3.,uTime*.08)+d*.4,4.);
  float fl=pow(noise(vec3(cos(a)*5.,sin(a)*5.,uTime*.15)),5.)*exp(-(d-1.)*1.3)*3.;      // llamaradas
  gl_FragColor=vec4(vec3(1.,.6,.22)*(glow*(.55+.9*rays)+fl)*smoothstep(4.,2.4,d)*uGain,1.); }`;

const GL_TAPA = /* glsl */`
uniform float uLayR[6]; uniform vec3 uLayC[6]; uniform int uLayN; uniform float uHi; varying vec3 vObj;
${GL_RUIDO}
void main(){ float r=length(vObj.xy); vec3 c=uLayC[0]; float idx=0.,borde=1.;
  for(int i=0;i<6;i++){ if(i>=uLayN)break; if(r<=uLayR[i]){ c=uLayC[i]; idx=float(i); }
    borde=min(borde,smoothstep(0.,.012,abs(r-uLayR[i]))); }
  c*=.82+.3*noise(vec3(vObj.xy*14.,idx*7.)); if(idx>float(uLayN)-1.5)c*=1.35;       // el núcleo brilla un poco
  if(uHi>-.5)c*=abs(idx-uHi)<.5?1.35:.3;
  gl_FragColor=vec4(c*(.35+.65*borde),1.); }`;

/* ---------- 4) ESCENA Y RENDER ---------- */
const lienzo = $('lienzo');
let renderer;
try {
  if (!document.createElement('canvas').getContext('webgl2')) throw new Error('sin webgl2');
  renderer = new THREE.WebGLRenderer({ canvas: lienzo, antialias: false, powerPreference: 'high-performance' });
} catch (e) {
  $('sinWebgl').hidden = false; $('inicio').hidden = true;
  document.querySelectorAll('.ui').forEach(el => el.hidden = true);
  throw e;                                           // detiene el módulo: no hay nada más que hacer
}
let prMax = Math.min(devicePixelRatio || 1, movil ? 1.5 : PIXEL_RATIO_MAX), pr = prMax;
renderer.setPixelRatio(pr);
renderer.setClearColor(COLORES.fondo);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.1;

const escena = new THREE.Scene();
const camara = new THREE.PerspectiveCamera(45, 1, 1, 30000);
const sistema = new THREE.Group(), grupoCmp = new THREE.Group();
grupoCmp.visible = false;
escena.add(sistema, grupoCmp);

// Postprocesado: bloom (Sol), desenfoque radial ligero al volar + viñeta, y salida con tono de cine
const rtBase = new THREE.WebGLRenderTarget(4, 4, { type: THREE.HalfFloatType, samples: movil ? 0 : 4 });
const composer = new EffectComposer(renderer, rtBase);
composer.addPass(new RenderPass(escena, camara));
const bloom = new UnrealBloomPass(new THREE.Vector2(4, 4), .5, .35, 1.0);
composer.addPass(bloom);
const pasoFinal = new ShaderPass({
  uniforms: { tDiffuse: { value: null }, uVig: { value: .55 }, uBlur: { value: 0 } },
  vertexShader: 'varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }',
  fragmentShader: /* glsl */`uniform sampler2D tDiffuse; uniform float uVig,uBlur; varying vec2 vUv;
    void main(){ vec2 c=vUv-.5; vec3 col=texture2D(tDiffuse,vUv).rgb;
      if(uBlur>.001){ for(int i=1;i<8;i++) col+=texture2D(tDiffuse,.5+c*(1.-uBlur*float(i)/8.)).rgb; col/=8.; }
      col*=1.-uVig*smoothstep(.35,.9,length(c)); gl_FragColor=vec4(col,1.); }` });
composer.addPass(pasoFinal);
composer.addPass(new OutputPass());

let W = 1, H = 1;
function ajustar() {
  W = innerWidth; H = innerHeight;
  renderer.setPixelRatio(pr); renderer.setSize(W, H, false);
  composer.setPixelRatio(pr); composer.setSize(W, H);
  camara.aspect = W / H; camara.updateProjectionMatrix();
}
addEventListener('resize', ajustar);

// Uniformes globales compartidos por todos los materiales (una sola actualización por cuadro)
const G = { uTime: { value: 0 }, uDayNight: { value: 1 }, uGrid: { value: 0 }, uAtmoOn: { value: 1 } };
const TX = { uMap: { value: null }, uNight: { value: null }, uPack: { value: null }, uUseMap: { value: 0 } };   // texturas de la Tierra
const NADA = { uMap: { value: null }, uNight: { value: null }, uPack: { value: null }, uUseMap: { value: 0 } };

if (TEXTURAS_TIERRA) {
  const cargador = new THREE.TextureLoader(); let listas = 0, fallo = false;
  const cargar = (url, destino, srgb) => cargador.load(url, t => {
    if (srgb) t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 8; t.wrapS = THREE.RepeatWrapping; destino.value = t;
    if (++listas === 3 && !fallo) TX.uUseMap.value = 1;
  }, undefined, () => { fallo = true; porId.tierra.marcas = []; if (foco === porId.tierra) crearRasgos(); });
  cargar(TEXTURAS_TIERRA.dia, TX.uMap, true); cargar(TEXTURAS_TIERRA.noche, TX.uNight, true); cargar(TEXTURAS_TIERRA.relieveNubes, TX.uPack, false);
}

// Fondo: estrellas a varias profundidades (paralaje al moverse) y una Vía Láctea tenue
{
  const n = movil ? 3500 : 8000, pos = new Float32Array(n * 3), col = new Float32Array(n * 3), tam = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const u = Math.random() * 2 - 1, a = Math.random() * 6.2832, r = 2500 + Math.random() * 7000, s = Math.sqrt(1 - u * u);
    pos.set([r * s * Math.cos(a), r * u, r * s * Math.sin(a)], i * 3);
    const k = Math.random(), b = .5 + Math.pow(Math.random(), 4) * 1.6;
    col.set([b * (.8 + .2 * k), b * .9, b * (1 - .25 * k)], i * 3); tam[i] = 1 + Math.pow(Math.random(), 6) * 3;
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.BufferAttribute(col, 3)); g.setAttribute('tam', new THREE.BufferAttribute(tam, 1));
  escena.add(new THREE.Points(g, new THREE.ShaderMaterial({ depthWrite: false, transparent: true, blending: THREE.AdditiveBlending, uniforms: { uPR: { value: pr } },
    vertexShader: 'attribute float tam; attribute vec3 color; varying vec3 vC; uniform float uPR; void main(){ vC=color; gl_PointSize=tam*uPR*1.3; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }',
    fragmentShader: 'varying vec3 vC; void main(){ float d=length(gl_PointCoord-.5); gl_FragColor=vec4(vC*smoothstep(.5,.05,d),1.); }' })));
  escena.add(new THREE.Mesh(new THREE.SphereGeometry(12000, 48, 32), new THREE.ShaderMaterial({ side: THREE.BackSide, depthWrite: false,
    vertexShader: 'varying vec3 vD; void main(){ vD=normalize(position); gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }',
    fragmentShader: `varying vec3 vD; ${GL_RUIDO}
      void main(){ vec3 d=normalize(vD); float b=dot(d,normalize(vec3(.35,1.,.25))); float banda=exp(-b*b*22.);
        float n=fbm(d*4.,5.)*fbm(d*9.+3.,5.); float polvo=smoothstep(.2,.5,fbm(d*14.+7.,4.));
        vec3 c=mix(vec3(.25,.3,.55),vec3(.6,.5,.45),fbm(d*2.,3.))*banda*n*(.45+.55*polvo)*.4; gl_FragColor=vec4(c,1.); }` })));
}

/* ---------- 5) CUERPOS ---------- */
const GEO_ALTA = new THREE.SphereGeometry(1, 128, 96), GEO_BAJA = new THREE.SphereGeometry(1, 40, 28);
const GEO_TAPA = new THREE.CircleGeometry(.999, 64, -Math.PI / 2, Math.PI);

// Crea todo lo visible de un cuerpo. Jerarquía: g (posición y tamaño) > userG (giro con la mano) > tiltG (inclinación) > spinG (rotación)
function crearVisual(b, principal) {
  const g = new THREE.Group(), userG = new THREE.Group(), tiltG = new THREE.Group(), spinG = new THREE.Group();
  g.add(userG); userG.add(tiltG); tiltG.add(spinG);
  tiltG.rotation.z = rad(b.tilt || 0);
  if (b.forma) spinG.scale.set(...b.forma);
  const semilla = CUERPOS.indexOf(b) * 7.31 + 1.7;
  // uniformes propios del cuerpo, compartidos entre sus materiales
  const P = { uLightDir: { value: new V3(1, 0, 0) }, uCenter: { value: new V3() }, uAxis: { value: new V3(0, 1, 0) }, uRadius: { value: 1 },
              uDetail: { value: 0 }, uOct: { value: 4 }, uCut: { value: 0 }, uCutLon: { value: 0 }, uGain: { value: 1.9 } };
  const v = { b, g, userG, tiltG, spinG, P, R: b.R, cut: 0, cutObj: 0, metaQ: null, impT: [-1, -1, -1, -1], impI: 0 };
  const esTierra = b.id === 'tierra', tx = esTierra ? TX : NADA;
  let mat;
  if (b.id === 'sol') {
    mat = new THREE.ShaderMaterial({ vertexShader: GL_VERT, fragmentShader: GL_SOL, uniforms: { uTime: G.uTime, uGain: P.uGain, uCut: P.uCut, uCutLon: P.uCutLon } });
    v.corona = new THREE.Mesh(new THREE.PlaneGeometry(8, 8), new THREE.ShaderMaterial({ transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
      vertexShader: 'varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }',
      fragmentShader: GL_CORONA, uniforms: { uTime: G.uTime, uGain: P.uGain } }));
    g.add(v.corona);
  } else {
    const marcas = [0, 1, 2, 3].map(() => new THREE.Vector4(0, 1, 0, 0)), tipos = [0, 0, 0, 0];
    (b.marcas || []).filter(m => m.tam).slice(0, 4).forEach((m, i) => { const d = dirLL(m.lat, m.lon); marcas[i].set(d.x, d.y, d.z, m.tam); tipos[i] = m.tipo; });
    v.imp = [0, 1, 2, 3].map(() => new THREE.Vector4(0, 1, 0, -1));
    const sp = b.spot ? dirLL(b.spot.lat, b.spot.lon) : new V3(0, 1, 0);
    const an = b.anillo;
    mat = new THREE.ShaderMaterial({ vertexShader: GL_VERT, fragmentShader: GL_PLANETA, uniforms: {
      uMode: { value: b.modo }, uC1: { value: new THREE.Color(b.c[0]) }, uC2: { value: new THREE.Color(b.c[1]) }, uC3: { value: new THREE.Color(b.c[2]) },
      uSeed: { value: semilla }, uBump: { value: b.modo === 2 ? .006 : esTierra ? .012 : .055 }, uCaps: { value: b.caps || 0 }, uCrater: { value: b.crater || 0 },
      uHex: { value: b.hex || 0 }, uGas: { value: new THREE.Vector2(...(b.gas || [1, 1])) },
      uSpot: { value: new THREE.Vector4(sp.x, sp.y, sp.z, b.spot ? b.spot.tam : 0) }, uSpotCol: { value: new THREE.Color(b.spot ? b.spot.col : '#000') },
      uAtmoCol: { value: new THREE.Color(b.atmo ? b.atmo.col : '#000') }, uAtmo: { value: b.atmo ? b.atmo.f : 0 },
      uRing: { value: new THREE.Vector4(an ? an.r1 : 1, an ? an.r2 : 2, an ? an.estilo : 0, an ? an.op : 0) },
      uMarks: { value: marcas }, uMarkK: { value: tipos }, uImp: { value: v.imp },
      uTime: G.uTime, uDayNight: G.uDayNight, uGrid: G.uGrid, uAtmoOn: G.uAtmoOn, ...tx, ...P } });
  }
  v.surf = new THREE.Mesh(GEO_BAJA, mat); spinG.add(v.surf);

  if (b.nubes) {                                     // capa de nubes (Tierra, Venus, Titán)
    v.nubes = new THREE.Mesh(GEO_BAJA, new THREE.ShaderMaterial({ vertexShader: GL_VERT, fragmentShader: GL_NUBES, transparent: true, depthWrite: false,
      uniforms: { uCol: { value: new THREE.Color(b.nubes.col) }, uCover: { value: b.nubes.cover }, uSwirl: { value: b.nubes.swirl }, uSeed: { value: semilla + 3 },
        uTime: G.uTime, uDayNight: G.uDayNight, uPack: tx.uPack, uUseMap: tx.uUseMap, ...P } }));
    v.nubes.scale.setScalar(1.012); v.nubes.renderOrder = 1; spinG.add(v.nubes);
  }
  if (b.atmo) {                                      // halo atmosférico en el borde
    const esc = b.modo === 2 ? 1.05 : 1.1;
    v.atmo = new THREE.Mesh(GEO_BAJA, new THREE.ShaderMaterial({ vertexShader: GL_VERT, fragmentShader: GL_ATMO, side: THREE.BackSide, transparent: true,
      depthWrite: false, blending: THREE.AdditiveBlending,
      uniforms: { uCol: { value: new THREE.Color(b.atmo.col) }, uFall: { value: Math.sqrt(1 - 1 / (esc * esc)) }, uInt: { value: b.atmo.f * .9 }, uDayNight: G.uDayNight, uLightDir: P.uLightDir } }));
    v.atmo.scale.setScalar(esc); tiltG.add(v.atmo);
  }
  if (b.anillo) {                                    // anillos translúcidos con huecos y sombra del planeta
    const an = b.anillo;
    v.anillo = new THREE.Mesh(new THREE.RingGeometry(an.r1, an.r2, 160, 1), new THREE.ShaderMaterial({ vertexShader: GL_VERT, fragmentShader: GL_ANILLO,
      side: THREE.DoubleSide, transparent: true, depthWrite: false,
      uniforms: { uCol: { value: new THREE.Color(an.col) }, uRing: { value: new THREE.Vector4(an.r1, an.r2, an.estilo, an.op) }, uDayNight: G.uDayNight, ...P } }));
    v.anillo.rotation.x = -Math.PI / 2; v.anillo.renderOrder = 2; tiltG.add(v.anillo);
  }
  if (principal) {
    // Eje de rotación (capa "Eje")
    v.eje = new THREE.Mesh(new THREE.CylinderGeometry(.008, .008, 3, 6), new THREE.MeshBasicMaterial({ color: COLORES.oro }));
    v.eje.visible = false; tiltG.add(v.eje);
    // Tapas del corte interior: dos semicírculos que muestran las capas
    const n = b.capas.length, radios = new Array(6).fill(0), cols = [0, 1, 2, 3, 4, 5].map(() => new THREE.Color(0));
    b.capas.forEach((c, i) => { radios[i] = c[1]; cols[i].set(c[2]); });
    v.uHi = { value: -1 };
    const mt = new THREE.ShaderMaterial({ side: THREE.DoubleSide, vertexShader: 'varying vec3 vObj; void main(){ vObj=position; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }',
      fragmentShader: GL_TAPA, uniforms: { uLayR: { value: radios }, uLayC: { value: cols }, uLayN: { value: n }, uHi: v.uHi } });
    v.tapaA = new THREE.Mesh(GEO_TAPA, mt); v.tapaB = new THREE.Mesh(GEO_TAPA, mt);
    v.tapaA.visible = v.tapaB.visible = false; spinG.add(v.tapaA, v.tapaB);
  }
  return v;
}

CUERPOS.forEach((b, i) => {
  b.pos = new V3(); b.ang0 = (i * 2.399) % 6.2832;                 // posición inicial repartida
  b.w = b.a ? (b.padre ? .5 : .25) / Math.sqrt(Math.abs(b.per)) * Math.sign(b.per) : 0;   // velocidad orbital comprimida
  b.vis = crearVisual(b, true); sistema.add(b.vis.g); b.vis.g.scale.setScalar(b.R);
});
// Órbitas
const matOrbita = new THREE.LineBasicMaterial({ color: COLORES.cian, transparent: true, opacity: .22 });
const circulo = (() => { const p = []; for (let i = 0; i < 256; i++) { const a = i / 256 * 6.2832; p.push(Math.cos(a), 0, Math.sin(a)); } const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(p, 3)); return g; })();
CUERPOS.forEach(b => { if (!b.a) return; b.orbita = new THREE.LineLoop(circulo, matOrbita); b.orbita.scale.setScalar(b.a);
  if (b.padre) b.orbita.rotation.z = rad(porId[b.padre].tilt || 0); sistema.add(b.orbita); });
// Cinturón de asteroides
sistema.add(new THREE.PointLight(0xfff2dd, 3, 0, 0), new THREE.AmbientLight(0x223355, .4));
const cinturon = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1, 0), new THREE.MeshStandardMaterial({ color: '#8d8276', roughness: 1, flatShading: true }), movil ? 700 : CINTURON.cantidad);
{ const m = new THREE.Matrix4(), q = new THREE.Quaternion(), s = new V3(), p = new V3();
  for (let i = 0; i < cinturon.count; i++) { const a = Math.random() * 6.2832, r = CINTURON.r1 + (CINTURON.r2 - CINTURON.r1) * (Math.random() + Math.random()) / 2;
    p.set(Math.cos(a) * r, (Math.random() - .5) * 2.4, Math.sin(a) * r); q.setFromEuler(new THREE.Euler(Math.random() * 6, Math.random() * 6, 0));
    const t = .05 + Math.pow(Math.random(), 3) * .28; s.set(t, t * (.6 + Math.random() * .4), t * (.6 + Math.random() * .4)); cinturon.setMatrixAt(i, m.compose(p, q, s)); } }
sistema.add(cinturon);

/* ---------- 6) CÁMARA Y MODOS ---------- */
let modo = 'general';            // 'general' | 'inspeccion' | 'comparar'
let foco = null;                 // cuerpo seleccionado
const orb = { az: .7, pol: 1.02, dist: 290, distObj: 290, vaz: 0, vpol: 0, min: 45, max: 650, centro: new V3() };   // cámara orbital (vista general y comparación)
const ins = { dist: 10, distObj: 10, vista: 0 };
const giro = { vx: 0, vy: 0, vz: 0 };                                // inercia del cuerpo girado con la mano
const vuelo = { activo: false, t: 0, dur: 2.4, p0: new V3(), l0: new V3() };
const mira = new V3(), destino = new V3(), destMira = new V3(), _a = new V3(), _b = new V3(), _q = new THREE.Quaternion(), _q2 = new THREE.Quaternion();
const capas = { atmosfera: true, nubes: true, rasgos: false, eje: false, malla: false, dianoche: true };
let orbitasOn = !reducir, velocidad = .3, giroReal = true, tOrb = 0, verNombres = true, modoFoto = false;
const cmp = { vis: {}, lista: [], guardado: null };

function iniciarVuelo(dur) { vuelo.p0.copy(camara.position); vuelo.l0.copy(mira); vuelo.t = 0; vuelo.dur = reducir ? .001 : dur; vuelo.activo = true; }
const distInicial = b => b.R * (b.anillo && b.anillo.op > .3 ? 6.2 : 3.6) * (W < H ? 1.5 : 1);

function seleccionar(b) {
  if (modo === 'comparar') salirComparar(true);
  if (foco && foco !== b) cerrarCorte(foco.vis, true);
  foco = b; modo = 'inspeccion';
  ins.distObj = ins.dist = distInicial(b); ins.vista = 0; $('rodear').value = 0;
  giro.vx = giro.vy = giro.vz = 0; pr = prMax; ajustar();
  iniciarVuelo(2.4); actualizarUI(); crearRasgos();
  avisar('Volando a ' + b.nombre + '…');
}
function vistaGeneral() {
  if (modo === 'comparar') salirComparar(true);
  if (foco) cerrarCorte(foco.vis, true);
  foco = null; modo = 'general'; orb.centro.set(0, 0, 0); orb.min = 45; orb.max = 650; orb.distObj = orb.dist = 290 * (W < H ? 1.5 : 1); orb.pol = 1.02;
  iniciarVuelo(2.2); actualizarUI(); crearRasgos();
}

// Corte interior
function abrirCorte(v) {
  v.spinG.updateWorldMatrix(true, false);
  const l = v.spinG.worldToLocal(camara.position.clone());           // la cuña se abre mirando a la cámara
  v.P.uCutLon.value = Math.atan2(-l.z, l.x); v.cutObj = rad(+$('apertura').value);
  v.tapaA.visible = v.tapaB.visible = true;
}
function cerrarCorte(v, yaMismo) { v.cutObj = 0; if (yaMismo) { v.cut = 0; v.P.uCut.value = 0; v.tapaA.visible = v.tapaB.visible = false; } v.uHi.value = -1; }

// Comparar tamaños: el cuerpo elegido junto a la Tierra y al Sol, a escala real entre ellos
function comparar() {
  if (!foco) return;
  const b = foco, ids = [...new Set(['sol', 'tierra', b.id])];
  $('fundido').classList.add('on');
  setTimeout(() => {
    grupoCmp.clear(); cmp.lista = [];
    const rT = 1, rS = porId.sol.km / porId.tierra.km, rB = b.km / porId.tierra.km;
    const poner = (id, r, x) => { const c = porId[id], v = cmp.vis[id] || (cmp.vis[id] = crearVisual(c, false)); v.g.scale.setScalar(r); v.g.position.set(x, 0, 0); v.R = r; if (v.corona) v.corona.visible = false; grupoCmp.add(v.g); cmp.lista.push(v); };
    poner('sol', rS, -(rT + 1.2 + rS)); poner('tierra', rT, 0);
    let der = rT;
    if (ids.length === 3) { const x = rT + rB + Math.max(.5, .35 * rB); poner(b.id, rB, x); der = x + rB; }
    cmp.guardado = { ...orb, centro: orb.centro.clone() };
    const ancho = der + rT;
    orb.centro.set((der - rT) / 2, 0, 0); orb.distObj = orb.dist = (ancho * 1.7 + 2) * (W < H ? 1.9 : 1); orb.az = .28; orb.pol = 1.42; orb.vaz = orb.vpol = 0;
    orb.min = Math.max(.01, Math.min(rT, rB) * 2.6); orb.max = 800;
    sistema.visible = false; grupoCmp.visible = true; modo = 'comparar'; vuelo.activo = false;
    const veces = x => x >= 10 ? Math.round(x) : x >= 1 ? x.toFixed(1).replace('.', ',') : null;
    let txt = 'El Sol mide ' + Math.round(rS) + ' veces el diámetro de la Tierra.';
    if (ids.length === 3) txt = b.nombre + (veces(rB) ? ' mide ' + veces(rB) + ' veces el diámetro de la Tierra.' : ' cabría ' + Math.round(1 / rB).toLocaleString('es') + ' veces en el diámetro de la Tierra.') + ' Aleja la vista para ver el Sol completo.';
    $('cmpTexto').textContent = txt;
    actualizarUI(); crearRasgos(); $('fundido').classList.remove('on');
  }, 320);
}
function salirComparar(yaMismo) {
  const fin = () => { grupoCmp.visible = false; sistema.visible = true; Object.assign(orb, cmp.guardado); modo = foco ? 'inspeccion' : 'general'; actualizarUI(); crearRasgos(); $('fundido').classList.remove('on'); };
  if (yaMismo) return fin();
  $('fundido').classList.add('on'); setTimeout(fin, 320);
}
function atras() { if (modoFoto) return foto(false); if (!$('inicio').hidden) return cerrarInicio(); if (modo === 'comparar') return salirComparar(); if (modo === 'inspeccion') vistaGeneral(); }

/* ---------- 7) ENTRADA: ratón, táctil y teclado ---------- */
const punteros = new Map(); let arrastre = 0, tAbajo = 0, pinch = 0, angPinch = 0, arrastrando = false, ultClic = { t: 0, x: 0, y: 0 };
const ejeCam = (x, y, z) => _a.set(x, y, z).applyQuaternion(camara.quaternion);

function girarCuerpo(dx, dy, dz) {                                    // gira el cuerpo en los 3 ejes respecto a la cámara
  const u = foco.vis.userG;
  if (dx) u.quaternion.premultiply(_q.setFromAxisAngle(ejeCam(0, 1, 0), dx));
  if (dy) u.quaternion.premultiply(_q.setFromAxisAngle(ejeCam(1, 0, 0), dy));
  if (dz) u.quaternion.premultiply(_q.setFromAxisAngle(ejeCam(0, 0, 1), dz));
}
function zoom(f) {
  if (modo === 'inspeccion') ins.distObj = clamp(ins.distObj * f, foco.R * 1.22, foco.R * 16);
  else orb.distObj = clamp(orb.distObj * f, orb.min, orb.max);
}
lienzo.addEventListener('pointerdown', e => {
  lienzo.setPointerCapture(e.pointerId); punteros.set(e.pointerId, { x: e.clientX, y: e.clientY });
  if (punteros.size === 1) { arrastre = 0; tAbajo = performance.now(); arrastrando = true; giro.vx = giro.vy = giro.vz = 0; if (foco) foco.vis.metaQ = null; }
  if (punteros.size === 2) { const [a, b] = [...punteros.values()]; pinch = Math.hypot(a.x - b.x, a.y - b.y); angPinch = Math.atan2(b.y - a.y, b.x - a.x); }
});
lienzo.addEventListener('pointermove', e => {
  const p = punteros.get(e.pointerId); if (!p) return;
  const dx = e.clientX - p.x, dy = e.clientY - p.y; p.x = e.clientX; p.y = e.clientY;
  if (punteros.size === 1) {
    arrastre += Math.abs(dx) + Math.abs(dy);
    if (modo === 'inspeccion') { const k = .006 * clamp((ins.dist - foco.R) / (foco.R * 2.5), .12, 1); girarCuerpo(dx * k, dy * k, 0); giro.vx = dx * k * 60; giro.vy = dy * k * 60; }
    else { orb.az -= dx * .005; orb.pol = clamp(orb.pol - dy * .004, .15, 2.9); orb.vaz = -dx * .3; orb.vpol = -dy * .24; }
  } else if (punteros.size === 2) {
    const [a, b] = [...punteros.values()], d = Math.hypot(a.x - b.x, a.y - b.y), an = Math.atan2(b.y - a.y, b.x - a.x);
    if (pinch) zoom(pinch / d); pinch = d; arrastre += 10;
    if (modo === 'inspeccion') { let da = an - angPinch; da = Math.atan2(Math.sin(da), Math.cos(da)); girarCuerpo(0, 0, -da); } angPinch = an;
  }
});
const soltar = e => {
  if (!punteros.has(e.pointerId)) return; punteros.delete(e.pointerId);
  if (punteros.size === 0) { arrastrando = false; if (arrastre < 7 && performance.now() - tAbajo < 450) clic(e.clientX, e.clientY); }
  pinch = 0;
};
lienzo.addEventListener('pointerup', soltar); lienzo.addEventListener('pointercancel', soltar);
lienzo.addEventListener('wheel', e => { e.preventDefault(); zoom(Math.exp(clamp(e.deltaY, -120, 120) * .0014)); }, { passive: false });
lienzo.addEventListener('contextmenu', e => e.preventDefault());

// Selección por rayo contra esferas (con un tamaño mínimo para que los cuerpos pequeños se puedan tocar)
const rayo = new THREE.Raycaster();
function rayoEsfera(c, r) { const oc = _b.copy(rayo.ray.origin).sub(c), b = oc.dot(rayo.ray.direction), d = b * b - (oc.lengthSq() - r * r); if (d < 0) return -1; const t = -b - Math.sqrt(d); return t > 0 ? t : -1; }
function clic(x, y) {
  if (modo === 'comparar' || vuelo.activo) return;
  rayo.setFromCamera(new THREE.Vector2(x / W * 2 - 1, -(y / H) * 2 + 1), camara);
  let mejor = null, tMin = 1e9;
  for (const b of CUERPOS) { const d = camara.position.distanceTo(b.pos); const t = rayoEsfera(b.pos, Math.max(b.R, d * (movil ? .028 : .016))); if (t > 0 && t < tMin) { tMin = t; mejor = b; } }
  const ahora = performance.now(), doble = ahora - ultClic.t < 380 && Math.hypot(x - ultClic.x, y - ultClic.y) < 30; ultClic = { t: ahora, x, y };
  if (!mejor) return;
  if (mejor !== foco) return seleccionar(mejor);
  if (doble) { const t = rayoEsfera(foco.pos, foco.R); if (t > 0) impacto(foco, rayo.ray.at(t, new V3())); }
}
function impacto(b, punto) {
  const v = b.vis;
  if (!v.imp) return avisar('El Sol vaporiza cualquier meteorito antes de que lo toque.');
  v.surf.updateWorldMatrix(true, false);
  const d = v.surf.worldToLocal(punto).normalize(), i = v.impI++ % 4; v.imp[i].set(d.x, d.y, d.z, 0); v.impT[i] = 0;
  avisar(b.modo === 2 ? 'En un gigante de gas no queda cráter: solo una cicatriz oscura en las nubes.'
    : b.nubes && b.nubes.cover > .9 && capas.nubes ? '¡Impacto! Apaga la capa de nubes para ver el cráter.' : '¡Impacto! Así nacen los cráteres.');
}

addEventListener('keydown', e => {
  const enCampo = e.target.tagName === 'INPUT', k = e.key;
  if (k === 'Escape') { atras(); return; }
  if (!$('inicio').hidden || e.ctrlKey || e.metaKey || e.altKey) return;
  const flecha = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] }[k];
  if (flecha && !enCampo) { e.preventDefault(); if (modo === 'inspeccion') { foco.vis.metaQ = null; giro.vx += flecha[0] * 1.2; giro.vy += flecha[1] * 1.2; } else { orb.vaz += flecha[0] * 1.5; orb.vpol += flecha[1] * 1.2; } }
  else if (k === '+' || k === '=') zoom(.85);
  else if (k === '-' || k === '_') zoom(1.18);
  else if ((k === 'q' || k === 'e') && modo === 'inspeccion') giro.vz += k === 'q' ? 1 : -1;
  else if (k === ',' || k === '.') { const i = foco ? CUERPOS.indexOf(foco) : (k === '.' ? -1 : 0); seleccionar(CUERPOS[(i + (k === '.' ? 1 : -1) + CUERPOS.length) % CUERPOS.length]); }
  else if (k === ' ' && e.target.tagName !== 'BUTTON' && !enCampo) { e.preventDefault(); $('bOrbitas').click(); }
});

/* ---------- 8) INTERFAZ ---------- */
let tAviso = 0;
function avisar(txt) { const a = $('aviso'); a.textContent = txt; a.classList.add('ver'); clearTimeout(tAviso); tAviso = setTimeout(() => a.classList.remove('ver'), 3200); }

// Selector inferior
CUERPOS.forEach(b => {
  const bt = document.createElement('button'); bt.type = 'button'; bt.dataset.id = b.id; if (b.padre) bt.className = 'luna';
  bt.setAttribute('aria-pressed', 'false'); bt.setAttribute('aria-label', 'Ir a ' + b.nombre + (b.padre ? ', luna de ' + porId[b.padre].nombre : ''));
  bt.innerHTML = `<i style="background:radial-gradient(circle at 35% 35%,${b.c[2]},${b.c[0]} 55%,${b.c[1]})"></i>${b.nombre}`;
  bt.onclick = () => seleccionar(b); $('selector').append(bt);
  // etiqueta con el nombre sobre la escena
  b.etq = document.createElement('button'); b.etq.className = 'etq'; b.etq.textContent = b.nombre; b.etq.tabIndex = -1; b.etq.onclick = () => seleccionar(b); $('etiquetas').append(b.etq);
});
const etqCmp = [0, 1, 2].map(() => { const d = document.createElement('div'); d.className = 'etq cmp'; $('etiquetas').append(d); return d; });
let etqRasgos = [];
function crearRasgos() {                                              // etiquetas de rasgos del cuerpo en foco
  etqRasgos.forEach(r => r.el.remove()); etqRasgos = [];
  if (!foco || modo !== 'inspeccion') return;
  (foco.marcas || []).forEach(m => { const el = document.createElement('button'); el.className = 'etq rasgo'; el.textContent = m.n; el.tabIndex = -1;
    const r = { el, m, dir: m.anillo ? null : dirLL(m.lat, m.lon) }; el.onclick = () => enfocarRasgo(r); $('etiquetas').append(el); etqRasgos.push(r); });
}
function enfocarRasgo(r) {                                            // gira el cuerpo hasta poner el rasgo frente a la cámara
  if (!r.dir) return; const v = foco.vis; v.spinG.updateWorldMatrix(true, false);
  const dw = v.spinG.localToWorld(r.dir.clone()).sub(foco.pos).normalize(), dc = camara.position.clone().sub(foco.pos).normalize();
  v.metaQ = new THREE.Quaternion().setFromUnitVectors(dw, dc).multiply(v.userG.quaternion); giro.vx = giro.vy = giro.vz = 0;
}

function actualizarUI() {
  const enIns = modo === 'inspeccion';
  $('panel').hidden = !enIns; $('cmpBarra').hidden = modo !== 'comparar';
  document.querySelectorAll('#selector button').forEach(bt => bt.setAttribute('aria-pressed', String(!!foco && bt.dataset.id === foco.id)));
  lienzo.setAttribute('aria-label', foco ? 'Vista 3D de ' + foco.nombre + '. ' + foco.unico : 'Vista general del sistema solar. Usa la barra inferior para elegir un cuerpo.');
  if (!enIns) return;
  $('pNombre').textContent = foco.nombre; $('pUnico').textContent = foco.unico; $('pLugar').textContent = foco.lugar;
  const abierto = foco.vis.cutObj > 0; $('bDentro').setAttribute('aria-pressed', String(abierto)); $('bDentro').textContent = abierto ? 'Cerrar el corte' : 'Ver por dentro';
  $('interior').hidden = !abierto;
  $('capasLista').innerHTML = '';
  foco.capas.forEach((c, i) => { const li = document.createElement('li'), bt = document.createElement('button'); bt.type = 'button';
    bt.innerHTML = `<i style="background:${c[2]}"></i><div><b>${c[0]}.</b> <span>${c[3]}</span></div>`;
    const res = on => { foco.vis.uHi.value = on ? i : -1; };
    bt.onmouseenter = bt.onfocus = () => res(true); bt.onmouseleave = bt.onblur = () => res(false); bt.onclick = () => res(true);
    li.append(bt); $('capasLista').append(li); });
}
$('general').onclick = vistaGeneral;
$('bDentro').onclick = () => { const v = foco.vis; if (v.cutObj > 0) cerrarCorte(v); else abrirCorte(v); actualizarUI(); };
$('apertura').oninput = e => { if (foco && foco.vis.cutObj > 0) foco.vis.cutObj = rad(+e.target.value); };
$('bComparar').onclick = comparar; $('bSalirCmp').onclick = () => salirComparar();
$('bInclinacion').onclick = () => { foco.vis.metaQ = new THREE.Quaternion(); giro.vx = giro.vy = giro.vz = 0; avisar('Inclinación real del eje: ' + String(foco.tilt).replace('.', ',') + '°'); };
$('bGiro').onclick = e => { giroReal = !giroReal; e.currentTarget.setAttribute('aria-pressed', String(giroReal)); avisar(giroReal ? 'Giro real: 1 segundo = ' + HORAS_POR_SEGUNDO + ' hora' : 'Giro detenido: ahora solo lo mueves tú'); };
$('rodear').oninput = e => { ins.vista = rad(+e.target.value); };
$('bOrbitas').onclick = e => { orbitasOn = !orbitasOn; e.currentTarget.setAttribute('aria-pressed', String(orbitasOn)); e.currentTarget.textContent = 'Órbitas: ' + (orbitasOn ? 'en marcha' : 'en pausa'); };
$('velocidad').oninput = e => { velocidad = +e.target.value; };
$('bNombres').onclick = e => { verNombres = !verNombres; e.currentTarget.setAttribute('aria-pressed', String(verNombres)); };
function plegar(p) { $('panel').classList.toggle('plegado', p); $('plegar').textContent = p ? 'Controles' : 'Ocultar'; $('plegar').setAttribute('aria-expanded', String(!p)); }
$('plegar').onclick = () => plegar(!$('panel').classList.contains('plegado'));
plegar(innerWidth <= 760);                                             // en celular el panel empieza compacto
document.querySelectorAll('[data-capa]').forEach(ch => ch.onchange = () => { capas[ch.dataset.capa] = ch.checked; aplicarCapas(); });
function aplicarCapas() {
  G.uDayNight.value = capas.dianoche ? 1 : 0; G.uGrid.value = capas.malla ? 1 : 0; G.uAtmoOn.value = capas.atmosfera ? 1 : 0;
  const todos = [...CUERPOS.map(b => b.vis), ...Object.values(cmp.vis)];
  todos.forEach(v => { if (v.nubes) v.nubes.visible = capas.nubes && v.cut < .01; if (v.atmo) v.atmo.visible = capas.atmosfera; if (v.eje) v.eje.visible = capas.eje; });
}
if (!orbitasOn) { $('bOrbitas').setAttribute('aria-pressed', 'false'); $('bOrbitas').textContent = 'Órbitas: en pausa'; }

// Modo foto
function foto(on) { modoFoto = on; document.body.classList.toggle('foto', on); if (on) { avisar(''); $('bGuardar').focus(); } }
$('bFoto').onclick = () => foto(true); $('bSalirFoto').onclick = () => foto(false);
$('bGuardar').onclick = () => {
  composer.render();                                                  // se dibuja y se lee en el mismo instante
  const a = document.createElement('a'); a.href = lienzo.toDataURL('image/png'); a.download = 'observatorio-' + (foco ? foco.id : 'sistema-solar') + '.png'; a.click();
};

// Sonido ambiental (Web Audio), apagado por defecto
let audio = null;
$('bSonido').onclick = e => {
  const on = e.currentTarget.getAttribute('aria-pressed') !== 'true'; e.currentTarget.setAttribute('aria-pressed', String(on));
  if (!audio) { const ctx = new (window.AudioContext || window.webkitAudioContext)(), sal = ctx.createGain(), fil = ctx.createBiquadFilter();
    sal.gain.value = 0; fil.type = 'lowpass'; fil.frequency.value = 420; fil.connect(sal); sal.connect(ctx.destination);
    [55, 82.5, 110.4, 164.6].forEach((f, i) => { const o = ctx.createOscillator(), g = ctx.createGain(), l = ctx.createOscillator(), lg = ctx.createGain();
      o.type = i % 2 ? 'triangle' : 'sine'; o.frequency.value = f; g.gain.value = .22 / (i + 1); l.frequency.value = .05 + i * .03; lg.gain.value = .1 / (i + 1);
      l.connect(lg); lg.connect(g.gain); o.connect(g); g.connect(fil); o.start(); l.start(); });
    audio = { ctx, sal }; }
  audio.ctx.resume(); audio.sal.gain.linearRampToValueAtTime(on ? .22 : 0, audio.ctx.currentTime + 1.5);
};

// Pantalla de inicio
function cerrarInicio() { $('inicio').hidden = true; lienzo.focus(); }
$('entrar').onclick = cerrarInicio; $('bAyuda').onclick = () => { $('inicio').hidden = false; $('entrar').focus(); };
$('entrar').focus();

/* ---------- 9) BUCLE PRINCIPAL ---------- */
const reloj = new THREE.Clock(); let acumFps = 0, cuadros = 0, desv = 0;
const suave = k => k < .5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
const EJE_Z = new V3(0, 0, 1), EJE_Y = new V3(0, 1, 0), LUZ_CMP = new V3(-.55, .3, .78).normalize(), ID_Q = new THREE.Quaternion();

function ponerEtq(el, punto, visible) {
  if (!visible) { el.style.display = 'none'; return; }
  _b.copy(punto).project(camara);
  if (_b.z > 1 || Math.abs(_b.x) > 1.05 || Math.abs(_b.y) > 1.05) { el.style.display = 'none'; return; }
  el.style.display = ''; el.style.transform = `translate(${((_b.x * .5 + .5) * W).toFixed(1)}px,${((-_b.y * .5 + .5) * H).toFixed(1)}px) translate(-50%,-110%)`;
}

function actualizarVisual(v, centro, luz, dt, esFoco) {
  const d = camara.position.distanceTo(centro) / v.R, det = clamp(1 - (d - 1.3) / 5, 0, 1);
  v.P.uLightDir.value.copy(luz); v.P.uCenter.value.copy(centro); v.P.uRadius.value = v.R; v.P.uDetail.value = det;
  v.P.uOct.value = movil ? 3.5 + 2 * det : 4.5 + 2.5 * det;
  v.P.uAxis.value.copy(EJE_Y).applyQuaternion(v.tiltG.quaternion).applyQuaternion(v.userG.quaternion);
  const geo = (esFoco || d < 25) ? GEO_ALTA : GEO_BAJA;              // nivel de detalle de la malla según la distancia
  if (v.surf.geometry !== geo) { v.surf.geometry = geo; if (v.nubes) v.nubes.geometry = geo; }
  if (v.corona) { v.corona.quaternion.copy(camara.quaternion); v.P.uGain.value = modo === 'comparar' ? .8 : .68 + 1.2 * clamp((d - 4) / 14, 0, 1); }
  if (v.imp) for (let i = 0; i < 4; i++) if (v.impT[i] >= 0) { v.impT[i] += dt; v.imp[i].w = Math.min(v.impT[i], 99); }
}

function cuadro() {
  const dt = Math.min(reloj.getDelta(), .05);
  G.uTime.value += dt;
  if (orbitasOn) tOrb += dt * velocidad;

  // Órbitas y rotación
  for (const b of CUERPOS) {
    if (b.a) { const an = b.ang0 + b.w * tOrb; b.pos.set(Math.cos(an) * b.a, 0, Math.sin(an) * b.a);
      if (b.padre) { const p = porId[b.padre]; b.pos.applyAxisAngle(EJE_Z, rad(p.tilt || 0)).add(p.pos); b.orbita.position.copy(p.pos); } }
    const v = b.vis; v.g.position.copy(b.pos);
    if (giroReal && v.cut < .01 && modo !== 'comparar') v.spinG.rotation.y += dt * 6.2832 * HORAS_POR_SEGUNDO / b.rot;
    // corte interior animado
    if (v.cut !== v.cutObj) { v.cut += (v.cutObj - v.cut) * (reducir ? 1 : 1 - Math.exp(-5 * dt)); if (Math.abs(v.cut - v.cutObj) < .002) v.cut = v.cutObj;
      v.P.uCut.value = v.cut; const l = v.P.uCutLon.value; v.tapaA.rotation.y = l + v.cut / 2; v.tapaB.rotation.y = l - v.cut / 2;
      if (v.cut === 0) v.tapaA.visible = v.tapaB.visible = false; if (v.nubes) v.nubes.visible = capas.nubes && v.cut < .01; }
  }
  cinturon.rotation.y = tOrb * .02;

  // Giro del cuerpo con la mano: inercia, vuelta a la inclinación real o hacia un rasgo
  if (modo === 'inspeccion') {
    const v = foco.vis;
    if (v.metaQ) { v.userG.quaternion.slerp(v.metaQ, reducir ? 1 : 1 - Math.exp(-4 * dt)); if (v.userG.quaternion.angleTo(v.metaQ) < .002) { v.userG.quaternion.copy(v.metaQ); v.metaQ = null; } }
    else if (!arrastrando) { girarCuerpo(giro.vx * dt, giro.vy * dt, giro.vz * dt); const f = Math.exp(-2.2 * dt); giro.vx *= f; giro.vy *= f; giro.vz *= f; }
  }

  // Cámara: destino según el modo
  if (modo === 'inspeccion') {
    ins.dist += (ins.distObj - ins.dist) * (1 - Math.exp(-7 * dt));
    const s = foco.id === 'sol' ? _a.set(.3, 0, 1) : _a.copy(foco.pos).negate(); s.y = 0; s.normalize().applyAxisAngle(EJE_Y, .75 + ins.vista); s.y = .22; s.normalize();
    destMira.copy(foco.pos); destino.copy(foco.pos).addScaledVector(s, ins.dist);
  } else {
    if (!arrastrando) { orb.az += orb.vaz * dt; orb.pol = clamp(orb.pol + orb.vpol * dt, .15, 2.9); const f = Math.exp(-3 * dt); orb.vaz *= f; orb.vpol *= f; }
    orb.dist += (orb.distObj - orb.dist) * (1 - Math.exp(-7 * dt));
    destMira.copy(orb.centro); destino.set(Math.sin(orb.pol) * Math.sin(orb.az), Math.cos(orb.pol), Math.sin(orb.pol) * Math.cos(orb.az)).multiplyScalar(orb.dist).add(orb.centro);
  }
  let blur = 0;
  if (vuelo.activo) {                                                 // vuelo cinematográfico: curva suave con un arco y desenfoque ligero
    vuelo.t += dt; const k = suave(Math.min(vuelo.t / vuelo.dur, 1)), arco = Math.sin(Math.PI * k);
    camara.position.lerpVectors(vuelo.p0, destino, k); camara.position.y += arco * vuelo.p0.distanceTo(destino) * .1;
    mira.lerpVectors(vuelo.l0, destMira, Math.min(1, k * 1.25)); blur = arco * .045;
    if (vuelo.t >= vuelo.dur) vuelo.activo = false;
  } else { camara.position.copy(destino); mira.copy(destMira); }
  camara.lookAt(mira);
  pasoFinal.uniforms.uBlur.value = reducir ? 0 : blur;
  camara.near = modo === 'inspeccion' && !vuelo.activo ? Math.max(.002, (ins.dist - foco.R) * .2) : modo === 'comparar' ? Math.max(.002, orb.dist * .02) : vuelo.activo ? .05 : 1;
  // en escritorio, desplaza la vista para que el panel no tape al cuerpo
  const ancho = W > 760, obj = modo === 'inspeccion' && !modoFoto ? (ancho ? 165 : H * .13) : 0;
  desv += (obj - desv) * (reducir ? 1 : 1 - Math.exp(-4 * dt));
  if (desv > .5) camara.setViewOffset(W, H, ancho ? -desv : 0, ancho ? 0 : desv, W, H); else if (camara.view) camara.clearViewOffset();
  camara.updateProjectionMatrix(); camara.updateMatrixWorld();

  // Uniformes por cuerpo
  if (modo === 'comparar') { for (const v of cmp.lista) { v.spinG.rotation.y += dt * .25; actualizarVisual(v, v.g.position, LUZ_CMP, dt, true); } }
  else for (const b of CUERPOS) actualizarVisual(b.vis, b.pos, b.id === 'sol' ? EJE_Y : _a.copy(b.pos).negate().normalize(), dt, b === foco);

  // Etiquetas
  const sis = foco ? (foco.padre || foco.id) : null, arribaCam = _q2.copy(camara.quaternion);
  for (const b of CUERPOS) {
    const ver = verNombres && !modoFoto && modo !== 'comparar' && b !== foco && (modo === 'general' ? !b.padre : (b.padre === sis || b.id === sis));
    ponerEtq(b.etq, _a.set(0, b.R * 1.15, 0).applyQuaternion(arribaCam).add(b.pos), ver);
  }
  for (const r of etqRasgos) {
    const v = foco.vis; let ver = capas.rasgos && modo === 'inspeccion' && !vuelo.activo;
    if (r.dir) { v.spinG.localToWorld(_a.copy(r.dir).multiplyScalar(1.01)); if (ver) ver = _b.copy(_a).sub(foco.pos).dot(destino.clone().sub(foco.pos)) > .12 * foco.R * ins.dist; }
    else { const an = foco.anillo; v.tiltG.localToWorld(_a.set(an.r1 + (an.r2 - an.r1) * r.m.anillo, 0, 0).applyAxisAngle(EJE_Y, -.6)); }
    ponerEtq(r.el, _a, ver);
  }
  etqCmp.forEach((el, i) => { const v = cmp.lista[i]; if (modo !== 'comparar' || !v) return void (el.style.display = 'none');
    el.textContent = v.b.nombre; if (v.b.id === 'sol') _a.copy(v.g.position).add(_b.set(v.R, 0, 0).applyAxisAngle(EJE_Z, .012 * orb.dist / 3)); else _a.copy(v.g.position).add(_b.set(0, v.R * 1.1, 0));
    ponerEtq(el, _a.clone(), true); });

  composer.render();

  // Resolución adaptable: si el equipo va lento, baja un poco la densidad de píxeles
  acumFps += dt; cuadros++;
  if (acumFps > 1.5) { const ms = acumFps / cuadros * 1000; if (ms > (movil ? 36 : 21) && pr > .7) { pr = Math.max(.7, pr * .85); ajustar(); } acumFps = 0; cuadros = 0; }
}

aplicarCapas(); ajustar();
orb.distObj = orb.dist = 290 * (W < H ? 1.5 : 1);
renderer.setAnimationLoop(cuadro);
// Pausa total al ocultar la pestaña
document.addEventListener('visibilitychange', () => {
  if (document.hidden) { renderer.setAnimationLoop(null); if (audio) audio.ctx.suspend(); }
  else { reloj.getDelta(); renderer.setAnimationLoop(cuadro); if (audio && $('bSonido').getAttribute('aria-pressed') === 'true') audio.ctx.resume(); }
});
window.__obs = { seleccionar, porId, comparar, vistaGeneral, saltar: () => { vuelo.t = vuelo.dur; } };        // acceso para pruebas desde la consola
