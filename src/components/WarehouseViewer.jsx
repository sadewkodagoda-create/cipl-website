import React, {
  Component,
  Suspense,
  useEffect,
  useMemo,
  useState,
} from "react";
import { Canvas } from "@react-three/fiber";
import {
  ContactShadows,
  OrbitControls,
  useGLTF,
  useProgress,
} from "@react-three/drei";
import { Cube, WarningCircle } from "@phosphor-icons/react";
import { useReducedMotion } from "framer-motion";
import * as THREE from "three";

const MODEL_DIAMETER = 11;
const MODEL_STAGE_OFFSET_X = 1.35;

function hasInvisibleVertexAlpha(attribute) {
  if (!attribute || attribute.itemSize < 4) return false;

  for (let index = 0; index < attribute.count; index += 1) {
    if (attribute.getW(index) > 0.001) return false;
  }

  return true;
}

function UploadedModel({ url, onReady }) {
  const { scene } = useGLTF(url);
  const prepared = useMemo(() => {
    const model = scene.clone(true);

    model.traverse((object) => {
      if (object.isMesh) {
        const vertexColors = object.geometry.getAttribute("color");
        const hasInvalidVertexAlpha = hasInvisibleVertexAlpha(vertexColors);

        // Some CAD/FBX exporters write COLOR_0 with alpha=0 for every vertex.
        // That is valid GLB data, but it makes the complete model invisible.
        // Clone geometry only for this uncommon repair path. Most models can
        // safely share the parsed geometry and avoid a costly full copy.
        if (hasInvalidVertexAlpha) {
          object.geometry = object.geometry.clone();
          object.geometry.deleteAttribute("color");
        }

        const materials = Array.isArray(object.material)
          ? object.material
          : [object.material];
        const safeMaterials = materials.map((material) => {
          const safeMaterial = material.clone();
          safeMaterial.side = THREE.DoubleSide;

          if (hasInvalidVertexAlpha) {
            safeMaterial.vertexColors = false;
            safeMaterial.transparent = false;
            safeMaterial.opacity = 1;
            if (safeMaterial.color && !safeMaterial.map) {
              safeMaterial.color.set("#b49a69");
            }
            if (typeof safeMaterial.roughness === "number") {
              safeMaterial.roughness = Math.max(safeMaterial.roughness, 0.58);
            }
          }

          safeMaterial.needsUpdate = true;
          return safeMaterial;
        });

        object.material = Array.isArray(object.material)
          ? safeMaterials
          : safeMaterials[0];
      }
    });

    model.updateMatrixWorld(true);
    const bounds = new THREE.Box3().setFromObject(model);
    const size = bounds.getSize(new THREE.Vector3());
    const center = bounds.getCenter(new THREE.Vector3());
    const largestDimension = Math.max(size.x, size.y, size.z);

    if (!Number.isFinite(largestDimension) || largestDimension <= 0) {
      throw new Error("The uploaded GLB does not contain visible geometry.");
    }

    return {
      model,
      offset: [-center.x, -bounds.min.y, -center.z],
      scale: MODEL_DIAMETER / largestDimension,
    };
  }, [scene]);

  useEffect(
    () => () => {
      prepared.model.traverse((object) => {
        if (!object.isMesh) return;
        object.geometry?.dispose();
        const materials = Array.isArray(object.material)
          ? object.material
          : [object.material];
        materials.forEach((material) => material?.dispose());
      });
      useGLTF.clear(url);
    },
    [prepared, url],
  );

  useEffect(() => {
    onReady(url);
  }, [onReady, url]);

  return (
    <group position={[MODEL_STAGE_OFFSET_X, 0, 0]} scale={prepared.scale}>
      <group position={prepared.offset}>
        <primitive object={prepared.model} dispose={null} />
      </group>
    </group>
  );
}

class ModelErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { failed: false };
  }

  static getDerivedStateFromError() {
    return { failed: true };
  }

  render() {
    if (this.state.failed) return this.props.fallback;
    return this.props.children;
  }
}

function EmptyModel({ message }) {
  return (
    <div className="model-viewer-empty">
      <span>
        <Cube size={34} weight="thin" />
      </span>
      <h3>No 3D model published yet</h3>
      <p>
        {message ||
          "The first construction model will appear here after it is published by the project team."}
      </p>
    </div>
  );
}

function BrokenModel() {
  return (
    <div className="model-viewer-empty model-viewer-error" role="alert">
      <span>
        <WarningCircle size={34} weight="thin" />
      </span>
      <h3>This model could not be opened</h3>
      <p>Ask the project team to upload a valid binary glTF (.glb) file.</p>
    </div>
  );
}

function ModelLoadingStatus({ visible }) {
  const { progress } = useProgress();
  if (!visible) return null;

  return (
    <div className="model-viewer-load-status" role="status" aria-live="polite">
      <span className="model-viewer-spinner" aria-hidden="true" />
      <span>Loading 3D model… {Math.round(progress)}%</span>
    </div>
  );
}

export default function WarehouseViewer({
  modelUrl,
  title,
  siteUpdate,
  uploadedAt,
  emptyMessage,
}) {
  const reduceMotion = useReducedMotion();
  const [readyModelUrl, setReadyModelUrl] = useState(null);
  if (!modelUrl) return <EmptyModel message={emptyMessage} />;
  const modelLoading = readyModelUrl !== modelUrl;

  return (
    <ModelErrorBoundary key={modelUrl} fallback={<BrokenModel />}>
      <div className="construction-model-viewer" aria-busy={modelLoading}>
        <div className="model-viewer-caption">
          <p>3D construction update</p>
          <strong>{title || "Latest model"}</strong>
          {siteUpdate && <span>{siteUpdate}</span>}
          {uploadedAt && (
            <time>{new Date(uploadedAt).toLocaleDateString()}</time>
          )}
        </div>
        <ModelLoadingStatus visible={modelLoading} />
        <Canvas
          camera={{ position: [10.5, 9, 12], fov: 40, near: 0.05, far: 200 }}
          dpr={[1, 1.25]}
          frameloop={reduceMotion ? "demand" : "always"}
          gl={{ antialias: true, powerPreference: "high-performance" }}
        >
          <color attach="background" args={["#dfe9ef"]} />
          <fog attach="fog" args={["#dfe9ef", 22, 48]} />
          <ambientLight intensity={0.85} />
          <hemisphereLight args={["#ffffff", "#6c7f8d", 1.7]} />
          <directionalLight position={[8, 12, 7]} intensity={2.2} />
          <Suspense fallback={null}>
            <UploadedModel url={modelUrl} onReady={setReadyModelUrl} />
            <ContactShadows
              position={[0, -0.02, 0]}
              opacity={0.28}
              scale={18}
              blur={2.8}
              far={8}
              frames={1}
              resolution={256}
            />
          </Suspense>
          <gridHelper
            args={[24, 24, "#9db0bd", "#c5d1d9"]}
            position={[0, -0.03, 0]}
          />
          <OrbitControls
            makeDefault
            autoRotate={!reduceMotion}
            autoRotateSpeed={0.28}
            target={[MODEL_STAGE_OFFSET_X, 0.55, 0]}
            minDistance={2}
            maxDistance={40}
            maxPolarAngle={Math.PI / 2.03}
          />
        </Canvas>
        <p className="model-viewer-help">
          <Cube size={15} /> Drag to rotate. Scroll to zoom.
        </p>
      </div>
    </ModelErrorBoundary>
  );
}
