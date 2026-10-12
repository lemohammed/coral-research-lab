import * as THREE from "three";

export function createWater() {
  const material = new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 } },
    vertexShader: `
      uniform float uTime;
      varying vec3 vWorld;
      void main() {
        vec3 p = position;
        p.z += sin(p.x * .009 + uTime * .65) * .75 + cos(p.y * .013 - uTime * .4) * .5;
        vec4 world = modelMatrix * vec4(p, 1.0);
        vWorld = world.xyz;
        gl_Position = projectionMatrix * viewMatrix * world;
      }`,
    fragmentShader: `
      uniform float uTime;
      varying vec3 vWorld;
      void main() {
        float ripple = sin(vWorld.x * .018 + vWorld.z * .026 + uTime * .75);
        ripple += sin(vWorld.x * .043 - vWorld.z * .017 - uTime * .42) * .42;
        float shimmer = pow(max(0.0, ripple * .65), 16.0);
        vec3 color = vec3(.59, .62, .64) + ripple * .009 + shimmer * .047;
        float distanceFade = smoothstep(2000.0, 11500.0, distance(cameraPosition, vWorld));
        color = mix(color, vec3(.81, .83, .84), distanceFade);
        gl_FragColor = vec4(color, 1.0);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`,
  });
  const geometry = new THREE.PlaneGeometry(24000, 24000, 96, 96);
  const mesh = new THREE.Mesh(geometry, material); mesh.rotation.x = -Math.PI / 2;
  return { mesh, update: (seconds: number) => { material.uniforms.uTime.value = seconds; } };
}
