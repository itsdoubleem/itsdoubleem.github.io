
(function () {
  'use strict';
  var DEG = Math.PI / 180;

  /* Coastline polygons as flat [lon,lat,...] rings - validated by raster before embedding */
  var POLYS = [
    [-168,66,-165,60,-162,58,-158,57,-154,58,-152,60,-148,60,-141,60,-135,57,-131,53,-127,50,-124,48,-124,42,-121,35,-117,32,-114,30,-110,24,-106,23,-100,18,-95,16,-92,15,-88,14,-87,13,-85,11,-83,9,-79,9,-77,8,-82,9,-84,13,-87,16,-88,18,-90,19,-87,21,-90,21,-92,19,-95,19,-97,22,-97,26,-94,29,-89,29,-84,30,-82,27,-80,25,-81,31,-76,35,-74,40,-70,43,-66,45,-60,47,-56,51,-57,54,-64,60,-78,62,-80,70,-95,70,-115,73,-125,70,-140,70,-156,71],
    [-81,-4,-79,-8,-76,-14,-71,-18,-70,-23,-72,-30,-73,-37,-75,-44,-74,-50,-69,-52,-68,-55,-65,-55,-64,-51,-62,-46,-57,-38,-57,-34,-53,-34,-48,-25,-40,-21,-39,-13,-35,-8,-35,-5,-44,-2,-48,-1,-51,0,-50,4,-52,5,-58,8,-62,11,-68,11,-72,12,-75,9,-78,8,-80,0],
    [-17,15,-17,21,-13,28,-10,30,-6,36,3,37,11,34,20,32,25,32,32,31,35,28,38,22,43,12,48,12,51,11,48,3,42,-1,40,-8,40,-15,35,-20,33,-26,28,-32,25,-34,20,-34,18,-32,14,-23,12,-17,13,-11,9,-1,9,4,5,5,-3,5,-8,4,-13,8,-16,12],
    [-10,36,-9,43,-2,43,0,47,-5,48,-2,49,2,51,4,53,8,54,9,57,11,58,13,55,19,54,21,56,24,57,28,59,30,60,26,65,22,66,21,70,28,71,40,67,44,66,50,69,60,70,70,73,78,73,86,74,95,76,105,77,113,74,125,73,137,72,146,70,160,70,170,69,179,66,179,62,170,60,163,58,158,52,155,50,143,45,140,42,131,43,128,38,122,31,120,25,110,21,106,10,103,2,98,8,94,16,90,22,88,22,80,15,77,8,72,20,68,24,62,25,57,25,54,17,48,13,43,12,39,21,35,28,34,31,36,36,36,40,29,41,26,40,23,40,20,40,19,42,14,42,12,44,8,44,4,43,3,42,-2,42,-9,43],
    [-45,60,-50,64,-53,68,-58,72,-55,76,-45,80,-30,82,-22,77,-25,72,-32,68,-38,64],
    [114,-22,113,-26,115,-32,119,-34,125,-33,131,-32,137,-35,140,-38,146,-39,150,-37,153,-31,153,-25,146,-19,142,-11,136,-12,131,-11,126,-14,122,-18],
    [-5,50,-6,53,-6,58,-3,58,0,53,1,51],
    [130,31,133,34,136,37,141,41,145,44,142,39,139,35,135,33],
    [43,-12,44,-16,47,-25,50,-16,49,-13],
    [95,5,100,1,104,-3,106,-7,115,-9,120,-9,125,-9,131,-8,141,-9,141,-3,134,-2,128,-1,119,-5,117,1,112,3,108,1,98,6],
    [120,5,121,10,124,13,122,18,126,9,126,6],
    [166,-46,173,-42,175,-37,178,-38,174,-41,170,-45],
    [-24,64,-22,66,-14,66,-14,64],
    [80,6,80,9,82,9,81,6],
    [-84,22,-81,23,-75,20,-79,20],
    [10,77,12,80,20,80,25,78,16,76]
  ];
  var BOXES = POLYS.map(function (p) {
    var x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9;
    for (var i = 0; i < p.length; i += 2) {
      if (p[i] < x0) x0 = p[i]; if (p[i] > x1) x1 = p[i];
      if (p[i + 1] < y0) y0 = p[i + 1]; if (p[i + 1] > y1) y1 = p[i + 1];
    }
    return [x0 - 1, x1 + 1, y0 - 1, y1 + 1];
  });
  function inRing(lon, lat, p) {
    var ins = false, n = p.length / 2;
    for (var i = 0; i < n; i++) {
      var j = (i + n - 1) % n;
      var xi = p[2 * i], yi = p[2 * i + 1], xj = p[2 * j], yj = p[2 * j + 1];
      if ((yi > lat) !== (yj > lat) && lon < (xj - xi) * (lat - yi) / (yj - yi) + xi) ins = !ins;
    }
    return ins;
  }
  function isLand(lon, lat) {
    if (lat < -62) return true;
    for (var i = 0; i < POLYS.length; i++) {
      var b = BOXES[i];
      if (lon >= b[0] && lon <= b[1] && lat >= b[2] && lat <= b[3] && inRing(lon, lat, POLYS[i])) return true;
    }
    return false;
  }

  /* Metro clusters — drive the bright "city light" blooms */
  var METROS = [
    [40.7,-74.0],[34.1,-118.2],[41.9,-87.6],[19.4,-99.1],[25.8,-80.2],[43.7,-79.4],[29.8,-95.4],[37.8,-122.4],
    [51.5,-0.1],[48.9,2.35],[50.1,8.7],[52.5,13.4],[40.4,-3.7],[41.9,12.5],[55.8,37.6],[41.0,29.0],[52.4,4.9],
    [-23.5,-46.6],[-34.6,-58.4],[-12.0,-77.0],[4.7,-74.1],[-33.4,-70.7],
    [-26.2,28.0],[30.0,31.2],[6.5,3.4],[-1.3,36.8],[33.6,-7.6],[-33.9,18.4],
    [35.7,139.7],[37.6,127.0],[31.2,121.5],[39.9,116.4],[22.3,114.2],[23.1,113.3],[1.35,103.8],[13.8,100.5],
    [19.1,72.9],[28.6,77.2],[13.1,80.3],[24.9,67.0],[25.2,55.3],[24.7,46.7],[3.1,101.7],[-6.2,106.8],[14.6,121.0],
    [-33.9,151.2],[-37.8,145.0]
  ];

  var CITIES = {
    LON:[51.5,-0.13], NYC:[40.71,-74.01], SGP:[1.35,103.82], FRA:[50.11,8.68],
    SAO:[-23.55,-46.63], JNB:[-26.2,28.05], TYO:[35.68,139.69], DXB:[25.2,55.27], BOM:[19.08,72.88]
  };
  var CORRIDORS = [['LON','NYC'],['SGP','LON'],['NYC','SAO'],['DXB','BOM'],['TYO','SGP']];

  function llToVec(lat, lon, r) {
    var phi = (90 - lat) * DEG, theta = (lon + 180) * DEG;
    return new THREE.Vector3(
      -r * Math.sin(phi) * Math.cos(theta),
       r * Math.cos(phi),
       r * Math.sin(phi) * Math.sin(theta)
    );
  }

  /* ------------------------------ Shaders ------------------------------ */
  var FRESNEL_VERT = [
    'varying vec3 vN;','varying vec3 vP;',
    'void main(){',
    '  vN = normalize(normalMatrix * normal);',
    '  vec4 mv = modelViewMatrix * vec4(position,1.0);',
    '  vP = mv.xyz;',
    '  gl_Position = projectionMatrix * mv;',
    '}'
  ].join('\n');

  /* Opaque night-side body */
  var BODY_FRAG = [
    'uniform vec3 uCore;','uniform vec3 uEdge;','uniform vec3 uLight;','uniform vec3 uCyan;',
    'varying vec3 vN;','varying vec3 vP;',
    'void main(){',
    '  vec3 n = normalize(vN);',
    '  float limb = 1.0 - abs(dot(n, normalize(-vP)));',
    '  float lit = smoothstep(-0.55, 0.95, dot(n, uLight));',
    '  vec3 col = mix(uCore, uEdge, pow(limb, 1.7));',
    '  col += uEdge * lit * 0.26;',
    '  col += uCyan * lit * 0.42 * pow(limb, 3.2);',
    '  col += uEdge * 0.20 * pow(limb, 6.0);',
    '  gl_FragColor = vec4(col, 1.0);',
    '}'
  ].join('\n');

  /* Rim crescent + outer haze (BackSide, additive, no depth test) */
  /* City-light dot matrix */
  var DOT_VERT = [
    'attribute float aSize;','attribute float aHot;','attribute float aPhase;','attribute float aLat;',
    'uniform float uTime;','uniform float uH;','uniform float uDpr;','uniform float uPulse;','uniform float uScale;',
    'varying float vHot;','varying float vPulse;','varying float vFace;',
    'void main(){',
    '  vec4 mv = modelViewMatrix * vec4(position,1.0);',
    '  vec3 n = normalize(normalMatrix * normalize(position));',
    '  vFace = dot(n, normalize(-mv.xyz));',
    '  vHot = aHot;',
    '  float sweep = sin(aLat * 4.2 - uTime * 1.15 + aPhase * 0.3);',
    '  vPulse = smoothstep(0.86, 1.0, sweep) * uPulse;',
    '  float twinkle = 0.75 + 0.25 * sin(uTime * 2.1 + aPhase * 5.0);',
    '  float world = aSize * uScale * twinkle * (1.0 + vPulse * 1.4);',
    '  gl_PointSize = max(world * uH / max(-mv.z, 0.001) * uDpr, 0.9 * uDpr);',
    '  gl_Position = projectionMatrix * mv;',
    '}'
  ].join('\n');

  var DOT_FRAG = [
    'uniform vec3 uDim;','uniform vec3 uHotCol;','uniform vec3 uIce;','uniform vec3 uCyan;','uniform float uOpacity;',
    'varying float vHot;','varying float vPulse;','varying float vFace;',
    'void main(){',
    '  vec2 uv = gl_PointCoord - 0.5;',
    '  float d = length(uv);',
    '  float disc = smoothstep(0.5, 0.06, d);',
    '  if (disc <= 0.002) discard;',
    '  vec3 col = mix(uDim, uHotCol, vHot);',
    '  col = mix(col, uIce, pow(vHot, 3.0) * 0.55);',
    '  col = mix(col, uCyan, smoothstep(0.55, 0.0, vFace) * 0.35);',
    '  col = mix(col, uIce, vPulse * 0.8);',
    '  float a = uOpacity * disc * (0.38 + 0.62 * vHot) * smoothstep(-0.05, 0.30, vFace);',
    '  gl_FragColor = vec4(col * (0.9 + vPulse), a + vPulse * 0.25 * disc);',
    '}'
  ].join('\n');

  /* Travelling head for arcs, graticule and the dotted orbit */
  var TRACE_VERT = [
    'attribute float aT;','varying float vT;',
    'void main(){ vT = aT; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }'
  ].join('\n');

  var TRACE_FRAG = [
    'uniform float uTime;','uniform vec3 uColor;','uniform vec3 uHead;','uniform float uSpeed;',
    'uniform float uBase;','uniform float uOffset;','uniform float uTail;','uniform float uGain;',
    'varying float vT;',
    'void main(){',
    '  float head = fract(uTime * uSpeed + uOffset);',
    '  float d = fract(head - vT);',
    '  float comet = pow(1.0 - d, uTail);',
    '  vec3 col = mix(uColor, uHead, comet);',
    '  gl_FragColor = vec4(col * (0.5 + comet * 1.3), (uBase + comet * uGain));',
    '}'
  ].join('\n');

  /* Billboarded radial spikes */
  /* Ambient dust with pointer proximity */
  var DUST_VERT = [
    'attribute float aSize;','attribute float aPhase;','attribute float aSeed;',
    'uniform float uTime;','uniform float uH;','uniform float uDpr;','uniform float uAspect;',
    'uniform vec2 uMouse;','uniform float uDrift;',
    'varying float vAlpha;','varying float vProx;','varying float vSeed;','varying float vSoft;',
    'void main(){',
    '  vec3 p = position;',
    '  p.x += sin(uTime * 0.22 + aPhase) * 0.10 * uDrift;',
    '  p.y += cos(uTime * 0.18 + aPhase * 1.7) * 0.09 * uDrift;',
    '  p.z += sin(uTime * 0.15 + aPhase * 0.6) * 0.08 * uDrift;',
    '  vec4 mv = modelViewMatrix * vec4(p, 1.0);',
    '  vec4 clip = projectionMatrix * mv;',
    '  vec2 ndc = clip.xy / max(clip.w, 0.001);',
    '  float md = distance(vec2(ndc.x * uAspect, ndc.y), vec2(uMouse.x * uAspect, uMouse.y));',
    '  vProx = 1.0 - smoothstep(0.0, 0.55, md);',
    '  float depth = -mv.z;',
    '  vAlpha = smoothstep(0.9, 2.6, depth);',
    '  vSoft = smoothstep(4.5, 12.0, depth);',
    '  vSeed = aSeed;',
    '  gl_PointSize = clamp(aSize * uH / max(depth, 0.001) * uDpr * (1.0 + vProx * 0.9), 1.0 * uDpr, 42.0 * uDpr);',
    '  gl_Position = clip;',
    '}'
  ].join('\n');

  var DUST_FRAG = [
    'uniform vec3 uCyan;','uniform vec3 uViolet;','uniform vec3 uIce;','uniform float uOpacity;',
    'varying float vAlpha;','varying float vProx;','varying float vSeed;','varying float vSoft;',
    'void main(){',
    '  vec2 uv = gl_PointCoord - 0.5;',
    '  float d = length(uv);',
    '  float edge = mix(0.10, 0.44, vSoft);',
    '  float disc = smoothstep(0.5, edge, d);',
    '  if (disc <= 0.002) discard;',
    '  vec3 col = mix(uCyan, uViolet, vSeed);',
    '  col = mix(col, uIce, vProx * 0.85);',
    '  float a = disc * vAlpha * uOpacity * (0.34 + vProx * 0.9) * mix(1.0, 0.5, vSoft);',
    '  gl_FragColor = vec4(col, a);',
    '}'
  ].join('\n');

  /* ---------------- Meteors: tapered billboard ribbons ---------------- */
  var METEOR_VERT = [
    'attribute vec3 aOrigin;','attribute vec3 aDir;','attribute float aLen;','attribute float aWidth;',
    'attribute float aSpeed;','attribute float aSeed;','attribute float aSpan;','attribute float aDuty;',
    'uniform float uTime;','uniform float uWidth;',
    'varying vec2 vUv;','varying float vFade;','varying float vSeed;','varying float vNdcX;','varying float vDepth;',
    'void main(){',
    '  vUv = uv;',
    '  vSeed = aSeed;',
    '  float cycle = fract(aSeed + uTime * aSpeed);',
    '  float live = step(cycle, aDuty);',
    '  float trip = cycle / max(aDuty, 0.0001);',
    '  vec3 dir = normalize(aDir);',
    '  vec3 head = aOrigin + dir * (trip * aSpan);',
    '  vec3 p = head - dir * (uv.y * aLen);',           // uv.y: 0 at head, 1 at tail
    '  vec4 mv = modelViewMatrix * vec4(p, 1.0);',
    '  vec3 dv = normalize((modelViewMatrix * vec4(dir, 0.0)).xyz);',
    '  vec3 side = cross(dv, vec3(0.0, 0.0, 1.0));',
    '  float sl = length(side);',
    '  side = sl > 0.0001 ? side / sl : vec3(1.0, 0.0, 0.0);',
    '  float taper = 1.0 - uv.y * 0.74;',               // tail narrows to a point
    '  mv.xyz += side * (uv.x - 0.5) * 2.0 * aWidth * uWidth * taper;',
    '  vFade = live * pow(sin(clamp(trip, 0.0, 1.0) * 3.14159), 1.35);',
    '  vDepth = -mv.z;',
    '  vec4 clip = projectionMatrix * mv;',
    '  vNdcX = clip.x / max(abs(clip.w), 0.001);',
    '  gl_Position = clip;',
    '}'
  ].join('\n');

  var METEOR_FRAG = [
    'uniform vec3 uHead;','uniform vec3 uTrail;','uniform float uOpacity;','uniform float uCopyGuard;',
    'varying vec2 vUv;','varying float vFade;','varying float vSeed;','varying float vNdcX;','varying float vDepth;',
    'void main(){',
    '  float across = 1.0 - abs(vUv.x * 2.0 - 1.0);',
    '  float body = pow(clamp(across, 0.0, 1.0), 1.5);',
    '  float core = pow(clamp(across, 0.0, 1.0), 7.0);',
    '  float along = pow(1.0 - vUv.y, 2.0);',           // brightest at the head
    '  if (body * along <= 0.001) discard;',
    '  vec3 col = mix(uTrail, uHead, pow(1.0 - vUv.y, 3.0) * 0.85 + core * 0.4);',
    '  float guard = mix(1.0, mix(0.12, 1.0, smoothstep(-0.60, 0.04, vNdcX)), uCopyGuard);',
    '  float a = uOpacity * body * along * vFade * guard * smoothstep(0.7, 2.4, vDepth);',
    '  gl_FragColor = vec4(col * (0.6 + core * 1.5), a);',
    '}'
  ].join('\n');

  var METEOR_HEAD_VERT = [
    'attribute vec3 aOrigin;','attribute vec3 aDir;','attribute float aSize;',
    'attribute float aSpeed;','attribute float aSeed;','attribute float aSpan;','attribute float aDuty;',
    'uniform float uTime;','uniform float uH;','uniform float uDpr;',
    'varying float vFade;','varying float vSeed;','varying float vNdcX;',
    'void main(){',
    '  float cycle = fract(aSeed + uTime * aSpeed);',
    '  float live = step(cycle, aDuty);',
    '  float trip = cycle / max(aDuty, 0.0001);',
    '  vec3 p = aOrigin + normalize(aDir) * (trip * aSpan);',
    '  vec4 mv = modelViewMatrix * vec4(p, 1.0);',
    '  float depth = -mv.z;',
    '  vFade = live * pow(sin(clamp(trip, 0.0, 1.0) * 3.14159), 1.35) * smoothstep(0.7, 2.4, depth);',
    '  vSeed = aSeed;',
    '  gl_PointSize = clamp(aSize * uH / max(depth, 0.001) * uDpr, 2.0 * uDpr, 64.0 * uDpr);',
    '  vec4 clip = projectionMatrix * mv;',
    '  vNdcX = clip.x / max(abs(clip.w), 0.001);',
    '  gl_Position = clip;',
    '}'
  ].join('\n');

  var METEOR_HEAD_FRAG = [
    'uniform vec3 uHead;','uniform vec3 uHalo;','uniform float uOpacity;','uniform float uCopyGuard;',
    'varying float vFade;','varying float vSeed;','varying float vNdcX;',
    'void main(){',
    '  vec2 uv = (gl_PointCoord - 0.5) * 2.0;',
    '  float d = length(uv);',
    '  if (d > 1.0) discard;',
    '  float glow = pow(1.0 - d, 3.0);',
    '  float core = pow(1.0 - d, 14.0);',
    '  vec3 col = mix(uHalo, uHead, clamp(core * 1.5, 0.0, 1.0));',
    '  float guard = mix(1.0, mix(0.12, 1.0, smoothstep(-0.60, 0.04, vNdcX)), uCopyGuard);',
    '  float a = (glow * 0.7 + core) * vFade * uOpacity * guard * (0.65 + 0.35 * vSeed);',
    '  gl_FragColor = vec4(col * (0.8 + core * 2.0), a);',
    '}'
  ].join('\n');

  /* ---------------- Orbit ring with a travelling comet packet ---------------- */
  var RING_VERT = [
    'attribute float aSize;','attribute float aSeed;',
    'uniform float uTime;','uniform float uH;','uniform float uDpr;','uniform float uSizeScale;',
    'uniform vec3 uCenter;','uniform vec3 uLight;','uniform float uRadius;',
    'varying float vLit;','varying float vSeed;',
    'void main(){',
    '  vec4 mv = modelViewMatrix * vec4(position, 1.0);',
    '  vec3 rel = mv.xyz - uCenter;',
    // Cylindrical shadow: behind the terminator plane AND inside the planet's disc = eclipsed.
    '  float along = dot(rel, -uLight);',
    '  vec3 perp = rel + uLight * along;',
    '  float perpDist = length(perp);',
    '  float umbra = smoothstep(uRadius * 0.86, uRadius * 1.14, perpDist);',
    '  vLit = mix(1.0, umbra, step(0.0, along));',
    '  vSeed = aSeed;',
    '  float w = aSize * uSizeScale;',
    '  gl_PointSize = clamp(w * uH / max(-mv.z, 0.001) * uDpr, 1.0 * uDpr, 18.0 * uDpr);',
    '  gl_Position = projectionMatrix * mv;',
    '}'
  ].join('\n');

  var RING_FRAG = [
    'uniform vec3 uDim;','uniform vec3 uHot;','uniform float uOpacity;','uniform float uSoft;',
    'varying float vLit;','varying float vSeed;',
    'void main(){',
    '  vec2 uv = gl_PointCoord - 0.5;',
    '  float d = length(uv);',
    '  float disc = smoothstep(0.5, uSoft, d);',
    '  if (disc <= 0.002) discard;',
    '  vec3 col = mix(uDim, uHot, vLit * (0.55 + 0.45 * vSeed));',
    '  float a = uOpacity * disc * (0.45 + 0.55 * vSeed) * (0.10 + 0.90 * vLit);',
    '  gl_FragColor = vec4(col, a);',
    '}'
  ].join('\n');

  /* ---- Bloom: bright-pass, separable blur, composite (no external passes) ---- */
  var QUAD_VERT = [
    'varying vec2 vUv;',
    'void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }'
  ].join('\n');

  var BRIGHT_FRAG = [
    'uniform sampler2D tDiffuse;','uniform float uThreshold;','uniform float uKnee;',
    'varying vec2 vUv;',
    'void main(){',
    '  vec4 c = texture2D(tDiffuse, vUv);',
    '  float l = dot(c.rgb, vec3(0.2126, 0.7152, 0.0722));',
    '  float k = smoothstep(uThreshold, uThreshold + uKnee, l);',
    '  gl_FragColor = vec4(c.rgb * k, 1.0);',
    '}'
  ].join('\n');

  var BLUR_FRAG = [
    'uniform sampler2D tDiffuse;','uniform vec2 uDir;',
    'varying vec2 vUv;',
    'void main(){',
    '  vec3 sum = texture2D(tDiffuse, vUv).rgb * 0.227027;',
    '  sum += (texture2D(tDiffuse, vUv + uDir * 1.3846).rgb + texture2D(tDiffuse, vUv - uDir * 1.3846).rgb) * 0.3162162;',
    '  sum += (texture2D(tDiffuse, vUv + uDir * 3.2308).rgb + texture2D(tDiffuse, vUv - uDir * 3.2308).rgb) * 0.0702703;',
    '  gl_FragColor = vec4(sum, 1.0);',
    '}'
  ].join('\n');

  var COMPOSITE_FRAG = [
    'uniform sampler2D tScene;','uniform sampler2D tBloomA;','uniform sampler2D tBloomB;',
    'uniform float uIntensity;','uniform float uWide;','uniform float uExposure;',
    'varying vec2 vUv;',
    'vec3 aces(vec3 x){',
    '  return clamp((x * (2.51 * x + 0.03)) / (x * (2.43 * x + 0.59) + 0.14), 0.0, 1.0);',
    '}',
    'void main(){',
    '  vec4 s = texture2D(tScene, vUv);',
    '  vec3 b = texture2D(tBloomA, vUv).rgb * uIntensity + texture2D(tBloomB, vUv).rgb * uWide;',
    '  vec3 col = aces((s.rgb + b) * uExposure);',
    '  float a = clamp(s.a + dot(b, vec3(0.2126, 0.7152, 0.0722)) * 1.5, 0.0, 1.0);',
    '  gl_FragColor = vec4(col, a);',
    '}'
  ].join('\n');

  /* ------------------------------ Factory ------------------------------ */
  function createGlobeHero(canvas, options) {
    var o = options || {};
    var C = Object.assign({
      violet: 0x935AE2, cyan: 0x4DB1C0, ice: 0xACCDE6, plum: 0x773E75, deep: 0x1C2950
    }, o.colors || {});

    var R       = o.radius   || 1.8;
    var TILT    = (o.tilt === undefined ? 23.5 : o.tilt);
    var DENSITY = o.density  || 46000;
    var NDUST   = o.particles|| 480;
    var FILL    = o.fill     || 0.67;
    var FIXED_FILL = o.fill !== undefined;       // caller owns the framing
    var MANUAL_POS = o.manualPlacement === true; // caller owns the placement
    var MO      = (o.motion === undefined ? 1 : o.motion);
    var AUTO    = (o.autoRotate === undefined ? 0.150 : o.autoRotate) * MO;
    var FOV     = 30;

    var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    var renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setClearColor(0x000000, 0);

    var scene  = new THREE.Scene();
    var camera = new THREE.PerspectiveCamera(FOV, 1, 0.1, 200);

    var BLOOM = o.bloom === undefined ? 0.80 : o.bloom;
    var rtScene = null, rtA = null, rtB = null, rtC = null, bloomOK = BLOOM > 0;
    var quadScene = null, quadCam = null, quadMesh = null;
    var brightMat = null, blurMat = null, compMat = null;
    if (bloomOK) {
      try {
        var rtOpts = { minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, format: THREE.RGBAFormat, depthBuffer: true, stencilBuffer: false };
        rtScene = new THREE.WebGLRenderTarget(2, 2, rtOpts);
        var halfOpts = { minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, format: THREE.RGBAFormat, depthBuffer: false, stencilBuffer: false };
        rtA = new THREE.WebGLRenderTarget(2, 2, halfOpts);
        rtB = new THREE.WebGLRenderTarget(2, 2, halfOpts);
        rtC = new THREE.WebGLRenderTarget(2, 2, halfOpts);
        quadScene = new THREE.Scene();
        quadCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
        quadMesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), null);
        quadMesh.frustumCulled = false;
        quadScene.add(quadMesh);
        brightMat = new THREE.ShaderMaterial({
          vertexShader: QUAD_VERT, fragmentShader: BRIGHT_FRAG,
          uniforms: { tDiffuse: { value: null }, uThreshold: { value: 0.70 }, uKnee: { value: 0.30 } },
          depthTest: false, depthWrite: false
        });
        blurMat = new THREE.ShaderMaterial({
          vertexShader: QUAD_VERT, fragmentShader: BLUR_FRAG,
          uniforms: { tDiffuse: { value: null }, uDir: { value: new THREE.Vector2() } },
          depthTest: false, depthWrite: false
        });
        compMat = new THREE.ShaderMaterial({
          vertexShader: QUAD_VERT, fragmentShader: COMPOSITE_FRAG,
          uniforms: {
            tScene: { value: rtScene.texture }, tBloomA: { value: rtA.texture }, tBloomB: { value: rtC.texture },
            uIntensity: { value: BLOOM }, uWide: { value: BLOOM * 0.55 },
            uExposure: { value: o.exposure === undefined ? 1.12 : o.exposure }
          },
          depthTest: false, depthWrite: false, transparent: true, blending: THREE.NoBlending
        });
      } catch (err) { bloomOK = false; }
    }
    function runPass(mat, target) {
      quadMesh.material = mat;
      renderer.setRenderTarget(target);
      renderer.clear();
      renderer.render(quadScene, quadCam);
    }

    var world = new THREE.Group();   scene.add(world);    // composition + parallax
    var globe = new THREE.Group();   world.add(globe);    // spins
    globe.rotation.z = TILT * DEG;

    var col = {
      violet: new THREE.Color(C.violet),
      cyan:   new THREE.Color(C.cyan),
      ice:    new THREE.Color(C.ice),
      plum:   new THREE.Color(C.plum),
      deep:   new THREE.Color(C.deep)
    };
    var hotPink = new THREE.Color(C.violet).lerp(new THREE.Color(0xFF86E4), 0.62);
    var dimDot  = new THREE.Color(C.plum).lerp(new THREE.Color(C.violet), 0.30);
    var LIGHT   = new THREE.Vector3(-0.52, 0.46, 0.72).normalize();  // view-space key light

    var junk = [];
    function keep(x) { junk.push(x); return x; }

    /* --- 1. Opaque night-side body ------------------------------------ */
    var bodyMat = keep(new THREE.ShaderMaterial({
      vertexShader: FRESNEL_VERT, fragmentShader: BODY_FRAG,
      uniforms: {
        uCore:  { value: new THREE.Color(0x07051A) },
        uEdge:  { value: new THREE.Color(C.deep).multiplyScalar(0.60) },
        uCyan:  { value: col.cyan },
        uLight: { value: LIGHT }
      }
    }));
    var body = new THREE.Mesh(keep(new THREE.SphereGeometry(R * 0.995, 96, 64)), bodyMat);
    body.renderOrder = 0;
    world.add(body);

    /* --- 2. City-light dot matrix ------------------------------------- */
    var metroVecs = METROS.map(function (m) { return llToVec(m[0], m[1], 1); });

    var dPos = [], dSize = [], dHot = [], dPhase = [], dLat = [];
    var golden = Math.PI * (3 - Math.sqrt(5));
    for (var i = 0; i < DENSITY; i++) {
      var y = 1 - (i / (DENSITY - 1)) * 2;
      var rad = Math.sqrt(Math.max(0, 1 - y * y));
      var th = golden * i;
      var x = Math.cos(th) * rad, z = Math.sin(th) * rad;

      var lat = Math.asin(Math.max(-1, Math.min(1, y))) / DEG;
      var lon = Math.atan2(z, -x) / DEG - 180;
      if (lon < -180) lon += 360;
      if (!isLand(lon, lat)) continue;

      var hot = 0;
      for (var m = 0; m < metroVecs.length; m++) {
        var mv = metroVecs[m];
        var dp = x * mv.x + y * mv.y + z * mv.z;
        var ang = Math.acos(Math.max(-1, Math.min(1, dp)));
        var g = Math.exp(-(ang * ang) / 0.0125);
        if (g > hot) hot = g;
      }
      hot = Math.min(1, hot * (0.55 + Math.random() * 0.75));
      if (Math.random() < 0.06) hot = Math.max(hot, 0.35 + Math.random() * 0.4);

      dPos.push(x * R * 1.002, y * R * 1.002, z * R * 1.002);
      dSize.push(0.0090 + hot * 0.0160 + Math.random() * 0.0040);
      dHot.push(hot);
      dPhase.push(Math.random() * 6.283);
      dLat.push(Math.asin(y));
    }

    var dotGeo = keep(new THREE.BufferGeometry());
    dotGeo.setAttribute('position', new THREE.Float32BufferAttribute(dPos, 3));
    dotGeo.setAttribute('aSize',  new THREE.Float32BufferAttribute(dSize, 1));
    dotGeo.setAttribute('aHot',   new THREE.Float32BufferAttribute(dHot, 1));
    dotGeo.setAttribute('aPhase', new THREE.Float32BufferAttribute(dPhase, 1));
    dotGeo.setAttribute('aLat',   new THREE.Float32BufferAttribute(dLat, 1));

    var dotMat = keep(new THREE.ShaderMaterial({
      vertexShader: DOT_VERT, fragmentShader: DOT_FRAG,
      uniforms: {
        uTime: { value: 0 }, uH: { value: 800 }, uDpr: { value: 1 }, uScale: { value: 1 },
        uPulse: { value: reduced ? 0.3 : 1 }, uOpacity: { value: 1.15 },
        uDim: { value: dimDot }, uHotCol: { value: hotPink }, uIce: { value: col.ice }, uCyan: { value: col.cyan }
      },
      transparent: true, depthWrite: false, depthTest: true, blending: THREE.AdditiveBlending
    }));
    var dots = new THREE.Points(dotGeo, dotMat);
    dots.renderOrder = 2;
    globe.add(dots);

    /* --- 3. Graticule ------------------------------------------------- */
    function traceMat(cfg) {
      return keep(new THREE.ShaderMaterial({
        vertexShader: TRACE_VERT, fragmentShader: TRACE_FRAG,
        uniforms: {
          uTime: { value: 0 }, uColor: { value: cfg.color }, uHead: { value: cfg.head },
          uSpeed: { value: cfg.speed }, uBase: { value: cfg.base }, uOffset: { value: cfg.offset },
          uTail: { value: cfg.tail }, uGain: { value: cfg.gain === undefined ? 0.9 : cfg.gain }
        },
        transparent: true, depthWrite: false, depthTest: cfg.depth !== false, blending: THREE.AdditiveBlending
      }));
    }

    var gridMats = [];
    var gridColor = col.violet.clone().lerp(col.cyan, 0.22).multiplyScalar(0.85);
    (function buildGraticule() {
      var lat, lon, k, pts, ts, g, mtl, line;
      for (lat = -75; lat <= 75; lat += 15) {
        pts = []; ts = [];
        var rr = Math.cos(lat * DEG) * R * 1.004, yy = Math.sin(lat * DEG) * R * 1.004;
        for (k = 0; k <= 128; k++) {
          var a = (k / 128) * Math.PI * 2;
          pts.push(Math.cos(a) * rr, yy, Math.sin(a) * rr); ts.push(k / 128);
        }
        g = keep(new THREE.BufferGeometry());
        g.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
        g.setAttribute('aT', new THREE.Float32BufferAttribute(ts, 1));
        mtl = traceMat({ color: gridColor, head: col.cyan, speed: (0.10 + lat * 0.0006) * MO, base: 0.085, offset: (lat + 75) / 170, tail: 40, gain: 0.55 });
        gridMats.push(mtl);
        line = new THREE.Line(g, mtl); line.renderOrder = 1; globe.add(line);
      }
      for (lon = 0; lon < 180; lon += 15) {
        pts = []; ts = [];
        for (k = 0; k <= 128; k++) {
          var t = k / 128, ph = t * Math.PI * 2;
          var v = new THREE.Vector3(Math.cos(ph) * Math.cos(lon * DEG), Math.sin(ph), Math.cos(ph) * Math.sin(lon * DEG));
          v.multiplyScalar(R * 1.004);
          pts.push(v.x, v.y, v.z); ts.push(t);
        }
        g = keep(new THREE.BufferGeometry());
        g.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
        g.setAttribute('aT', new THREE.Float32BufferAttribute(ts, 1));
        mtl = traceMat({ color: gridColor, head: col.ice, speed: 0.09 * MO, base: 0.075, offset: lon / 180, tail: 46, gain: 0.50 });
        gridMats.push(mtl);
        line = new THREE.Line(g, mtl); line.renderOrder = 1; globe.add(line);
      }
    })();

    /* --- 4. Corridor arcs + node markers ------------------------------ */
    var arcMats = [];
    CORRIDORS.forEach(function (pair, idx) {
      var a = llToVec(CITIES[pair[0]][0], CITIES[pair[0]][1], 1);
      var b = llToVec(CITIES[pair[1]][0], CITIES[pair[1]][1], 1);
      var lift = 0.06 + a.distanceTo(b) * 0.075;
      var pts = [], ts = [], N = 110;
      for (var k = 0; k <= N; k++) {
        var t = k / N;
        var v = new THREE.Vector3().copy(a).lerp(b, t).normalize();
        v.multiplyScalar(R * (1.006 + Math.sin(t * Math.PI) * lift));
        pts.push(v.x, v.y, v.z); ts.push(t);
      }
      var g = keep(new THREE.BufferGeometry());
      g.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
      g.setAttribute('aT', new THREE.Float32BufferAttribute(ts, 1));
      var mtl = traceMat({
        color: col.violet.clone().lerp(col.cyan, idx / CORRIDORS.length).multiplyScalar(0.8),
        head: col.ice, speed: (0.26 + idx * 0.020) * MO, base: 0.05, offset: idx * 0.19, tail: 24, gain: 1.0
      });
      arcMats.push(mtl);
      var line = new THREE.Line(g, mtl); line.renderOrder = 3; globe.add(line);
    });

    var nPos = [], nSize = [], nHot = [], nPhase = [], nLat = [];
    Object.keys(CITIES).forEach(function (key, idx) {
      var v = llToVec(CITIES[key][0], CITIES[key][1], R * 1.008);
      nPos.push(v.x, v.y, v.z);
      nSize.push(0.030); nHot.push(1); nPhase.push(idx * 0.8); nLat.push(0);
    });
    var nodeGeo = keep(new THREE.BufferGeometry());
    nodeGeo.setAttribute('position', new THREE.Float32BufferAttribute(nPos, 3));
    nodeGeo.setAttribute('aSize',  new THREE.Float32BufferAttribute(nSize, 1));
    nodeGeo.setAttribute('aHot',   new THREE.Float32BufferAttribute(nHot, 1));
    nodeGeo.setAttribute('aPhase', new THREE.Float32BufferAttribute(nPhase, 1));
    nodeGeo.setAttribute('aLat',   new THREE.Float32BufferAttribute(nLat, 1));
    var nodeMat = keep(new THREE.ShaderMaterial({
      vertexShader: DOT_VERT, fragmentShader: DOT_FRAG,
      uniforms: {
        uTime: { value: 0 }, uH: { value: 800 }, uDpr: { value: 1 }, uScale: { value: 1 },
        uPulse: { value: 0 }, uOpacity: { value: 0.85 },
        uDim: { value: col.ice }, uHotCol: { value: col.ice }, uIce: { value: new THREE.Color(0xFFFFFF) }, uCyan: { value: col.cyan }
      },
      transparent: true, depthWrite: false, depthTest: true, blending: THREE.AdditiveBlending
    }));
    var nodes = new THREE.Points(nodeGeo, nodeMat);
    nodes.renderOrder = 4;
    globe.add(nodes);

    /* --- 6. Orbit rings: comet packet running the circumference -------- */
    var ringMats = [], ringGroups = [];
    function buildRing(cfg) {
      var grp = new THREE.Group();
      grp.rotation.x = cfg.tiltX;
      grp.rotation.z = cfg.tiltZ;
      grp.userData.spin = cfg.spin;
      world.add(grp);
      ringGroups.push(grp);

      var rPos = [], rSize = [], rSeed = [];
      for (var q = 0; q < cfg.count; q++) {
        var t = q / cfg.count, ang = t * Math.PI * 2;
        rPos.push(Math.cos(ang) * cfg.radius, 0, Math.sin(ang) * cfg.radius);
        rSize.push(cfg.dot * (q % 9 === 0 ? 1.45 : (0.72 + Math.random() * 0.5)));
        rSeed.push(Math.random());
      }
      var g = keep(new THREE.BufferGeometry());
      g.setAttribute('position', new THREE.Float32BufferAttribute(rPos, 3));
      g.setAttribute('aSize', new THREE.Float32BufferAttribute(rSize, 1));
      g.setAttribute('aSeed', new THREE.Float32BufferAttribute(rSeed, 1));

      // halo pass under a tight core pass — the dots read as lit beads, not flat pixels
      [{ soft: 0.44, scale: 1.9, op: cfg.halo, order: 4 },
       { soft: 0.07, scale: 1.0, op: cfg.opacity, order: 5 }].forEach(function (pass) {
        var mtl = keep(new THREE.ShaderMaterial({
          vertexShader: RING_VERT, fragmentShader: RING_FRAG,
          uniforms: {
            uTime: { value: 0 }, uH: { value: 800 }, uDpr: { value: 1 },
            uSizeScale: { value: pass.scale },
            uCenter: { value: new THREE.Vector3() }, uLight: { value: LIGHT }, uRadius: { value: R },
            uDim: { value: cfg.dim }, uHot: { value: cfg.hot },
            uOpacity: { value: pass.op }, uSoft: { value: pass.soft }
          },
          transparent: true, depthWrite: false, depthTest: true, blending: THREE.AdditiveBlending
        }));
        ringMats.push(mtl);
        var pts = new THREE.Points(g, mtl);
        pts.renderOrder = pass.order;
        grp.add(pts);
      });
    }

    // Orbital periods follow Kepler's third law: omega proportional to a^-3/2.
    var OUTER_A = 1.52, INNER_A = 1.26, OUTER_W = 0.085;
    var INNER_W = OUTER_W * Math.pow(OUTER_A / INNER_A, 1.5);
    buildRing({ radius: R * OUTER_A, count: 360, dot: 0.016, tiltX: 1.30, tiltZ: -0.34, spin: OUTER_W,
                halo: 0.13, opacity: 0.90,
                dim: col.ice.clone().multiplyScalar(0.30), hot: new THREE.Color(0xF4F8FF) });
    buildRing({ radius: R * INNER_A, count: 240, dot: 0.011, tiltX: -1.16, tiltZ: 0.52, spin: INNER_W,
                halo: 0.10, opacity: 0.62,
                dim: col.violet.clone().lerp(col.cyan, 0.35).multiplyScalar(0.35), hot: col.ice });

    /* --- 7. Meteors ------------------------------------------------------ */
    var NMET = o.meteors === undefined ? 10 : o.meteors;
    var mQuad = [], mUv = [], mOrigin = [], mDir = [], mLen = [], mWid = [], mSpeed = [], mSeed = [], mSpan = [], mDuty = [], mIdx = [];
    var hOrigin = [], hDir = [], hSize = [], hSpeed = [], hSeed = [], hSpan = [], hDuty = [], hPos = [];
    for (var mi = 0; mi < NMET; mi++) {
      // Entry in the upper atmosphere: a meteor only glows where there is air to ablate in.
      var nu = Math.random() * 2 - 1;
      var np = Math.random() * Math.PI * 2;
      var nr = Math.sqrt(Math.max(0, 1 - nu * nu));
      var nrm = new THREE.Vector3(Math.cos(np) * nr, nu, Math.sin(np) * nr);
      var origin = nrm.clone().multiplyScalar(R * 1.055);

      // Shallow entry: mostly tangential, biased inward so the track descends.
      var tmpv = Math.abs(nrm.y) > 0.9 ? new THREE.Vector3(1, 0, 0) : new THREE.Vector3(0, 1, 0);
      var tan1 = new THREE.Vector3().crossVectors(nrm, tmpv).normalize();
      var tan2 = new THREE.Vector3().crossVectors(nrm, tan1).normalize();
      var roll = Math.random() * Math.PI * 2;
      var dv = tan1.multiplyScalar(Math.cos(roll)).add(tan2.multiplyScalar(Math.sin(roll)))
                   .multiplyScalar(0.90).add(nrm.clone().multiplyScalar(-0.44)).normalize();

      var span  = R * (0.30 + Math.random() * 0.32);   // burns out inside the shell
      var len   = R * (0.10 + Math.pow(Math.random(), 1.3) * 0.18);
      var wid   = R * (0.0055 + Math.random() * 0.0065);
      var speed = (0.085 + Math.random() * 0.075) * MO * (reduced ? 0.25 : 1);
      var duty  = 0.16 + Math.random() * 0.12;         // dark most of the time
      var seed  = Math.random();
      var base  = mi * 4;
      var uvs = [[0, 0], [1, 0], [0, 1], [1, 1]];
      for (var v4 = 0; v4 < 4; v4++) {
        mQuad.push(origin.x, origin.y, origin.z);
        mUv.push(uvs[v4][0], uvs[v4][1]);
        mOrigin.push(origin.x, origin.y, origin.z);
        mDir.push(dv.x, dv.y, dv.z);
        mLen.push(len); mWid.push(wid); mSpeed.push(speed); mSeed.push(seed);
        mSpan.push(span); mDuty.push(duty);
      }
      mIdx.push(base, base + 1, base + 2, base + 2, base + 1, base + 3);
      hPos.push(origin.x, origin.y, origin.z);
      hOrigin.push(origin.x, origin.y, origin.z);
      hDir.push(dv.x, dv.y, dv.z);
      hSize.push(wid * (3.0 + Math.random() * 2.2));
      hSpeed.push(speed); hSeed.push(seed); hSpan.push(span); hDuty.push(duty);
    }

    var metGeo = keep(new THREE.BufferGeometry());
    metGeo.setAttribute('position', new THREE.Float32BufferAttribute(mQuad, 3));
    metGeo.setAttribute('uv',       new THREE.Float32BufferAttribute(mUv, 2));
    metGeo.setAttribute('aOrigin',  new THREE.Float32BufferAttribute(mOrigin, 3));
    metGeo.setAttribute('aDir',     new THREE.Float32BufferAttribute(mDir, 3));
    metGeo.setAttribute('aLen',     new THREE.Float32BufferAttribute(mLen, 1));
    metGeo.setAttribute('aWidth',   new THREE.Float32BufferAttribute(mWid, 1));
    metGeo.setAttribute('aSpeed',   new THREE.Float32BufferAttribute(mSpeed, 1));
    metGeo.setAttribute('aSeed',    new THREE.Float32BufferAttribute(mSeed, 1));
    metGeo.setAttribute('aSpan',    new THREE.Float32BufferAttribute(mSpan, 1));
    metGeo.setAttribute('aDuty',    new THREE.Float32BufferAttribute(mDuty, 1));
    metGeo.setIndex(mIdx);

    var meteorMats = [];
    function meteorLayer(width, opacity, head, trail, order) {
      var mtl = keep(new THREE.ShaderMaterial({
        vertexShader: METEOR_VERT, fragmentShader: METEOR_FRAG,
        uniforms: {
          uTime: { value: 0 }, uWidth: { value: width },
          uHead: { value: head }, uTrail: { value: trail }, uOpacity: { value: opacity },
          uCopyGuard: { value: 1 }
        },
        transparent: true, depthWrite: false, depthTest: true, side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending
      }));
      meteorMats.push(mtl);
      var mesh = new THREE.Mesh(metGeo, mtl);
      mesh.frustumCulled = false;
      mesh.renderOrder = order;
      world.add(mesh);
      return mtl;
    }
    meteorLayer(3.4, 0.18, col.cyan.clone().lerp(col.ice, 0.5), col.violet, 6);
    meteorLayer(1.4, 0.85, new THREE.Color(0xF4FBFF), col.violet.clone().lerp(col.cyan, 0.30), 7);

    var headGeo = keep(new THREE.BufferGeometry());
    headGeo.setAttribute('position', new THREE.Float32BufferAttribute(hPos, 3));
    headGeo.setAttribute('aOrigin',  new THREE.Float32BufferAttribute(hOrigin, 3));
    headGeo.setAttribute('aDir',     new THREE.Float32BufferAttribute(hDir, 3));
    headGeo.setAttribute('aSize',    new THREE.Float32BufferAttribute(hSize, 1));
    headGeo.setAttribute('aSpeed',   new THREE.Float32BufferAttribute(hSpeed, 1));
    headGeo.setAttribute('aSeed',    new THREE.Float32BufferAttribute(hSeed, 1));
    headGeo.setAttribute('aSpan',    new THREE.Float32BufferAttribute(hSpan, 1));
    headGeo.setAttribute('aDuty',    new THREE.Float32BufferAttribute(hDuty, 1));
    var headMat = keep(new THREE.ShaderMaterial({
      vertexShader: METEOR_HEAD_VERT, fragmentShader: METEOR_HEAD_FRAG,
      uniforms: {
        uTime: { value: 0 }, uH: { value: 800 }, uDpr: { value: 1 },
        uHead: { value: new THREE.Color(0xFFFFFF) }, uHalo: { value: col.cyan.clone().lerp(col.ice, 0.4) },
        uOpacity: { value: 0.80 }, uCopyGuard: { value: 1 }
      },
      transparent: true, depthWrite: false, depthTest: true, blending: THREE.AdditiveBlending
    }));
    var meteorHeads = new THREE.Points(headGeo, headMat);
    meteorHeads.frustumCulled = false;
    meteorHeads.renderOrder = 8;
    world.add(meteorHeads);

    /* --- 9. Ambient dust ------------------------------------------------ */
    var uPos = [], uSize = [], uPhase = [], uSeed = [];
    for (var p = 0; p < NDUST; p++) {
      var pu = Math.random() * 2 - 1;
      var pp = Math.random() * Math.PI * 2;
      var prr = Math.sqrt(Math.max(0, 1 - pu * pu));
      var pd = R * (1.15 + Math.pow(Math.random(), 0.55) * 2.6);
      uPos.push(Math.cos(pp) * prr * pd * 1.7, pu * pd * 0.9, Math.sin(pp) * prr * pd);
      uSize.push(R * (0.0045 + Math.pow(Math.random(), 2.2) * 0.026));
      uPhase.push(Math.random() * 6.283);
      uSeed.push(Math.random());
    }
    var dustGeo = keep(new THREE.BufferGeometry());
    dustGeo.setAttribute('position', new THREE.Float32BufferAttribute(uPos, 3));
    dustGeo.setAttribute('aSize',  new THREE.Float32BufferAttribute(uSize, 1));
    dustGeo.setAttribute('aPhase', new THREE.Float32BufferAttribute(uPhase, 1));
    dustGeo.setAttribute('aSeed',  new THREE.Float32BufferAttribute(uSeed, 1));
    var dustMat = keep(new THREE.ShaderMaterial({
      vertexShader: DUST_VERT, fragmentShader: DUST_FRAG,
      uniforms: {
        uTime: { value: 0 }, uH: { value: 800 }, uDpr: { value: 1 }, uAspect: { value: 1 },
        uMouse: { value: new THREE.Vector2(0, 0) }, uDrift: { value: reduced ? 0.2 : 1 }, uOpacity: { value: 1.1 },
        uCyan: { value: col.cyan }, uViolet: { value: col.violet }, uIce: { value: col.ice }
      },
      transparent: true, depthWrite: false, depthTest: true, blending: THREE.AdditiveBlending
    }));
    var dust = new THREE.Points(dustGeo, dustMat);
    dust.renderOrder = 7;
    world.add(dust);

    /* ---------------------------- Interaction ---------------------------- */
    var centerWorld = new THREE.Vector3(), centerView = new THREE.Vector3();
    var pointer = { x: 0, y: 0 }, smooth = { x: 0, y: 0 };

    /* ── Why the listener is on the window and not on the canvas ──
       The canvas is decoration: it is pointer-events: none, z-index -1 and sits behind
       every readable thing on the page. It therefore never receives a pointer event of
       its own, and a listener bound to it fires exactly never — which is why the scene
       stood still no matter where the cursor went.

       So the window is the source, and the position is expressed relative to the
       canvas's own box. The pointer is being read, not captured: nothing here calls
       preventDefault, the listener is passive, and hit-testing on the page is
       unaffected. Dragging the globe is deliberately gone with it — a background the
       reader cannot click cannot be dragged either, and pretending otherwise would put
       a grab cursor on something that never responds. */
    function onMove(e) {
      var r = canvas.getBoundingClientRect();
      if (!r.width || !r.height) return;
      // Clamped: the canvas starts below the fold, so a cursor up in the header is far
      // outside its box and the raw value would swing the scene past anything it does
      // when the pointer is actually over it.
      pointer.x = Math.max(-1, Math.min(1, ((e.clientX - r.left) / r.width) * 2 - 1));
      pointer.y = Math.max(-1, Math.min(1, -(((e.clientY - r.top) / r.height) * 2 - 1)));
    }
    // Back to rest when the cursor leaves the document, rather than freezing off-centre.
    function onLeave() { pointer.x = 0; pointer.y = 0; }

    window.addEventListener('pointermove', onMove, { passive: true });
    document.addEventListener('pointerleave', onLeave, { passive: true });

    /* ------------------------------- Resize ------------------------------- */
    var dpr = 1, aspect = 1, halfW = 1, halfH = 1;
    var blurHalf = new THREE.Vector2(0.002, 0.002), blurQuarter = new THREE.Vector2(0.004, 0.004);
    var sizedMats = [dotMat, nodeMat, dustMat, headMat].concat(ringMats);

    function resize() {
      var w = canvas.clientWidth || (canvas.parentElement && canvas.parentElement.clientWidth) || 1;
      var h = canvas.clientHeight || (canvas.parentElement && canvas.parentElement.clientHeight) || 1;
      dpr = Math.min(window.devicePixelRatio || 1, o.dprCap || 2);
      renderer.setPixelRatio(dpr);
      renderer.setSize(w, h, false);
      aspect = w / h;
      camera.aspect = aspect;

      var narrow = w < 980;
      // Frame the globe as a fraction of the short-ish axis, then solve for distance.
      // A caller that passes `fill` has already sized the globe against the canvas
      // height, so honour that verbatim rather than reframing by width — otherwise a
      // tall, narrow section canvas shrinks the globe to a speck.
      var fill = FIXED_FILL ? FILL : (narrow ? (w < 560 ? 0.72 : 0.80) : FILL);
      halfH = (FIXED_FILL || !narrow) ? (R / fill) : Math.max((R / fill) / aspect, R / 1.25);
      halfW = halfH * aspect;

      var dist = halfH / Math.tan(FOV * 0.5 * DEG);
      camera.position.set(0, 0, dist);
      camera.updateProjectionMatrix();

      if (!MANUAL_POS) {
        world.position.x = narrow ? 0 : halfW * 0.46;
        world.position.y = narrow ? halfH * 0.40 : -halfH * 0.02;
      }

      var uH = (h * 0.5) / Math.tan(FOV * 0.5 * DEG);   // CSS px per world unit at 1 unit depth
      for (var k = 0; k < sizedMats.length; k++) {
        sizedMats[k].uniforms.uH.value = uH;
        sizedMats[k].uniforms.uDpr.value = dpr;
      }
      dustMat.uniforms.uAspect.value = aspect;
      if (bloomOK) {
        var bw = Math.max(2, Math.floor(w * dpr)), bh = Math.max(2, Math.floor(h * dpr));
        var hw = Math.max(2, Math.floor(bw * 0.5)), hh = Math.max(2, Math.floor(bh * 0.5));
        var qw = Math.max(2, Math.floor(bw * 0.25)), qh = Math.max(2, Math.floor(bh * 0.25));
        rtScene.setSize(bw, bh);
        rtA.setSize(hw, hh); rtB.setSize(hw, hh); rtC.setSize(qw, qh);
        blurHalf.set(1 / hw, 1 / hh);
        blurQuarter.set(1 / qw, 1 / qh);
      }
      dotMat.uniforms.uScale.value = (narrow && !FIXED_FILL) ? 0.9 : 1.0;
      for (var cg = 0; cg < meteorMats.length; cg++) meteorMats[cg].uniforms.uCopyGuard.value = narrow ? 0 : 1;
      headMat.uniforms.uCopyGuard.value = narrow ? 0 : 1;
    }
    resize();

    var ro = null;
    if (window.ResizeObserver) { ro = new ResizeObserver(resize); ro.observe(canvas.parentElement || canvas); }
    else { window.addEventListener('resize', resize); }

    /* --------------------------- Visibility gating --------------------------- */
    var onScreen = true, tabVisible = !document.hidden, raf = 0, prev = 0, clock = 0, alive = true;

    var io = null;
    if (window.IntersectionObserver) {
      io = new IntersectionObserver(function (en) { onScreen = en[0].isIntersecting; if (onScreen && tabVisible) kick(); }, { threshold: 0 });
      io.observe(canvas);
    }
    function onVisibility() { tabVisible = !document.hidden; if (tabVisible && onScreen) kick(); }
    document.addEventListener('visibilitychange', onVisibility);
    function kick() { if (alive && !raf) { prev = performance.now(); raf = requestAnimationFrame(frame); } }

    var timed = [dotMat, nodeMat, dustMat, headMat].concat(gridMats, arcMats, meteorMats);

    function frame(now) {
      raf = 0;
      if (!alive) return;
      var dt = Math.min((now - prev) / 1000, 0.05);
      prev = now;
      clock += dt;

      smooth.x += (pointer.x - smooth.x) * Math.min(1, dt * 3.0);
      smooth.y += (pointer.y - smooth.y) * Math.min(1, dt * 3.0);

      globe.rotation.y += (reduced ? AUTO * 0.25 : AUTO) * dt;
      globe.rotation.x = smooth.y * 0.10;

      for (var rg = 0; rg < ringGroups.length; rg++) ringGroups[rg].rotation.y = clock * ringGroups[rg].userData.spin * MO;
      body.getWorldPosition(centerWorld);
      centerView.copy(centerWorld).applyMatrix4(camera.matrixWorldInverse);
      for (var rm = 0; rm < ringMats.length; rm++) ringMats[rm].uniforms.uCenter.value.copy(centerView);
      dust.rotation.y = clock * 0.006 * MO;

      world.rotation.y = smooth.x * 0.13;
      world.rotation.x = -smooth.y * 0.08;
      camera.position.x = smooth.x * halfW * 0.045;
      camera.position.y = smooth.y * halfH * 0.045;
      camera.lookAt(camera.position.x * 0.5, camera.position.y * 0.5, 0);

      for (var k = 0; k < timed.length; k++) timed[k].uniforms.uTime.value = clock;
      dustMat.uniforms.uMouse.value.set(smooth.x, smooth.y);

      if (bloomOK) {
        renderer.setRenderTarget(rtScene);
        renderer.clear();
        renderer.render(scene, camera);
        brightMat.uniforms.tDiffuse.value = rtScene.texture;
        runPass(brightMat, rtA);
        blurMat.uniforms.tDiffuse.value = rtA.texture;
        blurMat.uniforms.uDir.value.set(blurHalf.x, 0);
        runPass(blurMat, rtB);
        blurMat.uniforms.tDiffuse.value = rtB.texture;
        blurMat.uniforms.uDir.value.set(0, blurHalf.y);
        runPass(blurMat, rtA);
        // second, wider octave for the broad atmospheric bloom
        blurMat.uniforms.tDiffuse.value = rtA.texture;
        blurMat.uniforms.uDir.value.set(blurQuarter.x * 3.4, 0);
        runPass(blurMat, rtC);
        blurMat.uniforms.tDiffuse.value = rtC.texture;
        blurMat.uniforms.uDir.value.set(0, blurQuarter.y * 3.4);
        runPass(blurMat, rtC);
        renderer.setRenderTarget(null);
        runPass(compMat, null);
      } else {
        renderer.setRenderTarget(null);
        renderer.render(scene, camera);
      }
      if (onScreen && tabVisible) raf = requestAnimationFrame(frame);
    }
    kick();

    /* ------------------------------- Teardown ------------------------------- */
    function destroy() {
      alive = false;
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
      window.removeEventListener('pointermove', onMove);
      document.removeEventListener('pointerleave', onLeave);
      window.removeEventListener('resize', resize);
      document.removeEventListener('visibilitychange', onVisibility);
      if (ro) ro.disconnect();
      if (io) io.disconnect();
      [rtScene, rtA, rtB, rtC, brightMat, blurMat, compMat].forEach(function (d) { if (d && d.dispose) d.dispose(); });
      if (quadMesh && quadMesh.geometry) quadMesh.geometry.dispose();
      junk.forEach(function (d) { if (d && d.dispose) d.dispose(); });
      junk.length = 0;
      renderer.dispose();
      if (renderer.forceContextLoss) { try { renderer.forceContextLoss(); } catch (e) {} }
    }

    return { destroy: destroy, renderer: renderer, scene: scene, camera: camera, globe: globe };
  }

  window.createGlobeHero = createGlobeHero;

})();

