import { Cube } from "@phosphor-icons/react";

export default function ModelEmptyState({ message }) {
  return (
    <div className="model-viewer-empty">
      <span><Cube size={34} weight="thin" /></span>
      <h3>No 3D model published yet</h3>
      <p>{message || "The first construction model will appear here after it is published by the project team."}</p>
    </div>
  );
}
