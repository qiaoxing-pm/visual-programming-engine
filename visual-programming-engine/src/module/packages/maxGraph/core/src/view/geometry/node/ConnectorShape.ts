import AbstractCanvas2D from "../../canvas/AbstractCanvas2D";
import Rectangle from "../Rectangle";
import ImageShape from "./ImageShape";
import Connector from "../../other/Connector";

class ConnectorShape extends ImageShape {
  
  isInput: boolean;
  fill: string;
  iconBounds: Rectangle;
  connector: Connector;

  constructor(connector: Connector, fill: string = "#fff")
  {
    const rect = new Rectangle(
      connector.iconBounds!.x, connector.iconBounds!.y,
      connector.iconBounds!.width + connector.textRegion!.width, connector.iconBounds!.height 
    )
    super(connector.textRegion!!, "", fill, "#000", 1);
    this.isInput = connector.isInput;
    this.fill = fill;
    this.stroke = "#000";
    this.iconBounds = connector.iconBounds!!;
    this.connector = connector;
  }

  paintVertexShape(c: AbstractCanvas2D, x: number, y: number, w: number, h: number): void {
    c.begin();
    c.setFillColor(this.fill);
    c.setStrokeColor(this.stroke);
    const rect = this.connector.textRegion!!;
    c.rect(rect.x, rect.y, rect.width, rect.height);
    c.fill();
    // c.rect(rect.x + 1, rect.y + 1, rect.width - 2, rect.height - 2);
    // c.text(rect.x, rect.y + rect.height / 2, 0, 0, this.connector.name ?? '', 'left', 'middle',
    //   false, '#000', 'visible', false, 0, 'ltr');
    c.stroke();
  }
}
export default ConnectorShape;