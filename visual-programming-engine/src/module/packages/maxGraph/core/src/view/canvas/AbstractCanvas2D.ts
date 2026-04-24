/*
Copyright 2021-present The maxGraph project Contributors
Copyright (c) 2006-2015, JGraph Ltd
Copyright (c) 2006-2015, Gaudenz Alder

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

import { arcToCurves, getRotatedPoint } from '../../util/mathUtils';
import {
  DEFAULT_FONTFAMILY,
  DEFAULT_FONTSIZE,
  DIRECTION,
  NONE,
  SHADOWCOLOR,
  SHADOW_OFFSET_X,
  SHADOW_OFFSET_Y,
  SHADOW_OPACITY,
} from '../../util/Constants';
import UrlConverter from '../../util/UrlConverter';
import Point from '../geometry/Point';
import { clone } from '../../util/cloneUtils';

import type {
  AlignValue,
  CanvasState,
  ColorValue,
  DirectionValue,
  OverflowValue,
  TextDirectionValue,
  VAlignValue,
} from '../../types';

/**
 * Base class for all canvases. A description of the public API is available in <mxXmlCanvas2D>.
 * All color values of {@link Constants#NONE} will be converted to null in the state.
 *
 * Constructor: D
 *
 * Constructs a new abstract canvas.
 */
abstract class AbstractCanvas2D {
  constructor() {
    this.converter = this.createUrlConverter();
    this.reset();
  }

  /**
   * Holds the <UrlConverter> to convert image URLs.
   */
  converter: UrlConverter;

  /**
   * Holds the current state.
   */
  state: CanvasState = this.createState();

  /**
   * Stack of states.
   */
  states: CanvasState[] = [];

  /**
   * Holds the current path as an array.
   */
  path: (string | number)[] = [];

  /**
   * Switch for rotation of HTML. Default is false.
   */
  rotateHtml = true;

  /**
   * Holds the last x coordinate.
   */
  lastX = 0;

  /**
   * Holds the last y coordinate.
   */
  lastY = 0;

  /**
   * Contains the string used for moving in paths. Default is 'M'.
   */
  moveOp = 'M';

  /**
   * Contains the string used for moving in paths. Default is 'L'.
   */
  lineOp = 'L';

  /**
   * Contains the string used for quadratic paths. Default is 'Q'.
   */
  quadOp = 'Q';

  /**
   * Contains the string used for bezier curves. Default is 'C'.
   */
  curveOp = 'C';

  /**
   * Contains the string used for bezier curves. Default is 'C'.
   */
  smoothCurveto = 'S';

  /**
   * Holds the operator for closing curves. Default is 'Z'.
   */
  closeOp = 'Z';

  /**
   * Boolean value that specifies if events should be handled. Default is false.
   */
  pointerEvents = false;

  // from Polyline (maybe from other shapes also)
  pointerEventsValue: string | null = null;

  /**
   * Create a new <UrlConverter> and returns it.
   */
  createUrlConverter() {
    return new UrlConverter();
  }

  /**
   * Resets the state of this canvas.
   */
  reset() {
    this.state = this.createState();
    this.states = [];
  }

  /**
   * Creates the state of the this canvas.
   */
  createState() {
    return {
      dx: 0,
      dy: 0,
      scale: 1,
      alpha: 1,
      fillAlpha: 1,
      strokeAlpha: 1,
      fillColor: NONE,
      gradientFillAlpha: 1,
      gradientColor: NONE,
      gradientAlpha: 1,
      gradientDirection: DIRECTION.EAST,
      strokeColor: NONE,
      strokeWidth: 1,
      dashed: false,
      dashPattern: '3 3',
      fixDash: false,
      lineCap: 'flat',
      lineJoin: 'miter',
      miterLimit: 10,
      fontColor: '#000000',
      fontBackgroundColor: NONE,
      fontBorderColor: NONE,
      fontSize: DEFAULT_FONTSIZE,
      fontFamily: DEFAULT_FONTFAMILY,
      fontStyle: 0,
      shadow: false,
      shadowColor: SHADOWCOLOR,
      shadowAlpha: SHADOW_OPACITY,
      shadowDx: SHADOW_OFFSET_X,
      shadowDy: SHADOW_OFFSET_Y,
      rotation: 0,
      rotationCx: 0,
      rotationCy: 0,
    } as CanvasState;
  }

