import Shape from "../Shape.js";
import Point from '../Point.js';
import AbstractCanvas2D from '../../canvas/AbstractCanvas2D.js';
import CellState from "../../cell/CellState.js";
import type StencilShape from "../node/StencilShape.js";

// class BezierShape extends Shape {
// 	cellState: CellState | null = null;

// 	constructor(stencil: StencilShape | null = null) {
// 		super(stencil);
// 		// this.points = points;
// 		this.stroke = '#ff0000';
// 		this.strokeWidth = 2;
// 	}


// 	paintEdgeShape(c: AbstractCanvas2D, pts: Point[]) {
// 		const prev = c.pointerEventsValue;
// 		c.pointerEventsValue = 'stroke';
// 		this.drawBezier(c, pts);
// 		c.pointerEventsValue = prev;
// 	}

// 	drawBezier(c: AbstractCanvas2D, pts: Point[]): void {
// 		if (!this.cellState) return;
// 		const p0 = pts[0];
// 		const p3 = pts[pts.length - 1];
// 		const dist = p3.x - p0.x;
// 		const p1 = new Point(dist * 0.8 + p0.x, p0.y);
// 		const p2 = new Point(dist * 0.2 + p0.x, p3.y);
// 		c.begin();
// 		c.setStrokeColor(this.stroke);
// 		c.setStrokeWidth(this.strokeWidth);
// 		c.moveTo(p0.x, p0.y);
// 		c.curveTo(p1.x, p1.y, p2.x, p2.y, p3.x, p3.y);
// 		c.stroke();
// 	}

// 	apply(state: CellState) {
// 		super.apply(state);
// 		this.cellState = state;
// 	}
// }
// export default BezierShape;


class BezierShape extends Shape {
    cellState: CellState | null = null;
  
    constructor(stencil: StencilShape | null = null) {
      super(stencil);
      // this.points = points;
      this.stroke = '#ff0000';
      this.strokeWidth = 2;
    }
  
  
    paintEdgeShape(c: AbstractCanvas2D, pts: Point[]) {
      // console.log("BezierShape paintEdgeShape", pts);
      const prev = c.pointerEventsValue;
      c.pointerEventsValue = 'stroke';
      this.drawBezier(c, pts);
      c.pointerEventsValue = prev;
    }
  
    drawBezier(c: AbstractCanvas2D, pts: Point[]): void {
      if (!this.cellState) return;
      const cellStyle = this.cellState.style as any;
      // Keep edge tangent direction stable from source side.
      // Do not recompute from dragged waypoint positions, otherwise
      // crossing over may flip the output-side curve direction.
      const sc = (cellStyle.sc || 1) as 1 | -1;
      const edge = this.cellState.cell;
      const source = edge.source;
      let drawCircle = source && source.isEdge();
      if (drawCircle) {
        c.begin();
        c.setStrokeColor("black");
        c.setFillColor("black");
        c.drawCircle(pts[0].x, pts[0].y, 4);
        c.fill();
        c.fillAndStroke();
      }
      for (let i = 0; i < pts.length - 1; i++) {
        const p0 = pts[i];
        const p1 = pts[i + 1];
        c.begin();
        c.setStrokeColor(this.stroke);
        c.drawLinkPath(p0.x, p0.y, p1.x, p1.y, sc);
        c.stroke();
      }
    }
  
    apply(state: CellState) {
      super.apply(state);
      this.cellState = state;
    }
  
    destroy(): void {
      super.destroy();
      // console.log("BezierShape destroyed");
    }
  }
  
  export default BezierShape;