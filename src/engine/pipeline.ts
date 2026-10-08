import * as THREE from 'three';

// PixelPipeline renders the scene into a small render target, adds crisp
// depth/normal outlines (dark silhouettes + light crease highlights), then
// upscales with nearest-neighbor filtering. The camera is snapped to the
// texel grid and the leftover sub-texel offset is applied during the blit,
// so scrolling stays smooth without the classic pixel "swim".

const LAYER_NO_OUTLINE = 1;
export { LAYER_NO_OUTLINE };

const compositeVert = /* glsl */ `
  void main() { gl_Position = vec4(position.xy, 0.0, 1.0); }
`;

const compositeFrag = /* glsl */ `
  uniform sampler2D tColor;
  uniform sampler2D tDepth;
  uniform sampler2D tNormal;
  uniform vec2 rtSize;       // render target size in texels
  uniform float pixelSize;   // screen pixels per texel
  uniform vec2 subOffset;    // sub-texel camera remainder (texels)
  uniform float depthEdge;
  uniform float normalEdge;
  uniform float vignette;
  uniform vec3 tint;
  uniform vec2 screenSize;

  float getDepth(vec2 t) { return texture2D(tDepth, t / rtSize).r; }
  vec3 getNormal(vec2 t) { return texture2D(tNormal, t / rtSize).rgb * 2.0 - 1.0; }

  void main() {
    // which texel does this screen pixel land in? (+1 for the guard border)
    vec2 tex = floor(gl_FragCoord.xy / pixelSize + subOffset) + 1.0;
    vec2 c = tex + 0.5;

    vec4 col = texture2D(tColor, c / rtSize);
    float d = getDepth(c);
    vec3 n = getNormal(c);

    // depth-based outer outline: a neighbour is noticeably farther away
    float dd = 0.0;
    dd += clamp(getDepth(c + vec2(1.0, 0.0)) - d, 0.0, 1.0);
    dd += clamp(getDepth(c + vec2(-1.0, 0.0)) - d, 0.0, 1.0);
    dd += clamp(getDepth(c + vec2(0.0, 1.0)) - d, 0.0, 1.0);
    dd += clamp(getDepth(c + vec2(0.0, -1.0)) - d, 0.0, 1.0);
    float depthInd = floor(smoothstep(0.004, 0.008, dd) * 2.0) / 2.0;

    // normal-based crease highlight (only on the nearer side)
    float ni = 0.0;
    vec2 offs[4];
    offs[0] = vec2(1.0, 0.0); offs[1] = vec2(-1.0, 0.0); offs[2] = vec2(0.0, 1.0); offs[3] = vec2(0.0, -1.0);
    for (int i = 0; i < 4; i++) {
      vec2 o = offs[i];
      float nd = getDepth(c + o) - d;
      vec3 nn = getNormal(c + o);
      float normalDiff = dot(n - nn, vec3(-1.0, 1.0, 1.0));
      float normalInd = clamp(smoothstep(-0.01, 0.01, normalDiff), 0.0, 1.0);
      float depthOk = clamp(sign(nd * 0.25 + 0.0025), 0.0, 1.0);
      ni += (1.0 - dot(n, nn)) * depthOk * normalInd;
    }
    ni = step(0.15, ni);

    float k = depthInd > 0.0 ? (1.0 - depthEdge * depthInd) : (1.0 + normalEdge * ni);
    vec3 rgb = col.rgb * k;

    // background (no geometry) keeps its clear colour, no outline
    if (d >= 0.9999) rgb = col.rgb;

    rgb *= tint;

    // soft vignette in screen space
    vec2 uv = gl_FragCoord.xy / screenSize;
    float v = smoothstep(0.95, 0.25, distance(uv, vec2(0.5)));
    rgb *= mix(1.0, v, vignette);

    gl_FragColor = vec4(rgb, 1.0);
    #include <colorspace_fragment>
  }
`;

