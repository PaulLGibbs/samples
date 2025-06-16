import{ED as xe,Ey as Se,Dy as m,E2 as w,EG as Ve,Eb as H,Dd as l,g7 as j,u6 as le,EB as ye,Df as A,uA as Ce,e4 as v,e2 as oe,aT as d,fY as U,eE as B,FG as Le,fX as ce,E0 as he,De as M,aW as b,FH as de,fP as ue,aU as pe,gk as Ae,gh as Me,m$ as Te,ka as $e,gB as Re,gi as Ue,e3 as fe,Dh as ge,Di as _e,bS as me,E9 as ze,bW as G,gt as N,Ez as Ie,qN as Oe,b$ as qe,EH as Ne,Fd as je,fH as o,Ea as X,fL as Fe,aX as R,ht as We,fR as Pe,fK as z,ut as He,iI as Be,E as Ge,hr as Xe,FI as ke,D as _,Ds as S,EM as Ze,EN as k,FJ as Ke,FK as Ye,mG as Je,EO as c,FL as I,FM as Qe,CX as Z,gv as et,gx as tt,sR as it,gy as nt,gz as st,gA as at,F as T,L as rt,FN as lt,bY as K,fV as Y,gr as J,fW as Q,pj as ot,pp as ct,FO as ht,po as dt,pi as ut,ig as pt,aS as ee,Ap as ft,xu as gt,mA as _t,g0 as te,FP as mt}from"./index-Bis5Kf-g.js";import{t as Pt,a as vt}from"./LineVisualElement-B8owhhPI.js";function ve(t,e){const i=t.fragment;i.include(xe),t.include(Se),i.uniforms.add(new m("globalAlpha",n=>n.globalAlpha),new w("glowColor",n=>n.glowColor),new m("glowWidth",(n,s)=>n.glowWidth*s.camera.pixelRatio),new m("glowFalloff",n=>n.glowFalloff),new w("innerColor",n=>n.innerColor),new m("innerWidth",(n,s)=>n.innerWidth*s.camera.pixelRatio),new Ve("depthMap",n=>{var s;return(s=n.depth)==null?void 0:s.attachment}),new H("normalMap",n=>n.normals)),i.code.add(l`vec4 blendPremultiplied(vec4 source, vec4 dest) {
float oneMinusSourceAlpha = 1.0 - source.a;
return vec4(
source.rgb + dest.rgb * oneMinusSourceAlpha,
source.a + dest.a * oneMinusSourceAlpha
);
}`),i.code.add(l`vec4 premultipliedColor(vec3 rgb, float alpha) {
return vec4(rgb * alpha, alpha);
}`),i.code.add(l`vec4 laserlineProfile(float dist) {
if (dist > glowWidth) {
return vec4(0.0);
}
float innerAlpha = (1.0 - smoothstep(0.0, innerWidth, dist));
float glowAlpha = pow(max(0.0, 1.0 - dist / glowWidth), glowFalloff);
return blendPremultiplied(
premultipliedColor(innerColor, innerAlpha),
premultipliedColor(glowColor, glowAlpha)
);
}`),i.code.add(l`bool laserlineReconstructFromDepth(out vec3 pos, out vec3 normal, out float angleCutoffAdjust, out float depthDiscontinuityAlpha) {
float depth = depthFromTexture(depthMap, uv);
if (depth == 1.0) {
return false;
}
float linearDepth = linearizeDepth(depth);
pos = reconstructPosition(gl_FragCoord.xy, linearDepth);
float minStep = 6e-8;
float depthStep = clamp(depth + minStep, 0.0, 1.0);
float linearDepthStep = linearizeDepth(depthStep);
float depthError = abs(linearDepthStep - linearDepth);
if (depthError > 0.2) {
normal = texture(normalMap, uv).xyz * 2.0 - 1.0;
angleCutoffAdjust = 0.004;
} else {
normal = normalize(cross(dFdx(pos), dFdy(pos)));
angleCutoffAdjust = 0.0;
}
float ddepth = fwidth(linearDepth);
depthDiscontinuityAlpha = 1.0 - smoothstep(0.0, 0.01, -ddepth / linearDepth);
return true;
}`),e.contrastControlEnabled?i.uniforms.add(new H("frameColor",(n,s)=>n.colors),new m("globalAlphaContrastBoost",n=>n.globalAlphaContrastBoost)).code.add(l`float rgbToLuminance(vec3 color) {
return dot(vec3(0.2126, 0.7152, 0.0722), color);
}
vec4 laserlineOutput(vec4 color) {
float backgroundLuminance = rgbToLuminance(texture(frameColor, uv).rgb);
float alpha = clamp(globalAlpha * max(backgroundLuminance * globalAlphaContrastBoost, 1.0), 0.0, 1.0);
return color * alpha;
}`):i.code.add(l`vec4 laserlineOutput(vec4 color) {
return color * globalAlpha;
}`)}const F=j(6);function be(t){const e=new le;e.include(ye),e.include(ve,t);const i=e.fragment;if(t.lineVerticalPlaneEnabled||t.heightManifoldEnabled)if(i.uniforms.add(new m("maxPixelDistance",(n,s)=>t.heightManifoldEnabled?2*s.camera.computeScreenPixelSizeAt(n.heightManifoldTarget):2*s.camera.computeScreenPixelSizeAt(n.lineVerticalPlaneSegment.origin))),i.code.add(l`float planeDistancePixels(vec4 plane, vec3 pos) {
float dist = dot(plane.xyz, pos) + plane.w;
float width = fwidth(dist);
dist /= min(width, maxPixelDistance);
return abs(dist);
}`),t.spherical){const n=(a,r,h)=>v(a,r.heightManifoldTarget,h.camera.viewMatrix),s=(a,r)=>v(a,[0,0,0],r.camera.viewMatrix);i.uniforms.add(new A("heightManifoldOrigin",(a,r)=>(n(g,a,r),s(x,r),oe(x,x,g),U(f,x),f[3]=B(x),f)),new Le("globalOrigin",a=>s(g,a)),new m("cosSphericalAngleThreshold",(a,r)=>1-Math.max(2,ce(r.camera.eye,a.heightManifoldTarget)*r.camera.perRenderPixelRatio)/B(a.heightManifoldTarget))),i.code.add(l`float globeDistancePixels(float posInGlobalOriginLength) {
float dist = abs(posInGlobalOriginLength - heightManifoldOrigin.w);
float width = fwidth(dist);
dist /= min(width, maxPixelDistance);
return abs(dist);
}
float heightManifoldDistancePixels(vec4 heightPlane, vec3 pos) {
vec3 posInGlobalOriginNorm = normalize(globalOrigin - pos);
float cosAngle = dot(posInGlobalOriginNorm, heightManifoldOrigin.xyz);
vec3 posInGlobalOrigin = globalOrigin - pos;
float posInGlobalOriginLength = length(posInGlobalOrigin);
float sphericalDistance = globeDistancePixels(posInGlobalOriginLength);
float planarDistance = planeDistancePixels(heightPlane, pos);
return cosAngle < cosSphericalAngleThreshold ? sphericalDistance : planarDistance;
}`)}else i.code.add(l`float heightManifoldDistancePixels(vec4 heightPlane, vec3 pos) {
return planeDistancePixels(heightPlane, pos);
}`);if(t.pointDistanceEnabled&&(i.uniforms.add(new m("maxPixelDistance",(n,s)=>2*s.camera.computeScreenPixelSizeAt(n.pointDistanceTarget))),i.code.add(l`float sphereDistancePixels(vec4 sphere, vec3 pos) {
float dist = distance(sphere.xyz, pos) - sphere.w;
float width = fwidth(dist);
dist /= min(width, maxPixelDistance);
return abs(dist);
}`)),t.intersectsLineEnabled&&i.uniforms.add(new he("perScreenPixelRatio",n=>n.camera.perScreenPixelRatio)).code.add(l`float lineDistancePixels(vec3 start, vec3 dir, float radius, vec3 pos) {
float dist = length(cross(dir, pos - start)) / (length(pos) * perScreenPixelRatio);
return abs(dist) - radius;
}`),(t.lineVerticalPlaneEnabled||t.intersectsLineEnabled)&&i.code.add(l`bool pointIsWithinLine(vec3 pos, vec3 start, vec3 end) {
vec3 dir = end - start;
float t2 = dot(dir, pos - start);
float l2 = dot(dir, dir);
return t2 >= 0.0 && t2 <= l2;
}`),i.main.add(l`vec3 pos;
vec3 normal;
float angleCutoffAdjust;
float depthDiscontinuityAlpha;
if (!laserlineReconstructFromDepth(pos, normal, angleCutoffAdjust, depthDiscontinuityAlpha)) {
fragColor = vec4(0.0);
return;
}
vec4 color = vec4(0.0);`),t.heightManifoldEnabled){i.uniforms.add(new M("angleCutoff",s=>$(s)),new A("heightPlane",(s,a)=>Ee(s.heightManifoldTarget,s.renderCoordsHelper.worldUpAtPosition(s.heightManifoldTarget,g),a.camera.viewMatrix)));const n=t.spherical?l`normalize(globalOrigin - pos)`:l`heightPlane.xyz`;i.main.add(l`
      vec2 angleCutoffAdjusted = angleCutoff - angleCutoffAdjust;
      // Fade out laserlines on flat surfaces
      float heightManifoldAlpha = 1.0 - smoothstep(angleCutoffAdjusted.x, angleCutoffAdjusted.y, abs(dot(normal, ${n})));
      vec4 heightManifoldColor = laserlineProfile(heightManifoldDistancePixels(heightPlane, pos));
      color = max(color, heightManifoldColor * heightManifoldAlpha);`)}return t.pointDistanceEnabled&&(i.uniforms.add(new M("angleCutoff",n=>$(n)),new A("pointDistanceSphere",(n,s)=>bt(n,s))),i.main.add(l`float pointDistanceSphereDistance = sphereDistancePixels(pointDistanceSphere, pos);
vec4 pointDistanceSphereColor = laserlineProfile(pointDistanceSphereDistance);
float pointDistanceSphereAlpha = 1.0 - smoothstep(angleCutoff.x, angleCutoff.y, abs(dot(normal, normalize(pos - pointDistanceSphere.xyz))));
color = max(color, pointDistanceSphereColor * pointDistanceSphereAlpha);`)),t.lineVerticalPlaneEnabled&&(i.uniforms.add(new M("angleCutoff",n=>$(n)),new A("lineVerticalPlane",(n,s)=>Et(n,s)),new w("lineVerticalStart",(n,s)=>Dt(n,s)),new w("lineVerticalEnd",(n,s)=>wt(n,s))),i.main.add(l`if (pointIsWithinLine(pos, lineVerticalStart, lineVerticalEnd)) {
float lineVerticalDistance = planeDistancePixels(lineVerticalPlane, pos);
vec4 lineVerticalColor = laserlineProfile(lineVerticalDistance);
float lineVerticalAlpha = 1.0 - smoothstep(angleCutoff.x, angleCutoff.y, abs(dot(normal, lineVerticalPlane.xyz)));
color = max(color, lineVerticalColor * lineVerticalAlpha);
}`)),t.intersectsLineEnabled&&(i.uniforms.add(new M("angleCutoff",n=>$(n)),new w("intersectsLineStart",(n,s)=>v(g,n.lineStartWorld,s.camera.viewMatrix)),new w("intersectsLineEnd",(n,s)=>v(g,n.lineEndWorld,s.camera.viewMatrix)),new w("intersectsLineDirection",(n,s)=>(b(f,n.intersectsLineSegment.vector),f[3]=0,U(g,de(f,f,s.camera.viewMatrix)))),new m("intersectsLineRadius",n=>n.intersectsLineRadius)),i.main.add(l`if (pointIsWithinLine(pos, intersectsLineStart, intersectsLineEnd)) {
float intersectsLineDistance = lineDistancePixels(intersectsLineStart, intersectsLineDirection, intersectsLineRadius, pos);
vec4 intersectsLineColor = laserlineProfile(intersectsLineDistance);
float intersectsLineAlpha = 1.0 - smoothstep(angleCutoff.x, angleCutoff.y, 1.0 - abs(dot(normal, intersectsLineDirection)));
color = max(color, intersectsLineColor * intersectsLineAlpha);
}`)),i.main.add(l`fragColor = laserlineOutput(color * depthDiscontinuityAlpha);`),e}function $(t){return ue(xt,Math.cos(t.angleCutoff),Math.cos(Math.max(0,t.angleCutoff-j(2))))}function bt(t,e){return v($e(O),t.pointDistanceOrigin,e.camera.viewMatrix),O[3]=ce(t.pointDistanceOrigin,t.pointDistanceTarget),O}function Et(t,e){const i=Re(t.lineVerticalPlaneSegment,.5,g),n=t.renderCoordsHelper.worldUpAtPosition(i,St),s=U(x,t.lineVerticalPlaneSegment.vector),a=Ue(g,n,s);return U(a,a),Ee(t.lineVerticalPlaneSegment.origin,a,e.camera.viewMatrix)}function Dt(t,e){const i=b(g,t.lineVerticalPlaneSegment.origin);return t.renderCoordsHelper.setAltitude(i,0),v(i,i,e.camera.viewMatrix)}function wt(t,e){const i=fe(g,t.lineVerticalPlaneSegment.origin,t.lineVerticalPlaneSegment.vector);return t.renderCoordsHelper.setAltitude(i,0),v(i,i,e.camera.viewMatrix)}function Ee(t,e,i){return v(ie,t,i),b(f,e),f[3]=0,de(f,f,i),Ae(ie,f,Vt)}const xt=pe(),g=d(),f=Ce(),St=d(),x=d(),ie=d(),Vt=Me(),O=Te(),yt=Object.freeze(Object.defineProperty({__proto__:null,build:be,defaultAngleCutoff:F},Symbol.toStringTag,{value:"Module"}));let Ct=class extends ze{constructor(){super(...arguments),this.innerColor=G(1,1,1),this.innerWidth=1,this.glowColor=G(1,.5,0),this.glowWidth=8,this.glowFalloff=8,this.globalAlpha=.75,this.globalAlphaContrastBoost=2,this.angleCutoff=j(6),this.pointDistanceOrigin=d(),this.pointDistanceTarget=d(),this.lineVerticalPlaneSegment=N(),this.intersectsLineSegment=N(),this.intersectsLineRadius=3,this.heightManifoldTarget=d(),this.lineStartWorld=d(),this.lineEndWorld=d()}};class Lt extends ge{constructor(e,i){super(e,i,new _e(yt,()=>me(()=>Promise.resolve().then(()=>Ot),void 0)))}}function De(t){const e=new le;e.include(ve,t);const{vertex:i,fragment:n}=e;i.uniforms.add(new Ie("modelView",(a,{camera:r})=>Oe(Mt,r.viewMatrix,a.origin)),new Ne("proj",({camera:a})=>a.projectionMatrix),new m("glowWidth",(a,{camera:r})=>a.glowWidth*r.pixelRatio),new je("pixelToNDC",({camera:a})=>ue(At,2/a.fullViewport[2],2/a.fullViewport[3]))),e.attributes.add(o.START,"vec3"),e.attributes.add(o.END,"vec3"),t.spherical&&(e.attributes.add(o.START_UP,"vec3"),e.attributes.add(o.END_UP,"vec3")),e.attributes.add(o.EXTRUDE,"vec2"),e.varyings.add("uv","vec2"),e.varyings.add("vViewStart","vec3"),e.varyings.add("vViewEnd","vec3"),e.varyings.add("vViewSegmentNormal","vec3"),e.varyings.add("vViewStartNormal","vec3"),e.varyings.add("vViewEndNormal","vec3");const s=!t.spherical;return i.main.add(l`
    vec3 pos = mix(start, end, extrude.x);

    vec4 viewPos = modelView * vec4(pos, 1);
    vec4 projPos = proj * viewPos;
    vec2 ndcPos = projPos.xy / projPos.w;

    // in planar we hardcode the up vectors to be Z-up */
    ${X(s,l`vec3 startUp = vec3(0, 0, 1);`)}
    ${X(s,l`vec3 endUp = vec3(0, 0, 1);`)}

    // up vector corresponding to the location of the vertex, selecting either startUp or endUp */
    vec3 up = extrude.y * mix(startUp, endUp, extrude.x);
    vec3 viewUp = (modelView * vec4(up, 0)).xyz;

    vec4 projPosUp = proj * vec4(viewPos.xyz + viewUp, 1);
    vec2 projUp = normalize(projPosUp.xy / projPosUp.w - ndcPos);

    // extrude ndcPos along projUp to the edge of the screen
    vec2 lxy = abs(sign(projUp) - ndcPos);
    ndcPos += length(lxy) * projUp;

    vViewStart = (modelView * vec4(start, 1)).xyz;
    vViewEnd = (modelView * vec4(end, 1)).xyz;

    vec3 viewStartEndDir = vViewEnd - vViewStart;

    vec3 viewStartUp = (modelView * vec4(startUp, 0)).xyz;

    // the normal of the plane that aligns with the segment and the up vector
    vViewSegmentNormal = normalize(cross(viewStartUp, viewStartEndDir));

    // the normal orthogonal to the segment normal and the start up vector
    vViewStartNormal = -normalize(cross(vViewSegmentNormal, viewStartUp));

    // the normal orthogonal to the segment normal and the end up vector
    vec3 viewEndUp = (modelView * vec4(endUp, 0)).xyz;
    vViewEndNormal = normalize(cross(vViewSegmentNormal, viewEndUp));

    // Add enough padding in the X screen space direction for "glow"
    float xPaddingPixels = sign(dot(vViewSegmentNormal, viewPos.xyz)) * (extrude.x * 2.0 - 1.0) * glowWidth;
    ndcPos.x += xPaddingPixels * pixelToNDC.x;

    // uv is used to read back depth to reconstruct the position at the fragment
    uv = ndcPos * 0.5 + 0.5;

    gl_Position = vec4(ndcPos, 0, 1);
  `),n.uniforms.add(new he("perScreenPixelRatio",a=>a.camera.perScreenPixelRatio)),n.code.add(l`float planeDistance(vec3 planeNormal, vec3 planeOrigin, vec3 pos) {
return dot(planeNormal, pos - planeOrigin);
}
float segmentDistancePixels(vec3 segmentNormal, vec3 startNormal, vec3 endNormal, vec3 pos, vec3 start, vec3 end) {
float distSegmentPlane = planeDistance(segmentNormal, start, pos);
float distStartPlane = planeDistance(startNormal, start, pos);
float distEndPlane = planeDistance(endNormal, end, pos);
float dist = max(max(distStartPlane, distEndPlane), abs(distSegmentPlane));
float width = fwidth(distSegmentPlane);
float maxPixelDistance = length(pos) * perScreenPixelRatio * 2.0;
float pixelDist = dist / min(width, maxPixelDistance);
return abs(pixelDist);
}`),n.main.add(l`fragColor = vec4(0.0);
vec3 dEndStart = vViewEnd - vViewStart;
if (dot(dEndStart, dEndStart) < 1e-5) {
return;
}
vec3 pos;
vec3 normal;
float angleCutoffAdjust;
float depthDiscontinuityAlpha;
if (!laserlineReconstructFromDepth(pos, normal, angleCutoffAdjust, depthDiscontinuityAlpha)) {
return;
}
float distance = segmentDistancePixels(
vViewSegmentNormal,
vViewStartNormal,
vViewEndNormal,
pos,
vViewStart,
vViewEnd
);
vec4 color = laserlineProfile(distance);
float alpha = (1.0 - smoothstep(0.995 - angleCutoffAdjust, 0.999 - angleCutoffAdjust, abs(dot(normal, vViewSegmentNormal))));
fragColor = laserlineOutput(color * alpha * depthDiscontinuityAlpha);`),e}const At=pe(),Mt=qe(),Tt=Object.freeze(Object.defineProperty({__proto__:null,build:De},Symbol.toStringTag,{value:"Module"}));class $t extends Ct{constructor(){super(...arguments),this.origin=d()}}let q=class extends ge{constructor(e,i){super(e,i,new _e(Tt,()=>me(()=>Promise.resolve().then(()=>qt),void 0)),we)}};const we=new Map([[o.START,0],[o.END,1],[o.EXTRUDE,2],[o.START_UP,3],[o.END_UP,4]]);let ne=class{constructor(e){this._renderCoordsHelper=e,this._buffers=null,this._origin=d(),this._dirty=!1,this._count=0,this._vao=null}set vertices(e){const i=Fe(3*e.length);let n=0;for(const s of e)i[n++]=s[0],i[n++]=s[1],i[n++]=s[2];this.buffers=[i]}set buffers(e){if(this._buffers=e,this._buffers.length>0){const i=this._buffers[0],n=3*Math.floor(i.length/3/2);R(this._origin,i[n],i[n+1],i[n+2])}else R(this._origin,0,0,0);this._dirty=!0}get origin(){return this._origin}draw(e){const i=this._ensureVAO(e);i!=null&&(e.bindVAO(i),e.drawArrays(We.TRIANGLES,0,this._count))}dispose(){this._vao!=null&&this._vao.dispose()}get _layout(){return this._renderCoordsHelper.viewingMode===z.Global?Ut:zt}_ensureVAO(e){return this._buffers==null?null:(this._vao??(this._vao=this._createVAO(e,this._buffers)),this._ensureVertexData(this._vao,this._buffers),this._vao)}_createVAO(e,i){const n=this._createDataBuffer(i);return this._dirty=!1,new He(e,we,new Map([["data",Be(this._layout)]]),new Map([["data",Ge.createVertex(e,Xe.STATIC_DRAW,n)]]))}_ensureVertexData(e,i){var s;if(!this._dirty)return;const n=this._createDataBuffer(i);(s=e.vertexBuffers.get("data"))==null||s.setData(n),this._dirty=!1}_createDataBuffer(e){const i=e.reduce((u,p)=>u+se(p),0);this._count=i;const n=this._layout.createBuffer(i),s=this._origin;let a=0,r=0;const h="startUp"in n?this._setUpVectors.bind(this,n):void 0;for(const u of e){for(let p=0;p<u.length;p+=3){const L=R(ae,u[p],u[p+1],u[p+2]);p===0?r=this._renderCoordsHelper.getAltitude(L):this._renderCoordsHelper.setAltitude(L,r);const P=a+2*p;h==null||h(p,P,u,L);const W=oe(ae,L,s);if(p<u.length-3){for(let E=0;E<6;E++)n.start.setVec(P+E,W);n.extrude.setValues(P,0,-1),n.extrude.setValues(P+1,1,-1),n.extrude.setValues(P+2,1,1),n.extrude.setValues(P+3,0,-1),n.extrude.setValues(P+4,1,1),n.extrude.setValues(P+5,0,1)}if(p>0)for(let E=-6;E<0;E++)n.end.setVec(P+E,W)}a+=se(u)}return n.buffer}_setUpVectors(e,i,n,s,a){const r=this._renderCoordsHelper.worldUpAtPosition(a,Rt);if(i<s.length-3)for(let h=0;h<6;h++)e.startUp.setVec(n+h,r);if(i>0)for(let h=-6;h<0;h++)e.endUp.setVec(n+h,r)}};function se(t){return 3*(2*(t.length/3-1))}const Rt=d(),ae=d(),Ut=Pe().vec3f(o.START).vec3f(o.END).vec2f(o.EXTRUDE).vec3f(o.START_UP).vec3f(o.END_UP),zt=Pe().vec3f(o.START).vec3f(o.END).vec2f(o.EXTRUDE);class C extends ke{constructor(){super(...arguments),this.contrastControlEnabled=!1,this.spherical=!1}}_([S()],C.prototype,"contrastControlEnabled",void 0),_([S()],C.prototype,"spherical",void 0);class y extends C{constructor(){super(...arguments),this.heightManifoldEnabled=!1,this.pointDistanceEnabled=!1,this.lineVerticalPlaneEnabled=!1,this.intersectsLineEnabled=!1}}_([S()],y.prototype,"heightManifoldEnabled",void 0),_([S()],y.prototype,"pointDistanceEnabled",void 0),_([S()],y.prototype,"lineVerticalPlaneEnabled",void 0),_([S()],y.prototype,"intersectsLineEnabled",void 0);let D=class extends Ze{constructor(t){super(t),this.produces=k.LASERLINES,this.consumes={required:[k.LASERLINES,"normals"]},this.requireGeometryDepth=!0,this._configuration=new y,this._pathTechniqueConfiguration=new C,this._heightManifoldEnabled=!1,this._pointDistanceEnabled=!1,this._lineVerticalPlaneEnabled=!1,this._intersectsLineEnabled=!1,this._intersectsLineInfinite=!1,this._pathVerticalPlaneEnabled=!1,this._passParameters=new $t;const e=t.view._stage.renderView.techniques,i=new C;i.contrastControlEnabled=t.contrastControlEnabled,e.precompile(q,i)}initialize(){this._passParameters.renderCoordsHelper=this.view.renderCoordsHelper,this._pathTechniqueConfiguration.spherical=this.view.state.viewingMode===z.Global,this._pathTechniqueConfiguration.contrastControlEnabled=this.contrastControlEnabled,this._techniques.precompile(q,this._pathTechniqueConfiguration),this._blit=new Ke(this._techniques,Ye.PremultipliedAlpha)}destroy(){this._pathVerticalPlaneData=Je(this._pathVerticalPlaneData),this._blit=null}get _techniques(){return this.view._stage.renderView.techniques}get heightManifoldEnabled(){return this._heightManifoldEnabled}set heightManifoldEnabled(t){this._heightManifoldEnabled!==t&&(this._heightManifoldEnabled=t,this.requestRender(c.UPDATE))}get heightManifoldTarget(){return this._passParameters.heightManifoldTarget}set heightManifoldTarget(t){b(this._passParameters.heightManifoldTarget,t),this.requestRender(c.UPDATE)}get pointDistanceEnabled(){return this._pointDistanceEnabled}set pointDistanceEnabled(t){t!==this._pointDistanceEnabled&&(this._pointDistanceEnabled=t,this.requestRender(c.UPDATE))}get pointDistanceTarget(){return this._passParameters.pointDistanceTarget}set pointDistanceTarget(t){b(this._passParameters.pointDistanceTarget,t),this.requestRender(c.UPDATE)}get pointDistanceOrigin(){return this._passParameters.pointDistanceOrigin}set pointDistanceOrigin(t){b(this._passParameters.pointDistanceOrigin,t),this.requestRender(c.UPDATE)}get lineVerticalPlaneEnabled(){return this._lineVerticalPlaneEnabled}set lineVerticalPlaneEnabled(t){t!==this._lineVerticalPlaneEnabled&&(this._lineVerticalPlaneEnabled=t,this.requestRender(c.UPDATE))}get lineVerticalPlaneSegment(){return this._passParameters.lineVerticalPlaneSegment}set lineVerticalPlaneSegment(t){I(t,this._passParameters.lineVerticalPlaneSegment),this.requestRender(c.UPDATE)}get intersectsLineEnabled(){return this._intersectsLineEnabled}set intersectsLineEnabled(t){t!==this._intersectsLineEnabled&&(this._intersectsLineEnabled=t,this.requestRender(c.UPDATE))}get intersectsLineSegment(){return this._passParameters.intersectsLineSegment}set intersectsLineSegment(t){I(t,this._passParameters.intersectsLineSegment),this.requestRender(c.UPDATE)}get intersectsLineInfinite(){return this._intersectsLineInfinite}set intersectsLineInfinite(t){t!==this._intersectsLineInfinite&&(this._intersectsLineInfinite=t,this.requestRender(c.UPDATE))}get pathVerticalPlaneEnabled(){return this._pathVerticalPlaneEnabled}set pathVerticalPlaneEnabled(t){t!==this._pathVerticalPlaneEnabled&&(this._pathVerticalPlaneEnabled=t,this._pathVerticalPlaneData!=null&&this.requestRender(c.UPDATE))}set pathVerticalPlaneVertices(t){this._pathVerticalPlaneData==null&&(this._pathVerticalPlaneData=new ne(this._passParameters.renderCoordsHelper)),this._pathVerticalPlaneData.vertices=t,this.pathVerticalPlaneEnabled&&this.requestRender(c.UPDATE)}set pathVerticalPlaneBuffers(t){this._pathVerticalPlaneData==null&&(this._pathVerticalPlaneData=new ne(this._passParameters.renderCoordsHelper)),this._pathVerticalPlaneData.buffers=t,this.pathVerticalPlaneEnabled&&this.requestRender(c.UPDATE)}setParameters(t){Qe(this._passParameters,t)&&this.requestRender(c.UPDATE)}precompile(){this._acquireTechnique()}render(t){const e=t.find(({name:r})=>r===this.produces);if(!this.bindParameters.decorations||this._blit==null)return e;const i=this.renderingContext,n=t.find(({name:r})=>r==="normals");this._passParameters.normals=n==null?void 0:n.getTexture();const s=()=>{(this.heightManifoldEnabled||this.pointDistanceEnabled||this.lineVerticalPlaneSegment||this.intersectsLineEnabled)&&this._renderUnified(),this.pathVerticalPlaneEnabled&&this._renderPath()};if(!this.contrastControlEnabled)return i.bindFramebuffer(e.fbo),s(),e;this._passParameters.colors=e.getTexture();const a=this.fboCache.acquire(e.fbo.width,e.fbo.height,"laser lines");return i.bindFramebuffer(a.fbo),i.setClearColor(0,0,0,0),i.clear(Z.COLOR|Z.DEPTH),s(),i.unbindTexture(e.getTexture()),this._blit.blend(i,a,e,this.bindParameters)||this.requestRender(c.UPDATE),a.release(),e}_acquireTechnique(){return this._configuration.heightManifoldEnabled=this.heightManifoldEnabled,this._configuration.lineVerticalPlaneEnabled=this.lineVerticalPlaneEnabled,this._configuration.pointDistanceEnabled=this.pointDistanceEnabled,this._configuration.intersectsLineEnabled=this.intersectsLineEnabled,this._configuration.contrastControlEnabled=this.contrastControlEnabled,this._configuration.spherical=this.view.state.viewingMode===z.Global,this._techniques.get(Lt,this._configuration)}_renderUnified(){if(!this._updatePassParameters())return;const t=this._acquireTechnique();if(t.compiled){const e=this.renderingContext;e.bindTechnique(t,this.bindParameters,this._passParameters),e.screen.draw()}else this.requestRender(c.UPDATE)}_renderPath(){if(this._pathVerticalPlaneData==null)return;const t=this._techniques.get(q,this._pathTechniqueConfiguration);if(t.compiled){const e=this.renderingContext;this._passParameters.origin=this._pathVerticalPlaneData.origin,e.bindTechnique(t,this.bindParameters,this._passParameters),this._pathVerticalPlaneData.draw(e)}else this.requestRender(c.UPDATE)}_updatePassParameters(){if(!this._intersectsLineEnabled)return!0;const t=this.bindParameters.camera,e=this._passParameters;if(this._intersectsLineInfinite){if(et(it(e.intersectsLineSegment.origin,e.intersectsLineSegment.vector),V),V.c0=-Number.MAX_VALUE,!nt(t.frustum,V))return!1;st(V,e.lineStartWorld),at(V,e.lineEndWorld)}else b(e.lineStartWorld,e.intersectsLineSegment.origin),fe(e.lineEndWorld,e.intersectsLineSegment.origin,e.intersectsLineSegment.vector);return!0}get test(){}};_([T({constructOnly:!0})],D.prototype,"contrastControlEnabled",void 0),_([T({constructOnly:!0})],D.prototype,"isDecoration",void 0),_([T()],D.prototype,"produces",void 0),_([T()],D.prototype,"consumes",void 0),D=_([rt("esri.views.3d.webgl-engine.effects.laserlines.LaserLineRenderer")],D);const V=tt();class Bt extends Pt{constructor(e){super(e),this._angleCutoff=F,this._style={},this._heightManifoldTarget=d(),this._heightManifoldEnabled=!1,this._intersectsLine=N(),this._intersectsLineEnabled=!1,this._intersectsLineInfinite=!1,this._lineVerticalPlaneSegment=null,this._pathVerticalPlaneBuffers=null,this._pointDistanceLine=null,this.applyProperties(e)}get testData(){}createResources(){this._ensureRenderer()}destroyResources(){this._disposeRenderer()}updateVisibility(){this._syncRenderer(),this._syncHeightManifold(),this._syncIntersectsLine(),this._syncPathVerticalPlane(),this._syncLineVerticalPlane(),this._syncPointDistance()}get angleCutoff(){return this._angleCutoff}set angleCutoff(e){this._angleCutoff!==e&&(this._angleCutoff=e,this._syncAngleCutoff())}get style(){return this._style}set style(e){this._style=e,this._syncStyle()}get heightManifoldTarget(){return this._heightManifoldEnabled?this._heightManifoldTarget:null}set heightManifoldTarget(e){e!=null?(b(this._heightManifoldTarget,e),this._heightManifoldEnabled=!0):this._heightManifoldEnabled=!1,this._syncRenderer(),this._syncHeightManifold()}set intersectsWorldUpAtLocation(e){if(e==null)return void(this.intersectsLine=null);const i=this.view.renderCoordsHelper.worldUpAtPosition(e,It);this.intersectsLine=lt(e,i),this.intersectsLineInfinite=!0}get intersectsLine(){return this._intersectsLineEnabled?this._intersectsLine:null}set intersectsLine(e){e!=null?(I(e,this._intersectsLine),this._intersectsLineEnabled=!0):this._intersectsLineEnabled=!1,this._syncIntersectsLine(),this._syncRenderer()}get intersectsLineInfinite(){return this._intersectsLineInfinite}set intersectsLineInfinite(e){this._intersectsLineInfinite=e,this._syncIntersectsLineInfinite()}get lineVerticalPlaneSegment(){return this._lineVerticalPlaneSegment}set lineVerticalPlaneSegment(e){this._lineVerticalPlaneSegment=e!=null?I(e):null,this._syncLineVerticalPlane(),this._syncRenderer()}get pathVerticalPlane(){return this._pathVerticalPlaneBuffers}set pathVerticalPlane(e){this._pathVerticalPlaneBuffers=e,this._syncPathVerticalPlane(),this._syncLineVerticalPlane(),this._syncPointDistance(),this._syncRenderer()}get pointDistanceLine(){return this._pointDistanceLine}set pointDistanceLine(e){this._pointDistanceLine=e!=null?{origin:K(e.origin),target:e.target?K(e.target):null}:null,this._syncPointDistance(),this._syncRenderer()}_syncRenderer(){this.attached&&this.visible&&(this._intersectsLineEnabled||this._heightManifoldEnabled||this._pointDistanceLine!=null||this._pathVerticalPlaneBuffers!=null)?this._ensureRenderer():this._disposeRenderer()}_ensureRenderer(){this._renderer==null&&(this._renderer=new D({view:this.view,contrastControlEnabled:!0,isDecoration:this.isDecoration}),this._syncStyle(),this._syncHeightManifold(),this._syncIntersectsLine(),this._syncIntersectsLineInfinite(),this._syncPathVerticalPlane(),this._syncLineVerticalPlane(),this._syncPointDistance(),this._syncAngleCutoff())}_syncStyle(){this._renderer!=null&&this._renderer.setParameters(this._style)}_syncAngleCutoff(){var e;(e=this._renderer)==null||e.setParameters({angleCutoff:this._angleCutoff})}_syncHeightManifold(){this._renderer!=null&&(this._renderer.heightManifoldEnabled=this._heightManifoldEnabled&&this.visible,this._heightManifoldEnabled&&(this._renderer.heightManifoldTarget=this._heightManifoldTarget))}_syncIntersectsLine(){this._renderer!=null&&(this._renderer.intersectsLineEnabled=this._intersectsLineEnabled&&this.visible,this._intersectsLineEnabled&&(this._renderer.intersectsLineSegment=this._intersectsLine))}_syncIntersectsLineInfinite(){this._renderer!=null&&(this._renderer.intersectsLineInfinite=this._intersectsLineInfinite)}_syncPathVerticalPlane(){this._renderer!=null&&(this._renderer.pathVerticalPlaneEnabled=this._pathVerticalPlaneBuffers!=null&&this.visible,this._pathVerticalPlaneBuffers!=null&&(this._renderer.pathVerticalPlaneBuffers=this._pathVerticalPlaneBuffers))}_syncLineVerticalPlane(){this._renderer!=null&&(this._renderer.lineVerticalPlaneEnabled=this._lineVerticalPlaneSegment!=null&&this.visible,this._lineVerticalPlaneSegment!=null&&(this._renderer.lineVerticalPlaneSegment=this._lineVerticalPlaneSegment))}_syncPointDistance(){if(this._renderer==null)return;const e=this._pointDistanceLine,i=e!=null;this._renderer.pointDistanceEnabled=i&&e.target!=null&&this.visible,i&&(this._renderer.pointDistanceOrigin=e.origin,e.target!=null&&(this._renderer.pointDistanceTarget=e.target))}_disposeRenderer(){this._renderer!=null&&this.view._stage&&(this._renderer.destroy(),this._renderer=null)}}const It=d();let Gt=class extends vt{constructor(e){super(e),this._material=null,this._texture=null,this._geometry=null,this._size=3,this._color=Y(1,0,1,1),this._pixelSnappingEnabled=!0,this._primitive="square",this._outlineSize=1,this._outlineColor=Y(1,1,1,1),this._elevationInfo=null,this.applyProperties(e)}get geometry(){return this._geometry}set geometry(e){this._geometry=e,this.recreateGeometry()}get size(){return this._size}set size(e){if(e!==this._size){const i=this._preferredTextureSize;this._size=e,i<this._preferredTextureSize?this.recreate():this._updateSizeAttribute()}}get color(){return this._color}set color(e){J(e,this._color)||(Q(this._color,e),this._updateMaterial())}get pixelSnappingEnabled(){return this._pixelSnappingEnabled}set pixelSnappingEnabled(e){this._pixelSnappingEnabled!==e&&(this._pixelSnappingEnabled=e,this._updateMaterial())}get primitive(){return this._primitive}set primitive(e){this._primitive!==e&&(this._primitive=e,this.recreate())}get outlineSize(){return this._outlineSize}set outlineSize(e){e!==this._outlineSize&&(this._outlineSize=e,this._updateMaterial())}get outlineColor(){return this._outlineColor}set outlineColor(e){J(e,this._outlineColor)||(Q(this._outlineColor,e),this._updateMaterial())}get elevationInfo(){return this._elevationInfo}set elevationInfo(e){this._elevationInfo=e,this.recreateGeometry()}_updateMaterial(){var e;(e=this._material)==null||e.setParameters(this._materialParameters)}_updateSizeAttribute(){const e=this.object;if(e==null)return;const i=e.geometries[0];if(i==null)return;const n=i.getMutableAttribute(o.SIZE).data,s=this._geometrySize;n[0]=s,n[1]=s,e.geometryVertexAttributeUpdated(e.geometries[0],o.SIZE)}get _materialParameters(){var e;return{color:this._color,textureIsSignedDistanceField:!0,sampleSignedDistanceFieldTexelCenter:ct(this._primitive),distanceFieldBoundingBox:ot,occlusionTest:!1,outlineColor:this._outlineColor,outlineSize:this._outlineSize,textureId:(e=this._texture)==null?void 0:e.id,polygonOffset:!1,shaderPolygonOffset:0,drawAsLabel:!0,depthEnabled:!1,pixelSnappingEnabled:this.pixelSnappingEnabled,isDecoration:this.isDecoration}}get _geometrySize(){return this._size/ht}createExternalResources(){this._texture=dt(this._primitive,this._preferredTextureSize),this._material=new ut(this._materialParameters,this.view.state.viewingMode===z.Global);const e=this.view._stage;this._texture.load(e.renderView.renderingContext),e.add(this._texture)}destroyExternalResources(){this._texture&&(this.view._stage.remove(this._texture),this._texture.dispose(),this._texture=null),this._material=null}createGeometries(e){const i=this._createRenderGeometry();i!=null&&e.addGeometry(i)}forEachExternalMaterial(e){this._material&&e(this._material)}get _preferredTextureSize(){return pt(2*this._geometrySize,16,128)}calculateMapBounds(e){var s;const i=(s=this.object)==null?void 0:s.geometries[0];if(!i)return!1;const n=i.attributes.get(o.POSITION).data;return ee(n,this.view.renderCoordsHelper.spatialReference,re,this.view.spatialReference),ft(e,re),!0}_createRenderGeometry(){const{geometry:e,_material:i}=this;if(e==null||i==null)return null;const{renderCoordsHelper:n,elevationProvider:s}=this.view,a=gt(e,s,_t.fromElevationInfo(this.elevationInfo),n),r=R(te.get(),e.x,e.y,a),h=te.get();ee(r,e.spatialReference,h,n.spatialReference);const u=this._geometrySize;return mt(i,{position:h,size:[u,u],centerOffsetAndDistance:[0,0,0,1]})}};const re=d(),Ot=Object.freeze(Object.defineProperty({__proto__:null,build:be,defaultAngleCutoff:F},Symbol.toStringTag,{value:"Module"})),qt=Object.freeze(Object.defineProperty({__proto__:null,build:De},Symbol.toStringTag,{value:"Module"}));export{Gt as S,Bt as c};
