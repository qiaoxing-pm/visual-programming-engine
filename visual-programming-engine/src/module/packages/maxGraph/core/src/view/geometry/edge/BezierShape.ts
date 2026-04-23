import Shape from "../Shape";
import {LINE_ARCSIZE} from '../../../util/Constants';
import Point from '../Point';
import AbstractCanvas2D from '../../canvas/AbstractCanvas2D';
import type {ColorValue} from '../../../types';
import CellState from "../../cell/CellState"
import type StencilShape from "../node/StencilShape";

class BezierShape extends Shape {
  cellState: CellState | null = null;

  constructor(stencil: StencilShape | null = null) {
    super(stencil);
    // this.points = points;
    this.stroke = '#ff0000';
    this.strokeWidth = 2;
  }


  paintEdgeShape(c: AbstractCanvas2D, pts: Point[]) {
    const prev = c.pointerEventsValue;
    c.pointerEventsValue = 'stroke';
    this.drawBezier(c, pts);
    c.pointerEventsValue = prev;
  }

  drawBezier(c: AbstractCanvas2D, pts: Point[]): void {
    if (!this.cellState) return;
    const p0 = pts[0];
    const p3 = pts[pts.length - 1];
    const dist = p3.x - p0.x;
    const p1 = new Point(dist * 0.8 + p0.x, p0.y);
    const p2 = new Point(dist * 0.2 + p0.x, p3.y);
    c.begin();
    c.setStrokeColor(this.stroke);
    c.setStrokeWidth(this.strokeWidth);
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