  /**
   * Rounds all numbers to integers.
   */
  format(value: number) {
    return Math.round(value);
  }

  /**
   * Adds the given operation to the path.
   */
  addOp = (op: string, ...args: number[]) => {
    this.path.push(op);

    if (args.length > 1) {
      const s = this.state;

      for (let i = 1; i < args.length; i += 2) {
        this.lastX = args[i - 1];
        this.lastY = args[i];

        this.path.push(this.format((this.lastX + s.dx) * s.scale));
        this.path.push(this.format((this.lastY + s.dy) * s.scale));
      }
    }
  };

  /**
   * Rotates the given point and returns the result as an {@link Point}.
   */
  rotatePoint(x: number, y: number, theta: number, cx: number, cy: number) {
    const rad = theta * (Math.PI / 180);

    return getRotatedPoint(
      new Point(x, y),
      Math.cos(rad),
      Math.sin(rad),
      new Point(cx, cy)
    );
  }

  /**
   * Saves the current state.
   */
  save() {
    this.states.push(this.state);
    this.state = clone(this.state);
  }

  /**
   * Restores the current state.
   */
  restore() {
    const state = this.states.pop();

    if (state) this.state = state;
  }

  /**
   * Sets the current link. Hook for subclassers.
   */
  setLink(link: string | null) {
    // nop
  }

  /**
   * Scales the current state.
   */
  scale(value: number) {
    this.state.scale *= value;

    if (this.state.strokeWidth !== null) this.state.strokeWidth *= value;
  }

  /**
   * Translates the current state.
   */
  translate(dx: number, dy: number) {
    this.state.dx += dx;
    this.state.dy += dy;
  }

  /**
   * Rotates the current state.
   */
  rotate(theta: number, flipH: boolean, flipV: boolean, cx: number, cy: number) {
    // nop
  }

  /**
   * Sets the current alpha.
   */
  setAlpha(value: number) {
    this.state.alpha = value;
  }

  /**
   * Sets the current solid fill alpha.
   */
  setFillAlpha(value: number) {
    this.state.fillAlpha = value;
  }

  /**
   * Sets the current stroke alpha.
   */
  setStrokeAlpha(value: number) {
    this.state.strokeAlpha = value;
  }

  /**
   * Sets the current fill color.
   */
  setFillColor(value: ColorValue | null) {
    this.state.fillColor = value ?? NONE;
    this.state.gradientColor = NONE;
  }

  /**
   * Sets the current gradient.
   */
  setGradient(
    color1: ColorValue,
    color2: ColorValue,
    x: number,
    y: number,
    w: number,
    h: number,
    direction: DirectionValue,
    alpha1 = 1,
    alpha2 = 1
  ) {
    const s = this.state;
    s.fillColor = color1;
    s.gradientFillAlpha = alpha1;
    s.gradientColor = color2;
    s.gradientAlpha = alpha2;
    s.gradientDirection = direction;
  }

  /**
   * Sets the current stroke color.
   */
  setStrokeColor(value: ColorValue | null) {
    this.state.strokeColor = value ?? NONE;
  }

  /**
   * Sets the current stroke width.
   */
  setStrokeWidth(value: number) {
    this.state.strokeWidth = value;
  }

  /**
   * Enables or disables dashed lines.
   */
  setDashed(value: boolean, fixDash = false) {
    this.state.dashed = value;
    this.state.fixDash = fixDash;
  }

  /**
   * Sets the current dash pattern.
   */
  setDashPattern(value: string) {
    this.state.dashPattern = value;
  }

  /**
   * Sets the current line cap.
   */
  setLineCap(value: string) {
    this.state.lineCap = value;
  }

