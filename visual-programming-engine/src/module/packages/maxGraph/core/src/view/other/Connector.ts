import { ConnectionConstraint, Point, Geometry, Rectangle } from "@core/src"
import type { Link } from "@plc/types/plcOpen"
export type ValueType =
    "Boolean" | "String" | "Number" | "Object" | "Array" | "Null"
class Connector extends ConnectionConstraint {
    edge: any = null
    negated: any = null
    formalParameter: string
    link?: Link
    // 这个约束点是否是输入，默认是输入
    isInput = true
    // 这个约束点是否已经使用，默认没有使用
    isConnected = false
    // 相对于线框的左上角的相对位置，单位是px
    relPosition: Point | null = new Point()
    // 在线框上的百分比位置[0,1],不能出现负数，也不能大于1，如果point(1,0.5) 表示在线框上的最右侧中间位置
    point: Point | null = new Point()
    perimeter = true
    name: string | null = null
    with = 0
    height = 0
    value: any = null
    valueType: ValueType = "Null"
    inputPosition?: Geometry
    // 给定的位置偏移量，目的是让约束点偏移到线框的外面
    dx = 0
    dy = 0
    textRegion: Rectangle | null = null
    iconBounds: Rectangle | null = null
    constructor(
        point: Point | null = new Point(),
        perimeter = true,
        name: string | null = null,
        dx = 0,
        dy = 0,
        isInput = true,
        relPosition = new Point()
                ) {
        super(point, perimeter, name, dx, dy);
        this.name = name ?? ''
        this.formalParameter = name ?? ''
        this.relPosition = relPosition
        this.isInput = isInput
    }
    setValue(value: any) {
        this.value = value
        if (value === null) {
            this.valueType = "Null"
        } else {
            this.valueType = typeof value as ValueType
        }
    }
}
export default Connector