/* ──────────────────────────────────────────────────────────────────────────
   DOUBLEEM — the Science section's sky, as a globe.

   One script tag, no component edits: it makes its own canvas, hides the CSS
   sky it replaces, and measures its position from the hero device's own box.

   THE CSS SKY STAYS IN THE MARKUP ON PURPOSE. This file hides it at runtime,
   so with JavaScript off the reader still gets the nebula and the star layers
   exactly as before — no blank ground, no regression. That is also why the
   layers are hidden from script rather than deleted from the component.
   ────────────────────────────────────────────────────────────────────────── */
(function () {
  'use strict';

  var curio = document.querySelector('.curio');
  if (!curio || !window.THREE || !window.createGlobeHero) return;

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* Wide screens only — /globe.js decides that and never loads this file otherwise. */
  var TUNE = { globeFrac: 0.78, headFrac: 0.55, particles: 520, meteors: 14,
               bloom: 0.5, dpr: 2, motion: 0.65 };

  var style = document.createElement('style');
  style.textContent =
    '.curio .neb,.curio .sky,.curio .sky-fx{display:none!important}' +
    'main{position:relative}' +
    '.curio-sky{position:absolute;z-index:-1;display:block;pointer-events:none}';
  document.head.appendChild(style);

  var main = document.querySelector('main') || curio.parentElement;
  var device = document.querySelector('.hero__device');
  var cv = document.createElement('canvas');
  cv.className = 'curio-sky';
  cv.setAttribute('aria-hidden', 'true');
  main.appendChild(cv);

  var R = 1.8, geo = {}, hero;

  function layout() {
    var c = curio.getBoundingClientRect();
    var m = main.getBoundingClientRect();
    var sy = window.scrollY || window.pageYOffset;
    var secBottom = c.bottom + sy;

    /* Anchor: the hero device's lower edge on a wide layout, so the planet's limb
       meets it. On a phone the device is not beside the section, so anchor to the
       section itself instead. */
    var anchor = device
      ? device.getBoundingClientRect().bottom + sy
      : (c.top + sy) - 40;

    var globePx = Math.round(Math.min(c.height, window.innerHeight) * TUNE.globeFrac);
    var head    = Math.round(globePx * TUNE.headFrac);
    var top     = anchor - head;
    var h       = Math.max(240, secBottom - top);
    var vw      = document.documentElement.clientWidth;   // excludes the scrollbar

    cv.style.top    = (top - (m.top + sy)) + 'px';
    cv.style.left   = (0 - m.left) + 'px';
    cv.style.width  = vw + 'px';
    cv.style.height = h + 'px';

    geo.h = h;
    geo.fill = globePx / h;
    geo.cyFrac = (head + globePx / 2) / h;
    geo.cxFrac = device
      ? ((device.getBoundingClientRect().left + device.getBoundingClientRect().width / 2) / vw)
      : 0.66;

    /* Fade top and bottom only. The page's own edges are the horizontal boundary,
       so the field runs the full width instead of dying in a pool round the globe. */
    var t1 = (head * 0.78 / h * 100).toFixed(1);
    var mask = 'linear-gradient(to bottom, transparent 0%, rgba(0,0,0,.65) ' + t1 +
               '%, #000 ' + (+t1 + 14).toFixed(1) + '%, #000 86%, transparent 100%)';
    cv.style.webkitMaskImage = mask;
    cv.style.maskImage = mask;
  }

  function place() {
    if (!hero) return;
    var halfH = R / geo.fill;
    var halfW = halfH * (cv.clientWidth / cv.clientHeight);
    hero.globe.parent.position.set(
      (geo.cxFrac - 0.5) * 2 * halfW,
      (0.5 - geo.cyFrac) * 2 * halfH, 0);
  }

  layout();

  var cs = getComputedStyle(document.documentElement);
  var accent = (cs.getPropertyValue('--accent') || '').trim() || '#08DF9C';
  hero = window.createGlobeHero(cv, {
    colors: { violet: accent, cyan: '#6FF3C8', ice: '#DFFBF0', plum: '#0C5B45', deep: '#0B1410' },
    fill: geo.fill, tilt: 23.5,
    motion: reduced ? 0.25 : TUNE.motion,
    bloom: TUNE.bloom, exposure: 1.04,
    meteors: TUNE.meteors, particles: TUNE.particles,
    dprCap: TUNE.dpr, manualPlacement: true
  });
  place();

  var ro = new ResizeObserver(function () { layout(); place(); });
  ro.observe(main);
  window.__doubleemSky = hero;
})();
