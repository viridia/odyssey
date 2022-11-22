import {
  Blending,
  BufferGeometry,
  Float32BufferAttribute,
  Material,
  Object3D,
  Quaternion,
  Side,
  Vector3,
} from 'three';

const OPACITY_MULTIPLIER = 0.3;

/** A helper object which displays a semi-transparent shape. */
export abstract class AbstractDualTranslucent<
  Mat extends Material,
  Obj extends Object3D & { geometry: BufferGeometry }
> {
  protected abstract readonly material: Mat;
  protected abstract readonly material2: Mat;

  private geometry: BufferGeometry | null = null;
  protected abstract readonly mesh: Obj;
  protected abstract readonly mesh2: Obj;

  public dispose() {
    this.mesh.parent?.remove(this.mesh);
    this.mesh2.parent?.remove(this.mesh2);
    this.material.dispose();
    this.material2.dispose();
    this.geometry?.dispose();
  }

  public get visible(): boolean {
    return this.mesh.visible;
  }

  public setParent(parent: Object3D): this {
    parent.add(this.mesh);
    parent.add(this.mesh2);
    return this;
  }

  public setGeometry(geometry: BufferGeometry): this {
    if (this.geometry && this.geometry !== geometry) {
      this.geometry.dispose();
    }
    this.geometry = geometry;
    this.geometry.computeBoundingSphere();
    this.mesh.geometry = geometry;
    this.mesh2.geometry = geometry;
    this.postUpdateGeometry();
    return this;
  }

  public updateGeometry(position: number[] | Float32Array, indices?: number[]) {
    const positionBuffer = new Float32BufferAttribute(position, 3);
    if (!this.geometry) {
      this.setGeometry(new BufferGeometry());
    }

    this.geometry!.setAttribute('position', positionBuffer);
    this.geometry!.setIndex(indices ?? null);
    if (position.length > 0 && (!indices || indices.length > 0)) {
      this.geometry!.computeBoundingBox();
      this.geometry!.computeBoundingSphere();
    }
    this.postUpdateGeometry();
  }

  public updateVertexColors(colors: number[] | Float32Array) {
    if (!this.material.vertexColors) {
      this.material.vertexColors = this.material2.vertexColors = true;
      this.material.needsUpdate = this.material2.needsUpdate = true;
    }
    const colorsBuffer = new Float32BufferAttribute(colors, 4);
    if (!this.geometry) {
      this.setGeometry(new BufferGeometry());
    }

    this.geometry!.setAttribute('color', colorsBuffer);
  }

  protected postUpdateGeometry() {}

  public setVisible(visible: boolean, visible2?: boolean): this {
    this.mesh.visible = visible;
    this.mesh2.visible = visible2 ?? visible;
    return this;
  }

  public setLocation(location: Vector3): this {
    this.mesh.position.copy(location);
    this.mesh2.position.copy(location);
    return this;
  }

  public setRotation(rotation: Quaternion): this {
    this.mesh.quaternion.copy(rotation);
    this.mesh2.quaternion.copy(rotation);
    return this;
  }

  public setScale(scale: number): this {
    this.mesh.scale.set(scale, scale, scale);
    this.mesh2.scale.set(scale, scale, scale);
    return this;
  }

  public setBlending(blending: Blending): this {
    if (this.material.blending !== blending) {
      this.material.blending = blending;
      this.material.needsUpdate = true;
    }
    if (this.material2.blending !== blending) {
      this.material2.blending = blending;
      this.material2.needsUpdate = true;
    }
    return this;
  }

  public setOpacity(opacity: number, occlusionFactor = OPACITY_MULTIPLIER): this {
    if (this.material.opacity !== opacity) {
      this.material.opacity = opacity;
      this.material.needsUpdate = true;
    }
    if (this.material2.opacity !== opacity * occlusionFactor) {
      this.material2.opacity = opacity * occlusionFactor;
      this.material2.needsUpdate = true;
    }
    return this;
  }

  public setRenderOrder(order: number): this {
    this.mesh.renderOrder = order;
    this.mesh2.renderOrder = order;
    return this;
  }

  public setSide(side: Side): this {
    this.material.side = this.material2.side = side;
    return this;
  }

  public setName(name: string): this {
    this.mesh.name = name;
    this.mesh2.name = name;
    return this;
  }
}
