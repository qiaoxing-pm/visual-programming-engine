import Shape from "../Shape";
import Point from '../Point';
import AbstractCanvas2D from '../../canvas/AbstractCanvas2D';
import CellState from "../../cell/CellState";
import type StencilShape from "../node/StencilShape";

/**
 * Edge shape that renders the connection as a single cubic Bézier curve
 * between the source and target port, with horizontal handles suitable for
 * node-editor style flow graphs.
 */
class BezierShape extends Shape {
  cellState: CellState | null = null;

  /** Minimum horizontal handle length, keeps near-vertical connections curved. */
  private static readonly MIN_HANDLE = 40;
  /** Fraction of the |dx| used as the handle length when it exceeds MIN_HANDLE. */
  private static readonly HANDLE_RATIO = 0.5;

  constructor(stencil: StencilShape | null = null) {
    super(stencil);
  }

  paintEdgeShape(c: AbstractCanvas2D, pts: Point[]) {
    if (pts.length < 2) return;

    const prev = c.pointerEventsValue;
    c.pointerEventsValue = 'stroke';
    this.drawBezier(c, pts);
    c.pointerEventsValue = prev;
  }

  drawBezier(c: AbstractCanvas2D, pts: Point[]): void {
    const p0 = pts[0];
    const p3 = pts[pts.length - 1];
    const dx = p3.x - p0.x;
    const handle = Math.max(Math.abs(dx) * BezierShape.HANDLE_RATIO, BezierShape.MIN_HANDLE);
    // Symmetric horizontal handles: leave source heading right, arrive target heading left
    // (mirrored automatically when dx < 0 via the sign of `dir`).
    const dir = dx >= 0 ? 1 : -1;
    const p1 = new Point(p0.x + handle * dir, p0.y);
    const p2 = new Point(p3.x - handle * dir, p3.y);

    c.begin();
    c.moveTo(p0.x, p0.y);
    c.curveTo(p1.x, p1.y, p2.x, p2.y, p3.x, p3.y);
    c.stroke();
  }

  apply(state: CellState) {
    super.apply(state);
    this.cellState = state;
  }
}
export default BezierShape;