  /**
   * Sets the current line join.
   */
  setLineJoin(value: string) {
    this.state.lineJoin = value;
  }

  /**
   * Sets the current miter limit.
   */
  setMiterLimit(value: number) {
    this.state.miterLimit = value;
  }

  /**
   * Sets the current font color.
   */
  setFontColor(value: ColorValue | null) {
    this.state.fontColor = value ?? NONE;
  }

  /**
   * Sets the current font background color.
   */
  setFontBackgroundColor(value: ColorValue | null) {
    this.state.fontBackgroundColor = value ?? NONE;
  }

  /**
   * Sets the current font border color.
   */
  setFontBorderColor(value: ColorValue | null) {
    this.state.fontBorderColor = value ?? NONE;
  }

  /**
   * Sets the current font size.
   */
  setFontSize(value: number) {
    this.state.fontSize = value;
  }

  /**
   * Sets the current font family.
   */
  setFontFamily(value: string) {
    this.state.fontFamily = value;
  }

  /**
   * Sets the current font style.
   */
  setFontStyle(value: number) {
    this.state.fontStyle = value;
  }

  /**
   * Enables or disables and configures the current shadow.
   */
  setShadow(enabled: boolean) {
    this.state.shadow = enabled;
  }

  /**
   * Enables or disables and configures the current shadow.
   */
  setShadowColor(value: ColorValue | null) {
    this.state.shadowColor = value ?? NONE;
  }

  /**
   * Enables or disables and configures the current shadow.
   */
  setShadowAlpha(value: number) {
    this.state.shadowAlpha = value;
  }

  /**
   * Enables or disables and configures the current shadow.
   */
  setShadowOffset(dx: number, dy: number) {
    this.state.shadowDx = dx;
    this.state.shadowDy = dy;
  }

  /**
   * Starts a new path.
   */
  begin() {
    this.lastX = 0;
    this.lastY = 0;
    this.path = [];
  }

  /**
   *  Moves the current path the given coordinates.
   */
  moveTo(x: number, y: number) {
    this.addOp(this.moveOp, x, y);
  }

  /**
   * Draws a line to the given coordinates. Uses moveTo with the op argument.
   */
  lineTo(x: number, y: number) {
    this.addOp(this.lineOp, x, y);
  }

  /**
   * Adds a quadratic curve to the current path.
   */
  quadTo(x1: number, y1: number, x2: number, y2: number) {
    this.addOp(this.quadOp, x1, y1, x2, y2);
  }

