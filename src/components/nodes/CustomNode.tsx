import { type NodeProps } from "reactflow"
import { BusinessFlowNode } from "./BusinessFlowNode"
import { CustomerActionNode } from "./CustomerActionNode"
import { ApiNode } from "./ApiNode"
import { ControllerNode } from "./ControllerNode"
import { ServiceNode } from "./ServiceNode"
import { RepositoryNode } from "./RepositoryNode"
import { GatewayNode } from "./GatewayNode"

export function CustomNode(props: NodeProps) {
  switch (props.data.nodeType) {
    case "businessFlow":
      return <BusinessFlowNode {...props} />
    case "customerAction":
      return <CustomerActionNode {...props} />
    case "api":
      return <ApiNode {...props} />
    case "controller":
      return <ControllerNode {...props} />
    case "service":
      return <ServiceNode {...props} />
    case "repository":
      return <RepositoryNode {...props} />
    case "gateway":
      return <GatewayNode {...props} />
    default:
      return null
  }
}