export class PixelPipeline {
  renderer: THREE.WebGLRenderer;
  colorRT: THREE.WebGLRenderTarget;
  normalRT: THREE.WebGLRenderTarget;
  normalMat = new THREE.MeshNormalMaterial();
  quadScene = new THREE.Scene();
  quadCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  composite: THREE.ShaderMaterial;
  pixelSize = 3;
  rtW = 1;
  rtH = 1;
  screenW = 1;
  screenH = 1;

  constructor(canvas: HTMLCanvasElement) {
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(1);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.BasicShadowMap;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;

    const mk = (depth: boolean) => {
      const rt = new THREE.WebGLRenderTarget(1, 1, {
        minFilter: THREE.NearestFilter,
        magFilter: THREE.NearestFilter,
        type: THREE.HalfFloatType,
      });
      if (depth) {
        rt.depthTexture = new THREE.DepthTexture(1, 1);
        rt.depthTexture.type = THREE.FloatType;
      }
      return rt;
    };
    this.colorRT = mk(true);
    this.normalRT = mk(false);

    this.composite = new THREE.ShaderMaterial({
      vertexShader: compositeVert,
      fragmentShader: compositeFrag,
      uniforms: {
        tColor: { value: this.colorRT.texture },
        tDepth: { value: this.colorRT.depthTexture },
        tNormal: { value: this.normalRT.texture },
        rtSize: { value: new THREE.Vector2(1, 1) },
        pixelSize: { value: this.pixelSize },
        subOffset: { value: new THREE.Vector2() },
        depthEdge: { value: 0.5 },
        normalEdge: { value: 0.28 },
        vignette: { value: 0.35 },
        tint: { value: new THREE.Vector3(1, 1, 1) },
        screenSize: { value: new THREE.Vector2(1, 1) },
      },
      depthTest: false,
      depthWrite: false,
    });
    const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), this.composite);
    quad.frustumCulled = false;
    this.quadScene.add(quad);
  }

  /** Resize to CSS pixel dimensions. Returns the render target size in texels. */
  setSize(w: number, h: number, pixelSize: number) {
    this.screenW = Math.max(1, Math.floor(w));
    this.screenH = Math.max(1, Math.floor(h));
    this.pixelSize = pixelSize;
    this.renderer.setSize(this.screenW, this.screenH, false);
    // +2 guard texels so sub-texel shifting never samples off the edge
    this.rtW = Math.ceil(this.screenW / pixelSize) + 2;
    this.rtH = Math.ceil(this.screenH / pixelSize) + 2;
    this.colorRT.setSize(this.rtW, this.rtH);
    this.normalRT.setSize(this.rtW, this.rtH);
    const u = this.composite.uniforms;
    u.rtSize.value.set(this.rtW, this.rtH);
    u.pixelSize.value = pixelSize;
    u.screenSize.value.set(this.screenW, this.screenH);
    return { w: this.rtW, h: this.rtH };
  }

  render(scene: THREE.Scene, camera: THREE.Camera, subOffset: THREE.Vector2) {
    const r = this.renderer;
    // normals pass (skip glow/glass/sprite layer so they don't draw creases)
    const bg = scene.background;
    scene.background = null;
    scene.overrideMaterial = this.normalMat;
    camera.layers.disable(LAYER_NO_OUTLINE);
    r.setRenderTarget(this.normalRT);
    r.setClearColor(0x8080ff, 1);
    r.clear();
    r.render(scene, camera);
    camera.layers.enable(LAYER_NO_OUTLINE);
    scene.overrideMaterial = null;
    scene.background = bg;

    // colour + depth pass
    r.setRenderTarget(this.colorRT);
    r.render(scene, camera);

    // composite to screen
    this.composite.uniforms.subOffset.value.copy(subOffset);
    r.setRenderTarget(null);
    r.render(this.quadScene, this.quadCam);
  }

  setTint(r: number, g: number, b: number) {
    this.composite.uniforms.tint.value.set(r, g, b);
  }

  dispose() {
    this.colorRT.dispose();
    this.normalRT.dispose();
    this.renderer.dispose();
  }
}