  /**
   * Adds a curve path from origin to destination.
   */
  drawLinkPath(origX: number, origY: number, destX: number,
               destY: number, sc: 1 | -1, scale = 0.75, hasStatus: boolean = false)  {

    const dy = destY - origY;
    const dx = destX - origX;
    const node_width = 100;
    const node_height = 30;
    const delta = Math.sqrt(dy * dy + dx * dx);

    let scaleY = 0;

    if (dx * sc > 0) {
      if (delta < node_width) {
        scale = 0.75 - 0.75 * ((node_width - delta) / node_width);
      }
    } else {
      scale = 0.4 - 0.2 * (Math.max(0, node_width - Math.min(Math.abs(dx), Math.abs(dy))) / node_width);
    }

    if (dx * sc > 0) {
      const cp: [number, number][] = [
        [origX + sc * node_width * scale, origY + scaleY * node_height],
        [destX - sc * scale * node_width, destY - scaleY * node_height]
      ];
      this.moveTo(origX, origY);
      this.curveTo(cp[0][0], cp[0][1], cp[1][0], cp[1][1], destX, destY);
      // console.log(origX, origY, cp[0][0], cp[0][1], cp[1][0], cp[1][1], destX, destY);
      // return `M ${origX} ${origY} C ${cp[0][0]} ${cp[0][1]} ${cp[1][0]} ${cp[1][1]} ${destX} ${destY}`;
    } else {
      let cp: [number, number][];
      const midX = Math.floor(destX - dx / 2);
      const midY = Math.floor(destY - dy / 2);

      if (Math.abs(dy) < 10) {
        const bottomY = Math.max(origY, destY) + (hasStatus ? 35 : 25);
        const startCurveHeight = bottomY - origY;
        const endCurveHeight = bottomY - destY;

        cp = [
          [origX + sc * 15, origY],
          [origX + sc * 25, origY + 5],
          [origX + sc * 25, origY + startCurveHeight / 2],

          [origX + sc * 25, origY + startCurveHeight - 5],
          [origX + sc * 15, origY + startCurveHeight],
          [origX, origY + startCurveHeight],

          [destX - sc * 15, origY + startCurveHeight],
          [destX - sc * 25, origY + startCurveHeight - 5],
          [destX - sc * 25, destY + endCurveHeight / 2],

          [destX - sc * 25, destY + 5],
          [destX - sc * 15, destY],
          [destX, destY]
        ];
        this.moveTo(origX, origY);
        this.curveTo(cp[0][0], cp[0][1], cp[1][0], cp[1][1], cp[2][0], cp[2][1]);
        this.curveTo(cp[3][0], cp[3][1], cp[4][0], cp[4][1], cp[5][0], cp[5][1]);
        this.lineTo(cp[5][0] + dx, cp[5][1]);
        this.curveTo(cp[6][0], cp[6][1], cp[7][0], cp[7][1], cp[8][0], cp[8][1]);
        this.curveTo(cp[9][0], cp[9][1], cp[10][0], cp[10][1], cp[11][0], cp[11][1]);
        // return `M ${origX} ${origY}` +
        //   ` C ${cp[0][0]} ${cp[0][1]} ${cp[1][0]} ${cp[1][1]} ${cp[2][0]} ${cp[2][1]}` +
        //   ` C ${cp[3][0]} ${cp[3][1]} ${cp[4][0]} ${cp[4][1]} ${cp[5][0]} ${cp[5][1]}` +
        //   ` h ${dx}` +
        //   ` C ${cp[6][0]} ${cp[6][1]} ${cp[7][0]} ${cp[7][1]} ${cp[8][0]} ${cp[8][1]}` +
        //   ` C ${cp[9][0]} ${cp[9][1]} ${cp[10][0]} ${cp[10][1]} ${cp[11][0]} ${cp[11][1]}`;
      } else {
        const cpHeight = node_height / 2;
        const y1 = (destY + midY) / 2;

        const topX = origX + sc * node_width * scale;
        const topY = dy > 0
          ? Math.min(y1 - dy / 2, origY + cpHeight)
          : Math.max(y1 - dy / 2, origY - cpHeight);

        const bottomX = destX - sc * node_width * scale;
        const bottomY = dy > 0
          ? Math.max(y1, destY - cpHeight)
          : Math.min(y1, destY + cpHeight);

        const x1 = (origX + topX) / 2;
        const scy = dy > 0 ? 1 : -1;

        cp = [
          [x1, origY],
          [topX, dy > 0 ? Math.max(origY, topY - cpHeight) : Math.min(origY, topY + cpHeight)],
          [x1, dy > 0 ? Math.min(midY, topY + cpHeight) : Math.max(midY, topY - cpHeight)],
          [bottomX, dy > 0 ? Math.max(midY, bottomY - cpHeight) : Math.min(midY, bottomY + cpHeight)],
          [(destX + bottomX) / 2, destY]
        ];

        if (cp[2][1] === topY + scy * cpHeight) {
          if (Math.abs(dy) < cpHeight * 10) {
            cp[1][1] = topY - scy * cpHeight / 2;
            cp[3][1] = bottomY - scy * cpHeight / 2;
          }
          cp[2][0] = topX;
        }
        this.moveTo(origX, origY);
        this.curveTo(cp[0][0], cp[0][1], cp[1][0], cp[1][1], topX, topY);
        this.smoothCurveTo(cp[2][0], cp[2][1], midX, midY);
        this.smoothCurveTo(cp[3][0], cp[3][1], bottomX, bottomY);
        this.smoothCurveTo(cp[4][0], cp[4][1], destX, destY);
        // `M ${origX} ${origY}` +
        //   ` C ${cp[0][0]} ${cp[0][1]} ${cp[1][0]} ${cp[1][1]} ${topX} ${topY}` +
        //   ` S ${cp[2][0]} ${cp[2][1]} ${midX} ${midY}` +
        //   ` S ${cp[3][0]} ${cp[3][1]} ${bottomX} ${bottomY}` +
        //   ` S ${cp[4][0]} ${cp[4][1]} ${destX} ${destY}`;
      }
    }
  }

  /**
   * Adds a bezier curve to the current path.
   */
  curveTo(x1: number, y1: number, x2: number, y2: number, x3: number, y3: number) {
    this.addOp(this.curveOp, x1, y1, x2, y2, x3, y3);
  }

  smoothCurveTo(x2: number, y2: number, x: number, y: number) {
    // Uses the last point as the first control point
    this.addOp(this.smoothCurveto, x2, y2, x, y);
  }

  drawCircle(x: number, y: number, radius: number) {
    this.begin(); // 开始新的路径
    this.moveTo(x + radius, y); // 移动到圆的起始点
    this.arcTo(radius, radius, 0, false, true, x - radius, y); // 绘制圆的上半部分
    this.arcTo(radius, radius, 0, false, true, x + radius, y); // 绘制圆的下半部分
    this.close(); // 关闭路径
    this.stroke(); // 绘制路径
  }
  /**
   * Adds the given arc to the current path. This is a synthetic operation that
   * is broken down into curves.
   * @param rx: The x distance between the current position
   *            and the center of the ellipse around which to arc
   * @param ry: The y distance between the current position
   *            and the center of the ellipse around which to arc
   * @param x: The x position of the end point of the arc
   * @param y: The y position of the end point of the arc
   */
  arcTo(
    rx: number,
    ry: number,
    angle: number,
    largeArcFlag: boolean,
    sweepFlag: boolean,
    x: number,
    y: number
  ) {
    const curves = arcToCurves(
      this.lastX,
      this.lastY,
      rx,
      ry,
      angle,
      largeArcFlag,
      sweepFlag,
      x,
      y
    );

    if (curves != null) {
      for (let i = 0; i < curves.length; i += 6) {
        this.curveTo(
          curves[i],
          curves[i + 1],
          curves[i + 2],
          curves[i + 3],
          curves[i + 4],
          curves[i + 5]
        );
      }
    }
  }

  /**
   * Closes the current path.
   */
  close(x1?: number, y1?: number, x2?: number, y2?: number, x3?: number, y3?: number) {
    this.addOp(this.closeOp);
  }

  /**
   * Empty implementation for backwards compatibility. This will be removed.
   */
  abstract end(): void;

  abstract stroke(): void;

  abstract fill(): void;

  abstract fillAndStroke(): void;

  abstract rect(x: number, y: number, w: number, h: number): void;

  abstract roundrect(
    x: number,
    y: number,
    w: number,
    h: number,
    r1: number,
    r2: number
  ): void;

  abstract ellipse(x: number, y: number, w: number, h: number): void;

  abstract image(
    x: number,
    y: number,
    w: number,
    h: number,
    src: string,
    aspect: boolean,
    flipH: boolean,
    flipV: boolean
  ): void;

  abstract text(
    x: number,
    y: number,
    w: number,
    h: number,
    str: string,
    align: AlignValue,
    valign: VAlignValue,
    wrap: boolean,
    format: string,
    overflow: OverflowValue,
    clip: boolean,
    rotation: number,
    dir: TextDirectionValue
  ): void;

  abstract updateText(
    x: number,
    y: number,
    w: number,
    h: number,
    align: AlignValue,
    valign: VAlignValue,
    wrap: boolean,
    overflow: OverflowValue,
    clip: boolean,
    rotation: number,
    node: SVGElement
  ): void;
}

export default AbstractCanvas2D;
